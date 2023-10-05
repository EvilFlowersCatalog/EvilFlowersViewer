import { MouseEvent, useState } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import { RENDERING_STATES } from '../../../utils/enums'
import PaginatorPage from './PaginatorPage'
import ScrollPage from './ScrollPage'

interface IPageParams {
  onDoubleClick: (event: MouseEvent<HTMLDivElement>) => void
}

const pages: number = 15

const Page = ({ onDoubleClick }: IPageParams) => {
  const { isRendering, pdfViewing, totalPages } = useDocumentContext()
  const [nextIndex, setNextIndex] = useState(pages)

  // when scroll to 3/5 page, load next pages
  const handleScroll = (event: any) => {
    const scrollY = event.target.scrollTop
    const height = event.target.scrollHeight
    if (scrollY >= height * (3 / 5) && nextIndex < totalPages) {
      setNextIndex(Math.min(nextIndex + pages, totalPages))
    }
  }

  return (
    <div
      className={'page-container'}
      onDoubleClick={onDoubleClick}
      onScroll={handleScroll}
    >
      {isRendering &&
        isRendering in
          [RENDERING_STATES.LOADING, RENDERING_STATES.RENDERING] && (
          <div className={'page-loader-container'}>
            <span className={'viewer-loader-small'} />
          </div>
        )}
      {pdfViewing === 'paginator' && <PaginatorPage />}
      {pdfViewing === 'scroll' &&
        Array.from({ length: Math.min(nextIndex, totalPages) }).map(
          (_, index) => <ScrollPage pageNumber={index + 1} key={index} />
        )}
    </div>
  )
}

export default Page
