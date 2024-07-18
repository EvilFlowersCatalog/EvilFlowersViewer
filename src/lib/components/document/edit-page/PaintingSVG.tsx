import { useRef, useState } from 'react'
import { useDocumentContext } from '../../hooks/useDocumentContext'
import { EDIT_TOOLS } from '../../../../utils/enums'
import useCustomEffect from '../../hooks/useCustomEffect'

const PaintingSVG = () => {
  const svgRef: any = useRef(null)

  const {
    editLineSize,
    editHexColor,
    activeEditTool,
    svgHeight,
    svgWidth,
    editOpacity,
    editLayer,
    resizeElements,
  } = useDocumentContext()
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [entity, setEntity] = useState<
    SVGLineElement | SVGRectElement | SVGPathElement | null
  >(null)
  const [lastRectCords, setLastRectCords] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const [recreate, setRecreate] = useState<boolean>(true)
  const [path, setPath] = useState<string>('M')

  const handleMouseOver = (
    entity: SVGLineElement | SVGRectElement | SVGPathElement
  ) => {
    if (EDIT_TOOLS.ERASER === activeEditTool && isDrawing) {
      svgRef.current.removeChild(entity)
    }
  }

  // Initialization when something change
  useCustomEffect(() => {
    if (![EDIT_TOOLS.MOUSE, EDIT_TOOLS.ERASER].includes(activeEditTool)) {
      const newEntity = document.createElementNS(
        'http://www.w3.org/2000/svg',
        activeEditTool === EDIT_TOOLS.LINE
          ? 'line'
          : [EDIT_TOOLS.CIRCLE, EDIT_TOOLS.SQUARE].includes(activeEditTool)
          ? 'rect'
          : 'path'
      )

      // set atributes
      newEntity.setAttribute('stroke', editHexColor)
      newEntity.setAttribute('opacity', editOpacity.toString())
      newEntity.setAttribute('stroke-width', editLineSize.toString())
      newEntity.setAttribute('stroke-linecap', 'round')
      newEntity.setAttribute('fill', 'none')
      // for rubber to work
      newEntity.onmouseover = () => handleMouseOver(newEntity)
      setEntity(newEntity)
    }
  }, [editHexColor, editLineSize, activeEditTool, recreate, editOpacity])

  // reactivate hover function in elements
  useCustomEffect(() => {
    for (const child of svgRef.current.children) {
      if (child) {
        // reactivate
        child.onmouseover = () => handleMouseOver(child)
      }
    }
  }, [isDrawing, activeEditTool])

  // Call responsive each time schWidth/Height change
  useCustomEffect(() => {
    const svg = svgRef.current
    const width = svg.width.baseVal.value
    const height = svg.height.baseVal.value
    const children = svgRef.current.children

    resizeElements(children, width, height)

    // update size
    svg.setAttribute('width', svgWidth)
    svg.setAttribute('height', svgHeight)
  }, [svgWidth, svgHeight])

  // Function for starting the drawing
  const startDrawing = ({ nativeEvent }: any) => {
    if (activeEditTool === EDIT_TOOLS.ERASER) {
      setIsDrawing(true)
      return
    }
    const { offsetX, offsetY } = nativeEvent
    const svg = svgRef.current

    if (activeEditTool === EDIT_TOOLS.LINE) {
      entity?.setAttribute('x1', offsetX.toString())
      entity?.setAttribute('y1', offsetY.toString())
      entity?.setAttribute('x2', offsetX.toString())
      entity?.setAttribute('y2', offsetY.toString())
    } else if (
      [EDIT_TOOLS.SQUARE, EDIT_TOOLS.CIRCLE].includes(activeEditTool)
    ) {
      entity?.setAttribute(
        'rx',
        activeEditTool === EDIT_TOOLS.CIRCLE ? '50%' : '0'
      ) // radius
      setLastRectCords({ x: offsetX, y: offsetY })
    } else {
      setPath((prev) => prev + `${offsetX},${offsetY} `)
    }
    svg.appendChild(entity)
    setIsDrawing(true)
    nativeEvent.preventDefault()
  }

  const draw = ({ nativeEvent }: any) => {
    if (!isDrawing) return
    const { offsetX, offsetY } = nativeEvent

    if (activeEditTool === EDIT_TOOLS.LINE) {
      entity?.setAttribute('x2', offsetX)
      entity?.setAttribute('y2', offsetY)
    } else if (
      [EDIT_TOOLS.SQUARE, EDIT_TOOLS.CIRCLE].includes(activeEditTool)
    ) {
      const width = Math.abs(offsetX - lastRectCords.x)
      const height = Math.abs(offsetY - lastRectCords.y)
      const rx = offsetX < lastRectCords.x ? offsetX : lastRectCords.x
      const ry = offsetY < lastRectCords.y ? offsetY : lastRectCords.y

      entity?.setAttribute('x', rx.toString())
      entity?.setAttribute('y', ry.toString())
      entity?.setAttribute('width', width.toString())
      entity?.setAttribute('height', height.toString())
    } else {
      setPath((prev) => prev + `L${offsetX},${offsetY} `)
      entity?.setAttribute('d', path)
    }
    nativeEvent.preventDefault()
  }

  // Function for ending the drawing
  const endDrawing = () => {
    if (activeEditTool === EDIT_TOOLS.ERASER) {
      setIsDrawing(false)
      return
    }
    setEntity(null)
    setIsDrawing(false)
    setPath('M')
    setRecreate((prev) => !prev) // for trigger createing new entity
  }

  // Copy svg editLayer to pating editLayer
  useCustomEffect(() => {
    if (editLayer && svgRef.current) {
      // Clear existing SVG content
      svgRef.current.innerHTML = ''

      // Parse SVG string into a DOM object
      const parser = new DOMParser()
      const doc = parser.parseFromString(editLayer.svg, 'image/svg+xml')
      const parsedSvg = doc.documentElement

      // Get width and height from parsed SVG
      const width = parseFloat(parsedSvg.getAttribute('width')!)
      const height = parseFloat(parsedSvg.getAttribute('height')!)

      // Append child nodes to the SVG element
      if (parsedSvg) {
        Array.from(parsedSvg.children).forEach((child) => {
          svgRef.current.appendChild(child)
        })

        resizeElements(svgRef.current.children, width, height)
      }
    }
  }, [editLayer])

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      id="evilFlowersPaintSVG"
      className="efw-absolute efw-top-0 efw-left-0 efw-w-full efw-h-full efw-border efw-border-red"
      onMouseDown={
        EDIT_TOOLS.MOUSE === activeEditTool ? undefined : startDrawing
      }
      onMouseUp={EDIT_TOOLS.MOUSE === activeEditTool ? undefined : endDrawing}
      onMouseMove={
        [EDIT_TOOLS.MOUSE, EDIT_TOOLS.ERASER].includes(activeEditTool)
          ? undefined
          : draw
      }
      onMouseLeave={
        [EDIT_TOOLS.MOUSE, EDIT_TOOLS.ERASER].includes(activeEditTool)
          ? undefined
          : endDrawing
      }
      ref={svgRef}
    />
  )
}

export default PaintingSVG
