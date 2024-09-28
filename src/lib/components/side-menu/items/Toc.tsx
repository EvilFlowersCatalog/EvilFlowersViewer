import { useState, useEffect } from 'react'
import { useDocumentContext } from '../../hooks/useDocumentContext'
import { useTranslation } from 'react-i18next'
import { AiOutlineLeft, AiOutlineDown } from 'react-icons/ai'
import ModalWrapper from '../../modal/Modal'
import Button from '../../common/Button'

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
  const { TOC, setPage } = useDocumentContext()
  const [toc, setToc] = useState(() => {
    // Add isExpanded property to each item in outline
    const newOutline = TOC?.map((item) => ({
      ...item,
      isExpanded: false,
    }))
    return newOutline
  })
  const [isOpen, setIsOpen] = useState(true)

  // When title is clicked to navigate
  const handleItemClick = (pageNumber: number) => {
    setPage(pageNumber)
    setTocVisibility(false)
    setIsOpen(false)
  }

  // When button near title is cliced to expand
  const handleToggleExpand = (item: TOCItem) => {
    item.isExpanded = !item.isExpanded
    // Update the state to trigger a re-render
    setToc(toc ? [...toc] : [])
  }

  const renderTOC = (items: TOCItem[] | undefined, level = 1) => {
    return (
      <div className="efw-w-full efw-overflow-auto">
        {items?.map((item, i) => (
          <div
            key={`${item.title}-${i}`}
            className={`efw-text-sm', ${
              level === 1
                ? 'efw-font-medium efw-pl-0'
                : 'efw-font-light efw-pl-5'
            }`}
          >
            <div className="efw-flex efw-w-full efw-items-center efw-justify-between efw-gap-7 efw-border-b efw-border-transparent efw-mb-1">
              {/* Title */}
              <Button
                onClick={
                  item.pageNumber === -1
                    ? undefined
                    : () => {
                        umami.track('Viewer TOC title Button', {
                          title: item.title,
                        })
                        handleItemClick(item.pageNumber)
                      }
                }
                icon={item.title}
              />
              {/* Expand button */}
              {item.children.length > 0 && (
                <Button
                  onClick={() => {
                    umami.track('Viewer TOC Expand Button', {
                      title: item.title,
                    })
                    handleToggleExpand(item)
                  }}
                  icon={
                    item.isExpanded ? (
                      <AiOutlineDown size={15} />
                    ) : (
                      <AiOutlineLeft size={15} />
                    )
                  }
                />
              )}
            </div>
            {/* If item is expaned and has children, redner next */}
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
    <ModalWrapper isOpen={isOpen} onClose={handleOnCloseClick} title={t('toc')}>
      {renderTOC(TOC)}
    </ModalWrapper>
  )
}

export default Toc
