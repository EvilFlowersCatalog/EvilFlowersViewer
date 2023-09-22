import { useDocumentContext } from '../document/DocumentContext'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'

// icons
import {
  AiOutlineLeft,
  AiOutlineDown,
  AiOutlineRight,
  AiOutlineUp,
} from 'react-icons/ai'

import Preview from './Preview'
import Pagination from '../pagination/Pagination'

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
  const { activePage, prevPage, nextPage, totalPages } = useDocumentContext()
  const { t } = useTranslation()

  return (
    <div className="preview-bar-container">
      <div className="preview-bar-inner-container">
        <div
          title={t('prevPage')}
          className={'viewer-button'}
          onClick={prevPage}
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
            <Preview
              pageNumber={activePage - Math.ceil(pagePreviews / 2) + index + 1}
              previewNumber={index + 1}
              key={index}
            />
          ))}
        </div>
        <div
          title={t('nextPage')}
          className={'viewer-button'}
          onClick={nextPage}
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
