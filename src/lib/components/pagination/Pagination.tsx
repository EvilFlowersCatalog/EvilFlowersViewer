import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'

// context
import { useDocumentContext } from '../document/DocumentContext'

// icons
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai'

import Tooltip from '../helpers/Tooltip'

interface IZoomButtonProps {
  onClick: () => void
  icon: ReactNode
  tooltipText: string
}

const PaginationButton = ({ onClick, icon, tooltipText }: IZoomButtonProps) => {
  return (
    <Tooltip title={tooltipText}>
      <button
        onClick={onClick}
        className={
          'bg-transparent border-none hover:bg-gray-50 dark:hover:bg-gray-900 rounded cursor-pointer duration-200 flex items-center'
        }
      >
        {icon}
      </button>
    </Tooltip>
  )
}

const Pagination = () => {
  const { t } = useTranslation()
  const { nextPage, prevPage, activePage, totalPages } = useDocumentContext()

  return (
    <div
      className={
        'fixed right-6 bottom-10 bg-white dark:bg-gray-800 flex gap-2 p-2 rounded-xl shadow-lg justify-center items-center duration-200'
      }
    >
      <PaginationButton
        tooltipText={t('prevPage')}
        onClick={prevPage}
        icon={
          <AiOutlineLeft
            className={cx('duration-200', {
              'w-[24px] h-[24px] text-gray-500 dark:text-gray-300': activePage !== 1,
              'w-[24px] h-[24px] text-gray-300 dark:text-gray-500': activePage === 1,
            })}
          />
        }
      />
      <PaginationButton
        tooltipText={t('nextPage')}
        onClick={nextPage}
        icon={
          <AiOutlineRight
            className={cx('duration-200', {
              'w-[24px] h-[24px] text-gray-300 dark:text-gray-500': activePage === totalPages,
              'w-[24px] h-[24px] text-gray-500 dark:text-gray-300': activePage !== totalPages,
            })}
          />
        }
      />
      <span
        className={
          'text-sm font-bold p-2 rounded-2 w-28 text-gray-500 dark:text-gray-300 text-center'
        }
      >
        {t('pagination', { x: activePage, y: totalPages })}
      </span>
    </div>
  )
}

export default Pagination
