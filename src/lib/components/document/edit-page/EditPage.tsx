import { useCallback, useEffect, MouseEvent, useState } from 'react'
import { useDocumentContext } from '../DocumentContext'
import { EDIT_TOOLS, RENDERING_STATES } from '../../../../utils/enums'
import PaintingSVG from './PaintingSVG'

interface ISinglePage {
  onDoubleClick: (event: MouseEvent<HTMLDivElement>) => void
}

/**
 * Returns the page component after rendering
 *
 * @returns Page component
 *
 */

const EditPage = ({ onDoubleClick }: ISinglePage) => {
  const {
    pdf,
    activePage,
    scale,
    screenHeight,
    setPaginatorPageRender,
    editLineSize,
    editHexColor,
    activeEditTool,
    setSvgWidth,
    setSvgHeight,
    editOpacity,
  } = useDocumentContext()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [mouseVisible, setMouseVisible] = useState(false)

  const hexToRgba = (hex: string, alpha: number) => {
    const hexNumber = parseInt(hex.slice(1), 16)
    const r = (hexNumber >> 16) & 255
    const g = (hexNumber >> 8) & 255
    const b = hexNumber & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  /**
   * Renders the page and all its layers
   *
   * @returns A promise that resolves when the page is rendered
   */
  const renderPage = useCallback(
    async (view: HTMLElement | null) => {
      const page = await pdf?.getPage(activePage)
      if (!page) return

      const viewerContent = document.getElementById('evilFlowersEditContent')

      if (!viewerContent) return

      const height = viewerContent.getBoundingClientRect().height

      // Calculate scale
      let viewport = page.getViewport({ scale })
      const calcScreenHeight = 0.95 * height!
      const desiredHeight = calcScreenHeight * viewport.scale
      const viewportHeight = viewport.height / viewport.scale
      const desiredScale = desiredHeight / viewportHeight
      viewport = page.getViewport({ scale: desiredScale })

      const canvas = document.createElement('canvas')
      canvas.setAttribute('class', 'edit-page-canvas-container-paginator')
      canvas.width = viewport.width
      canvas.height = viewport.height
      setSvgWidth(canvas.width)
      setSvgHeight(canvas.height)
      const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D

      // render page
      await page
        .render({
          canvasContext,
          viewport,
        })
        .promise.then(() => {
          // append canvas
          view?.replaceChildren(canvas)
        })
    },
    [activePage, pdf, scale]
  )

  useEffect(() => {
    setPaginatorPageRender(RENDERING_STATES.RENDERING)
    const loader = document.createElement('div')
    loader.setAttribute('class', 'viewer-loader-small')

    const loadPage = async () => {
      const view = document.getElementById('evilFlowersEditPageContent')
      view?.replaceChildren(loader)

      await renderPage(view)
    }

    loadPage().then(() => {
      setPaginatorPageRender(RENDERING_STATES.RENDERED)
    })
  }, [activePage, pdf, scale, screenHeight])

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!mouseVisible && activeEditTool !== EDIT_TOOLS.MOUSE)
      setMouseVisible(true)
    setMousePosition({ x: e.clientX, y: e.clientY })
  }

  return (
    <div id={'evilFlowersEditContent'} onDoubleClick={onDoubleClick}>
      <div
        className="edit-page-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMouseVisible(false)}
        style={
          activeEditTool === EDIT_TOOLS.MOUSE
            ? { cursor: 'default' }
            : [EDIT_TOOLS.SQUARE, EDIT_TOOLS.CIRCLE, EDIT_TOOLS.LINE].includes(
                activeEditTool
              )
            ? { cursor: 'crosshair' }
            : { cursor: 'none' }
        }
      >
        <div id={'evilFlowersEditPageContent'} />
        <PaintingSVG />
      </div>
      {mouseVisible &&
        ![EDIT_TOOLS.SQUARE, EDIT_TOOLS.CIRCLE, EDIT_TOOLS.LINE].includes(
          activeEditTool
        ) && (
          <span
            style={{
              position: 'absolute',
              left: mousePosition.x - (editLineSize + 4) / 2 + 'px',
              top: mousePosition.y - (editLineSize + 4) / 2 + 'px',
              width:
                activeEditTool === EDIT_TOOLS.ERASER
                  ? '20px'
                  : editLineSize + 'px',
              height:
                activeEditTool === EDIT_TOOLS.ERASER
                  ? '20px'
                  : editLineSize + 'px',
              backgroundColor:
                activeEditTool === EDIT_TOOLS.ERASER
                  ? 'white'
                  : hexToRgba(editHexColor, editOpacity),
              border:
                activeEditTool === EDIT_TOOLS.ERASER
                  ? '2px solid black'
                  : `2px solid ${
                      editHexColor === '#ffffff' ? 'black' : 'transparent'
                    }`,
              borderRadius:
                activeEditTool === EDIT_TOOLS.ERASER ? '5px' : '50%',
              pointerEvents: 'none',
            }}
          />
        )}
    </div>
  )
}

export default EditPage
