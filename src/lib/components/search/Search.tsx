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
import { BiSad, BiSmile } from 'react-icons/bi'

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

  const {
    pdf,
    searchPage,
    desiredScale,
    isRendering,
    setRendering,
    nextPreviewPage,
    pagePreviews,
    setNextPreviewPage,
    pdfViewing,
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
    if (pagePreviews + nextPreviewPage < page) {
      setNextPreviewPage(page - pagePreviews)
    } else if (nextPreviewPage >= page) {
      setNextPreviewPage(page < pagePreviews ? 0 : page - pagePreviews)
    }
    setRendering(RENDERING_STATES.RENDERING)
    searchPage(page)
    setSelectedMatch(index)
  }

  /**
   * seach with every change of searchPattern, for loaded PDFs only
   */
  useEffect(() => {
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
      let canvas
      pdfViewing === 'paginator'
        ? (canvas = document.getElementById(
            'evilFlowersCanvas'
          ) as HTMLCanvasElement | null)
        : (canvas = document.getElementById(
            'evilFlowersCanvas' + matches[selectedMatch]!.page
          ) as HTMLCanvasElement | null)

      if (canvas) {
        const x: number = matches[selectedMatch]!.transform![4]
        const y: number = matches[selectedMatch]!.transform![5] - 3
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
  }, [selectedMatch, isRendering])

  return (
    <>
      <div className={'search-input-container'}>
        <input
          type={'text'}
          value={searchPattern}
          onChange={handleSearchChange}
          className={'search-input'}
          placeholder={t('search')}
          onKeyDown={(e) => {
            e.stopPropagation()
          }}
        />
        {/* {tmpSecuredView && (
          <button
            className={
              'bg-transparent border-none hover:bg-gray-400 dark:hover:bg-gray-900 rounded cursor-pointer duration-200 h-6 w-4'
            }
            onClick={(e) => searchQuery()}
          >
            S
          </button>
        )} */}
      </div>
      {searching === SEARCH_STATES.LOADING && (
        <div className={'search-loader'}>
          <span className={'viewer-loader-small'}></span>
        </div>
      )}
      {searchPattern.length === 0 && (
        <span
          className={'search-tips-titles'}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {t('searchPattern')}
          <BiSmile className="viewer-button-icon" />
        </span>
      )}
      {searching === SEARCH_STATES.DONE &&
        matches.length === 0 &&
        searchPattern.length > 0 && (
          <span className={'search-tips-titles'}>
            {t('noMatchesFound')}
            <BiSad className="viewer-button-icon" />
          </span>
        )}
      {searching === SEARCH_STATES.DONE &&
        matches.length > 0 &&
        searchPattern.length > 0 && (
          <div className="search-found-results-container">
            <span className={'search-found-results'}>
              {t('foundResults', { count: matches.length })}
            </span>
            <div className="search-matches-container">
              {matches.map((match, i) => {
                if (!match) return <></>
                return (
                  <div
                    key={i}
                    className={'search-mached-text-container'}
                    onClick={() => {
                      findMatchedText(match.page, i)
                    }}
                  >
                    <span className={'search-mached-pattern'}>
                      {match.text}
                    </span>
                    <span className={'search-mached-page'}>
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
