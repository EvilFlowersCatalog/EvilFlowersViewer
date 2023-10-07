import { useCallback, useEffect } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'

const ScrollPage = () => {
  const { pdf, totalPages, setDesiredScale, screenWidth } = useDocumentContext()
  // when scroll to 3/5 page, load next pages
  const handleScroll = (event: any) => {
    const scrollY = event.target.scrollTop
    const height = event.target.scrollHeight
    if (scrollY >= height * (3 / 5)) {
      console.log('ahoj')
    }
  }

  // Render one page
  const renderPage = useCallback(
    async (givenPage: number, canvas: HTMLCanvasElement, div: HTMLElement) => {
      await new Promise((resolve) => {
        // get page
        pdf?.getPage(givenPage).then(async (page) => {
          let viewport = page.getViewport({ scale: 1 })
          // get width of container
          const width = document
            .getElementById('evilFlowersContent')!
            .getBoundingClientRect().width

          // calculate desired scale
          const calcScreenWidth = screenWidth > 599 ? width * 0.5 : width * 0.9
          const desiredWidth = calcScreenWidth * viewport.scale
          const viewportWidth = viewport.width / viewport.scale
          const desiredScale = desiredWidth / viewportWidth
          setDesiredScale(desiredScale)
          viewport = page.getViewport({ scale: desiredScale })

          // create text layer
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

          // update canvas
          canvas.height = viewport.height
          canvas.width = viewport.width
          const renderTask = page.render({
            canvasContext: canvas.getContext('2d') as Object,
            viewport: viewport,
          })

          // when rendered, update div by replacing all with ew canvas and container
          await renderTask.promise.then(() => {
            div.replaceChildren(canvas, container)

            resolve('') // return
          })
        })
      })
    },
    [pdf, totalPages]
  )
  useEffect(() => {
    // create loader
    const loader = document.createElement('div')
    loader.setAttribute('class', 'viewer-loader-small')

    // render func for all pages
    const startRender = async () => {
      const viewer = document.getElementById('evilFlowersScrollContent')! // get container
      viewer.replaceChildren() // delete all

      for (let page = 1; page <= totalPages; page++) {
        // create canvas adn style it
        const canvas = document.createElement('canvas')
        canvas.setAttribute('id', 'evilFlowersCanvas' + page)
        canvas.setAttribute('class', 'pdf-canvas-container')

        // get div
        let div: HTMLElement | null = document.getElementById(
          'scrollPage' + page
        )

        // if does not exist, create it
        if (!div) {
          div = document.createElement('div')
          div.setAttribute('id', 'scrollPage' + page)
          div.setAttribute('class', 'page-scroll-page-container')
          div.appendChild(loader) // append loader
          viewer.appendChild(div) // append div
        } else {
          div.replaceChildren() // delete all
          div.appendChild(loader) // append loader
        }

        // generate page for div
        await renderPage(page, canvas, div)
      }
    }
    startRender()
  }, [pdf, totalPages])
  return <div id={'evilFlowersScrollContent'} onScroll={handleScroll}></div>
}

export default ScrollPage
