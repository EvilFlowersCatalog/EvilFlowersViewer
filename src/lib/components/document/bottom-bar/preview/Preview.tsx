import { useCallback, useEffect, useState } from 'react'
import { useDocumentContext } from '../../DocumentContext'
import { RENDERING_STATES } from '../../../../../utils/enums'
import { debounce } from '../../../../../utils'

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
  const handleScroll = debounce((e: any) => {
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
  })

  // use call back func to generate one page
  const renderPage = useCallback(
    async (givenPage: number, canvas: HTMLCanvasElement, div: HTMLElement) => {
      const page = await pdf?.getPage(givenPage)
      if (!page) return

      const paragraph = document.createElement('span')
      paragraph.setAttribute('class', 'preview-paragraph')
      paragraph.textContent = givenPage.toString()

      let viewport = page.getViewport({ scale: 1 })
      const desiredHeight = 100
      const desiredScale = desiredHeight / viewport.height
      viewport = page.getViewport({ scale: desiredScale })

      // create canvas
      canvas.height = viewport.height
      canvas.width = viewport.width
      canvas.onclick = () => {
        setPage(givenPage)
      }

      let context = canvas.getContext('2d')!
      context.imageSmoothingEnabled = false // vraj to zlepšuje performance

      // redner and replace everything in div with created canvas
      await page
        .render({
          canvasContext: context,
          viewport,
        })
        .promise.then(() => {
          div.classList.remove('preview-loader-container') // remove loader container
          div.replaceChildren(canvas, paragraph)
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
      const previewBar = document.getElementById('previewBarContainer') // get container

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
          div.appendChild(loader) // append loader
          previewBar?.appendChild(div) // append to container
        } else {
          div.classList.add('preview-loader-container')
          div.replaceChildren(loader) // delete everything and replace
        }

        // when page renders get psitions of the div
        await renderPage(page, canvas, div).then(() => {
          positions[page - 1] = {
            x: div.offsetLeft,
            width: div.getBoundingClientRect().width,
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
    const previewBar = document.getElementById('previewBarContainer') // get container
    previewBar?.replaceChildren()
    setPositions([])
    setStart(1)
    setEnd(Math.min(NEXT_PREVIEW, totalPages))
  }, [pdf, totalPages])

  useEffect(() => {
    if (previewRender === RENDERING_STATES.RENDERED) {
      // update onclick function each time active page change
      for (let page = 1; page <= end; page++) {
        let div: HTMLElement | null = document.getElementById(
          'previewPage' + page
        )
        if (div) {
          const canvas = div.querySelector('canvas')
          if (canvas) {
            canvas.onclick = () => {
              setPage(page)
            }
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
            // Calculate the target scroll position to center the page in the container
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
  }, [activePage, prevActivePage, previewRender, positions])

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
