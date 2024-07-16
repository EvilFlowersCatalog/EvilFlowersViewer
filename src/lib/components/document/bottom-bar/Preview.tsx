import { useCallback, useState } from 'react'
import { useDocumentContext } from '../../hooks/useDocumentContext'
import { RENDERING_STATES } from '../../../../utils/enums'
import { debounce } from '../../../../utils'
import useCustomEffect from '../../hooks/useCustomEffect'
import loader from '../../common/RenderLoader'

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
  const renderPreviewPage = useCallback(
    async (givenPage: number, canvas: HTMLCanvasElement, div: HTMLElement) => {
      const page = await pdf?.getPage(givenPage)
      if (!page) return

      const paragraph = document.createElement('p')
      paragraph.setAttribute(
        'class',
        'text-[10px] font-bold flex justify-center mt-1'
      )
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
      context.imageSmoothingEnabled = false // they say it improves performance

      // render and replace everything in div with created canvas
      await page
        .render({
          canvasContext: context,
          viewport,
        })
        .promise.then(() => {
          div.classList.remove('flex', 'h-full', 'items-center') // remove loader container
          div.replaceChildren(canvas, paragraph)
        })
    },
    [pdf, totalPages]
  )

  useCustomEffect(() => {
    setPreviewRender(RENDERING_STATES.RENDERING)

    // func for creating pages
    const startRender = async () => {
      const previewBar = document.getElementById('previewBarContainer') // get container

      // for each page
      for (let page = start; page <= Math.min(end, totalPages); page++) {
        // create canvas
        const canvas = document.createElement('canvas')
        canvas.setAttribute(
          'class',
          'shadow-own transition-all duration-200 cursor-pointer'
        ) // give it style
        if (page === activePage) {
          canvas.setAttribute('class', 'border-t-5 border-red') // if it's active
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
          div.setAttribute('class', 'flex h-4/5 items-center')
          div.appendChild(loader) // append loader
          previewBar?.appendChild(div) // append to container
        } else {
          div.setAttribute('class', 'flex h-4/5 items-center')
          div.replaceChildren(loader) // delete everything and replace
        }

        // when page renders get psitions of the div
        await renderPreviewPage(page, canvas, div).then(() => {
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

  useCustomEffect(() => {
    // Reset when pdf changes
    const previewBar = document.getElementById('previewBarContainer') // get container
    previewBar?.replaceChildren()
    setPositions([])
    setStart(1)
    setEnd(Math.min(NEXT_PREVIEW, totalPages))
  }, [pdf, totalPages])

  useCustomEffect(() => {
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
        if (canvas) canvas.classList.remove('border-t-5', 'border-red')
      }
      if (newActive) {
        const canvas = newActive.querySelector('canvas')
        if (canvas)
          canvas.setAttribute(
            'class',
            'border-t-5 border-red shadow-own cursor-pointer'
          )
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

  useCustomEffect(() => {
    if (activePage > end) {
      setStart(end + 1)
      setEnd(Math.min(activePage + NEXT_PREVIEW, totalPages))
    }
  }, [activePage])

  return (
    <div
      id={'previewBar'}
      className="flex max-w-full h-full mx-5 pt-5 md:mx-[50px] px-2.5 overflow-x-auto"
      onScroll={handleScroll}
    >
      <div
        id="previewBarContainer"
        className="relative flex items-start mx-auto gap-2.5"
      ></div>
    </div>
  )
}

export default Preview
