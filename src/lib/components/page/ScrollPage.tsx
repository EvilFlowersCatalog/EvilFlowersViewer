import { useCallback, useEffect, useState } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
import { RENDERING_STATES } from '../../../utils/enums'

interface IScrollPageProps {
  pageNumber: number
}

const ScrollPage = ({ pageNumber }: IScrollPageProps) => {
  const {
    pdf,
    totalPages,
    scale,
    screenWidth,
    setDesiredScale,
    setRendering,
    rerender,
  } = useDocumentContext()
  const canvas = document.createElement('canvas')

  /**
   * Renders the page preview on a canvas, append to the div element
   *
   * @returns A promise that resolves when the page is rendered
   */
  const renderPage = useCallback(async () => {
    setRendering(RENDERING_STATES.RENDERING)

    return await new Promise((resolve) => {
      pdf?.getPage(pageNumber).then((page) => {
        const container = document.createElement('textLayer')
        container.setAttribute('id', 'textLayer')
        container.setAttribute('class', 'pdf-canvas-textLayer')

        let viewport = page.getViewport({ scale })
        const calcScreenWidth =
          screenWidth > 959 ? screenWidth * 0.5 : screenWidth * 0.75
        const desiredWidth = calcScreenWidth * viewport.scale
        const viewportWidth = viewport.width / viewport.scale
        const desiredScale = desiredWidth / viewportWidth
        setDesiredScale(desiredScale)
        viewport = page.getViewport({ scale: desiredScale })

        page.getTextContent().then((textContent) => {
          pdfjs.renderTextLayer({
            textContent,
            container,
            viewport,
            textDivs: [],
          })
        })

        canvas.width = viewport.width
        canvas.setAttribute('style', 'margin-bottom: 5px;')
        canvas.height = viewport.height
        canvas.style.width = viewport.width + 'px'
        canvas.style.height = viewport.height + 'px'
        const context = canvas.getContext('2d')
        context!.clearRect(0, 0, canvas.width, canvas.height)
        const renderContext = {
          canvasContext: context as Object,
          viewport: viewport,
        }

        const renderTask = page.render(renderContext)
        renderTask.promise.then(() => {
          document
            .getElementById('evilFlowersContent' + pageNumber)
            ?.replaceChildren(container, canvas)

          resolve(RENDERING_STATES.RENDERED)
        })
      })
    })
  }, [pdf, scale])

  useEffect(() => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      renderPage().then((resolve) => {
        setRendering(RENDERING_STATES.RENDERED)
      })
    }
  }, [pdf, scale])

  return (
    <div
      id={'evilFlowersContent' + pageNumber}
      key={'evilFlowersContent' + pageNumber}
      className={'pdf-container'}
    ></div>
  )
}

export default ScrollPage
