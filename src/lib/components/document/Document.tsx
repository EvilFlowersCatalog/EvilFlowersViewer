import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'

import { useEffect, useState } from 'react'

import { DocumentContext } from './DocumentContext'
import Page from '../page/Page'
import BottomBar from '../bottomBar/BottomBar'
import Sidebar from '../sidebar/Sidebar'
import ZoomControls from '../zoom/ZoomControls'
import Outline from '../outline/Outline'
import { string32 } from 'pdfjs-dist/types/src/shared/util'
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'

interface IDocumentProps {
  data: string
}

interface TOCItem {
  title: string
  pageNumber: number
  level: number
  children: TOCItem[]
}

interface PDFOutlineItem {
  title: string
  bold: boolean
  italic: boolean
  color: Uint8ClampedArray
  dest: string | any[] | null
  url: string | null
  unsafeUrl: string | undefined
  newWindow: boolean | undefined
  count: number | undefined
  items: PDFOutlineItem[] | undefined
}

const Document = ({ data }: IDocumentProps) => {
  const [activePage, setActivePage] = useState(1)
  const [scale, setScale] = useState(1)
  const [pdf, setPdf] = useState<PDFDocumentProxy>()
  const [outline, setOutline] = useState<TOCItem[] | undefined>(undefined)

  const loadDocument = () => {
    pdfjs.getDocument({ data }).promise.then((doc) => {
      // https://medium.com/@csofiamsousa/creating-a-table-of-contents-with-pdf-js-4a4316472fff
      // https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFDocumentProxy.html#getDestination

      doc.getOutline().then((outline) => {
        console.log(outline)
        console.log([outline[0].dest])

        //console.log(outline[0].dest ? [0])
        if (outline[0].dest && Array.isArray(outline[0].dest)) {
          console.log(outline[0].dest[0])
        }

        for (let i = 0; i < outline.length; i++) {
          console.log(outline[i].dest)
        }

        getTableOfContents(outline, 0)
      })

      setPdf(doc)
    })
  }

  const getTableOfContents = async (
    outline: PDFOutlineItem[] | undefined,
    level: number
  ): Promise<TOCItem[]> => {
    const toc: TOCItem[] = []
    //const pageNumber = 2

    if (!outline) {
      return toc
    }

    for (let i = 0; i < outline.length; i++) {
      const item = outline[i]
      const title = item.title ?? 'Untitled'

      const children = item.items
        ? await getTableOfContents(item.items, level + 1)
        : []

      pdf?.getPageIndex(outline[i].dest[0]).then((index) => {
        console.log(index)
        const updatedPageNumber = index + 1
        toc.push({ title, pageNumber: updatedPageNumber, level, children })
      })
    }
    setOutline(toc)
    return toc
  }

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

  const nextPage = () => {
    setActivePage((prevPage) =>
      pdf && pdf?.numPages > prevPage ? prevPage + 1 : prevPage
    )
  }

  const prevPage = () => {
    setActivePage((prevPage) => (prevPage > 1 ? prevPage - 1 : prevPage))
  }

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

  const outlineSetPage = (numPage: number) => {
    setActivePage(numPage)
  }

  const searchPage = (page: number) => {
    if (page < 1 || (pdf?.numPages && pdf?.numPages < page)) return
    else setActivePage(page)
  }

  const zoomIn = () => {
    setScale((prevScale) => (prevScale < 2.5 ? prevScale + 0.25 : prevScale))
  }

  const zoomOut = () => {
    setScale((prevScale) => (prevScale > 0.5 ? prevScale - 0.25 : prevScale))
  }

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
        outlineSetPage,
        searchPage,
        scale,
        setScale,
        zoomIn,
        zoomOut,
        resetScale,
        setOutline,
        outline,
      }}
    >
      <Sidebar />
      <Page />
      <BottomBar />
      <ZoomControls />
      <Outline />
    </DocumentContext.Provider>
  )
}

export default Document
