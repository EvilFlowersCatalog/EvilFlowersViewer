import { useCallback, useEffect, useState } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'

const ScrollPage = () => {
  const { pdf, totalPages, scale, setDesiredScale, screenWidth } =
    useDocumentContext()
  // when scroll to 3/5 page, load next pages
  const handleScroll = (event: any) => {
    const scrollY = event.target.scrollTop
    const height = event.target.scrollHeight
    if (scrollY >= height * (3 / 5)) {
      console.log('ahoj')
    }
  }
  const renderPage = useCallback(
    async (givenPage: number, canvas: HTMLCanvasElement, div: HTMLElement) => {
      await new Promise((resolve) => {
        pdf?.getPage(givenPage).then(async (page) => {
          let viewport = page.getViewport({ scale })
          const width = document
            .getElementById('evilFlowersContent')!
            .getBoundingClientRect().width

          const calcScreenWidth = screenWidth > 599 ? width * 0.5 : width * 0.9
          const desiredWidth = calcScreenWidth * viewport.scale
          const viewportWidth = viewport.width / viewport.scale
          const desiredScale = desiredWidth / viewportWidth
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
          canvas.height = viewport.height
          canvas.width = viewport.width
          const renderTask = page.render({
            canvasContext: canvas.getContext('2d') as Object,
            viewport: viewport,
          })
          await renderTask.promise.then(() => {
            div.appendChild(canvas)
            div.appendChild(container)
            resolve('')
          })
        })
      })
    },
    [pdf, totalPages]
  )
  useEffect(() => {
    const loader = document.createElement('div')
    loader.setAttribute('class', 'viewer-loader-small')
    const startRender = async () => {
      const viewer = document.getElementById('evilFlowersScrollContent')!
      viewer.replaceChildren()
      for (let page = 1; page <= totalPages; page++) {
        const canvas = document.createElement('canvas')
        canvas.setAttribute('id', 'evilFlowersCanvas' + page)
        canvas.setAttribute('class', 'pdf-canvas-container')
        let div: HTMLElement | null = document.getElementById(
          'scrollPage' + page
        )
        if (!div) {
          div = document.createElement('div')
          div.setAttribute('id', 'scrollPage' + page)
          div.setAttribute('class', 'page-scroll-page-container')
          div.appendChild(loader)
          viewer.appendChild(div)
        } else {
          div.replaceChildren()
          div.appendChild(loader)
        }
        await renderPage(page, canvas, div).then(() => {
          div?.removeChild(loader)
        })
      }
    }
    startRender()
  }, [pdf, totalPages])
  return <div id={'evilFlowersScrollContent'} onScroll={handleScroll}></div>
}

export default ScrollPage
