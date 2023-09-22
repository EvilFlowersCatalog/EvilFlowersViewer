import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

// icons
import { BiCheck, BiDownload } from 'react-icons/bi'
import { BiCopyAlt } from 'react-icons/bi'

import ModalWrapper from '../modal/Modal'
import { useDocumentContext } from '../document/DocumentContext'
import cx from 'classnames'

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
  const [isOpen, setIsOpen] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [title, setTitle] = useState<string>('bibtex')
  const [citationFormaters, setCitationFormaters] = useState([
    {
      name: 'BibTeX',
      format: 'bibtex',
      type: 'bib',
    },
    {
      name: 'BibLaTeX',
      format: 'biblatex',
      type: 'bib',
    },
    {
      name: 'RIS',
      format: 'ris',
      type: 'ris',
    },
    {
      name: 'Plain-Text',
      format: 'bibliography',
      type: 'txt',
    },
  ])
  const { downloadCitation, copyCitation, pdfCitation, changeCitationFormat } =
    useDocumentContext()
  const { t } = useTranslation()

  useEffect(() => {
    citationFormaters.forEach((item) => {
      if (item.format === pdfCitation?.format) {
        setTitle(item.name)
      }
    })
  }, [])

  /**
   * function for handling close click
   */
  const handleOnCloseClick = () => {
    setIsOpen(false)
    setCitationVisible(false)
  }

  /**
   * Function for accepting button on click
   */
  const handleOnClickClick = () => {
    downloadCitation() // download citation
    setIsOpen(false) // closal modal wrapper (citation component)
    setCitationVisible(false) // set false
  }

  const handleFormatClick = (selectedFormat: string, type: string) => {
    changeCitationFormat(selectedFormat, type) // change format for citation
    setIsCopied(false) // reset copy posibility

    // update formaters
    const updatedFormaters = citationFormaters.map((item) => ({
      ...item,
      active: item.format === selectedFormat,
    }))

    setCitationFormaters(updatedFormaters)
  }

  return (
    <div>
      <ModalWrapper
        label={t('download')}
        onClick={() => handleOnClickClick()}
        isOpen={isOpen}
        onClose={() => handleOnCloseClick()}
        icon={
          <BiDownload
            className="viewer-button-icon"
            style={{
              color: 'white',
              width: '20px',
              height: '20px',
            }}
          />
        }
      >
        <h4 className="citations-title">{title}</h4>
        <span
          className={cx('citations-citation', {
            'citations-citation-coppied': isCopied,
            'citations-citation-not-coppied': !isCopied,
          })}
          onClick={() => {
            setIsCopied(true)
            copyCitation()
          }}
        >
          {pdfCitation?.citation}
          {!isCopied ? (
            <BiCopyAlt className="citation-icon" />
          ) : (
            <BiCheck className="citation-icon citation-coppied-icon" />
          )}
        </span>
        <div className="citation-buttons-container">
          {citationFormaters.map((item, i) => (
            <div
              key={i}
              className={'viewer-button'}
              onClick={() => {
                setTitle(item.name)
                handleFormatClick(item.format, item.type)
              }}
            >
              <span style={{ fontSize: '13px' }}>{item.name}</span>
            </div>
          ))}
        </div>
      </ModalWrapper>
    </div>
  )
}
export default Citations
