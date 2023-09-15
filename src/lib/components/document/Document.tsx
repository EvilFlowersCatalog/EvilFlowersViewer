import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'

import React, { KeyboardEvent, useEffect, useState } from 'react'
// @ts-ignore
import Cite from 'citation-js'
import { DocumentContext } from './DocumentContext'
import Page from '../page/Page'
import Tools from '../sidebar/Tools'
import Pagination from '../pagination/Pagination'
import { RENDERING_STATES } from '../../../utils/enums'
import BottomBar from '../bottomBar/BottomBar'
import {
  GetDocumentParameters,
  PDFDocumentProxy,
} from 'pdfjs-dist/types/src/display/api'
import { t } from 'i18next'
import Header from '../header/Header'

/**
 * Document component
 * @param data - PDF data
 *
 */
interface IDocumentProps {
  data: string | null
  citationBibTeX: string | null | undefined
}

/**
 *
 * @param data - PDF data from props
 *
 * @returns Document context through a provider to be used by other components
 *
 */
interface TOCItemDoc {
  isExpanded: any
  title: string
  pageNumber: number
  level: number
  children: TOCItemDoc[]
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

const Document = ({ data, citationBibTeX }: IDocumentProps) => {
  const [activePage, setActivePage] = useState(1)
  const [scale, setScale] = useState(1)
  const [menu, setMenu] = useState(false)
  const [pdf, setPdf] = useState<PDFDocumentProxy>()
  const [rerender, setRerender] = useState<Object>({})
  const [isRendering, setRendering] = useState<RENDERING_STATES | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [outline, setOutline] = useState<TOCItemDoc[] | undefined>()
  const [basedPdfCitation] = useState<string | null | undefined>(citationBibTeX)
  const [pdfCitation, setPdfCitation] = useState<{
    citation: string
    type: string
  } | null>(null)

  // Set citation on start
  useEffect(() => {
    if (basedPdfCitation) {
      changeCitationFormat('bibtex', 'bib')
    }
  }, [])

  // reload
  useEffect(() => {}, [pdfCitation])
  /**
   * Load document on mount
   *
   */
  const loadDocument = () => {
    pdfjs
      .getDocument({ data } as GetDocumentParameters)
      .promise.then((doc: any) => {
        // https://medium.com/@csofiamsousa/creating-a-table-of-contents-with-pdf-js-4a4316472fff
        // https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFDocumentProxy.html#getDestination

        // Case where we do not have outlines
        doc.getOutline().then(async (outline: any) => {
          if (outline == null || !outline) {
            return
          }

          // Case where we have outlines
          const toc = await getTableOfContents(outline, 0, doc)
          setOutline(toc)
        })

        setPdf(doc)
        setTotalPages(doc.numPages)
      })
  }

  const getTableOfContents = async (
    outline: PDFOutlineItem[],
    level: number,
    doc: PDFDocumentProxy
  ): Promise<TOCItemDoc[]> => {
    const toc: TOCItemDoc[] = []

    for (let i = 0; i < outline.length; i++) {
      const item = outline[i]
      const title = item.title ?? 'Untitled'

      const children = item.items
        ? await getTableOfContents(item.items, level + 1, doc)
        : []

      let pageNumber
      try {
        if (item.dest) {
          const index = await doc.getPageIndex(item.dest[0])
          pageNumber = index + 1
        } else {
          pageNumber = -1
        }
      } catch (error) {
        pageNumber = -1
      }

      toc.push({ title, pageNumber, level, children, isExpanded: false })
    }

    return toc
  }

  /**
   * Download document
   */
  const downloadDocument = () => {
    const link = document.createElement('a')
    pdf?.getMetadata().then((meta: any) => {
      // @ts-ignore
      var fileName = meta.info?.Title || 'document.pdf'

      pdf?.getData().then((data: any) => {
        const blob = new Blob([data], { type: 'application/pdf' })
        link.href = URL.createObjectURL(blob)
        link.download = fileName
        link.click()
      })
    })
  }

  // Donwload citation
  const downloadCitation = () => {
    const link = document.createElement('a')

    if (pdfCitation) {
      var fileName = 'document-citation.' + `${pdfCitation.type}`
      const blob = new Blob([pdfCitation.citation], { type: 'text/plain' })
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      link.click()
    }
  }

  /**
   * Copy pdf citation
   */
  const copyCitation = () => {
    if (pdfCitation) {
      // Create a temporary textarea element
      const textarea = document.createElement('textarea')
      textarea.value = pdfCitation.citation
      document.body.appendChild(textarea)

      // select and copy the text
      textarea.select()
      document.execCommand('copy')

      // remove the temporary textarea
      document.body.removeChild(textarea)
    }
  }

  /**
   * func for formating citation
   * @param format type of format -> bibtex/biblatex/bibliography...
   */
  const changeCitationFormat = (format: string, type: string) => {
    try {
      // set new Cite by based pdf citation
      const citation = new Cite(basedPdfCitation)
      // convert our citation to wanted one
      let formattedCitation: { citation: string; type: string } = {
        citation: citation.format(format, {
          template: 'apa',
        }),
        type: type,
      }
      // fixed utf-8 (just for now)
      formattedCitation.citation = formattedCitation.citation.replace(
        /{\\' a}/g,
        'á'
      )
      formattedCitation.citation = formattedCitation.citation.replace(
        /{\\" a}/g,
        'ä'
      )
      formattedCitation.citation = formattedCitation.citation.replace(
        /{\\' e}/g,
        'é'
      )
      formattedCitation.citation = formattedCitation.citation.replace(
        /{\\' i}/g,
        'í'
      )
      formattedCitation.citation = formattedCitation.citation.replace(
        /{\\' y}/g,
        'ý'
      )
      formattedCitation.citation = formattedCitation.citation.replace(
        /{\\' o}/g,
        'ó'
      )
      formattedCitation.citation = formattedCitation.citation.replace(
        /{\\' u}/g,
        'ú'
      )
      formattedCitation.citation = formattedCitation.citation.replace(
        /{\\v c}/g,
        'č'
      )
      formattedCitation.citation = formattedCitation.citation.replace(
        /{\\v s}/g,
        'š'
      )
      formattedCitation.citation = formattedCitation.citation.replace(
        /{\\v l}/g,
        'ľ'
      )
      formattedCitation.citation = formattedCitation.citation.replace(
        /{\\v z}/g,
        'ž'
      )
      formattedCitation.citation = formattedCitation.citation.replace(
        /{\\v t}/g,
        'ť'
      )
      formattedCitation.citation = formattedCitation.citation.replace(
        /{\\v d}/g,
        'ď'
      )
      formattedCitation.citation = formattedCitation.citation.replace(
        /{\\\^ o}/g,
        'ô'
      )
      setPdfCitation(formattedCitation)
    } catch (err) {
      console.log(err)
    }
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

  const outlineSetPage = (numPage: number) => {
    setActivePage(numPage)
  }

  /**
   * Go to selected page
   *
   * @param page - Page number
   */
  const searchPage = (page: number) => {
    if (page < 1 || (pdf?.numPages && pdf?.numPages < page)) return
    else if (page === activePage) setRerender({})
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
    setScale((prevScale) => (prevScale > 1 ? prevScale - 0.25 : prevScale))
  }

  /**
   * Reset zoom on document
   */
  const resetScale = () => {
    setScale(1)
  }

  // Loads the document every time the data changes
  useEffect(() => {
    if (data == null) return
    loadDocument()
  }, [data])

  const keyDownHandler = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        prevPage()
        break
      case 'ArrowRight':
        event.preventDefault()
        nextPage()
        break
      case '+':
        event.preventDefault()
        zoomIn()
        break
      case '-':
        event.preventDefault()
        zoomOut()
        break
    }
  }

  return (
    <DocumentContext.Provider
      value={{
        downloadDocument,
        downloadCitation,
        copyCitation,
        changeCitationFormat,
        menu,
        setMenu,
        pdf,
        pdfCitation,
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
        rerender,
        isRendering,
        setRendering,
        totalPages,
      }}
    >
      <div
        onKeyDown={keyDownHandler}
        tabIndex={-1}
        className={'outline-0 w-full h-full'}
      >
        {!data && (
          <div className="flex items-center justify-center w-screen h-screen">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4 text-gray-500 dark:text-gray-300">
                {t('loadPDFerror')}
              </h1>
            </div>
          </div>
        )}
        <Header />
        {data && <Tools />}
        {data && <Page />}
        {data && <Pagination />}
        {data && <BottomBar pagePreviews={7} />}
      </div>
    </DocumentContext.Provider>
  )
}

export default Document
