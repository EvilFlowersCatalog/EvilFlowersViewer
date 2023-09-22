import { ChangeEvent, KeyboardEvent, ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'

// context
import { useDocumentContext } from '../document/DocumentContext'

// icons
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai'

import Tooltip from '../helpers/Tooltip'

interface IZoomButtonProps {
  onClick: () => void
  icon: ReactNode
  tooltipText: string
  position: 'top' | 'left' | 'right' | 'bottom'
}

const PaginationButton = ({
  onClick,
  icon,
  tooltipText,
  position,
}: IZoomButtonProps) => {
  return (
    <Tooltip title={tooltipText} placement={position}>
      <div onClick={onClick} className={'viewer-button'}>
        {icon}
      </div>
    </Tooltip>
  )
}

const Pagination = () => {
  const { t } = useTranslation()
  const { nextPage, prevPage, activePage, totalPages, setActivePage } =
    useDocumentContext()
  const [inputValue, setInputValue] = useState('')

  const handlePaginationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const valueRegex = /^[0-9]*$/
    const valueInt = parseInt(value ? value : '1')
    if (valueRegex.test(value) && valueInt <= totalPages && valueInt > 0)
      setInputValue(value)
  }

  const handlePaginationKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'Enter' && inputValue) {
      setActivePage(parseInt(inputValue))
      setInputValue('')
    }
  }

  return (
    <div
      className={'pagination-container'}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <PaginationButton
        tooltipText={activePage !== 1 ? t('prevPage') : ''}
        onClick={prevPage}
        position="top"
        icon={
          <AiOutlineLeft
            className={
              activePage !== 1
                ? 'viewer-button-icon'
                : 'viewer-button-icon-deactive'
            }
          />
        }
      />
      <span className={'pagination-pages-text'}>
        {t('pagination')}
        <input
          placeholder={activePage.toString()}
          value={inputValue}
          className="pagination-input"
          onChange={handlePaginationChange}
          onKeyDown={handlePaginationKey}
        />
        {t('of')}
        {totalPages}
      </span>
      <PaginationButton
        tooltipText={activePage !== totalPages ? t('nextPage') : ''}
        onClick={nextPage}
        position="top"
        icon={
          <AiOutlineRight
            className={
              activePage !== totalPages
                ? 'viewer-button-icon'
                : 'viewer-button-icon-deactive'
            }
          />
        }
      />
    </div>
  )
}

export default Pagination
