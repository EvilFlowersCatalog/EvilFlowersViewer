import { useCallback, useEffect, useState } from 'react'
import { useDocumentContext } from '../document/DocumentContext'

interface IScrollPageProps {
  pageNumber: number
}

const ScrollPage = ({ pageNumber }: IScrollPageProps) => {
  const { pdf, totalPages, scale, screenWidth, setDesiredScale } =
    useDocumentContext()
  const canvas = document.createElement('canvas')

  const renderPage = useCallback(async () => {
    return await new Promise((resolve) => {
      pdf?.getPage(pageNumber).then((page) => {
        document
          .getElementById('scroll-page-' + pageNumber)
          ?.appendChild(canvas)
        canvas.setAttribute('style', 'border: 1px solid black;')

        let viewport = page.getViewport({ scale })
        const calcScreenWidth =
          screenWidth > 959 ? screenWidth * 0.5 : screenWidth * 0.7
        const desiredWidth = calcScreenWidth * viewport.scale
        const viewportWidth = viewport.width / viewport.scale
        const desiredScale = desiredWidth / viewportWidth
        setDesiredScale(desiredScale)
        viewport = page.getViewport({ scale: desiredScale })

        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.width = viewport.width + 'px'
        canvas.style.height = viewport.height + 'px'
        const context = canvas.getContext('2d')
        context!.clearRect(0, 0, canvas.width, canvas.height)
        const renderContext = {
          canvasContext: context as Object,
          viewport: viewport,
        }
        page.render(renderContext)
      })
    })
  }, [pdf, pageNumber, scale])

  useEffect(() => {
    document.getElementById('scroll-page-' + pageNumber)?.replaceChildren()
    if (pageNumber > 0 && pageNumber <= totalPages) {
      renderPage()
    }
  }, [pdf, pageNumber, scale])

  return (
    <div
      key={'scroll-page-' + pageNumber}
      id={'scroll-page-' + pageNumber}
    ></div>
  )
}

export default ScrollPage
