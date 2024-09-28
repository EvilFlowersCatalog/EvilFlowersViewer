import { MouseEvent, useEffect, useState } from 'react'
import { useDocumentContext } from '../../hooks/useDocumentContext'
import {
  EDIT_STAGES,
  EDIT_TOOLS,
  RENDERING_STATES,
} from '../../../../utils/enums'
import PaintingSVG from './PaintingSVG'
import useRenderPage from '../../hooks/useRenderPage'
import EditMenu from './edit-items/EditMenu'
import loader from '../../common/RenderLoader'
import Loader from '../../common/Loader'

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
    editOpacity,
    editStage,
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

  const renderPage = useRenderPage()

  useEffect(() => {
    // start rendering
    setPaginatorPageRender(RENDERING_STATES.RENDERING)

    const loadPage = async () => {
      const view = document.getElementById('evilFlowersPageContent')
      view?.replaceChildren(loader) // set loader

      // render page
      await renderPage({
        view,
        edit: true,
        renderTextContext: false,
      })
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
    <>
      {/* MENU */}
      <EditMenu />
      <div id={'evilFlowersContent'} onDoubleClick={onDoubleClick}>
        {/* Container */}
        <div
          className="efw-relative efw-w-fit efw-m-auto efw-overflow-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setMouseVisible(false)}
          style={
            activeEditTool === EDIT_TOOLS.MOUSE
              ? { cursor: 'default' }
              : [
                  EDIT_TOOLS.SQUARE,
                  EDIT_TOOLS.CIRCLE,
                  EDIT_TOOLS.LINE,
                ].includes(activeEditTool)
              ? { cursor: 'crosshair' }
              : { cursor: 'none' }
          }
        >
          {/* Content */}
          <div id={'evilFlowersPageContent'} />

          {/* Panting SVG */}
          {editStage !== EDIT_STAGES.NULL && (
            <>
              {[EDIT_STAGES.DONE, EDIT_STAGES.WORKING].includes(editStage) && (
                <PaintingSVG />
              )}
              {[EDIT_STAGES.LOADING, EDIT_STAGES.WORKING].includes(
                editStage
              ) && (
                <div className="efw-absolute efw-top-0 efw-flex efw-justify-center efw-items-center efw-left-0 efw-w-full efw-h-full efw-bg-black efw-bg-opacity-50 ">
                  <Loader size={50} />
                </div>
              )}
            </>
          )}
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
    </>
  )
}

export default EditPage
