import { useEffect, useState } from 'react'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
// @ts-ignore
import * as PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import { base64ToBinary } from '../../utils'
import Document from './document/Document'

pdfjs.GlobalWorkerOptions.workerSrc = PDFJSWorker

interface IViewerProps {
  data?: string
}

/**
 * The Viewer component. It takes a base64 encoded string of the PDF file and renders it.
 * 
 * @param param0 - props
 * @param param0.data - The base64 encoded string of the PDF file
 * @returns - The Viewer component
 */
export const Viewer = ({ data }: IViewerProps) => {
  const [documentData, setDocumentData] = useState<string>()

  // On every data change, convert it to binary and set it to the documentData state
  useEffect(() => {
    if (!data) return
    const binary = base64ToBinary(data)

    setDocumentData(binary)
  }, [data])

  return (
    <div id="evilFlowersViewer" className="evilFlowersViewe w-screen h-screen">
      {documentData && <Document data={documentData} />}
    </div>
  )
}