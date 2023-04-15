import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDocumentContext } from '../document/DocumentContext'
import { TextItem, getTextContentParameters } from 'pdfjs-dist/types/src/display/api'

// utils
import { debounce } from '../../../utils'
import { SEARCH_STATES } from '../../../utils/enums'
import { RENDERING_STATES } from '../../../utils/enums'

// icons
import { ReactComponent as SadIcon } from '../../../assets/icons/mood-sad.svg'

/**
 *
 * @param param0 - props
 * @param param0.setActiveSidebar - function to set the active sidebar
 * @returns The search sidebar component
 */
const Search = () => {
  const { t } = useTranslation()

  const [searchPattern, setSearchPattern] = useState<string>('')
  const [matches, setMatches] = useState<
    ({ page: number; text: string, transform: Array<number>, width: number, height: number } | undefined)[]
  >([])
  const [searching, setSearching] = useState<SEARCH_STATES>(SEARCH_STATES.DONE)
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null)

  const { pdf, searchPage, scale, isRendering, setRendering } = useDocumentContext()

  /**
   *
   * @param e - the change event
   * @returns - the search pattern
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (searchPattern === '') setMatches([])
    return setSearchPattern(e.target.value)
  }

  /**
   * Looks for the search pattern in the whole document
   * and returns them and their page number in sidebar component
   *
   * @param pattern - the search pattern
   * @returns - the matches with their page number
   *
   * @todo - consider using web workers to unblock the main thread
   *
   * @alpha
   */
  //NOTE: This is a first version of the search function, consider refactoring it to use a web worker, to unblock the main thread
  const searchInDocument = useCallback(
    debounce(async (pattern: string) => {

      new Promise((resolve) => {
        setSelectedMatch(null)
        let textContent: { textItems: Array<TextItem>; page: number }[] = []

        /**
         * Get the text content of page
         *
         * @param n - the page number
         *
         * @returns - an array of promises
         */
        const pagesContent = Array.from(Array(pdf?.numPages).keys()).map(
          (n) => {
            return pdf
              ?.getPage(n + 1)
              .then((page) => {
                // ensure text content includes only textItems
                let e:getTextContentParameters = {disableCombineTextItems: false, includeMarkedContent: false}
                return page.getTextContent(e)
              })
              .then((content: any) => {
                textContent = [...textContent, { textItems: content.items, page: n + 1 }]
              })
          }
        )

        Promise.allSettled(pagesContent).then(() => {
          const reg = new RegExp('.{0,20}' + pattern + '.{0,20}', 'gimu')
          textContent.sort((a, b) => {
            if (a.page < b.page) return -1
            return 1
          })
          // keep matched string, page number, and information for highlighting: transformation matrix, width and height of text
          let matches: { text: string; page: number, transform: Array<number>, width: number, height: number }[] = []
          textContent.map((content) => {
            content.textItems.map((textItem: any) => {
              const match: RegExpMatchArray | null = textItem.str.match(reg)
              if (match) {
                match.map((text, index) => {
                  matches = [...matches, { page: content.page, text: text, transform: textItem.transform, width: textItem.width, height: textItem.height}]
                }) 
              }
            })
          }).filter(Boolean)

          setMatches(matches)
          resolve(SEARCH_STATES.DONE)
        })
      }).then(() => setSearching(SEARCH_STATES.DONE))
    }),
    []
  )

  const findMatchedText = (page: number, index: number) => {
    setRendering(RENDERING_STATES.RENDERING)
    searchPage(page)
    setSelectedMatch(index)
  }

  useEffect(() => {
    if (searchPattern === '') return setMatches([])

    setSearching(SEARCH_STATES.LOADING)
    searchInDocument(searchPattern)
  }, [searchPattern])

  useEffect(() => {
    if (selectedMatch != null && isRendering === RENDERING_STATES.RENDERED && matches && matches.length > selectedMatch) {
      const canvas = document.getElementById('evilFlowersCanvas') as HTMLCanvasElement | null

      if (canvas) {
        const x: number = matches[selectedMatch]!.transform[4]
        const y: number = matches[selectedMatch]!.transform[5]
        const width: number = matches[selectedMatch]!.width
        const height: number = matches[selectedMatch]!.height
        const canvas_height = canvas.getAttribute('height')
        const context: CanvasRenderingContext2D | null = canvas.getContext('2d')
        if (context) {
          context.fillStyle = 'yellow'
          context.globalAlpha = 0.3
          context.fillRect(x*scale, parseInt(canvas_height!) - y * scale - height * scale, width*scale, height*scale)
        }
      }
    }
  }, [selectedMatch, isRendering])

  return (
    <>
      <input
        type={'text'}
        value={searchPattern}
        onChange={handleSearchChange}
        className={
          'mx-4 p-2 rounded-md bg-gray-100 dark:bg-gray-900 border border-solid dark:border-gray-500 dark:text-gray-300 outline-none focus:outline-none focus:border-gray-500 dark:focus:border-gray-300 duration-300'
        }
        placeholder={'Enter search pattern...'}
      ></input>
      {searching === SEARCH_STATES.LOADING && (
        <div className={'w-full flex justify-center py-4'}>
          <span className={'evilflowersviewer-loader-small'}></span>
        </div>
      )}
      {searching === SEARCH_STATES.DONE && matches.length === 0 && (
        <span
          className={
            'flex justify-center items-center gap-2 text-gray-500 dark:text-gray-300 text-xs mt-4'
          }
        >
          <SadIcon width={20} />
          {t('noMatchesFound')}
        </span>
      )}
      {searching === SEARCH_STATES.DONE && matches.length > 0 && (
        <>
          <span className={'text-xs mx-4 mt-4 text-gray-500 dark:text-gray-300'}>
            {t('foundResults', { count: matches.length })}
          </span>
          {matches.map((match, i) => {
            if (!match) return <></>
            return (
              <div
                key={i}
                className={
                  'mx-4 bg-gray-100 dark:bg-gray-300 rounded-md my-1 cursor-pointer hover:bg-gray-200 px-4 py-2 duration-200'
                }
                onClick={() => {
                  findMatchedText(match.page, i)
                }}
              >
                <span className={'break-all text-xs'}>{match.text}</span>
                <span className={'text-right block break-all text-sm'}>
                  {t('pageNumber', { number: match.page })}
                </span>
              </div>
            )
          })}
        </>
      )}
    </>
  )
}
export default Search
