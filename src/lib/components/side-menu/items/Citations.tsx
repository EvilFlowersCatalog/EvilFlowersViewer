import { useEffect, useState, ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'

// icons
import { BiCheck, BiDownload } from 'react-icons/bi'
import { BiCopyAlt } from 'react-icons/bi'

import ModalWrapper from '../../modal/Modal'
import { useDocumentContext } from '../../hooks/useDocumentContext'
import { Checkbox } from '@mui/material'

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
        icon={<BiDownload size={20} color="white" />}
        title={title}
      >
        <span
          className={`efw-relative efw-rounded-md efw-max-h-[400px] efw-min-h-[100px] efw-overflow-auto efw-w-full efw-border-2 efw-text-sm efw-p-2 efw-pr-5 efw-bg-gray-light dark:efw-bg-gray-dark-medium efw-whitespace-pre-wrap efw-border-white dark:efw-border-gray-dark-medium ${
            isCopied
              ? 'efw-cursor-default efw-animate-blink-border'
              : 'efw-cursor-pointer efw-animate-none'
          }`}
          onClick={() => {
            setIsCopied(true)
            copyCitation()
          }}
        >
          {pdfCitation?.citation}
          {!isCopied ? (
            <BiCopyAlt
              className="efw-absolute efw-top-1 efw-right-1"
              size={20}
            />
          ) : (
            <BiCheck
              className="efw-absolute efw-top-1 efw-right-1 efw-opacity-0 efw-animate-blink-icon"
              size={20}
            />
          )}
        </span>
        <div className="efw-w-full efw-flex efw-justify-start efw-mt-2.5 efw-gap-2.5">
          {citationFormaters.map((item, i) => (
            <div
              key={i}
              className={`efw-py-1 efw-px-2 efw-flex efw-items-center efw-justify-center efw-cursor-pointer efw-outline-none efw-border-none efw-rounded-md
                ${
                  item.active
                    ? 'efw-bg-gray-light dark:efw-bg-gray-dark-medium'
                    : 'efw-bg-transparent'
                } hover:efw-bg-gray-light dark:hover:efw-bg-gray-dark-medium`}
              onClick={() => {
                setTitle(item.name)
                handleFormatClick(item.format, item.type)
              }}
            >
              <span className="efw-text-sm">{item.name}</span>
            </div>
          ))}
        </div>
        <div className="efw-w-full efw-mt-5 efw-flex efw-gap-2.5 efw-items-center">
          <input
            className={`efw-w-32 efw-outline-none efw-bg-gray-light dark:efw-bg-gray-dark-medium efw-border efw-rounded-md efw-py-1 efw-px-2 efw-text-sm efw-text-black dark:efw-text-white
              ${
                pagesChacked
                  ? 'efw-border-black dark:efw-border-white'
                  : 'efw-border-transparent'
              }`}
            value={pagesInput}
            type="text"
            placeholder={t('citationPagesInput')}
            disabled={!pagesChacked}
            onChange={handleInput}
            onKeyDown={(e) => {
              e.stopPropagation()
            }}
          />
          <Checkbox
            size="small"
            sx={{
              color: '#01a9e0',
              '&.Mui-checked': {
                color: '#01a9e0',
              },
            }}
            checked={pagesChacked}
            onChange={() => setPagesChacked(!pagesChacked)}
          />
        </div>
      </ModalWrapper>
    </div>
  )
}
export default Citations
