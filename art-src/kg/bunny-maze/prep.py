"""Подготовка на одобрените изображения за „Приказният лабиринт“: почистване на алфа канала,
изрязване, котва (земята долу в средата), умаляване и WebP. Аргументи: orig_dir out_dir [имена...]
(с имена — обработват се само те; готовите файлове на останалите не се пипат)"""
import sys, json, os
import numpy as np
from PIL import Image
from scipy import ndimage

SRC, OUT = sys.argv[1], sys.argv[2]
ONLY = set(sys.argv[3:])
want = lambda n: not ONLY or n in ONLY
os.makedirs(OUT, exist_ok=True)
LO, HI = 24, 235   # под LO — прозрачно (ореол/мъгла); над HI — напълно плътно
report = {}

def clean(a):
    al = a[..., 3].astype(np.int32)
    haze = int(((al > 0) & (al < LO)).sum())
    al[al < LO] = 0
    al[al >= HI] = 255
    # махаме малки откъснати петънца
    lab, n = ndimage.label(al > 0)
    sizes = ndimage.sum(np.ones_like(al), lab, range(1, n + 1)) if n else []
    keep = np.zeros(n + 1, bool)
    big = max(sizes) if n else 0
    for k, sz in enumerate(sizes, 1):
        keep[k] = sz >= max(1500, big * 0.004)
    specks = int(n - keep[1:].sum()) if n else 0
    al[~keep[lab]] = 0
    a = a.copy(); a[..., 3] = al.astype(np.uint8)
    a[al == 0, :3] = 0
    return a, haze, specks

def bbox(al):
    ys, xs = np.nonzero(al)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

def anchored(a, pad=8):
    """Платно, симетрично около котвата: x — центърът на сянката (долните 4% от предмета), y — долният ръб."""
    al = a[..., 3]
    x0, y0, x1, y1 = bbox(al)
    band = al[max(y0, y1 - int((y1 - y0) * 0.04)):y1, x0:x1].astype(float)
    cx = x0 + (band.sum(0) * np.arange(x1 - x0)).sum() / max(band.sum(), 1)
    half = int(np.ceil(max(cx - x0, x1 - cx))) + pad
    H = (y1 - y0) + pad
    out = np.zeros((H, 2 * half, 4), np.uint8)
    sx0 = int(round(cx)) - half
    for y in range(H):
        sy = y1 - H + y
        if sy < 0: continue
        lo, hi = max(sx0, 0), min(sx0 + 2 * half, a.shape[1])
        out[y, lo - sx0:hi - sx0] = a[sy, lo:hi]
    return out

def save(name, arr, target, key):
    im = Image.fromarray(arr, 'RGBA')
    w, h = im.size
    f = target / (h if key == 'h' else w)
    if f < 1:
        im = im.resize((round(w * f), round(h * f)), Image.LANCZOS)
    p = f'{OUT}/{name}.webp'
    im.save(p, 'WEBP', quality=85, method=6, alpha_quality=90)
    report[name] = {'size': list(im.size), 'aspect': round(im.size[0] / im.size[1], 4), 'kb': round(os.path.getsize(p) / 1024)}

def load(n):
    f = f'{SRC}/{n}.png' if os.path.exists(f'{SRC}/{n}.png') else f'{SRC}/{n}.webp'
    return np.array(Image.open(f).convert('RGBA'))

if want('bunny-idle'):
  # зайчето: листът е разделен на две по празната колона между позите
  a, haze, specks = clean(load('bunny-sheet'))
  cols = a[..., 3].sum(0)
  mid = a.shape[1] // 2
  gap = [x for x in range(int(a.shape[1] * 0.35), int(a.shape[1] * 0.65)) if cols[x] == 0]
  cut = gap[len(gap) // 2] if gap else mid
  L, R = anchored(a[:, :cut]), anchored(a[:, cut:])
  # еднакво платно: обща височина и ширина, стъпалата на една линия
  H = max(L.shape[0], R.shape[0]); W = max(L.shape[1], R.shape[1])
  def fit(x):
      o = np.zeros((H, W, 4), np.uint8); dx = (W - x.shape[1]) // 2
      o[H - x.shape[0]:, dx:dx + x.shape[1]] = x; return o
  save('bunny-idle', fit(L), 760, 'h'); save('bunny-happy', fit(R), 760, 'h')
  report['bunny-idle']['cleaned'] = {'haze_px': haze, 'specks': specks}

# етап 4: природа; етап 5: животинките и предметите; етап 8: катеричката и домът
for n, t, k in [('hill-tree', 640, 'h'), ('pond', 720, 'w'), ('mushroom', 720, 'h'), ('bush', 520, 'w'), ('stone', 440, 'w'), ('hedge', 900, 'w'),
                ('chick', 360, 'h'), ('frog', 360, 'h'), ('basket', 560, 'h'), ('coop', 600, 'h'), ('fence', 480, 'w'),
                ('squirrel', 640, 'h'), ('home', 720, 'w')]:
    if not want(n) or not (os.path.exists(f'{SRC}/{n}.png') or os.path.exists(f'{SRC}/{n}.webp')): continue
    a, haze, specks = clean(load(n))
    save(n, anchored(a), t, k)
    report[n]['cleaned'] = {'haze_px': haze, 'specks': specks}

# фонът: непрозрачен квадрат, без увеличаване
if want('bg-garden'):
  bg = Image.open(f'{SRC}/bg-garden.png').convert('RGB')
  bg.save(f'{OUT}/bg-garden.webp', 'WEBP', quality=86, method=6)
  report['bg-garden'] = {'size': list(bg.size), 'aspect': 1, 'kb': round(os.path.getsize(f'{OUT}/bg-garden.webp') / 1024)}
print(json.dumps(report, ensure_ascii=False, indent=1))
