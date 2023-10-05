import { useDocumentContext } from '../document/DocumentContext'
import { useTranslation } from 'react-i18next'

// icons
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai'

import Preview from './Preview'
import {
  ChangeEvent,
  ReactNode,
  useState,
  KeyboardEvent,
  useEffect,
  useCallback,
} from 'react'
import Tooltip from '../helpers/toolTip/Tooltip'
import { BOTTOMBAR_STATES } from '../../../utils/enums'

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
    isBottomBarRendering,
    setBottomBarRendering,
  } = useDocumentContext()
  const { t } = useTranslation()

  const [inputValue, setInputValue] = useState('')
  const [previewBar, setPreviewBar] = useState<JSX.Element[]>([])

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
      setActivePage(value) // set page
      if (pagePreviews + nextPreviewPage < value) {
        setNextPreviewPage(value - pagePreviews)
      } else if (nextPreviewPage >= value) {
        setNextPreviewPage(value < pagePreviews ? 0 : value - pagePreviews)
      }
      setInputValue('') // reset
    }
  }

  // Load pages in preview bar
  const loadPreviews = useCallback(async () => {
    return await new Promise((resolve) => {
      // set new arr
      setPreviewBar(
        Array.from({
          length: Math.min(pagePreviews, totalPages),
        }).map((_, index) => (
          <Preview key={index} pageNumber={index + 1 + nextPreviewPage} />
        ))
      )
      resolve(BOTTOMBAR_STATES.RENDERED) // resolve value
    }) // return resolve
  }, [pagePreviews, totalPages, nextPreviewPage, activePage])

  // When something in given arr change, rerender
  useEffect(() => {
    setPreviewBar([])
    setBottomBarRendering(BOTTOMBAR_STATES.RENDERING) // set rendering
    loadPreviews().then((e: any) => setBottomBarRendering(e))
  }, [pagePreviews, totalPages, nextPreviewPage, activePage])

  return (
    <div className="preview-bar-container">
      <div className="preview-bar-paginator-container">
        <PaginationButton
          tooltipText={activePage !== 1 ? t('prevPage') : ''}
          onClick={() => {
            isBottomBarRendering === BOTTOMBAR_STATES.RENDERED
              ? prevPage()
              : null
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
            onChange={handleInputChange}
            onKeyDown={handleInputKey}
          />
          {t('of')}
          {totalPages}
        </span>
        <PaginationButton
          tooltipText={activePage !== totalPages ? t('nextPage') : ''}
          onClick={() => {
            isBottomBarRendering === BOTTOMBAR_STATES.RENDERED
              ? nextPage()
              : null
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
      <div id="preview-bar-container" className="prievew-bar-pages-container">
        {isBottomBarRendering === BOTTOMBAR_STATES.RENDERED && previewBar}
        {isBottomBarRendering === BOTTOMBAR_STATES.RENDERING && (
          <div className="viewer-loader-small"></div>
        )}
      </div>
    </div>
  )
}

export default BottomBar
