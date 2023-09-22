import { MouseEvent, useEffect } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import { RENDERING_STATES } from '../../../utils/enums'
import Pagination from '../pagination/Pagination'
import PaginatorPage from './PaginatorPage'

interface IPageParams {
  onDoubleClick: (event: MouseEvent<HTMLDivElement>) => void
}

const Page = ({ onDoubleClick }: IPageParams) => {
  const { isRendering, pdfViewing } = useDocumentContext()

  // triger rerender
  useEffect(() => {}, [pdfViewing])

  return (
    <div className="page-container" onDoubleClick={onDoubleClick}>
      {isRendering &&
        isRendering in
          [RENDERING_STATES.LOADING, RENDERING_STATES.RENDERING] && (
          <div className={'page-loader-container'}>
            <span className={'viewer-loader-small'} />
          </div>
        )}
      {pdfViewing === 'paginator' && (
        <>
          <PaginatorPage />
          <div className="page-paginator-container">
            <Pagination />
          </div>
        </>
      )}
      {pdfViewing === 'scroll' && (
        <div className={'page-loader-container'}>
          <span>NOT IMPLEMENTED</span>
        </div>
      )}
    </div>
  )
}

export default Page
