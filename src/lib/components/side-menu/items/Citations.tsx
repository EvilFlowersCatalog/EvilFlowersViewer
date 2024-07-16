import { useEffect, useState, ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'

// icons
import { BiCheck, BiDownload } from 'react-icons/bi'
import { BiCopyAlt } from 'react-icons/bi'

import ModalWrapper from '../../modal/Modal'
import { useDocumentContext } from '../../hooks/useDocumentContext'
import cx from 'classnames'
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
          className={`relative rounded-md max-h-[400px] min-h-[100px] overflow-auto w-full border-2 text-sm p-2 pr-5 bg-gray-light dark:bg-gray-dark-medium whitespace-pre-wrap border-white dark:border-gray-dark-medium ${
            isCopied
              ? 'cursor-default animate-blink-border'
              : 'cursor-pointer animate-none'
          }`}
          onClick={() => {
            setIsCopied(true)
            copyCitation()
          }}
        >
          {pdfCitation?.citation}
          {!isCopied ? (
            <BiCopyAlt className="absolute top-1 right-1" size={20} />
          ) : (
            <BiCheck
              className="absolute top-1 right-1 opacity-0 animate-blink-icon"
              size={20}
            />
          )}
        </span>
        <div className="w-full flex justify-start mt-2.5 gap-2.5">
          {citationFormaters.map((item, i) => (
            <div
              key={i}
              className={`py-1 px-2 flex items-center justify-center cursor-pointer outline-none border-none rounded-md
                ${
                  item.active
                    ? 'bg-gray-light dark:bg-gray-dark-medium'
                    : 'bg-transparent'
                } hover:bg-gray-light dark:hover:bg-gray-dark-medium`}
              onClick={() => {
                setTitle(item.name)
                handleFormatClick(item.format, item.type)
              }}
            >
              <span className="text-sm">{item.name}</span>
            </div>
          ))}
        </div>
        <div className="w-full mt-5 flex gap-2.5 items-center">
          <input
            className={`w-32 outline-none bg-gray-light dark:bg-gray-dark-medium border rounded-md py-1 px-2 text-sm text-black dark:text-white
              ${
                pagesChacked
                  ? 'border-black dark:border-white'
                  : 'border-transparent'
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
