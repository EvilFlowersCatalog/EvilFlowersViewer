import { useCallback, useEffect } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import PreviewHover from '../helpers/previewHover/PreviewHover'

interface IPreviewProps {
  pageNumber: number
}

/**
 * A preview of a document page
 *
 * @param pageNumber - number of page to be previewed
 *
 * @returns Preview component
 *
 */
const Preview = ({ pageNumber }: IPreviewProps) => {
  const {
    pdf,
    totalPages,
    searchPage,
    activePage,
    pagePreviews,
    nextPreviewPage,
  } = useDocumentContext()

  /**
   * Renders the page preview on a canvas, append to the div element
   *
   * @returns A promise that resolves when the page is rendered
   */
  const renderPreview = useCallback(async () => {
    await new Promise(() => {
      pdf?.getPage(pageNumber).then((page) => {
        // set sdesired scale
        let desiredHeight = 135
        let viewport = page.getViewport({ scale: 1 })
        let scale = desiredHeight / viewport.height
        viewport = page.getViewport({ scale: scale })

        // create and style canvas
        const canvas = document.createElement('canvas')
        canvas.onclick = () => {
          searchPage(pageNumber)
        }
        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.width = viewport.width + 'px'
        canvas.style.height = viewport.height + 'px'
        canvas.setAttribute(
          'style',
          pageNumber === activePage
            ? 'border: 5px double red; cursor: pointer;'
            : 'border: 1px solid black; cursor: pointer;'
        )
        document.getElementById('preview' + pageNumber)?.replaceChildren(canvas) // replace

        // remove context
        const context = canvas.getContext('2d')
        context!.clearRect(0, 0, canvas.width, canvas.height)
        const renderContext = {
          canvasContext: context as Object,
          viewport: viewport,
        }
        page.render(renderContext) // render
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
    <PreviewHover
      right={pageNumber - nextPreviewPage > pagePreviews * (3 / 4) ? 20 : 0}
      key={pageNumber}
      pageNumber={pageNumber}
    >
      <div id={'preview' + pageNumber}></div>
    </PreviewHover>
  )
}

export default Preview
