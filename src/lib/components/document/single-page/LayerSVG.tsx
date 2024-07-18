import { useRef, useState } from 'react'
import { useDocumentContext } from '../../hooks/useDocumentContext'
import { EDIT_TOOLS } from '../../../../utils/enums'
import useCustomEffect from '../../hooks/useCustomEffect'

const LayerSVG = () => {
  const svgRef: any = useRef(null)

  const { layer, svgHeight, svgWidth } = useDocumentContext()

  // Responsivness
  const resize = (children: any, width: number, height: number) => {
    for (const child of children) {
      // Adjust stroke width
      if (child) {
        const strokeWidth = child.getAttribute('stroke-width')
        if (strokeWidth) {
          const newStrokeWidth = (parseFloat(strokeWidth) / width) * svgWidth
          child.setAttribute('stroke-width', newStrokeWidth.toString())
        }

        // FOR STRAIGHT LINE
        if (child instanceof SVGLineElement) {
          const x1 = child.x1.baseVal.value
          const y1 = child.y1.baseVal.value
          const x2 = child.x2.baseVal.value
          const y2 = child.y2.baseVal.value

          // Adjust height and width for position
          child.setAttribute('x1', ((x1 / width) * svgWidth).toString())
          child.setAttribute('y1', ((y1 / height) * svgHeight).toString())
          child.setAttribute('x2', ((x2 / width) * svgWidth).toString())
          child.setAttribute('y2', ((y2 / height) * svgHeight).toString())
        }
        // FOR RECT
        else if (child instanceof SVGRectElement) {
          const x = child.x.baseVal.value
          const y = child.y.baseVal.value
          const entWidth = child.width.baseVal.value
          const entHeight = child.height.baseVal.value

          // Adjust height and width for position
          child.setAttribute('x', ((x / width) * svgWidth).toString())
          child.setAttribute('y', ((y / height) * svgHeight).toString())
          child.setAttribute(
            'width',
            ((entWidth / width) * svgWidth).toString()
          )
          child.setAttribute(
            'height',
            ((entHeight / height) * svgHeight).toString()
          )
        }
        // FOR LINE
        else if (child instanceof SVGPathElement) {
          const d = child.getAttribute('d') as string
          if (d) {
            const coords = d.split(' ').map((coord) => {
              const command = coord[0]
              const points = coord.substring(1).split(',')
              const x = ((parseFloat(points[0]) / width) * svgWidth).toFixed(0)
              const y = ((parseFloat(points[1]) / height) * svgHeight).toFixed(
                0
              )

              if (command && x && y) return `${command}${x},${y}`
            })
            child.setAttribute('d', coords.join(' '))
          }
        }
      }
    }
  }
  // Call responsive each time schWidth/Height change
  useCustomEffect(() => {
    const svg = svgRef.current
    const width = svg.width.baseVal.value
    const height = svg.height.baseVal.value
    const children = svgRef.current.children

    resize(children, width, height)

    svg.setAttribute('width', svgWidth)
    svg.setAttribute('height', svgHeight)
  }, [svgWidth, svgHeight])

  // Copy svg layer to pating layer
  useCustomEffect(() => {
    if (layer && svgRef.current) {
      // Clear existing SVG content
      svgRef.current.innerHTML = ''

      // Parse SVG string into a DOM object
      const parser = new DOMParser()
      const doc = parser.parseFromString(layer.svg, 'image/svg+xml')
      const parsedSvg = doc.documentElement

      // Get width and height from parsed SVG
      const width = parseFloat(parsedSvg.getAttribute('width')!)
      const height = parseFloat(parsedSvg.getAttribute('height')!)

      // Append child nodes to the SVG element
      if (parsedSvg) {
        Array.from(parsedSvg.children).forEach((child) => {
          svgRef.current.appendChild(child)
        })

        resize(svgRef.current.children, width, height)
      }
    }
  }, [layer])

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      id="evilFlowersPaintSVG"
      className="efw-absolute efw-top-0 efw-left-0 efw-w-full efw-h-full"
      ref={svgRef}
    />
  )
}

export default LayerSVG
