import { useCallback, useEffect, useState } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import PreviewHover from '../helpers/previewHover/PreviewHover'

interface IPreviewProps {
  pageNumber: number
  right: number
}

/**
 * A preview of a document page
 *
 * @param pageNumber - number of page to be previewed
 * @param previewNumber - number of the preview element
 *
 * @returns Preview component
 *
 */
const Preview = ({ pageNumber, right }: IPreviewProps) => {
  const { pdf, totalPages, searchPage, activePage } = useDocumentContext()
  const canvas = document.createElement('canvas')

  /**
   * Renders the page preview on a canvas, append to the div element
   *
   * @returns A promise that resolves when the page is rendered
   */
  const renderPreview = useCallback(async () => {
    return await new Promise((resolve) => {
      pdf?.getPage(pageNumber).then((page) => {
        document.getElementById('preview' + pageNumber)?.appendChild(canvas)
        canvas.setAttribute('style', 'cursor: pointer;')
        if (pageNumber === activePage) {
          canvas.setAttribute('style', 'border: 5px double red')
        } else {
          canvas.setAttribute('style', 'border: 1px solid black;')
        }

        let desiredWidth = 100
        let viewport = page.getViewport({ scale: 1 })
        let scale = desiredWidth / viewport.width
        viewport = page.getViewport({ scale: scale })
        canvas.onclick = () => {
          searchPage(pageNumber)
        }
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
  }, [pdf, pageNumber, activePage])

  useEffect(() => {
    document.getElementById('preview' + pageNumber)?.replaceChildren()
    if (pageNumber > 0 && pageNumber <= totalPages) {
      renderPreview()
    }
  }, [pdf, pageNumber, activePage])

  return (
    <PreviewHover right={right} key={pageNumber} pageNumber={pageNumber}>
      <div id={'preview' + pageNumber}></div>
    </PreviewHover>
  )
}

export default Preview
