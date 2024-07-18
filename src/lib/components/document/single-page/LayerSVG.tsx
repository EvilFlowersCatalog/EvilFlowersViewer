import { useRef, useState } from 'react'
import { useDocumentContext } from '../../hooks/useDocumentContext'
import { EDIT_TOOLS } from '../../../../utils/enums'
import useCustomEffect from '../../hooks/useCustomEffect'

const LayerSVG = () => {
  const svgRef: any = useRef(null)

  const { layer, svgHeight, svgWidth, resizeElements } = useDocumentContext()

  // Call responsive each time schWidth/Height change
  useCustomEffect(() => {
    const svg = svgRef.current
    const width = svg.width.baseVal.value
    const height = svg.height.baseVal.value
    const children = svgRef.current.children

    resizeElements(children, width, height)

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

        resizeElements(svgRef.current.children, width, height)
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
