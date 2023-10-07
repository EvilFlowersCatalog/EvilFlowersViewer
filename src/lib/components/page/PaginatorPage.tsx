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
    setPaginatorPageRender,
    setDesiredScale,
    screenWidth,
  } = useDocumentContext()

  /**
   * Renders the page and all its layers
   *
   * @returns A promise that resolves when the page is rendered
   */
  const renderPage = useCallback(
    async (viewer: HTMLElement) => {
      return await new Promise((resolve) => {
        pdf?.getPage(activePage).then(async (page) => {
          const height = document
            .getElementById('evilFlowersContent')!
            .getBoundingClientRect().height

          let viewport = page.getViewport({ scale })
          const calcScreenHeight = 0.95 * height
          const desiredHeight = calcScreenHeight * viewport.scale
          const viewportHeight = viewport.height / viewport.scale
          const desiredScale = desiredHeight / viewportHeight
          setDesiredScale(desiredScale)
          viewport = page.getViewport({ scale: desiredScale })

          const container = document.createElement('textLayer')
          container.setAttribute('id', 'textLayer')
          container.setAttribute('class', 'pdf-canvas-textLayer')

          page.getTextContent().then((textContent) => {
            pdfjs.renderTextLayer({
              textContent,
              container,
              viewport,
              textDivs: [],
            })
          })

          const canvas = document.createElement('canvas')
          canvas.setAttribute('id', 'evilFlowersCanvas')
          canvas.setAttribute('class', 'pdf-canvas-container-paginator')
          canvas.width = viewport.width
          canvas.height = viewport.height

          const context = canvas.getContext('2d')

          const renderContext = {
            canvasContext: context as Object,
            viewport: viewport,
          }
          const renderTask = page.render(renderContext)
          await renderTask.promise.then(() => {
            viewer.replaceChildren(canvas, container)

            resolve('')
          })
        })
      })
    },
    [activePage, pdf, scale, window.outerHeight]
  )

  useEffect(() => {
    setPaginatorPageRender(RENDERING_STATES.RENDERING)
    const loader = document.createElement('div')
    loader.setAttribute('class', 'viewer-loader-small')

    const loadPage = async () => {
      const viewer = document.getElementById('evilFlowersPaginatorContent')!
      viewer.replaceChildren()
      viewer.appendChild(loader)

      await renderPage(viewer)
    }
    loadPage().then(() => {
      setPaginatorPageRender(RENDERING_STATES.RENDERED)
    })
  }, [activePage, pdf, scale, rerender, window.outerHeight, screenWidth])

  return <div id={'evilFlowersPaginatorContent'}></div>
}

export default PaginatorPage
