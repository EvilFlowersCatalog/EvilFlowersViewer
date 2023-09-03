import { useState } from 'react';
import ModalWrapper from '../modal/Modal';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode.react';
import { BiDownload } from 'react-icons/bi';

interface IShareQRProps {
  link: string;
  setShareQRVisibility: (mode: boolean) => void;
}

/**
 * Component for citation generation modal
 * 
 * @param props - IShateQRProps -> link -> link for qr code, setShareQRVisibility for component visibility
 * @returns - ShareQRCode component * 
 */
const ShareQRCode = (props: IShareQRProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const { t } = useTranslation();

  /**
   * handle on click click
   */
  const handleOnClickClick = () => {
    const canvas: any = document.getElementById('QRCode');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl
      downloadLink.download = `shared-document-QR-code.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // close
      setIsOpen(false);
      props.setShareQRVisibility(false);
    }
  }

  /**
   * handle close click
   */
  const handleOnCloseClick = () => {
    setIsOpen(false); // closel modal
    props.setShareQRVisibility(false); // close share component
  }

  return (
    <ModalWrapper
      label={props.link ? t('downloadQR') : null}
      isOpen={isOpen}
      icon={props.link ? <BiDownload className='ml-3 h-[20px] w-[20px] text-white' /> : null}
      onClick={() => handleOnClickClick()}
      onClose={() => handleOnCloseClick()}
    >
      <div className={'text-lg text-center text-gray-800 dark:text-gray-200 mb-3'}>
        {t('shareQrCode')}
      </div>
      <div className={'w-full h-[300px] flex justify-center items-center'}>
        {props.link ? (
          <QRCode id='QRCode' size={300} value={props.link} />
        ) : (
          <div className={'w-full h-full spinner'}></div>
        )}
      </div>
    </ModalWrapper>
  )
}
export default ShareQRCode
