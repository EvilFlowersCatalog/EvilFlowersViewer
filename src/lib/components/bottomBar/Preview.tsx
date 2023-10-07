import { useCallback, useEffect, useRef } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import { RENDERING_STATES } from '../../../utils/enums'

let positions: { x: number; width: number }[] = []

const Preview = () => {
  const {
    pdf,
    totalPages,
    activePage,
    setPreviewRender,
    prevActivePage,
    previewRender,
    setPage,
  } = useDocumentContext()

  // use call back func to generate one page
  const renderPage = useCallback(
    async (givenPage: number, canvas: HTMLCanvasElement, div: HTMLElement) => {
      await new Promise((resolve) => {
        // get page
        pdf?.getPage(givenPage).then(async (page) => {
          // create desired scale
          let viewport = page.getViewport({ scale: 1 })
          const desiredHeight = 130
          const desiredScale = desiredHeight / viewport.height
          viewport = page.getViewport({ scale: desiredScale })

          // create canvas
          canvas.height = viewport.height
          canvas.width = viewport.width
          const context = canvas.getContext('2d')
          const renderTask = page.render({
            canvasContext: context as Object,
            viewport: viewport,
          })

          // redner and replace everything in div with created canvas
          await renderTask.promise.then(() => {
            div.replaceChildren(canvas)
            resolve('') // return
          })
        })
      })
    },
    [pdf, totalPages]
  )

  useEffect(() => {
    positions = [] // reset
    setPreviewRender(RENDERING_STATES.RENDERING)

    // create loader (spinning wheel)
    const loader = document.createElement('div')
    loader.setAttribute('class', 'viewer-loader-small')

    // func for creating pages
    const startRender = async () => {
      const previewBar = document.getElementById('previewBarContainer')! // get container

      // for each page
      for (let page = 1; page <= totalPages; page++) {
        // create canvas
        const canvas = document.createElement('canvas')
        canvas.setAttribute('class', 'preview-bar-page') // give it style
        if (page === activePage) {
          canvas.classList.add('preview-bar-active-page') // if it's active
        }

        // take div
        let div: HTMLElement | null = document.getElementById(
          'previewPage' + page
        )
        // if it does not exist, create one
        if (!div) {
          div = document.createElement('div')
          div.setAttribute('id', 'previewPage' + page)
          div.setAttribute('key', 'previewKey' + page)
          div.onclick = () => {
            setPage(page)
          }
          div.appendChild(loader) // append loader
          previewBar.appendChild(div) // append to container
        } else {
          div.replaceChildren() // delete everything
          div.appendChild(loader) // append loader
        }

        // when page renders get psitions of the div
        await renderPage(page, canvas, div).then(() => {
          const divBounding = div!.getBoundingClientRect()
          positions.push({ x: divBounding.x, width: divBounding.width })
        })
      }
    }

    // when everythings rendered set to RENDERED
    startRender().then(() => {
      setPreviewRender(RENDERING_STATES.RENDERED)
    })
  }, [pdf, totalPages])

  useEffect(() => {
    if (previewRender === RENDERING_STATES.RENDERED) {
      // update onclick function each time active page change
      for (let page = 1; page <= totalPages; page++) {
        let div: HTMLElement | null = document.getElementById(
          'previewPage' + page
        )
        if (div) {
          div.onclick = () => {
            setPage(page)
          }
        }
      }

      // updated active one
      const prevActive = document.getElementById('previewPage' + prevActivePage)
      const newActive = document.getElementById('previewPage' + activePage)

      // change active styles
      if (prevActive) {
        const canvas = prevActive.querySelector('canvas')
        if (canvas) canvas.classList.remove('preview-bar-active-page')
      }
      if (newActive) {
        const canvas = newActive.querySelector('canvas')
        if (canvas) canvas.classList.add('preview-bar-active-page')
        const container = document.getElementById('previewBar')

        // auto scroll
        if (container) {
          const containerRect = container.getBoundingClientRect()

          if (positions.length > 0) {
            // update width of active one (cut of the border in active one)
            const temp = positions[prevActivePage - 1].width
            positions[prevActivePage - 1].width =
              positions[activePage - 1].width
            positions[activePage - 1].width = temp

            // Calculate the target scroll position to center the picture in the container
            const targetScrollPosition =
              positions[activePage - 1].x -
              containerRect.x -
              (containerRect.width - positions[activePage - 1].width) / 2

            // Scroll to the target position smoothly
            container.scrollTo({
              left: targetScrollPosition,
              behavior: 'smooth',
            })
          }
        }
      }
    }
  }, [activePage, previewRender])

  return (
    <div id={'previewBar'} className="prievew-bar-pages-container">
      <div id="previewBarContainer" className="preview-bar-pages"></div>
    </div>
  )
}

export default Preview
