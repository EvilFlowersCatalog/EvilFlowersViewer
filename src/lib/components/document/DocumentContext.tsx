import { PDFDocumentProxy } from 'pdfjs-dist'
import { createContext, useContext } from 'react'

import { RENDERING_STATES } from '../../../utils/enums'

interface IDocumentContext {
  pdf?: PDFDocumentProxy
  activePage: number
  downloadDocument: () => void
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
}

export const DocumentContext = createContext<IDocumentContext | null>(null)

export const useDocumentContext = () => {
  const context = useContext(DocumentContext)

  if (context === null) throw Error('DocumentContext is null.')

  return context
}
