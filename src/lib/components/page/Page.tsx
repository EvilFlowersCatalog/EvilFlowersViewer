import { MouseEvent } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import PaginatorPage from './PaginatorPage'
import ScrollPage from './ScrollPage'

interface IPageParams {
  onDoubleClick: (event: MouseEvent<HTMLDivElement>) => void
}

const Page = ({ onDoubleClick }: IPageParams) => {
  const { pdfViewing } = useDocumentContext()
  return (
    <div
      id={'evilFlowersContent'}
      className={'page-container'}
      onDoubleClick={onDoubleClick}
    >
      {pdfViewing === 'paginator' && <PaginatorPage />}
      {pdfViewing === 'scroll' && <ScrollPage />}
    </div>
  )
}

export default Page
