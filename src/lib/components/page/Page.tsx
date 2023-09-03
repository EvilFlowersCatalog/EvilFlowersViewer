import { useCallback, useEffect } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import PageContext from './PageContext'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
import { RENDERING_STATES } from '../../../utils/enums'

/**
 * Returns the page component after rendering
 *
 * @returns Page component
 *
 */
const Page = () => {
  const { pdf, activePage, scale, rerender, isRendering, setRendering } = useDocumentContext()

  /**
   * Renders the page and all its layers
   *
   * @returns A promise that resolves when the page is rendered
   */
  const renderPage = useCallback(async () => {
    setRendering(RENDERING_STATES.RENDERING)

    return await new Promise((resolve) => {
      pdf?.getPage(activePage).then((page) => {
        const container = document.createElement('textLayer')
        container.setAttribute('id', 'textLayer')
        container.setAttribute(
          'class',
          'absolute w-full h-full top-0 left-0 leading-none text-transparent'
        )

        const viewport = page.getViewport({ scale })

        page.getTextContent().then((textContent) => {
          pdfjs.renderTextLayer({
            textContent,
            container,
            viewport,
            textDivs: [],
          })
        })

        const canvas =
          (document.getElementById('evilFlowersCanvas') as HTMLCanvasElement) ??
          document.createElement('canvas')
        canvas.setAttribute('id', 'evilFlowersCanvas')
        canvas.setAttribute('class', 'duration-200 transition-all')
        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.width = viewport.width + 'px'
        canvas.style.height = viewport.height + 'px'
        const context = canvas.getContext('2d')

        const renderContext = {
          canvasContext: context as Object,
          viewport: viewport,
        }
        const renderTask = page.render(renderContext)
        renderTask.promise.then(() => {
          const prevCanvas = document.getElementById(
            'evilFlowersCanvas'
          ) as HTMLCanvasElement
          const prevTextLayerNode = document.getElementById(
            'textLayer'
          ) as HTMLElement

          if (prevTextLayerNode)
            document
              .getElementById('evilFlowersContent')
              ?.replaceChild(container, prevTextLayerNode)
          else document
            .getElementById('evilFlowersContent')
            ?.replaceChildren(container)
          if (!prevCanvas)
            document.getElementById('evilFlowersContent')?.appendChild(canvas)

          resolve(RENDERING_STATES.RENDERED)
        })
      })
    })
  }, [activePage, pdf, scale])

  useEffect(() => {
    renderPage().then((resolve) => {
      setRendering(RENDERING_STATES.RENDERED)
    })
  }, [activePage, pdf, scale, rerender])

  return (
    <PageContext.Provider value={{}}>
      <div className={'pb-12 pt-7'}>
        <div
          id={'evilFlowersContent'}
          className={'w-fit mx-auto shadow relative'}
        ></div>
        {isRendering &&
          isRendering in
          [RENDERING_STATES.LOADING, RENDERING_STATES.RENDERING] && (
            <div className={'absolute left-1/2 top-1/3 translate-x-1/2'}>
              <span className={'evilflowersviewer-loader'} />
            </div>
          )}
      </div>
    </PageContext.Provider>
  )
}

export default Page
