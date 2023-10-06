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

  const renderPage = useCallback(
    async (givenPage: number, canvas: HTMLCanvasElement, div: HTMLElement) => {
      await new Promise((resolve) => {
        pdf?.getPage(givenPage).then(async (page) => {
          let viewport = page.getViewport({ scale: 1 })
          const desiredHeight = 130
          const desiredScale = desiredHeight / viewport.height
          viewport = page.getViewport({ scale: desiredScale })

          canvas.height = viewport.height
          canvas.width = viewport.width
          const context = canvas.getContext('2d')
          const renderTask = page.render({
            canvasContext: context as Object,
            viewport: viewport,
          })

          await renderTask.promise.then(() => {
            div.replaceChildren(canvas)
            resolve('')
          })
        })
      })
    },
    [pdf, totalPages]
  )

  useEffect(() => {
    positions = []
    setPreviewRender(RENDERING_STATES.RENDERING)
    const loader = document.createElement('div')
    loader.setAttribute('class', 'viewer-loader-small')

    const startRender = async () => {
      const previewBar = document.getElementById('previewBarContainer')!

      for (let page = 1; page <= totalPages; page++) {
        setPreviewRender(RENDERING_STATES.RENDERING)
        const canvas = document.createElement('canvas')
        canvas.setAttribute('class', 'preview-bar-page')
        if (page === activePage) {
          canvas.classList.add('preview-bar-active-page')
        }

        let div: HTMLElement | null = document.getElementById(
          'previewPage' + page
        )
        if (!div) {
          div = document.createElement('div')
          div.setAttribute('id', 'previewPage' + page)
          div.setAttribute('key', 'previewKey' + page)
          div.onclick = () => {
            setPage(page)
          }
          div.appendChild(loader)
          previewBar.appendChild(div)
        } else {
          div.replaceChildren()
          div.appendChild(loader)
        }

        const divBounding = div.getBoundingClientRect()
        positions.push({ x: divBounding.x, width: divBounding.width })

        await renderPage(page, canvas, div)
      }
    }

    startRender().then(() => {
      setPreviewRender(RENDERING_STATES.RENDERED)
    })
  }, [pdf, totalPages])

  useEffect(() => {
    if (previewRender === RENDERING_STATES.RENDERED) {
      // update onclick function
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
      if (prevActive) {
        const canvas = prevActive.querySelector('canvas')
        if (canvas) canvas.classList.remove('preview-bar-active-page')
      }
      if (newActive) {
        // updated active one
        const prevActive = document.getElementById(
          'previewPage' + prevActivePage
        )
        const newActive = document.getElementById('previewPage' + activePage)
        if (prevActive) {
          const canvas = prevActive.querySelector('canvas')
          if (canvas) canvas.classList.remove('preview-bar-active-page')
        }
        if (newActive) {
          const canvas = newActive.querySelector('canvas')
          if (canvas) canvas.classList.add('preview-bar-active-page')
          const container = document.getElementById('previewBar')

          // scroll
          if (container && canvas) {
            const containerRect = container.getBoundingClientRect()

            // Calculate the target scroll position to center the picture in the container
            const targetScrollPosition =
              positions[activePage - 1].x -
              containerRect.x -
              (containerRect.width - positions[activePage - 1].width) / 2 // Center the picture

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
