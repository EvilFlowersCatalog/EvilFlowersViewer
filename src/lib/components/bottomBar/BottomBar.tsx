import { ReactComponentElement, useEffect, useState } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'

// icons
import { AiOutlineLeft, AiOutlineDown, AiOutlineUp, AiOutlineRight } from 'react-icons/ai'

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { activePage, prevPage, nextPage, totalPages } = useDocumentContext()
  const { t } = useTranslation()

  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState)
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-800 gap-2 py-1 shadow-lg justify-center items-center grid grid-cols-1 duration-200 z-10">
      <button
        className="bg-transparent border-none hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer duration-200 items-center justify-self-center h-6 w-8 rounded-md pl-1"
        onClick={toggleDropdown}
        title={t('previewToggle')}
      >
        {isDropdownOpen ? (
          <AiOutlineDown className="duration-200 w-[24px] h-[24px] text-gray-500 dark:text-gray-300" />
        ) : (
          <AiOutlineUp className="duration-200 w-[24px] h-[24px] text-gray-500 dark:text-gray-300" />
        )}
      </button>
      {isDropdownOpen && (
        <div className="flex items-center justify-center bg-white dark:bg-gray-800 p-3 gap-10">
          <button
            title={t('prevPage')}
            className={
              'bg-transparent border-none hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer duration-200 flex items-center rounded-md'
            }
            onClick={prevPage}
          >
            <AiOutlineLeft
              className={cx('duration-200', {
                'w-[24px] h-[24px] text-gray-500 dark:text-gray-300': activePage !== 1,
                'w-[24px] h-[24px] text-gray-300 dark:text-gray-500': activePage === 1,
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
              'bg-transparent border-none hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer duration-200 flex items-center rounded-md'
            }
            onClick={nextPage}
          >
            <AiOutlineRight
              className={cx('duration-200', {
                'w-[24px] h-[24px] text-gray-300 dark:text-gray-500':
                  activePage === totalPages,
                'w-[24px] h-[24px] text-gray-500 dark:text-gray-300':
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
