import { useCallback, useEffect } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
import { RENDERING_STATES } from '../../../utils/enums'

/**
 * Returns the page component after rendering
 *
 * @returns Page component
 *
 */

const PaginatorPage = () => {
  const {
    pdf,
    activePage,
    scale,
    rerender,
    setRendering,
    screenWidth,
    pdfViewing,
  } = useDocumentContext()

  /**
   * Renders the page and all its layers
   *
   * @returns A promise that resolves when the page is rendered
   */
  const renderPage = useCallback(async () => {
    setRendering(RENDERING_STATES.RENDERING)

    return await new Promise((resolve) => {
      pdf?.getPage(activePage).then((page) => {
        const container = document.createElement('textLayer')
        container.setAttribute('id', 'textLayer')
        container.setAttribute('class', 'pdf-canvas-textLayer')

        let viewport = page.getViewport({ scale })
        let calcScreenWidth =
          screenWidth > 959 ? screenWidth * 0.5 : screenWidth * 0.75
        let desiredWidth = calcScreenWidth * viewport.scale
        let viewportWidth = viewport.width / viewport.scale
        let desiredScale = desiredWidth / viewportWidth
        viewport = page.getViewport({ scale: desiredScale })

        page.getTextContent().then((textContent) => {
          pdfjs.renderTextLayer({
            textContent,
            container,
            viewport,
            textDivs: [],
          })
        })

        const canvas =
          (document.getElementById('evilFlowersCanvas') as HTMLCanvasElement) ??
          document.createElement('canvas')
        canvas.setAttribute('id', 'evilFlowersCanvas')
        canvas.setAttribute('class', 'pdf-canvas-container')
        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.width = viewport.width + 'px'
        canvas.style.height = viewport.height + 'px'
        const context = canvas.getContext('2d')

        const renderContext = {
          canvasContext: context as Object,
          viewport: viewport,
        }
        const renderTask = page.render(renderContext)
        renderTask.promise.then(() => {
          const prevCanvas = document.getElementById(
            'evilFlowersCanvas'
          ) as HTMLCanvasElement
          const prevTextLayerNode = document.getElementById(
            'textLayer'
          ) as HTMLElement

          if (prevTextLayerNode)
            document
              .getElementById('evilFlowersContent')
              ?.replaceChild(container, prevTextLayerNode)
          else
            document
              .getElementById('evilFlowersContent')
              ?.replaceChildren(container)
          if (!prevCanvas)
            document.getElementById('evilFlowersContent')?.appendChild(canvas)

          resolve(RENDERING_STATES.RENDERED)
        })
      })
    })
  }, [activePage, pdf, scale])

  useEffect(() => {
    renderPage().then((resolve) => {
      setRendering(RENDERING_STATES.RENDERED)
    })
  }, [activePage, pdf, scale, rerender, pdfViewing])

  return <div id={'evilFlowersContent'} className={'pdf-container'}></div>
}

export default PaginatorPage
