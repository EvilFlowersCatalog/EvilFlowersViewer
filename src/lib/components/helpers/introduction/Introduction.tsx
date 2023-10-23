import introSK from '../../../../utils/images/introductionSK.png'
import introEN from '../../../../utils/images/introductionEN.png'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

interface IIntrodactionParams {
  setShow: (show: boolean) => void
  stayHidden: () => void
  lang: string | undefined
  visible?: boolean
}

const Introduction = ({
  setShow,
  stayHidden,
  lang,
  visible = false,
}: IIntrodactionParams) => {
  const { t } = useTranslation()
  const [isChecked, setIsChecked] = useState(true)

  return (
    <div className="introdaction-container">
      <img
        className="introdaction-image"
        src={lang === 'sk' ? introSK : introEN}
      />
      <div
        style={{ flex: '1', width: '100%' }}
        onClick={() => setShow(false)}
        className="intro-bc-close-click"
      ></div>
      <div className="introdaction-buttons-container">
        {visible && (
          <div className="introdaction-dont-show-button-container">
            <input
              type="checkbox"
              style={{ cursor: 'pointer' }}
              onClick={() => setIsChecked(!isChecked)}
              checked={isChecked}
            />
            <label
              className="introdaction-button"
              onClick={() => setIsChecked(!isChecked)}
            >
              {t('introShow')}
            </label>
          </div>
        )}
        <div
          className="introdaction-button-close"
          onClick={() => {
            if (isChecked) {
              stayHidden()
            }
            setShow(false)
          }}
        >
          {t('close')}
        </div>
      </div>
    </div>
  )
}

export default Introduction
