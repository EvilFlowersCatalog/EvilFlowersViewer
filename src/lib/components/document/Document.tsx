import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
import { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf'
import { useEffect, useState } from 'react'

import { DocumentContext } from './DocumentContext'
import Page from '../page/Page'
import BottomBar from '../bottomBar/BottomBar'
import Sidebar from '../sidebar/Sidebar'
import ZoomControls from '../zoom/ZoomControls'

/**
 * Document component
 * @param data - PDF data
 * 
 */
interface IDocumentProps {
  data: string
}

/**
 * 
 * @param data - PDF data from props
 * 
 * @returns Document context through a provider to be used by other components
 * 
 */
const Document = ({ data }: IDocumentProps) => {
  const [activePage, setActivePage] = useState(1)
  const [scale, setScale] = useState(1)
  const [pdf, setPdf] = useState<PDFDocumentProxy>()

  /**
   * Load document on mount
   * 
   */
  const loadDocument = () => {
    pdfjs.getDocument({ data }).promise.then((doc) => {
      setPdf(doc)
    })
  }

  /**
   * Download document
   */
  const downloadDocument = () => {
    const link = document.createElement('a')
    pdf?.getMetadata().then((meta) => {
      // @ts-ignore
      var fileName = meta.info?.Title || 'document.pdf'

      pdf?.getData().then((data) => {
        const blob = new Blob([data], { type: 'application/pdf' })
        link.href = URL.createObjectURL(blob)
        link.download = fileName
        link.click()
      }) 
    })
    
  }

  /**
   * Go to next page
   */
  const nextPage = () => {
    setActivePage((prevPage) =>
      pdf && pdf?.numPages > prevPage ? prevPage + 1 : prevPage
    )
  }

  /**
   * Go to previous page
   */
  const prevPage = () => {
    setActivePage((prevPage) => (prevPage > 1 ? prevPage - 1 : prevPage))
  }

  /**
   * Go to selected page
   * 
   * @param e - Input event
   * 
   */
  const setPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.validity.valid) {
      // Fix for valid number input
      let page = parseInt(e.target.value)
      if (page < 1) setActivePage(1)
      else if (pdf?.numPages && page > pdf?.numPages)
        setActivePage(pdf?.numPages)
      else setActivePage(page)
    }
  }

  /**
   * Go to selected page
   * 
   * @param page - Page number
   */
  const searchPage = (page: number) => {
    if (page < 1 || (pdf?.numPages && pdf?.numPages < page)) return
    else setActivePage(page)
  }

  /**
   * Zoom in on document
   */
  const zoomIn = () => {
    setScale((prevScale) => (prevScale < 2.5 ? prevScale + 0.25 : prevScale))
  }

  /**
   * Zoom out on document
   */
  const zoomOut = () => {
    setScale((prevScale) => (prevScale > 0.5 ? prevScale - 0.25 : prevScale))
  }

  /**
   * Reset zoom on document
   */
  const resetScale = () => {
    setScale(1)
  }

  // Loads the document every time the data changes
  useEffect(() => {
    loadDocument()
  }, [data])

  return (
    <DocumentContext.Provider
      value={{
        downloadDocument,
        pdf,
        activePage,
        nextPage,
        prevPage,
        setPage,
        searchPage,
        scale,
        setScale,
        zoomIn,
        zoomOut,
        resetScale,
      }}
    >
      <Sidebar />
      <Page />
      <BottomBar />
      <ZoomControls />
    </DocumentContext.Provider>
  )
}

export default Document
