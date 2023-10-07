import { PDFDocumentProxy } from 'pdfjs-dist'
import { createContext, useContext } from 'react'

import { RENDERING_STATES } from '../../../utils/enums'

/**
 * Document context
 */
interface TOCItemDoc {
  isExpanded: any
  title: string
  pageNumber: number
  level: number
  children: TOCItemDoc[]
}
interface IDocumentContext {
  pdf?: PDFDocumentProxy
  activePage: number
  prevActivePage: number
  setPage: (page: number) => void
  menu: boolean
  setMenu: (visibility: boolean) => void
  pdfCitation: { citation: string; type: string; format: string } | null
  downloadDocument: () => void
  downloadCitation: () => void
  copyCitation: () => void
  changeCitationFormat: (format: string, type: string) => void
  nextPage: () => void
  prevPage: () => void
  searchPage: (n: number) => void
  scale: number
  desiredScale: number
  setDesiredScale: (desiredScale: number) => void
  zoomIn: () => void
  zoomOut: () => void
  rerender: Object
  paginatorPageRender: RENDERING_STATES
  setPaginatorPageRender: (state: RENDERING_STATES) => void
  totalPages: number
  TOC: TOCItemDoc[] | undefined
  setTOC: (outline: TOCItemDoc[] | undefined) => void
  pdfViewing: 'paginator' | 'scroll'
  setPdfViewing: (type: 'paginator' | 'scroll') => void
  previewRender: RENDERING_STATES
  setPreviewRender: (state: RENDERING_STATES) => void
  screenWidth: number
}

export const DocumentContext = createContext<IDocumentContext | null>(null)

/**
 * Returns the document context
 *
 * @throws {Error}
 * This error is thrown if context is null
 *
 * @returns {IDocumentContext}
 */
export const useDocumentContext = (): IDocumentContext => {
  const context = useContext(DocumentContext)

  if (context === null) throw Error('DocumentContext is null.')

  return context
}
