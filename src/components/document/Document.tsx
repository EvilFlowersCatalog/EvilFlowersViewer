import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
import { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf'
import { useEffect, useState } from 'react'

import { DocumentContext } from './DocumentContext'
import Page from '../page/Page'
import BottomBar from '../bottom_bar/BottomBar'

interface IDocumentProps {
  data: string
}

const Document = ({ data }: IDocumentProps) => {
  const [activePage, setActivePage] = useState(1)
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

  const currPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    let page = parseInt(e.target.value)
    if (page < 1) setActivePage(1)
    else if (page > pdf?.numPages) setActivePage(pdf?.numPages)
    else setActivePage(page)
  }

  // Loads the document every time the data changes
  useEffect(() => {
    loadDocument()
  }, [data])

  return (
    <DocumentContext.Provider
      value={{ pdf, activePage, nextPage, prevPage, currPage }}
    >
      <Page />
      <BottomBar />
    </DocumentContext.Provider>
  )
}

export default Document
