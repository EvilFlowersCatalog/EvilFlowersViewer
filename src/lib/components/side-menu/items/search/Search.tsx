import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDocumentContext } from '../../../hooks/useDocumentContext'
import {
  TextItem,
  getTextContentParameters,
} from 'pdfjs-dist/types/src/display/api'

// utils
import { debounce } from '../../../../../utils'
import { SEARCH_STATES } from '../../../../../utils/enums'
import { RENDERING_STATES } from '../../../../../utils/enums'

// icons
import { BiSad, BiSmile } from 'react-icons/bi'
import Loader from '../../../common/Loader'

/**
 *
 * @returns The search sidebar component
 */
const Search = () => {
  const { t } = useTranslation()

  const [searchPattern, setSearchPattern] = useState<string>('')
  const [matches, setMatches] = useState<
    (
      | {
          page: number
          text: string
          transform: Array<number> | undefined
          width: number
          height: number
        }
      | undefined
    )[]
  >([])
  const [searching, setSearching] = useState<SEARCH_STATES>(SEARCH_STATES.DONE)
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null)
  let searchWorker: Worker | undefined = undefined

  const ref = useRef<HTMLInputElement | null>(null)

  const {
    pdf,
    searchPage,
    desiredScale,
    paginatorPageRender,
    setPaginatorPageRender,
    activePage,
  } = useDocumentContext()

  /**
   *
   * @param e - the change event
   * @returns - the search pattern
   *
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    return setSearchPattern(e.target.value)
  }

  /**
   * Looks for the search pattern in the whole document
   * and returns them and their page number in sidebar component
   *
   * @param pattern - the search pattern
   * @returns - the matches with their page number
   *
   */
  const searchInDocument = useCallback(
    debounce(async (pattern: string) => {
      if (window.Worker) {
        if (searchWorker) searchWorker.terminate()
        new Promise((resolve) => {
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
                  let e: getTextContentParameters = {
                    disableCombineTextItems: false,
                    includeMarkedContent: false,
                  }
                  return page.getTextContent(e)
                })
                .then((content: any) => {
                  textContent = [
                    ...textContent,
                    { textItems: content.items, page: n + 1 },
                  ]
                })
            }
          )

          Promise.allSettled(pagesContent).then(() => {
            searchWorker = new Worker(
              new URL('./SearchWorker.ts', import.meta.url)
            )
            setSelectedMatch(null)
            searchWorker!.postMessage([pattern, textContent])
            searchWorker!.onmessage = (e) => {
              setMatches(e.data)
              if (searchWorker) searchWorker.terminate()
              searchWorker = undefined
              setSearching(SEARCH_STATES.DONE)
            }
          })
        })
      }
    }),
    []
  )

  /**
   * navigate to selected match
   * @param page page number of selected match
   * @param index index of match in matches array
   */
  const findMatchedText = (page: number, index: number) => {
    setPaginatorPageRender(RENDERING_STATES.RENDERING)
    searchPage(page)
    setSelectedMatch(index)
  }

  /**
   * seach with every change of searchPattern, for loaded PDFs only
   */
  useEffect(() => {
    if (searchPattern === '') return setMatches([])
    setSearching(SEARCH_STATES.LOADING)
    searchInDocument(searchPattern)
  }, [searchPattern])

  /**
   * match highlighting
   */
  useEffect(() => {
    if (
      selectedMatch != null &&
      paginatorPageRender === RENDERING_STATES.RENDERED &&
      matches &&
      matches.length > selectedMatch &&
      matches[selectedMatch]?.transform &&
      activePage === matches[selectedMatch]?.page
    ) {
      const canvas = document.getElementById(
        'evilFlowersCanvas'
      ) as HTMLCanvasElement | null

      if (canvas) {
        const x: number = matches[selectedMatch]!.transform![4]
        const y: number = matches[selectedMatch]!.transform![5] - 2
        const width: number = matches[selectedMatch]!.width
        const height: number = matches[selectedMatch]!.height
        const canvas_height = canvas.getAttribute('height')
        const context: CanvasRenderingContext2D | null = canvas.getContext('2d')
        if (context) {
          context.fillStyle = 'orange'
          context.globalAlpha = 0.4
          context.fillRect(
            x * desiredScale,
            parseInt(canvas_height!) - y * desiredScale - height * desiredScale,
            width * desiredScale,
            height * desiredScale
          )
        }
      }
    }
  }, [selectedMatch, paginatorPageRender])

  useEffect(() => {
    if (ref) ref.current?.focus()
  }, [ref])

  return (
    <>
      <div
        className={'efw-flex efw-w-full efw-items-center efw-justify-center'}
      >
        {/* Search input */}
        <input
          ref={ref}
          type={'text'}
          value={searchPattern}
          onChange={handleSearchChange}
          name="search-input"
          className="efw-w-full efw-p-2 efw-text-sm efw-border-none efw-rounded-md efw-bg-gray-light dark:efw-bg-gray-dark-medium efw-outline-none efw-text-black dark:efw-text-white"
          placeholder={t('search')}
          onKeyDown={(e) => {
            e.stopPropagation()
          }}
        />
      </div>
      {/* If loading */}
      {searching === SEARCH_STATES.LOADING && (
        <div className="efw-w-full efw-flex efw-justify-center efw-mt-5">
          <Loader size={30} />
        </div>
      )}
      {/* If searchPattern is empty and searching is done */}
      {searchPattern.length === 0 && searching === SEARCH_STATES.DONE && (
        <span
          className={
            'efw-mt-5 efw-w-full efw-text-center efw-text-sm efw-whitespace-pre-wrap efw-flex efw-flex-col efw-justify-center efw-items-center'
          }
        >
          {t('searchPattern')}
          <BiSmile className="efw-mt-2" size={30} />
        </span>
      )}
      {/* if search is done and there are no matches and ther is pattern */}
      {searching === SEARCH_STATES.DONE &&
        matches.length === 0 &&
        searchPattern.length > 0 && (
          <span
            className={
              'efw-mt-5 efw-w-full efw-text-center efw-text-sm efw-whitespace-pre-wrap efw-flex efw-flex-col efw-justify-center efw-items-center'
            }
          >
            {t('noMatchesFound')}
            <BiSad className="efw-mt-2" size={30} />
          </span>
        )}
      {/* if search is done and there are matches */}
      {searching === SEARCH_STATES.DONE &&
        matches.length > 0 &&
        searchPattern.length > 0 && (
          <div className="efw-w-full efw-flex efw-flex-col efw-mt-5">
            <span className={'efw-text-sm efw-font-medium efw-mb-2'}>
              {t('foundResults', { count: matches.length })}
            </span>
            <div className="efw-flex efw-flex-col efw-gap-2.5 efw-w-full">
              {/* matches */}
              {matches.map((match, i) => {
                if (!match) return <></>
                return (
                  <div
                    key={i}
                    className={
                      'efw-rounded-md efw-bg-gray-light dark:efw-bg-gray-dark-medium hover:efw-bg-opacity-50 dark:hover:efw-bg-opacity-50 efw-cursor-pointer efw-flex efw-flex-col efw-p-2 efw-gap-2'
                    }
                    onClick={() => {
                      findMatchedText(match.page, i)
                    }}
                  >
                    <span className={'efw-text-sm efw-text-left'}>
                      {match.text}
                    </span>
                    <span
                      className={
                        'efw-text-right efw-block efw-text-sm efw-font-bold'
                      }
                    >
                      {t('pageNumber', { number: match.page })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
    </>
  )
}
export default Search
