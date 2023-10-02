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
  screenWidth: number
  menu: boolean
  setMenu: (visibility: boolean) => void
  pdfCitation: { citation: string; type: string; format: string } | null
  downloadDocument: () => void
  downloadCitation: () => void
  copyCitation: () => void
  changeCitationFormat: (format: string, type: string) => void
  nextPage: () => void
  prevPage: () => void
  setPage: (e: React.ChangeEvent<HTMLInputElement>) => void
  setActivePage: (page: number) => void
  searchPage: (n: number) => void
  scale: number
  desiredScale: number
  setDesiredScale: (desiredScale: number) => void
  zoomIn: () => void
  zoomOut: () => void
  rerender: Object
  isRendering: RENDERING_STATES | null
  setRendering: (state: RENDERING_STATES) => void
  totalPages: number
  TOC: TOCItemDoc[] | undefined
  setTOC: (outline: TOCItemDoc[] | undefined) => void
  tocSetPage: (num: number) => void
  pdfViewing: 'paginator' | 'scroll'
  setPdfViewing: (type: 'paginator' | 'scroll') => void
  pagePreviews: number
  nextPreviewPage: number
  setNextPreviewPage: (preview: number) => void
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
