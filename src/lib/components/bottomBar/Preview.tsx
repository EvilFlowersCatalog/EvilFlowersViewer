import { useCallback, useEffect, useState } from 'react'
import { useDocumentContext } from '../document/DocumentContext'

interface IPreviewProps {
  pageNumber: number
  previewNumber: number
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
const Preview = ({ pageNumber, previewNumber }: IPreviewProps) => {
  const { pdf, totalPages, searchPage } = useDocumentContext()
  const canvas = document.createElement('canvas')

  /**
   * Renders the page preview on a canvas, append to the div element
   *
   * @returns A promise that resolves when the page is rendered
   */
  const renderPreview = useCallback(async () => {
    return await new Promise((resolve) => {
      pdf?.getPage(pageNumber).then((page) => {
        const button = document.createElement('button')
        button.setAttribute(
          'class',
          'bg-transparent border-none shadow-lg cursor-pointer duration-200 flex w-128 items-center p-0'
        )
        button.onclick = () => {
          searchPage(pageNumber)
        }
        document.getElementById('preview ' + previewNumber)?.appendChild(button)
        button.appendChild(canvas)
        canvas.setAttribute(
          'className',
          'duration-200 transition-all border-none'
        )
        let desiredWidth = 80
        let viewport = page.getViewport({ scale: 1 })
        let scale = desiredWidth / viewport.width
        viewport = page.getViewport({ scale: scale })
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
  }, [pdf, pageNumber])

  useEffect(() => {
    document.getElementById('preview ' + previewNumber)?.replaceChildren()
    if (pageNumber > 0 && pageNumber <= totalPages) {
      renderPreview()
    }
  }, [pdf, pageNumber])

  return (
    <div
      key={'preview ' + previewNumber}
      id={'preview ' + previewNumber}
      className="w-16"
    ></div>
  )
}

export default Preview
