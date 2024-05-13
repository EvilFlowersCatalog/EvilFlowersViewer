import { useCallback, useEffect, MouseEvent } from 'react'
import { useDocumentContext } from '../DocumentContext'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
import { RENDERING_STATES } from '../../../../utils/enums'

interface ISinglePage {
  onDoubleClick: (event: MouseEvent<HTMLDivElement>) => void
}

/**
 * Returns the page component after rendering
 *
 * @returns Page component
 *
 */

const SinglePage = ({ onDoubleClick }: ISinglePage) => {
  const {
    pdf,
    activePage,
    scale,
    rerender,
    setPaginatorPageRender,
    setDesiredScale,
    screenHeight,
  } = useDocumentContext()

  /**
   * Renders the page and all its layers
   *
   * @returns A promise that resolves when the page is rendered
   */
  const renderPage = useCallback(
    async (view: HTMLElement | null) => {
      const page = await pdf?.getPage(activePage)
      if (!page) return

      const viewerContent = document.getElementById('evilFlowersEditContent')

      if (!viewerContent) return

      const height = viewerContent.getBoundingClientRect().height

      // Calculate scale
      let viewport = page.getViewport({ scale })
      const calcScreenHeight = 0.95 * height
      const desiredHeight = calcScreenHeight * viewport.scale
      const viewportHeight = viewport.height / viewport.scale
      const desiredScale = desiredHeight / viewportHeight
      setDesiredScale(desiredScale)
      viewport = page.getViewport({ scale: desiredScale })

      const container = document.createElement('textLayer')
      container.setAttribute('id', 'textLayer')

      // get text content
      page.getTextContent().then((textContent) => {
        // render ro container (text-layer)
        pdfjs.renderTextLayer({
          textContent,
          container,
          viewport,
          textDivs: [],
        })
      })

      // create canvas
      const canvas = document.createElement('canvas')
      canvas.setAttribute('id', 'evilFlowersCanvas')
      canvas.setAttribute('class', 'single-page-canvas-container-paginator')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const canvasContext = canvas.getContext('2d')!

      // render page
      await page
        .render({
          canvasContext,
          viewport,
        })
        .promise.then(() => {
          // replece everything with canvas and text layer
          view?.replaceChildren(canvas, container)
        })
    },
    [activePage, pdf, scale]
  )

  useEffect(() => {
    setPaginatorPageRender(RENDERING_STATES.RENDERING)
    const loader = document.createElement('div')
    loader.setAttribute('class', 'viewer-loader-small')

    const loadPage = async () => {
      const view = document.getElementById('evilFlowersSinglePageContent')
      view?.replaceChildren(loader)

      await renderPage(view)
    }

    loadPage().then(() => {
      setPaginatorPageRender(RENDERING_STATES.RENDERED)
    })
  }, [activePage, pdf, scale, rerender, screenHeight])

  return (
    <div id={'evilFlowersContent'} onDoubleClick={onDoubleClick}>
      <div id={'evilFlowersSinglePageContent'}></div>
    </div>
  )
}

export default SinglePage
