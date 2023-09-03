import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// icons
import { BiCheck, BiDownload } from 'react-icons/bi';
import { BiCopyAlt } from 'react-icons/bi';

import ModalWrapper from '../modal/Modal';
import { useDocumentContext } from '../document/DocumentContext';

interface ICitationsProps {
  setCitationVisible: (state: boolean) => void
}

/**
 * Component for citation generation modal
 * 
 * @param setCitationVisible - func for setting citation component visibility
 * @returns - Citaitons component * 
 */
const Citations = ({ setCitationVisible }: ICitationsProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [title, setTitle] = useState<string>('BibTeX');
  const [citationFormaters, setCitationFormaters] = useState([
    {
      name: 'BibTeX',
      format: 'bibtex',
      active: true,
    },
    {
      name: 'BibLaTeX',
      format: 'biblatex',
      active: false
    },
    {
      name: 'RIS',
      format: 'ris',
      active: false
    },
    {
      name: 'Plain-Text',
      format: 'bibliography',
      active: false
    },
  ]);
  const { downloadCitation, copyCitation, pdfCitation, changeCitationFormat } = useDocumentContext();
  const { t } = useTranslation();

  /**
   * function for handling close click
   */
  const handleOnCloseClick = () => {
    setIsOpen(false);
    setCitationVisible(false);
  }

  /**
   * Function for accepting button on click
   */
  const handleOnClickClick = () => {
    downloadCitation(); // download citation
    setIsOpen(false); // closal modal wrapper (citation component)
    setCitationVisible(false); // set false
  }

  const handleFormatClick = (selectedFormat: string) => {
    changeCitationFormat(selectedFormat); // change format for citation
    setIsCopied(false); // reset copy posibility

    // update formaters
    const updatedFormaters = citationFormaters.map((item) => ({
      ...item,
      active: item.format === selectedFormat,
    }));

    setCitationFormaters(updatedFormaters);
  }

  return (
    <div>
      <ModalWrapper
        label={t('download')}
        onClick={() => handleOnClickClick()}
        isOpen={isOpen}
        onClose={() => handleOnCloseClick()}
        icon={<BiDownload className='ml-3 h-[20px] w-[20px] text-white' />}
      >
        <h2 className="text-center fw-bold font-medium leading-6 text-gray-900 dark:text-gray-100">{title}</h2>
        <pre
          className="mt-3 relative max-h-[400px] w-fill overflow-hidden text-sm text-black dark:text-gray-300 p-2"
          style={{
            border: isCopied ? '1px solid' : "1px dashed",
            borderRadius: '10px',
            cursor: isCopied ? 'default' : 'pointer',
            animation: isCopied ? 'blink-border 0.5s linear' : 'none',
            whiteSpace: 'pre-wrap',
          }}
          onClick={() => {
            setIsCopied(true);
            copyCitation();
          }}
        >
          {pdfCitation}
          {!isCopied ? (
            <BiCopyAlt className='absolute top-1 end-1 text-black dark:text-white w-[20px] h-[20px]' />
          ) : (
            <BiCheck
              className='absolute top-1 end-1 text-black dark:text-white w-[20px] h-[20px]'
              style={{
                opacity: 0,
                animation: 'blink-icon 0.5s linear'
              }}
            />
          )
          }
        </pre>
        <div className='inline-flex gap-2'>
          {citationFormaters.map((item, i) => (
            <div
              key={i}
              className={`${item.active ? 'bg-gray-300 dark:bg-gray-600' : 'bg-transparent'} px-2 py-1 rounded-md text-black dark:text-gray-200 text-sm hover:bg-gray-300 hover:dark:bg-gray-600 duration-200`}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setTitle(item.name);
                handleFormatClick(item.format)
              }}
            >
              {item.name}
            </div>
          ))}
        </div>
      </ModalWrapper>
    </div>
  )
}
export default Citations
