import { useState } from 'react'
import ModalWrapper from '../../../modal/Modal'
import { useTranslation } from 'react-i18next'
import QRCode from 'qrcode.react'
import { BiDownload, BiSad } from 'react-icons/bi'

interface IShareQRProps {
  link: string
  setShareQRVisibility: (mode: boolean) => void
}

/**
 * Component for citation generation modal
 *
 * @param props - IShateQRProps -> link -> link for qr code, setShareQRVisibility for component visibility
 * @returns - ShareQRCode component *
 */
const ShareQRCode = (props: IShareQRProps) => {
  const [isOpen, setIsOpen] = useState(true)

  const { t } = useTranslation()

  /**
   * handle on click click
   */
  const handleOnClickClick = () => {
    const canvas: any = document.getElementById('QRCode')
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream')
      let downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = `shared-document-QR-code.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)

      // close
      setIsOpen(false)
      props.setShareQRVisibility(false)
    }
  }

  /**
   * handle close click
   */
  const handleOnCloseClick = () => {
    setIsOpen(false) // closel modal
    props.setShareQRVisibility(false) // close share component
  }

  return (
    <ModalWrapper
      label={props.link && props.link !== 'error' ? t('downloadQR') : null}
      isOpen={isOpen}
      icon={
        props.link && props.link !== 'error' ? (
          <BiDownload
            className="viewer-button-icon"
            style={{
              color: 'white',
              width: '20px',
              height: '20px',
            }}
          />
        ) : null
      }
      onClick={() => handleOnClickClick()}
      onClose={() => handleOnCloseClick()}
    >
      {props.link && <h4 className={'share-qr-title'}>{t('shareQrCode')}</h4>}
      <div className={'share-qr-code-container'}>
        {props.link ? (
          props.link !== 'error' ? (
            <QRCode
              style={{ border: '10px solid white' }}
              id="QRCode"
              size={200}
              value={props.link}
            />
          ) : (
            <pre className="share-failed-qr-code-text">
              {t('shareQrCodeFail')}
              <BiSad
                className="viewer-button-icon"
                style={{ marginTop: '20px' }}
              />
            </pre>
          )
        ) : (
          <div className={'share-qr-loading viewer-loader'}></div>
        )}
      </div>
    </ModalWrapper>
  )
}
export default ShareQRCode
