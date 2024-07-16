import { useCallback } from 'react'
import { useDocumentContext } from './useDocumentContext'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'

interface IRenderPage {
  view: HTMLElement | null
  edit: boolean
  renderTextContext: boolean
}
const useRenderPage = () => {
  const { pdf, activePage, setDesiredScale, scale, setSvgWidth, setSvgHeight } =
    useDocumentContext()

  // Call back for rendering
  const renderPage = useCallback(
    async ({ view, edit, renderTextContext }: IRenderPage) => {
      const page = await pdf?.getPage(activePage) // get page based on acive page
      let container: any = null
      if (!page) return

      // get content
      const viewerContent = document.getElementById('evilFlowersContent')

      if (!viewerContent) return

      // get its height
      const height = viewerContent.getBoundingClientRect().height

      // Calculate scale
      let viewport = page.getViewport({ scale })
      const calcScreenHeight = 0.95 * height // 95% of height
      const desiredHeight = calcScreenHeight * viewport.scale
      const viewportHeight = viewport.height / viewport.scale
      const desiredScale = desiredHeight / viewportHeight
      viewport = page.getViewport({ scale: desiredScale })

      // create canvas
      const canvas = document.createElement('canvas')
      canvas.setAttribute('class', 'shadow-own-2 transition-all')
      canvas.width = viewport.width
      canvas.height = viewport.height

      // If we are at edit mode
      if (edit) {
        setSvgWidth(canvas.width)
        setSvgHeight(canvas.height)
      } else {
        // container for rendering text content
        container = document.createElement('div')
        container.setAttribute('id', 'textLayer')

        canvas.setAttribute('id', 'evilFlowersCanvas')
        setDesiredScale(desiredScale)
      }
      // create context
      const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D

      // render page
      await page
        .render({
          canvasContext,
          viewport,
        })
        .promise.then(() => {
          if (edit) {
            view?.replaceChildren(canvas)
          } else {
            view?.replaceChildren(canvas, container)
          }
        })

      // Render text content
      if (renderTextContext) {
        await page.getTextContent().then((textContent) => {
          pdfjsLib.renderTextLayer({
            textContent,
            container,
            viewport,
          })
        })
      }
    },
    [pdf, activePage, scale]
  )
  return renderPage
}

export default useRenderPage
