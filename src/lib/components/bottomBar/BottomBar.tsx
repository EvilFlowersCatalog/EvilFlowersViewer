import { useState } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'

// icons
import { ReactComponent as Right } from '../../../assets/icons/chevron-right.svg'
import { ReactComponent as Left } from '../../../assets/icons/chevron-left.svg'
import Preview from './Preview'

interface IBottomBarProps {
  pagePreviews: number
}

/**
 * This method renders the bottom bar component
 * used to navigate through the document
 *
 * @param pagePreviews - number of previews to be rendered
 *
 * @returns The bottom bar component
 */
const BottomBar = ({ pagePreviews }: IBottomBarProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(true)
  const { activePage, prevPage, nextPage, setPage, totalPages } =
    useDocumentContext()
  const { t } = useTranslation()

  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState)
  }

  return (
    <div className="sticky bottom-0 left-0 w-fill bg-white dark:bg-gray-800 flex gap-2 p-2 rounded-xl shadow-lg justify-center items-center duration-200">
      <button
        className="bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900 rounded cursor-pointer duration-200 flex items-center"
        onClick={toggleDropdown}
        title={t('previewToggle')}
      >
        Previews
      </button>
      {isDropdownOpen && (
        <div className="flex items-center justify-center bg-white dark:bg-gray-800 p-3 rounded-lg gap-10">
          <button
            title={t('prevPage')}
            className={
              'bg-transparent border-none hover:bg-gray-50 dark:hover:bg-gray-900 rounded cursor-pointer duration-200 flex items-center'
            }
            onClick={prevPage}
          >
            <Left
              className={cx('duration-200', {
                'stroke-gray-500 dark:stroke-gray-300': activePage !== 1,
                'stroke-gray-300 dark:stroke-gray-500': activePage === 1,
              })}
            />
          </button>
          {Array.from({ length: pagePreviews }).map((_, index) => (
            <Preview
              pageNumber={
                activePage - Math.floor((pagePreviews + 1) / 2) + index + 1
              }
              previewNumber={index + 1}
              key={index}
            />
          ))}
          <button
            title={t('nextPage')}
            className={
              'bg-transparent border-none hover:bg-gray-50 dark:hover:bg-gray-900 rounded cursor-pointer duration-200 flex items-center'
            }
            onClick={nextPage}
          >
            <Right
              className={cx('duration-200', {
                'stroke-gray-300 dark:stroke-gray-500':
                  activePage === totalPages,
                'stroke-gray-500 dark:stroke-gray-300':
                  activePage !== totalPages,
              })}
            />
          </button>
        </div>
      )}
    </div>
  )
}

export default BottomBar
