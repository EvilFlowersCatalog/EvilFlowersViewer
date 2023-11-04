import { useEffect, useState, ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'

// icons
import { BiCheck, BiDownload } from 'react-icons/bi'
import { BiCopyAlt } from 'react-icons/bi'

import ModalWrapper from '../../../modal/Modal'
import { useDocumentContext } from '../../../document/DocumentContext'
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
  const [pagesInput, setPagesInput] = useState<string>('')
  const [pagesChacked, setPagesChacked] = useState<boolean>(false)
  const [citationFormaters, setCitationFormaters] = useState([
    {
      name: 'BibTeX',
      format: 'bibtex',
      type: 'bib',
      active: false,
    },
    {
      name: 'BibLaTeX',
      format: 'biblatex',
      type: 'bib',
      active: false,
    },
    {
      name: 'RIS',
      format: 'ris',
      type: 'ris',
      active: false,
    },
    {
      name: 'Plain-Text',
      format: 'bibliography',
      type: 'txt',
      active: false,
    },
  ])
  const {
    downloadCitation,
    copyCitation,
    pdfCitation,
    changeCitationFormat,
    setBasedPdfCitation,
    basedPdfCitation,
    activePage,
  } = useDocumentContext()
  const { t } = useTranslation()

  const changeCitation = (input: string) => {
    setPagesInput(input)

    const pagesPattern = /pages = \{[0-9]*\}/
    const citationReg = /.*pages = \{[0-9]*\}.*/
    let tmp = basedPdfCitation

    // if it contains pages
    if (citationReg.test(tmp!)) {
      // Replace the "pages" line with the updated value
      const updatedCitation = tmp?.replace(pagesPattern, `pages = {${input}}`)
      setBasedPdfCitation(updatedCitation)
    } else {
      // if not
      const lastIndex = tmp!.lastIndexOf('}')
      const newTmp = `${tmp!.slice(
        0,
        lastIndex
      )}\t,pages = {${input}}\n${tmp!.slice(lastIndex)}`
      setBasedPdfCitation(newTmp)
    }
  }

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const regex = /^[0-9]*$/

    if (regex.test(input) || input === '') {
      changeCitation(input)
    }
  }

  useEffect(() => {
    if (pagesChacked) {
      changeCitation(activePage.toString())
    } else {
      changeCitation('')
    }
  }, [pagesChacked])

  useEffect(() => {
    citationFormaters.forEach((item) => {
      if (item.format === pdfCitation?.format) {
        setTitle(item.name)
        item.active = true
      } else {
        item.active = false
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
              className={
                item.active ? 'citation-active-button' : 'viewer-button'
              }
              onClick={() => {
                setTitle(item.name)
                handleFormatClick(item.format, item.type)
              }}
            >
              <span style={{ fontSize: '13px' }}>{item.name}</span>
            </div>
          ))}
        </div>
        <div className="citation-input-container">
          <input
            className={cx('citation-input ', {
              'citation-input-active': pagesChacked,
            })}
            value={pagesInput}
            type="text"
            placeholder={t('citationPagesInput')}
            disabled={!pagesChacked}
            onChange={handleInput}
            onKeyDown={(e) => {
              e.stopPropagation()
            }}
          />
          <input
            type="checkbox"
            checked={pagesChacked}
            style={{ cursor: 'pointer' }}
            onChange={() => setPagesChacked(!pagesChacked)}
          />
        </div>
      </ModalWrapper>
    </div>
  )
}
export default Citations
