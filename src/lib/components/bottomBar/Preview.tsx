import { useCallback, useEffect, useState } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import { RENDERING_STATES } from '../../../utils/enums'

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
  const NEXT_PREVIEW = 50

  const [start, setStart] = useState<number>(1)
  const [end, setEnd] = useState<number>(NEXT_PREVIEW)
  const [positions, setPositions] = useState<{ x: number; width: number }[]>([])

  // added new ones when scroll near end
  const handleScroll = (e: any) => {
    const target = e.target
    const width = target.scrollWidth
    const scrollWidth = target.clientWidth
    const scrollX = target.scrollLeft + scrollWidth

    if (
      scrollX >= (9 / 10) * width &&
      end < totalPages &&
      previewRender === RENDERING_STATES.RENDERED
    ) {
      setStart(end + 1)
      setEnd(Math.min(end + NEXT_PREVIEW, totalPages))
    }
  }

  // use call back func to generate one page
  const renderPage = useCallback(
    async (givenPage: number, canvas: HTMLCanvasElement, div: HTMLElement) => {
      await new Promise((resolve) => {
        // get page
        pdf?.getPage(givenPage).then(async (page) => {
          // create desired scale
          let viewport = page.getViewport({ scale: 1 })
          const desiredHeight = 145
          const desiredScale = desiredHeight / viewport.height
          viewport = page.getViewport({ scale: desiredScale })
          const paragraph = document.createElement('span')
          paragraph.setAttribute('class', 'preview-paragraph')
          paragraph.textContent = givenPage.toString()

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
            div.classList.remove('preview-loader-container') // remove loader container
            div.replaceChildren(canvas, paragraph)

            resolve('') // return
          })
        })
      })
    },
    [pdf, totalPages]
  )

  useEffect(() => {
    setPreviewRender(RENDERING_STATES.RENDERING)

    // create loader (spinning wheel)
    const loader = document.createElement('div')
    loader.setAttribute('class', 'viewer-loader-small')

    // func for creating pages
    const startRender = async () => {
      const previewBar = document.getElementById('previewBarContainer')! // get container

      // for each page
      for (let page = start; page <= Math.min(end, totalPages); page++) {
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
          div.classList.add('preview-loader-container')
          div.onclick = () => {
            setPage(page)
          }
          div.appendChild(loader) // append loader
          previewBar.appendChild(div) // append to container
        } else {
          div.classList.add('preview-loader-container')
          div.replaceChildren() // delete everything
          div.appendChild(loader) // append loader
        }

        // when page renders get psitions of the div
        await renderPage(page, canvas, div).then(() => {
          positions[page - 1] = {
            x: div!.offsetLeft,
            width: div!.getBoundingClientRect().width,
          }
        })
      }
    }

    // when everythings rendered set to RENDERED
    startRender().then(() => {
      setPreviewRender(RENDERING_STATES.RENDERED)
    })
  }, [pdf, totalPages, start, end, positions])

  useEffect(() => {
    // Reset when pdf changes
    const previewBar = document.getElementById('previewBarContainer')! // get container
    previewBar.replaceChildren()
    setPositions([])
    setStart(1)
    setEnd(Math.min(NEXT_PREVIEW, totalPages))
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
            const scrollToPosition =
              positions[activePage - 1].x -
              containerRect.x -
              (containerRect.width - positions[activePage - 1].width) / 2

            // Scroll to the target position smoothly
            // does not work on safari cuz safari sucks (does not support, idk why)
            container.scrollTo({
              left: scrollToPosition,
              behavior: 'smooth',
            })
          }
        }
      }
    }
  }, [activePage, previewRender, positions])

  useEffect(() => {
    if (activePage > end) {
      setStart(end + 1)
      setEnd(Math.min(activePage + NEXT_PREVIEW, totalPages))
    }
  }, [activePage])

  return (
    <div
      id={'previewBar'}
      className="prievew-bar-pages-container"
      onScroll={handleScroll}
    >
      <div id="previewBarContainer" className="preview-bar-pages"></div>
    </div>
  )
}

export default Preview
