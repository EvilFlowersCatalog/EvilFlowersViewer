import { PDFDocumentProxy } from 'pdfjs-dist'
import { useEffect } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import PageContext from './PageContext'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'

interface IPageProps {
  pdf?: PDFDocumentProxy
}

const Page = () => {
  const { pdf, activePage } = useDocumentContext()

  const renderPage = () => {
    pdf?.getPage(activePage).then((page) => {
      const container = document.createElement('textLayer')
      container.setAttribute('id', 'textLayer')
      page.getTextContent().then((textContent) => {
        pdfjs.renderTextLayer({
          textContent,
          container,
          viewport,
          textDivs: [],
        })
      })

      const viewport = page.getViewport({ scale: 1 })

      const canvas = document.createElement('canvas')
      canvas.height = viewport.height
      canvas.width = viewport.width
      const context = canvas.getContext('2d')

      const renderContext = {
        canvasContext: context as Object,
        viewport: viewport,
      }
      const renderTask = page.render(renderContext)
      renderTask.promise.then(() => {
        document.getElementById('evilFlowersContent')?.replaceChildren(canvas)
      })
    })
  }

  useEffect(() => {
    renderPage()
  }, [activePage, pdf])

  return (
    <PageContext.Provider value={{}}>
      <div className={'pt-10'}>
        <div id={'evilFlowersContent'} className={'w-fit mx-auto shadow'}/>
      </div>
    </PageContext.Provider>
  )
}

export default Page
