import { useDocumentContext } from '../DocumentContext'
import { useTranslation } from 'react-i18next'

// icons
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai'

import Preview from './preview/Preview'
import { ChangeEvent, ReactNode, useState, KeyboardEvent } from 'react'
import Tooltip from '../../helpers/toolTip/Tooltip'
import { RENDERING_STATES, SIDEBAR_TABS } from '../../../../utils/enums'

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
    setPage,
    previewRender,
    activeSidebar,
  } = useDocumentContext()
  const { t } = useTranslation()

  const [inputValue, setInputValue] = useState('')

  // handle when input changed
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value // get value
    const valueRegex = /^[0-9]*$/ // regex
    const valueInt = parseInt(value ? value : '1')
    if (valueRegex.test(value) && valueInt <= totalPages && valueInt > 0) {
      // if pass set input val
      setInputValue(value)
    }
  }

  // Handle enter
  const handleInputKey = async (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'Enter' && inputValue) {
      // if enter adn input has value
      const value = parseInt(inputValue) // to int
      setPage(value)
      setInputValue('') // reset
    }
  }

  return (
    <div
      className="bottom-bar-container"
      style={activeSidebar !== SIDEBAR_TABS.EDIT ? {} : { height: '50px' }}
    >
      <div className="bottom-bar-paginator-container">
        <PaginationButton
          tooltipText={
            activePage !== 1 && previewRender !== RENDERING_STATES.RENDERING
              ? t('prevPage')
              : ''
          }
          onClick={prevPage}
          icon={
            <AiOutlineLeft
              id="bottom-bar-left"
              className={
                activePage !== 1 && previewRender !== RENDERING_STATES.RENDERING
                  ? 'viewer-button-icon'
                  : 'viewer-button-icon-deactive'
              }
              style={{ width: '20px', height: '20px' }}
            />
          }
        />
        {previewRender === RENDERING_STATES.RENDERED ? (
          <span className={'bottom-bar-pagination-pages-text'}>
            <input
              placeholder={activePage.toString()}
              value={inputValue}
              name="page-input"
              className="bottom-bar-pagination-input"
              onChange={handleInputChange}
              onKeyDown={handleInputKey}
            />
            /<span className="bottom-bar-text-container">{totalPages}</span>
          </span>
        ) : (
          <div
            className="viewer-loader-small"
            style={{ width: '20px', height: '20px' }}
          ></div>
        )}
        <PaginationButton
          tooltipText={
            activePage !== totalPages &&
            previewRender !== RENDERING_STATES.RENDERING
              ? t('nextPage')
              : ''
          }
          onClick={nextPage}
          icon={
            <AiOutlineRight
              id="bottom-bar-right"
              className={
                activePage !== totalPages &&
                previewRender !== RENDERING_STATES.RENDERING
                  ? 'viewer-button-icon'
                  : 'viewer-button-icon-deactive'
              }
              style={{ width: '20px', height: '20px' }}
            />
          }
        />
      </div>
      <Preview />
    </div>
  )
}

export default BottomBar
