import { useState, useEffect } from 'react'
import { useDocumentContext } from '../../../document/DocumentContext'
import { useTranslation } from 'react-i18next'
import { AiOutlineLeft, AiOutlineDown } from 'react-icons/ai'
import ModalWrapper from '../../../modal/Modal'
import cx from 'classnames'

interface TOCItem {
  title: string
  pageNumber: number
  level: number
  children: TOCItem[]
  isExpanded: boolean
}
interface IOutlineProps {
  setTocVisibility: (state: boolean) => void
}

const Toc = ({ setTocVisibility }: IOutlineProps) => {
  const { t } = useTranslation()
  const [isDropdownShown, setIsDropdownShown] = useState(false)
  const { pdf, TOC, setPage } = useDocumentContext()
  const [toc, setToc] = useState(() => {
    // Add isExpanded property to each item in outline
    const newOutline = TOC?.map((item) => ({
      ...item,
      isExpanded: false,
    }))
    return newOutline
  })
  const [isOpen, setIsOpen] = useState(true)

  const handleItemClick = (pageNumber: number) => {
    setPage(pageNumber)
    setTocVisibility(false)
    setIsOpen(false)
  }

  const handleToggleExpand = (item: TOCItem) => {
    item.isExpanded = !item.isExpanded
    const tmpTOC = toc ? [...toc] : []
    setToc(tmpTOC) // Update the state to trigger a re-render
  }

  const renderTOC = (items: TOCItem[] | undefined, level = 1) => {
    return (
      <div className="outline-container">
        {items?.map((item, i) => (
          <div
            key={`${item.title}-${i}`}
            className={cx('outline-section-container', {
              'outline-section-container-main': level === 1,
              'outline-section-container-basic': level !== 1,
            })}
          >
            <div className="outline-section-inner-container">
              <div
                className="viewer-button"
                onClick={
                  item.pageNumber === -1
                    ? undefined
                    : () => handleItemClick(item.pageNumber)
                }
              >
                {item.title}
              </div>
              {item.children.length > 0 && (
                <div
                  className="viewer-button"
                  onClick={() => handleToggleExpand(item)}
                >
                  {item.isExpanded ? (
                    <AiOutlineDown
                      className="viewer-button-icon"
                      style={{ width: '15px', height: '15px' }}
                    />
                  ) : (
                    <AiOutlineLeft
                      className="viewer-button-icon"
                      style={{ width: '15px', height: '15px' }}
                    />
                  )}
                </div>
              )}
            </div>
            {item.isExpanded &&
              item.children &&
              renderTOC(item.children, level + 1)}
          </div>
        ))}
      </div>
    )
  }

  useEffect(() => {
    // Update isExpanded property when outline changes
    setToc((prevToc) => {
      const newOutline = TOC?.map((item) => {
        const matchingItem = prevToc?.find(
          (prevItem) =>
            prevItem.title === item.title &&
            prevItem.pageNumber === item.pageNumber
        )
        return {
          ...item,
          isExpanded: matchingItem ? matchingItem.isExpanded : false,
        }
      })
      return newOutline
    })
  }, [TOC])

  const handleOnCloseClick = () => {
    setIsOpen(false)
    setTocVisibility(false)
  }

  return (
    <ModalWrapper isOpen={isOpen} onClose={() => handleOnCloseClick()}>
      <>
        <h4 className="outline-title">{t('toc')}</h4>
        {renderTOC(TOC)}
      </>
    </ModalWrapper>
  )
}

export default Toc
