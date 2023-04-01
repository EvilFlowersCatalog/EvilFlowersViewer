import {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { debounce } from '../../../utils'
import { SEARCH_STATES, SIDEBAR_TABS } from '../../../utils/enums'
import { useDocumentContext } from '../document/DocumentContext'
// import { FaAngleLeft } from 'react-icons/fa'

interface ISearchProps {
  setActiveSidebar: (bool: any) => void
}

const Search = ({ setActiveSidebar }: ISearchProps) => {
  const [searchPattern, setSearchPattern] = useState<string>('')
  const [matches, setMatches] = useState<
    ({ page: number; text: string } | undefined)[]
  >([])
  const [searching, setSearching] = useState<SEARCH_STATES>(SEARCH_STATES.DONE)

  const { pdf, searchPage } = useDocumentContext()

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
        let textContent: { text: string; page: number }[] = []

        const pagesContent = Array.from(Array(pdf?.numPages).keys()).map(
          (n) => {
            return pdf
              ?.getPage(n + 1)
              .then((page) => page.getTextContent())
              .then((content) => {
                const text = content.items.map((i: any) => i.str).join('')
                textContent = [...textContent, { text, page: n + 1 }]
              })
          }
        )

        Promise.allSettled(pagesContent).then(() => {
          const reg = new RegExp('.{0,20}' + pattern + '.{0,20}', 'gimu')
          textContent.sort((a, b) => {
            if (a.page < b.page) return -1
            return 1
          })

          const matches = textContent.map((content) => {
            const match = content.text.match(reg)
            if (match) {
              return {
                page: content.page,
                text: match[0],
              }
            }
          })

          setMatches(matches)
          resolve(SEARCH_STATES.DONE)
        })
      }).then(() => setSearching(SEARCH_STATES.DONE))
    }),
    []
  )

  useEffect(() => {
    setSearching(SEARCH_STATES.LOADING)
    searchInDocument(searchPattern)
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
                    searchPage(match.page)
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
