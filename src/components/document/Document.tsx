import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
import { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf'
import { useEffect, useState } from 'react'

import { DocumentContext } from './DocumentContext'
import Page from '../page/Page'

interface IDocumentProps {
  data: string
}

const Document = ({ data }: IDocumentProps) => {
  const [activePage, setActivePage] = useState(2)
  const [pdf, setPdf] = useState<PDFDocumentProxy>()

  const loadDocument = () => {
    pdfjs.getDocument({ data }).promise.then((doc) => {
      setPdf(doc)
      //console.log(pdf?.numPages)
    })
  }

  const nextPage = () => {
    setActivePage((prevPage) =>
      pdf && pdf?.numPages > prevPage ? prevPage + 1 : prevPage
    )
  }

  const prevPage = () => {
    setActivePage((prevPage) => (prevPage > 1 ? prevPage - 1 : prevPage))
  }

  // Loads the document every time the data changes
  useEffect(() => {
    loadDocument()
  }, [data])

  return (
    <DocumentContext.Provider value={{ pdf, activePage, nextPage, prevPage }}>
      <Page />
    </DocumentContext.Provider>
  )
}

export default Document
