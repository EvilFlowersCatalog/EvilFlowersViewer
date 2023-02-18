import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
import { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf'
import { useEffect, useState } from 'react'
import Page from '../page/Page'
import DocumentContext from './DocumentContext'

interface IDocumentProps {
  data: string
}

const Document = ({ data }: IDocumentProps) => {
  const [pdf, setPdf] = useState<PDFDocumentProxy>()

  const loadDocument = () => {
    pdfjs.getDocument(data).promise.then((pdf) => {
      setPdf(pdf)
    })
  }

  // Loads the document every time the data changes
  useEffect(() => {
    loadDocument()
  }, [data])

  return (
    <DocumentContext.Provider value={{ pdf }}>
      <Page />
    </DocumentContext.Provider>
  )
}

export default Document
