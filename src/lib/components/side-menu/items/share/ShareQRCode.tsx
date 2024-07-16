import { useState } from 'react'
import ModalWrapper from '../../../modal/Modal'
import { useTranslation } from 'react-i18next'
import QRCode from 'qrcode.react'
import { BiDownload, BiSad } from 'react-icons/bi'
import Loader from '../../../common/Loader'

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
          <BiDownload size={20} color="white" />
        ) : null
      }
      title={props.link && props.link !== 'error' ? t('shareQrCode') : ''}
      onClick={() => handleOnClickClick()}
      onClose={() => handleOnCloseClick()}
    >
      <div
        className={
          'efw-w-full efw-min-h-[200px] efw-flex efw-justify-center efw-items-center'
        }
      >
        {props.link ? (
          props.link !== 'error' ? (
            <QRCode
              style={{ border: '10px solid white' }}
              id="QRCode"
              size={200}
              value={props.link}
            />
          ) : (
            <pre className="efw-flex efw-justify-center efw-items-center efw-text-center efw-flex-col efw-uppercase efw-text-sm efw-font-extrabold">
              {t('shareQrCodeFail')}
              <BiSad size={25} className="efw-mt-5" />
            </pre>
          )
        ) : (
          <Loader size={100} />
        )}
      </div>
    </ModalWrapper>
  )
}
export default ShareQRCode
