import { useEffect, useState } from 'react'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
import * as PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import { base64ToBinary } from '../utils'
import Document from './document/Document'
import Sidebar from './sidebar/Sidebar'

pdfjs.GlobalWorkerOptions.workerSrc = PDFJSWorker

interface IViewerProps {
  data?: string
}

const Viewer = ({ data }: IViewerProps) => {
  const [documentData, setDocumentData] = useState<string>()

  // On every data change, convert it to binary and set it to the documentData state
  useEffect(() => {
    if (!data) return
    const binary = base64ToBinary(data)

    setDocumentData(binary)
  }, [data])

  return (
    <div className="evilFlowersViewer bg-gray-100 w-screen h-screen">
      <Sidebar />
      {documentData && <Document data={documentData} />}
    </div>
  )
}

export default Viewer
