import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDocumentContext } from '../document/DocumentContext'
import {
  TextItem,
  getTextContentParameters,
} from 'pdfjs-dist/types/src/display/api'

// utils
import { debounce } from '../../../utils'
import { SEARCH_STATES } from '../../../utils/enums'
import { RENDERING_STATES } from '../../../utils/enums'

// icons
import { BiSad } from 'react-icons/bi'

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
  const tmpSecuredView = false

  const { pdf, searchPage, scale, isRendering, setRendering } =
    useDocumentContext()

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
              new URL('SearchWorker.ts', import.meta.url)
            )
            setSelectedMatch(null)
            searchWorker!.postMessage([pattern, textContent])
            searchWorker!.onmessage = (e) => {
              setMatches(e.data)
              searchWorker!.terminate()
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
   * query server for search results in case of secured document.
   */
  const searchQuery = () => {
    if (searchPattern === '') {
      return setMatches([])
    }
    setSearching(SEARCH_STATES.LOADING)
    // query server with searchPattern
    // parse results into setMatches() - create new array with each elemet's attributes:
    // page - page number,
    // text - matched text preview
    // for disabled highlighting:
    // transform - undefined,
    // width,height - 0

    // temp example for disabled highlighting - no transform matrix
    setMatches([
      {
        page: 5,
        text: 'ukazka: ' + searchPattern,
        transform: undefined,
        width: 0,
        height: 0,
      },
    ])
    setSearching(SEARCH_STATES.DONE)
  }

  /**
   * navigate to selected match
   * @param page page number of selected match
   * @param index index of match in matches array
   */
  const findMatchedText = (page: number, index: number) => {
    setRendering(RENDERING_STATES.RENDERING)
    searchPage(page)
    setSelectedMatch(index)
  }

  /**
   * seach with every change of searchPattern, for loaded PDFs only
   */
  useEffect(() => {
    //TODO: update condition
    if (!tmpSecuredView) {
      if (searchPattern === '') return setMatches([])
      setSearching(SEARCH_STATES.LOADING)
      searchInDocument(searchPattern)
    }
  }, [searchPattern])

  /**
   * match highlighting
   */
  useEffect(() => {
    if (
      selectedMatch != null &&
      isRendering === RENDERING_STATES.RENDERED &&
      matches &&
      matches.length > selectedMatch &&
      matches[selectedMatch]?.transform
    ) {
      const canvas = document.getElementById(
        'evilFlowersCanvas'
      ) as HTMLCanvasElement | null

      if (canvas) {
        const x: number = matches[selectedMatch]!.transform![4]
        const y: number = matches[selectedMatch]!.transform![5]
        const width: number = matches[selectedMatch]!.width
        const height: number = matches[selectedMatch]!.height
        const canvas_height = canvas.getAttribute('height')
        const context: CanvasRenderingContext2D | null = canvas.getContext('2d')
        if (context) {
          context.fillStyle = 'yellow'
          context.globalAlpha = 0.3
          context.fillRect(
            x * scale,
            parseInt(canvas_height!) - y * scale - height * scale,
            width * scale,
            height * scale
          )
        }
      }
    }
  }, [selectedMatch, isRendering])

  return (
    <>
      <div className={'flex items-center justify-center gap-0 border-none'}>
        <input
          type={'text'}
          value={searchPattern}
          onChange={handleSearchChange}
          className={`ml-4 mr-4 py-1 px-2 rounded-md bg-gray-100 dark:bg-gray-900 border border-solid dark:border-gray-500 dark:text-gray-300 outline-none focus:outline-none focus:border-gray-500 dark:focus:border-gray-300 duration-300 
            ${tmpSecuredView ? 'w-32' : ''}`}
          placeholder={t('searchPattern')}
          onKeyDown={(e) => {
            e.stopPropagation()
          }}
        />
        {tmpSecuredView && (
          <button
            className={
              'bg-transparent border-none hover:bg-gray-400 dark:hover:bg-gray-900 rounded cursor-pointer duration-200 h-6 w-4'
            }
            onClick={(e) => searchQuery()}
          >
            S
          </button>
        )}
      </div>
      {searching === SEARCH_STATES.LOADING && (
        <div className={'w-full flex justify-center py-4'}>
          <span className={'evilflowersviewer-loader-small'}></span>
        </div>
      )}
      {searching === SEARCH_STATES.DONE &&
        matches.length === 0 &&
        searchPattern.length > 0 && (
          <span
            className={
              'flex flex-col justify-center items-center gap-2 text-gray-500 dark:text-gray-300 text-xs mt-4'
            }
          >
            {t('noMatchesFound')}
            <BiSad className="w-[30px] h-[30px] text-gray-500 dark:text-gray-300" />
          </span>
        )}
      {searching === SEARCH_STATES.DONE && matches.length > 0 && (
        <>
          <span
            className={'text-xs mx-4 mt-4 text-gray-500 dark:text-gray-300'}
          >
            {t('foundResults', { count: matches.length })}
          </span>
          {matches.map((match, i) => {
            if (!match) return <></>
            return (
              <div
                key={i}
                className={
                  'mx-4 my-1 bg-gray-200 dark:bg-gray-400 hover:bg-gray-300 rounded-md hover:dark:bg-gray-300 cursor-pointer px-4 py-2 duration-200'
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
