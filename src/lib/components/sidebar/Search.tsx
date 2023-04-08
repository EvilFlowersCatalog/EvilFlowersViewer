import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDocumentContext } from '../document/DocumentContext'

// utils
import { debounce } from '../../../utils'
import { SEARCH_STATES } from '../../../utils/enums'

// icons
import { ReactComponent as SadIcon } from '../../../assets/icons/mood-sad.svg'

interface ISearchProps {}

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
    ({ page: number; text: string } | undefined)[]
  >([])
  const [searching, setSearching] = useState<SEARCH_STATES>(SEARCH_STATES.DONE)

  const { pdf, searchPage } = useDocumentContext()

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
        let textContent: { text: string; page: number }[] = []

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
          }).filter(Boolean)

          setMatches(matches)
          resolve(SEARCH_STATES.DONE)
        })
      }).then(() => setSearching(SEARCH_STATES.DONE))
    }),
    []
  )

  useEffect(() => {
    if (searchPattern === '') return setMatches([])

    setSearching(SEARCH_STATES.LOADING)
    searchInDocument(searchPattern)
  }, [searchPattern])

  return (
    <>
      <input
        type={'text'}
        value={searchPattern}
        onChange={handleSearchChange}
        className={
          'mx-4 p-2 rounded-md bg-gray-100 border border-solid outline-none focus:outline-none focus:border-gray-500 duration-300'
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
            'flex justify-center items-center gap-2 text-gray-500 text-xs mt-4'
          }
        >
          <SadIcon width={20} />
          {t('noMatchesFound')}
        </span>
      )}
      {searching === SEARCH_STATES.DONE && matches.length > 0 && (
        <>
          <span className={'text-xs mx-4 mt-4 text-gray-500'}>
            {t('foundResults', { count: matches.length })}
          </span>
          {matches.map((match, i) => {
            if (!match) return <></>
            return (
              <div
                key={i}
                className={
                  'mx-4 bg-gray-100 rounded-md my-1 cursor-pointer hover:bg-gray-200 p-4 duration-200'
                }
                onClick={() => {
                  searchPage(match.page)
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
