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

export const Viewer = ( config : IViewerProps ) => {
  const [documentData, setDocumentData] = useState<string>()

  useEffect(() => {
    if (
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.getElementById('evilFlowersViewer')?.classList.add('dark')
    } else {
      document.getElementById('evilFlowersViewer')?.classList.remove('dark')
    }
  }, [])

  // On every data change, convert it to binary and set it to the documentData state
  useEffect(() => {
    if (!config.data) return
    const binary = base64ToBinary(config.data)

    setDocumentData(binary)
  }, [config.data])

  return (
    <div
      id={'evilFlowersViewer'}
      className={
        'evilFlowersViewer w-full h-full'
      }
    >
      <div className={'bg-gray-100 dark:bg-zinc-700 w-full h-full duration-200'}>{documentData && <Document data={documentData} />}</div>
    </div>
  )
}
