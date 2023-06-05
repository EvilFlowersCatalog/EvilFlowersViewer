import { createElement, useEffect, useState } from 'react'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
// @ts-ignore
import * as PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import { base64ToBinary } from '../../utils'
import Document from './document/Document'
import { createRoot } from 'react-dom/client'

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
    const binary = base64ToBinary(data)

    setDocumentData(binary)
  }, [data])

  return (
    <div id={'evilFlowersViewer'} className={'evilFlowersViewer w-full h-full'}>
      <div
        className={'bg-gray-100 dark:bg-zinc-700 w-full h-full duration-200'}
      >
        {documentData && <Document data={documentData} />}
      </div>
    </div>
  )
}

export const renderViewer = (rootID: string, data: string) => {
  const root = createRoot(document.getElementById(rootID)!)
  root.render(createElement(() => <Viewer data={data}/>))
}
