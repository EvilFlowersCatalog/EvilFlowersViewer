import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
import { useGesture } from 'react-use-gesture'
import { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react'
// @ts-ignore
import Cite from 'citation-js'
import { DocumentContext } from './DocumentContext'
import { RENDERING_STATES, SIDEBAR_TABS } from '../../../utils/enums'
import BottomBar from './bottom-bar/BottomBar'
import {
  DocumentInitParameters,
  PDFDocumentProxy,
} from 'pdfjs-dist/types/src/display/api'
import Menu from '../side-menu/menu/Menu'
import { useViewerContext } from '../ViewerContext'
import SinglePage from './single-page/SinglePage'
import Help from '../helpers/help/Help'

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
  const [prevActivePage, setPrevActivePage] = useState<number>(activePage)
  const [scale, setScale] = useState(1)
  const [waiter, setWaiter] = useState(50)
  const [desiredScale, setDesiredScale] = useState(1)
  const [menu, setMenu] = useState(false)
  const [pdf, setPdf] = useState<PDFDocumentProxy>()
  const [screenWidth, setScreenWidth] = useState(window.innerWidth)
  const [screenHeight, setScreenHeight] = useState(window.innerHeight)
  const [rerender, setRerender] = useState<Object>({})
  const [actualFormat, setActualFormat] = useState<{
    format: string
    type: string
  }>({ format: 'bibtex', type: 'bib' })
  const [paginatorPageRender, setPaginatorPageRender] =
    useState<RENDERING_STATES>(RENDERING_STATES.RENDERING)
  const [previewRender, setPreviewRender] = useState<RENDERING_STATES>(
    RENDERING_STATES.RENDERING
  )
  const [totalPages, setTotalPages] = useState(0)
  const ref: any = useRef(null)
  const [TOC, setTOC] = useState<TOCItemDoc[] | undefined>()
  const [activeSidebar, setActiveSidebar] = useState<SIDEBAR_TABS>(
    SIDEBAR_TABS.NULL
  )
  const [basedPdfCitation, setBasedPdfCitation] = useState<
    string | null | undefined
  >(citationBibTeX)
  const [pdfCitation, setPdfCitation] = useState<{
    citation: string
    type: string
    format: string
  } | null>(null)
  const [citationVisibile, setCitationVisible] = useState<boolean>(false)
  const [tocVisibility, setTocVisibility] = useState<boolean>(false)
  const [pinchZoom, setPinchZoom] = useState<number>(0)
  const [controlKey, setControlKey] = useState<boolean>(false)

  const { setShowHelp, showHelp, theme, setTheme, shareFunction } =
    useViewerContext()

  useEffect(() => {
    // Set base citation
    if (basedPdfCitation) {
      changeCitationFormat(actualFormat.format, actualFormat.type)
    }

    // handle resizeing window and set height/width
    const handleResize = () => {
      const newScreenWidth = window.innerWidth
      const newScreenHeight = window.innerHeight
      setScreenWidth(newScreenWidth)
      setScreenHeight(newScreenHeight)
    }

    // Attach the event listener when the component mounts
    window.addEventListener('resize', handleResize)

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    // Set base citation
    if (basedPdfCitation) {
      changeCitationFormat(actualFormat.format, actualFormat.type)
    }
  }, [basedPdfCitation])

  /**
   * Load document on mount
   *
   */
  const loadDocument = async () => {
    await pdfjs
      .getDocument({ data } as DocumentInitParameters)
      .promise.then(async (doc: PDFDocumentProxy) => {
        // https://medium.com/@csofiamsousa/creating-a-table-of-contents-with-pdf-js-4a4316472fff
        // https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFDocumentProxy.html#getDestination

        // Case where we do not have outlines
        doc.getOutline().then(async (outline: any) => {
          if (!outline) {
            return
          }

          // Case where we have outlines
          const toc = await getTableOfContents(outline, 0, doc)
          setTOC(toc)
        })

        setPdf(doc)
        setPrevActivePage(1)
        setActivePage(1)
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
          if (typeof item.dest === 'string') {
            let ref: any
            await doc.getDestination(item.dest).then((dest) => {
              if (dest) {
                ref = dest[0]
              }
            })
            const index = await doc.getPageIndex(ref)
            pageNumber = index + 1
          } else {
            const index = await doc.getPageIndex(item.dest[0])
            pageNumber = index + 1
          }
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
      var fileName = meta.info?.Title || 'document'

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
      let formattedCitation: {
        citation: string
        type: string
        format: string
      } = {
        citation: citation.format(format, {
          template: 'apa',
        }),
        type: type,
        format: format,
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
      setActualFormat({ format, type })
    } catch (err) {
      console.log(err)
    }
  }

  const setPage = (page: number) => {
    if (
      paginatorPageRender === RENDERING_STATES.RENDERED &&
      previewRender === RENDERING_STATES.RENDERED
    ) {
      setPrevActivePage(activePage)
      setActivePage(page)
    }
  }

  /**
   * Go to next page
   */
  const nextPage = () => {
    if (
      paginatorPageRender === RENDERING_STATES.RENDERED &&
      previewRender === RENDERING_STATES.RENDERED
    ) {
      if (activePage !== totalPages) {
        setPrevActivePage(activePage)
        setActivePage(activePage + 1)
      }
    }
  }

  /**
   * Go to previous page
   */
  const prevPage = () => {
    if (
      paginatorPageRender === RENDERING_STATES.RENDERED &&
      previewRender === RENDERING_STATES.RENDERED
    ) {
      if (activePage !== 1) {
        setPrevActivePage(activePage)
        setActivePage(activePage - 1)
      }
    }
  }

  /**
   * Go to selected page
   *
   * @param page - Page number
   */
  const searchPage = (page: number) => {
    if (
      paginatorPageRender === RENDERING_STATES.RENDERED &&
      previewRender === RENDERING_STATES.RENDERED
    ) {
      if (page < 1 || (pdf?.numPages && pdf?.numPages < page)) return
      else if (page === activePage) setRerender({})
      else {
        setPrevActivePage(activePage)
        setActivePage(page)
      }
    }
  }

  /**
   * Zoom in on document
   */
  const zoomIn = () => {
    setScale((prevScale) => (prevScale < 3 ? prevScale + 0.25 : prevScale))
  }

  /**
   * Zoom out on document
   */
  const zoomOut = () => {
    setScale((prevScale) => (prevScale > 0.25 ? prevScale - 0.25 : prevScale))
  }

  // Loads the document every time the data changes
  useEffect(() => {
    if (data == null) return
    loadDocument()
  }, [data])

  const keyDownHandler = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!controlKey) {
      switch (event.key.toLocaleLowerCase()) {
        case 'arrowleft':
          event.preventDefault()
          prevPage()
          break
        case 'arrowright':
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
        case 'h':
          event.preventDefault()
          setShowHelp(!showHelp)
          break
        case 's':
          event.preventDefault()
          shareFunction &&
            setActiveSidebar((activity) =>
              activity === SIDEBAR_TABS.SHARE
                ? SIDEBAR_TABS.NULL
                : SIDEBAR_TABS.SHARE
            )
          break
        // case 'e':
        //   event.preventDefault()
        //   shareFunction &&
        //     setActiveSidebar((activity) =>
        //       activity === SIDEBAR_TABS.EDIT
        //         ? SIDEBAR_TABS.NULL
        //         : SIDEBAR_TABS.EDIT
        //     )
        //   break
        case 'f':
          event.preventDefault()
          setActiveSidebar((activity) =>
            activity === SIDEBAR_TABS.SEARCH
              ? SIDEBAR_TABS.NULL
              : SIDEBAR_TABS.SEARCH
          )
          break
        case 'i':
          event.preventDefault()
          setActiveSidebar((activity) =>
            activity === SIDEBAR_TABS.INFO
              ? SIDEBAR_TABS.NULL
              : SIDEBAR_TABS.INFO
          )
          break
        case 't':
          event.preventDefault()
          TOC && TOC.length > 0 && setTocVisibility(!tocVisibility)
          break
        case 'c':
          event.preventDefault()
          pdfCitation && setCitationVisible(!citationVisibile)
          break
        case 'm':
          event.preventDefault()
          handleModeChange()
          break
        case 'meta':
          setControlKey(true)
          break
        case 'control':
          setControlKey(true)
          break
      }
    }
  }

  const keyUpHandler = (event: KeyboardEvent<HTMLDivElement>) => {
    setControlKey(false)
  }

  const handleModeChange = () => {
    if (theme === 'light') {
      setTheme('dark')
      document.getElementById('evilFlowersViewer')?.classList.add('dark')
    } else {
      setTheme('light')
      document.getElementById('evilFlowersViewer')?.classList.remove('dark')
    }
  }

  const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    setScale((prevScale) =>
      prevScale > 1.5 ? 1.5 : prevScale < 1 ? 1 : prevScale === 1.5 ? 1 : 1.5
    )
  }

  useGesture(
    {
      onPinch: ({ offset: [d] }) => {
        setPinchZoom(d)
        if (pinchZoom < d) {
          setWaiter(waiter + 5)
        } else {
          setWaiter(waiter - 5)
        }
        if (waiter > 100) {
          setWaiter(50)
          setScale((prevScale) =>
            prevScale < 3 ? prevScale + 0.25 : prevScale
          )
        } else if (waiter < 0) {
          setScale((prevScale) =>
            prevScale > 0.25 ? prevScale - 0.25 : prevScale
          )
          setWaiter(50)
        }
      },
    },
    {
      domTarget: ref,
      eventOptions: { passive: false },
    }
  )

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
        prevActivePage,
        setPage,
        nextPage,
        prevPage,
        searchPage,
        scale,
        desiredScale,
        setDesiredScale,
        zoomIn,
        zoomOut,
        setTOC,
        TOC,
        rerender,
        paginatorPageRender,
        setPaginatorPageRender,
        totalPages,
        previewRender,
        setPreviewRender,
        screenWidth,
        screenHeight,
        setActiveSidebar,
        activeSidebar,
        citationVisibile,
        setCitationVisible,
        tocVisibility,
        setTocVisibility,
        handleModeChange,
        basedPdfCitation,
        setBasedPdfCitation,
      }}
    >
      {data && (
        <div
          ref={ref}
          onKeyDown={keyDownHandler}
          onKeyUp={keyUpHandler}
          tabIndex={-1}
          className={'document-container'}
          onMouseEnter={() => ref.current?.focus()}
        >
          {showHelp && <Help />}
          <div className="document-upper-row-container">
            <Menu />
            <SinglePage onDoubleClick={handleDoubleClick} />
          </div>

          <BottomBar />
        </div>
      )}
    </DocumentContext.Provider>
  )
}

export default Document
