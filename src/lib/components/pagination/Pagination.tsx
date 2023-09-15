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
  position: 'right' | 'left' | 'bottom'
}

const PaginationButton = ({
  onClick,
  icon,
  tooltipText,
  position,
}: IZoomButtonProps) => {
  return (
    <Tooltip title={tooltipText} placement={position}>
      <div
        onClick={onClick}
        className={
          'border-none p-1 hover:bg-gray-50 dark:hover:bg-gray-900 rounded cursor-pointer duration-200 flex items-center'
        }
      >
        {icon}
      </div>
    </Tooltip>
  )
}

const Pagination = () => {
  const { t } = useTranslation()
  const { nextPage, prevPage, activePage, totalPages } = useDocumentContext()

  return (
    <div
      className={
        'fixed right-0 bg-gray-100 dark:bg-gray-800 flex-col shadow-lg justify-center items-center'
      }
      style={{ top: '50px', padding: '5px 20px' }}
    >
      <div className={'flex items-center justify-center gap-3 mb-2'}>
        <PaginationButton
          tooltipText={t('prevPage')}
          onClick={prevPage}
          position="bottom"
          icon={
            <AiOutlineLeft
              className={cx('duration-200', {
                'w-[24px] h-[24px] text-gray-500 dark:text-gray-300':
                  activePage !== 1,
                'w-[24px] h-[24px] text-gray-300 dark:text-gray-500':
                  activePage === 1,
              })}
            />
          }
        />
        <PaginationButton
          tooltipText={t('nextPage')}
          onClick={nextPage}
          position="left"
          icon={
            <AiOutlineRight
              className={cx('duration-200', {
                'w-[24px] h-[24px] text-gray-300 dark:text-gray-500':
                  activePage === totalPages,
                'w-[24px] h-[24px] text-gray-500 dark:text-gray-300':
                  activePage !== totalPages,
              })}
            />
          }
        />
      </div>
      <span
        className={
          'text-sm flex text-center font-bold px-2 pb-2 flex rounded-2 text-gray-500 dark:text-gray-300'
        }
      >
        {t('pagination', { x: activePage, y: totalPages })}
      </span>
    </div>
  )
}

export default Pagination
