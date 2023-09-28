import { useDocumentContext } from '../document/DocumentContext'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'

// icons
import { AiOutlineDown, AiOutlineUp } from 'react-icons/ai'

import Preview from './Preview'
import Pagination from '../pagination/Pagination'
import { useState } from 'react'

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
const PreviewBar = ({ pagePreviews }: IBottomBarProps) => {
  const [nextIndex, setNextIndex] = useState(0)
  const { activePage, prevPage, nextPage, totalPages } = useDocumentContext()
  const { t } = useTranslation()

  return (
    <div className="preview-bar-container">
      <div className="preview-bar-inner-container">
        <div
          title={t('prevPage')}
          className={'viewer-button'}
          onClick={() => {
            setNextIndex(Math.max(nextIndex - 1, 0))
            prevPage()
          }}
        >
          <AiOutlineUp
            className={
              activePage !== 1
                ? 'viewer-button-icon'
                : 'viewer-button-icon-deactive'
            }
          />
        </div>
        <div className="prievew-bar-pages-container">
          {Array.from({ length: pagePreviews }).map((_, index) => (
            <Preview pageNumber={index + 1 + nextIndex} key={index} />
          ))}
        </div>
        <div
          title={t('nextPage')}
          className={'viewer-button'}
          onClick={() => {
            setNextIndex(Math.min(nextIndex + 1, totalPages - pagePreviews))
            nextPage()
          }}
        >
          <AiOutlineDown
            className={
              activePage !== totalPages
                ? 'viewer-button-icon'
                : 'viewer-button-icon-deactive'
            }
          />
        </div>
      </div>
    </div>
  )
}

export default PreviewBar
