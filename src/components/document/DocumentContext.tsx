import { PDFDocumentProxy } from 'pdfjs-dist'
import { createContext } from 'react'

interface IDocumentContext {
  pdf?: PDFDocumentProxy
}

export default createContext<IDocumentContext | null>(null)
