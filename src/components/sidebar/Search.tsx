import { ReactElement, ReactNode, useEffect, useState } from 'react'
import { SIDEBAR_TABS } from '../../utils/enums'
import { useDocumentContext } from '../document/DocumentContext'
import { FaAngleLeft } from 'react-icons/fa'

interface ISearchProps {
  setActiveSidebar: (bool: any) => void
}

const Search = ({ setActiveSidebar }: ISearchProps) => {
  const [searchPattern, setSearchPattern] = useState<string>('')
  const [matchesList, setMatchesList] = useState<
    Array<{ pageNumber: number; matchText: string }>
  >([])
  const [isSearching, setIsSearching] = useState<boolean>(false)

  const { pdf, searchPage } = useDocumentContext()

  const handleClick = () => {
    setActiveSidebar(SIDEBAR_TABS.NULL)
  }

  const updateSearchPattern = (e: React.ChangeEvent<HTMLInputElement>) => {
    let pattern = e.target.value
    setSearchPattern(pattern)
    if (pattern === '' || !pdf) return
    setIsSearching(true)
    var textContent: { text: string; pageNumber: number }[] = []
    setMatchesList([])
    new Promise(() => {
      let promises: Array<Promise<any>> = []
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        let p = pdf?.getPage(pageNumber).then((page) => {
          return page.getTextContent()
        }).then((content) => {
          var text = content.items.map((i: any) => {
            return i.str
          }).join('')
          textContent.push({ text, pageNumber })
        })
        promises.push(p)
      }
      Promise.allSettled(promises).then( () => {
        let reg = new RegExp('.{0,20}' + pattern + '.{0,20}', 'gimu')
        textContent.sort( (a, b) => {
          if (a.pageNumber < b.pageNumber) return -1
          return 1
        })
        var _matchesList: { pageNumber: number; matchText: string }[] = []
        for (let i = 0; i < textContent.length; i++) {
          let matches = textContent[i].text.match(reg)
          if (!matches || matches.length === 0) continue
          matches.map( (match: string) => {
            _matchesList.push({
              pageNumber: textContent[i].pageNumber,
              matchText: match,
            })
          })
        }
        setMatchesList(_matchesList)
        setIsSearching(false)
      })
    })
  }

  function showSearchResults(): ReactNode {
    if (isSearching) {
      return (
        <div>
          <p>Searching...</p>
        </div>
      )
    } else {
      if (matchesList.length === 0)
        return (
          <div>
            <p>No matches</p>
          </div>
        )
      else
        return (
          <div>
            {
              matchesList.map((match, index) => {
                return (
                  <div key={'Match nr. ' + index}>
                    <button
                      className="text-black text-xs bg-blue-100 rounded-md hover:bg-blue-500 w-48 break-all ml-2"
                      onClick={() => {
                        searchPage(match.pageNumber)
                      }}
                    >
                      <p className="break-all"> {match.matchText} </p>
                      <p className="break-all">
                        {' '}
                        {'Page number: ' + match.pageNumber}{' '}
                      </p>
                    </button>
                  </div>
                )
              })
            }
          </div>
        )
    }
  }

  return (
    <div className="w-30 h-screen bg-blue-200 fixed top-100 x-100 y-100 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 z-10 overflow-auto">
      <div className="text-white mt-5">
        <input
          type="text"
          value={searchPattern}
          onChange={updateSearchPattern}
          className="w-30 bg-gray-200 text-black rounded-md mr-2 ml-2 pl-2 py-1"
        ></input>
        <button
          className="px-2 py-2 text-lg text-black bg-blue-100 rounded-md hover:bg-blue-500 mr-1"
          onClick={handleClick}
        >
          <FaAngleLeft />
        </button>
      </div>
      {showSearchResults()}
    </div>
  )
}
export default Search
