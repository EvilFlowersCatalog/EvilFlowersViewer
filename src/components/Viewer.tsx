import { useEffect, useState } from 'react'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
import * as PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import { base64ToBinary } from '../utils'

pdfjs.GlobalWorkerOptions.workerSrc = PDFJSWorker

interface IViewerProps {
  data?: string
}

const Viewer: React.FC<IViewerProps> = ({ data }): JSX.Element => {
  useEffect(() => {
    if (!data) return
    const binary = base64ToBinary(data)

    pdfjs.getDocument({ data: binary }).promise.then((pdf) => {
      const numPages = pdf.numPages

      for (let i = 1; i < numPages + 1; i++) {
        pdf.getPage(i).then((page) => {
          const container = document.createElement('textLayer')
          container.setAttribute('id', 'textLayer')

          page.getTextContent().then((textContent) => {
            pdfjs.renderTextLayer({
              textContent,
              //@ts-ignore
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
            document.getElementById('canvasWrapper')?.appendChild(canvas)
          })
        })
      }
    })
  }, [])

  return (
    <div className="evilFlowersViewer bg-gray-100">
      <div id="canvasWrapper" />
    </div>
  )
}

export default Viewer
