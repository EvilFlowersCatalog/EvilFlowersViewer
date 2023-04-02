import { useEffect, useState } from 'react'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
// @ts-ignore
import * as PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import { base64ToBinary } from '../../utils'
import Document from './document/Document'

pdfjs.GlobalWorkerOptions.workerSrc = PDFJSWorker

interface IViewerProps {
  data?: string
  buttons?: {
    search?: boolean
    edit?: boolean
    message?: boolean
    share?: boolean
    info?: boolean
    download?: boolean
  }
  flags?: {
    showAnnotations?: boolean
    showComments?: boolean
    showLeftPanel?: boolean
    showMessage?: boolean
    showPrint?: boolean
    showProperties?: boolean
  }
}

export const Viewer = ( config : IViewerProps ) => {
  const [documentData, setDocumentData] = useState<string>()

  // On every data change, convert it to binary and set it to the documentData state
  useEffect(() => {
    if (!config.data) return
    const binary = base64ToBinary(config.data)

    setDocumentData(binary)
  }, [config.data])

  return (
    <div
      id="evilFlowersViewer"
      className="evilFlowersViewer bg-gray-100 w-screen h-screen"
    >
      {documentData && <Document data={documentData} />}
    </div>
  )
}
