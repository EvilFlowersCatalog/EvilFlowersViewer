import { useEffect, useState } from 'react'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
// @ts-ignore
import * as PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import { base64ToBinary } from '../../utils'
import Document from './document/Document'

pdfjs.GlobalWorkerOptions.workerSrc = PDFJSWorker

interface IViewerProps {
  data?: any
  config?: any
}

export const Viewer = ({ data, config }: IViewerProps) => {
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
    if (!data) return

    // if data is string, convert it to binary
    if (typeof data === 'string') {
      const binary = base64ToBinary(data)
      setDocumentData(binary)
    }

    // if data is pdf file, set it to the documentData state
    if (data instanceof File) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setDocumentData(e.target.result as string)
        }
      }
      reader.readAsDataURL(data)
    }

    // if data is json format, set it to the documentData state
    if (typeof data === 'object') {
      setDocumentData(JSON.stringify(data))
    }
  }, [data])

  return (
    <div id={'evilFlowersViewer'} className={'evilFlowersViewer w-full h-full'}>
      <div
        className={'bg-gray-100 dark:bg-zinc-700 w-full h-full duration-200'}
      >
        {documentData && <Document data={documentData} config={config} />}
      </div>
    </div>
  )
}
