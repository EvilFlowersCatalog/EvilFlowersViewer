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
  menu: boolean
  setMenu: (visibility: boolean) => void
  pdfCitation: { citation: string; type: string } | null
  downloadDocument: () => void
  downloadCitation: () => void
  copyCitation: () => void
  changeCitationFormat: (format: string, type: string) => void
  nextPage: () => void
  prevPage: () => void
  setPage: (e: React.ChangeEvent<HTMLInputElement>) => void
  searchPage: (n: number) => void
  scale: number
  setScale: (scale: number) => void
  resetScale: () => void
  zoomIn: () => void
  zoomOut: () => void
  rerender: Object
  isRendering: RENDERING_STATES | null
  setRendering: (state: RENDERING_STATES) => void
  totalPages: number
  outline: TOCItemDoc[] | undefined
  setOutline: (outline: TOCItemDoc[] | undefined) => void
  outlineSetPage: (num: number) => void
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
