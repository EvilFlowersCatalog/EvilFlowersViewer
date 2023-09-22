import introSK from '../../../../utils/images/Tool-Tip-SK.png'
import introEN from '../../../../utils/images/Tool-Tip-EN.png'
import { useTranslation } from 'react-i18next'

interface IIntrodactionParams {
  setShow: (show: boolean) => void
  stayHidden?: (() => void) | null
  lang: string | undefined
  visible?: boolean
}

const Introduction = ({
  setShow,
  stayHidden = null,
  lang,
  visible = false,
}: IIntrodactionParams) => {
  const { t } = useTranslation()

  return (
    <div className="introdaction-container" onClick={() => setShow(false)}>
      <img
        className="introdaction-image"
        src={lang === 'sk' ? introSK : introEN}
      />
      <div className="introdaction-buttons-container">
        {visible && (
          <div
            className="introdaction-button"
            onClick={() => (stayHidden ? stayHidden() : null)}
          >
            {t('introShow')}
          </div>
        )}
        <div
          className="introdaction-button-close"
          onClick={() => setShow(false)}
        >
          {t('close')}
        </div>
      </div>
    </div>
  )
}

export default Introduction
