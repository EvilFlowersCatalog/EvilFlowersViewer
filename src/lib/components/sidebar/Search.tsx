import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import { debounce } from '../../../utils'
import { SEARCH_STATES, SIDEBAR_TABS } from '../../../utils/enums'
import { useDocumentContext } from '../document/DocumentContext'
import { TextContent, TextItem, TextMarkedContent, getTextContentParameters } from 'pdfjs-dist/types/src/display/api'
// import { FaAngleLeft } from 'react-icons/fa'

interface ISearchProps {
  setActiveSidebar: (bool: any) => void
}

const Search = ({ setActiveSidebar }: ISearchProps) => {
  const [searchPattern, setSearchPattern] = useState<string>('')
  const [matches, setMatches] = useState<
    ({ page: number; text: string, transform: Array<number>, width: number, height: number } | undefined)[]
  >([])
  const [searching, setSearching] = useState<SEARCH_STATES>(SEARCH_STATES.DONE)

  const { pdf, searchPage, scale } = useDocumentContext()

  const handleClick = () => {
    setActiveSidebar(SIDEBAR_TABS.NULL)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (searchPattern === '') setMatches([])
    return setSearchPattern(e.target.value)
  }

  //NOTE: This is a first version of the search function, consider refactoring it to use a web worker, to unblock the main thread
  const searchInDocument = useCallback(
    debounce(async (pattern: string) => {
      new Promise((resolve) => {
        let textContent: { textItems: Array<TextItem>; page: number }[] = []

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
          })

          setMatches(matches)
          resolve(SEARCH_STATES.DONE)
        })
      }).then(() => setSearching(SEARCH_STATES.DONE))
    }),
    []
  )

  const findMatchedText = (match: { page: number; text: string, transform: Array<number>, width: number, height: number}) => {
    searchPage(match.page)

    const x: number = match.transform[4]
    const y: number = match.transform[5]
    const width: number = match.width
    const height: number = match.height

    const canvas: HTMLCanvasElement | null = document.getElementById('viewer canvas') as HTMLCanvasElement
    const canvas_height = canvas.getAttribute('height')
    if (canvas) {
      const context: CanvasRenderingContext2D | null = canvas.getContext('2d')
      if (context) {
        context.fillStyle = 'yellow'
        context.globalAlpha = 0.3
        context.fillRect(x*scale, parseInt(canvas_height!) - y * scale - height * scale, width*scale, height*scale)
      }
    }
  }

  useEffect(() => {
    if (searchPattern !== '') {
      setSearching(SEARCH_STATES.LOADING)
      searchInDocument(searchPattern)
    }
  }, [searchPattern])

  return (
    <div className="w-30 h-screen bg-blue-200 fixed top-100 x-100 y-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 z-10 overflow-auto">
      <div className="text-white mt-5">
        <input
          type="text"
          value={searchPattern}
          onChange={handleSearchChange}
          className="w-30 bg-gray-200 text-black rounded-md mr-2 ml-2 pl-2 py-1"
        ></input>
        <button
          className="px-2 py-2 text-lg text-black bg-blue-100 rounded-md hover:bg-blue-500 mr-1"
          onClick={handleClick}
        >
          {/* <FaAngleLeft /> */}
        </button>
      </div>
      {searching === SEARCH_STATES.LOADING && (
        <div className={'w-full flex justify-center py-4'}>
          <span className={'evilflowersviewer-loader-small'}></span>
        </div>
      )}
      {searching === SEARCH_STATES.DONE && matches.length === 0 && (
        <span>No matches found</span>
      )}
      {searching === SEARCH_STATES.DONE && matches.length > 0 && (
        <div>
          {matches.map((match, index) => {
            if (!match) return <></>
            return (
              <div key={'Match nr. ' + index}>
                <button
                  className="text-black text-xs bg-blue-100 rounded-md hover:bg-blue-500 w-48 break-all ml-2"
                  onClick={() => {
                    findMatchedText(match)
                  }}
                >
                  <p className="break-all"> {match.text} </p>
                  <p className="break-all"> {'Page number: ' + match.page} </p>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
export default Search
