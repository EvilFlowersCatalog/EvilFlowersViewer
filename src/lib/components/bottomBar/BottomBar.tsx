import { useDocumentContext } from '../document/DocumentContext'
import { useTranslation } from 'react-i18next'

// icons
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai'

import Preview from './Preview'
import { ChangeEvent, ReactNode, useState, KeyboardEvent } from 'react'
import Tooltip from '../helpers/toolTip/Tooltip'

interface IZoomButtonProps {
  onClick: () => void
  icon: ReactNode
  tooltipText: string
}

const PaginationButton = ({ onClick, icon, tooltipText }: IZoomButtonProps) => {
  return (
    <Tooltip title={tooltipText} placement={'top'}>
      <div onClick={onClick} className={'viewer-button'}>
        {icon}
      </div>
    </Tooltip>
  )
}

/**
 * This method renders the bottom bar component
 * used to navigate through the document
 *
 * @param pagePreviews - number of previews to be rendered
 *
 * @returns The bottom bar component
 */
const BottomBar = () => {
  const {
    activePage,
    prevPage,
    nextPage,
    totalPages,
    setActivePage,
    nextPreviewPage,
    setNextPreviewPage,
    pagePreviews,
  } = useDocumentContext()
  const { t } = useTranslation()

  const [inputValue, setInputValue] = useState('')

  const handlePaginationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const valueRegex = /^[0-9]*$/
    const valueInt = parseInt(value ? value : '1')
    if (valueRegex.test(value) && valueInt <= totalPages && valueInt > 0) {
      setInputValue(value)
    }
  }

  const handlePaginationKey = async (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'Enter' && inputValue) {
      const value = parseInt(inputValue)
      setActivePage(value)
      if (pagePreviews + nextPreviewPage < value) {
        setNextPreviewPage(value - pagePreviews)
      } else if (nextPreviewPage >= value) {
        setNextPreviewPage(value < pagePreviews ? 0 : value - pagePreviews)
      }
      setInputValue('')
    }
  }

  return (
    <div className="preview-bar-container">
      <div className="preview-bar-paginator-container">
        <PaginationButton
          tooltipText={activePage !== 1 ? t('prevPage') : ''}
          onClick={() => {
            prevPage()
          }}
          icon={
            <AiOutlineLeft
              className={
                activePage !== 1
                  ? 'viewer-button-icon'
                  : 'viewer-button-icon-deactive'
              }
              style={{ width: '20px', height: '20px' }}
            />
          }
        />
        <span className={'preview-bar-pagination-pages-text'}>
          {t('pagination')}
          <input
            placeholder={activePage.toString()}
            value={inputValue}
            className="preview-bar-pagination-input"
            onChange={handlePaginationChange}
            onKeyDown={handlePaginationKey}
          />
          {t('of')}
          {totalPages}
        </span>
        <PaginationButton
          tooltipText={activePage !== totalPages ? t('nextPage') : ''}
          onClick={() => {
            nextPage()
          }}
          icon={
            <AiOutlineRight
              className={
                activePage !== totalPages
                  ? 'viewer-button-icon'
                  : 'viewer-button-icon-deactive'
              }
              style={{ width: '20px', height: '20px' }}
            />
          }
        />
      </div>
      <div className="prievew-bar-pages-container">
        {Array.from({ length: Math.min(pagePreviews, totalPages) }).map(
          (_, index) => (
            <Preview pageNumber={index + 1 + nextPreviewPage} key={index} />
          )
        )}
      </div>
    </div>
  )
}

export default BottomBar
