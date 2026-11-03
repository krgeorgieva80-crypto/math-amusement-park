import { ATTRACTIONS } from '../attractions/registry'
import { useStage } from '../core/Stage'
import { MascotSays } from '../components/art/Mascot'
import { SkyAndHills, SkyDefs } from '../components/scenery/Scenery'
import { RoundButton } from '../components/ui/GameButton'
import { SoundControl } from '../components/ui/SoundControl'

export function AboutScreen({ onBack }: { onBack: () => void }) {
  const { width: w, height: h } = useStage()
  return (
    <div className="screen info-screen">
      <svg className="scene" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <SkyDefs />
        <SkyAndHills w={w} h={h} horizon={h * 0.75} />
      </svg>
      <div className="top-bar">
        <RoundButton icon="back" label="Назад" color="yellow" onClick={onBack} />
        <div className="top-bar__spacer" />
        <SoundControl />
      </div>
      <div className="info-panel">
        <h2 className="info-panel__title">За играта</h2>
        <MascotSays mood="happy" size={120}>
          Добре дошъл в <b>Математическия увеселителен парк</b>! Всеки атракцион е забавна игра с числа. Решавай задачи, събирай звезди и стани майстор на математиката!
        </MascotSays>
        <div className="info-columns">
          <div className="info-box">
            <h3>Как се играе „Вълшебните жетони“?</h3>
            <ol>
              <li>Виж числото на голямото табло.</li>
              <li>Влачи жетони в зоната или просто ги докосни.</li>
              <li>Следи сбора — той се смята сам.</li>
              <li>Натисни „Провери“. Ако сбъркаш, поправи и опитай отново!</li>
              <li>Ако имаш нужда, натисни „Помощ“.</li>
            </ol>
          </div>
          <div className="info-box">
            <h3>Атракционите в парка</h3>
            <ul className="info-attractions">
              {ATTRACTIONS.map((a) => (
                <li key={a.id}>
                  <a.Art size={54} />
                  <span>
                    <b>{a.name}</b>
                    <small>{a.status === 'ready' ? a.tagline : `${a.tagline} · очаквай скоро`}</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
