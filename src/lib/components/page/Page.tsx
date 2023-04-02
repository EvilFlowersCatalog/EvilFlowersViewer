import { useCallback, useEffect, useState } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import PageContext from './PageContext'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
import { RENDERING_STATES } from '../../../utils/enums'

const Page = () => {
  const [isRendering, setRendering] = useState<RENDERING_STATES | null>(null)
  const { pdf, activePage, scale } = useDocumentContext()

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

        const canvas = document.createElement('canvas')
        canvas.setAttribute('id', 'viewer canvas')
        canvas.height = viewport.height
        canvas.width = viewport.width
        const context = canvas.getContext('2d')

        const renderContext = {
          canvasContext: context as Object,
          viewport: viewport,
        }
        const renderTask = page.render(renderContext)
        renderTask.promise.then(() => {
          document
            .getElementById('evilFlowersContent')
            ?.replaceChildren(container)
          document.getElementById('evilFlowersContent')?.appendChild(canvas)

          resolve(RENDERING_STATES.RENDERED)
        })
      })
    })
  }, [activePage, pdf, scale])

  useEffect(() => {
    renderPage().then(() => {
      setRendering(RENDERING_STATES.RENDERED)
    })
  }, [activePage, pdf, scale])

  return (
    <PageContext.Provider value={{}}>
      <div className={'pt-10'}>
        <div
          id={'evilFlowersContent'}
          className={'w-fit mx-auto shadow relative'}
        ></div>
        {isRendering &&
          isRendering in
            [RENDERING_STATES.LOADING, RENDERING_STATES.RENDERING] && (
            <div
              className={
                'absolute left-1/2 top-1/3 translate-x-1/2'
              }
            >
              <span className={'evilflowersviewer-loader'} />
            </div>
          )}
      </div>
    </PageContext.Provider>
  )
}

export default Page
