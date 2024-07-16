import { useEffect, useRef, useState, MouseEvent } from 'react'
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
    elements,
    setElements,
    editOpacity,
    layer,
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
      setElements(elements.filter((item) => entity !== item))
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

      newEntity.setAttribute('stroke', editHexColor)
      newEntity.setAttribute('opacity', editOpacity.toString())
      newEntity.setAttribute('stroke-width', editLineSize.toString())
      newEntity.setAttribute('stroke-linecap', 'round')
      newEntity.setAttribute('fill', 'none')
      newEntity.onmouseover = () => handleMouseOver(newEntity)
      setEntity(newEntity)
    }
  }, [editHexColor, editLineSize, activeEditTool, recreate, editOpacity])

  // reactivate hover function in elements
  useCustomEffect(() => {
    elements.forEach((element) => {
      if (element) {
        element.onmouseover = () => handleMouseOver(element)
      }
    })
  }, [isDrawing, activeEditTool])

  // // Responsivness
  // useCustomEffect(() => {
  //   const svg = svgRef.current
  //   const width = svg.width.baseVal.value
  //   const height = svg.height.baseVal.value

  //   console.log(width, height)

  //   if (elements.length !== 0) {
  //     elements.forEach((element) => {
  //       // adaptd stroke width
  //       if (element) {
  //         const strokeWidth = element.getAttribute('stroke-width')
  //         if (strokeWidth) {
  //           element.setAttribute(
  //             'stroke-width',
  //             Math.max(1, (parseInt(strokeWidth) / width) * svgWidth).toString()
  //           )
  //         }
  //       }
  //       // FOR STRAIGHT LINE
  //       if (element && element instanceof SVGLineElement) {
  //         const x1 = element.x1.baseVal.value
  //         const y1 = element.y1.baseVal.value
  //         const x2 = element.x2.baseVal.value
  //         const y2 = element.y2.baseVal.value

  //         element.setAttribute('x1', ((x1 / width) * svgWidth).toString())
  //         element.setAttribute('y1', ((y1 / height) * svgHeight).toString())
  //         element.setAttribute('x2', ((x2 / width) * svgWidth).toString())
  //         element.setAttribute('y2', ((y2 / height) * svgHeight).toString())
  //       }
  //       // FOR RECT
  //       else if (element && element instanceof SVGRectElement) {
  //         const x = element.x.baseVal.value
  //         const y = element.y.baseVal.value
  //         const entWidth = element.width.baseVal.value
  //         const entHeight = element.height.baseVal.value

  //         element.setAttribute('x', ((x / width) * svgWidth).toString())
  //         element.setAttribute('y', ((y / height) * svgHeight).toString())
  //         element.setAttribute(
  //           'width',
  //           ((entWidth / width) * svgWidth).toString()
  //         )
  //         element.setAttribute(
  //           'height',
  //           ((entHeight / height) * svgHeight).toString()
  //         )
  //       }
  //       // FOR LINE
  //       else if (element && element instanceof SVGPathElement) {
  //         const d = element.getAttribute('d') as string
  //         if (d) {
  //           const coords = d.split(' ').map((coord) => {
  //             const command = coord[0]
  //             const points = coord.substring(1).split(',')
  //             const x = ((parseInt(points[0]) / width) * svgWidth).toFixed(0)
  //             const y = ((parseInt(points[1]) / height) * svgHeight).toFixed(0)

  //             if (command && x && y) return `${command}${x},${y}`
  //           })
  //           element.setAttribute('d', coords.join(' '))
  //         }
  //       }
  //     })
  //   }

  //   svg.setAttribute('width', svgWidth)
  //   svg.setAttribute('height', svgHeight)
  // }, [svgWidth, svgHeight])

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
    if (isDrawing) elements.push(entity)
    setEntity(null)
    setIsDrawing(false)
    setPath('M')
    setRecreate((prev) => !prev) // for trigger createing new entity
  }

  useEffect(() => {
    if (layer && svgRef.current) {
      // Clear existing SVG content
      svgRef.current.innerHTML = ''

      // Parse SVG string into a DOM object
      const parser = new DOMParser()
      const doc = parser.parseFromString(layer.svg, 'image/svg+xml')
      const parsedSvg = doc.documentElement

      // Append child nodes to the SVG element
      if (parsedSvg) {
        const tmpElements: (
          | SVGLineElement
          | SVGRectElement
          | SVGPathElement
          | null
        )[] = []
        Array.from(parsedSvg.children).forEach((child) => {
          svgRef.current.appendChild(child)
          switch (child.tagName.toLowerCase()) {
            case 'line':
              tmpElements.push(child as SVGLineElement)
              break
            case 'rect':
              tmpElements.push(child as SVGRectElement)
              break
            case 'path':
              tmpElements.push(child as SVGPathElement)
              break
            default:
              break
          }
        })
        setElements(tmpElements)
      }
    }
  }, [layer])

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      id="evilFlowersPaintSVG"
      className="absolute top-0 left-0 w-full h-full border border-red"
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
