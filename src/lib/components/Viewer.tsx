import { useEffect, useState } from 'react'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
// @ts-ignore
import * as PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import { base64ToBinary } from '../../utils'
import { ReactComponent as SadIcon } from '../../assets/icons/bx-sad.svg'
import Document from './document/Document'
import { t } from 'i18next'

pdfjs.GlobalWorkerOptions.workerSrc = PDFJSWorker

interface IViewerProps {
  data: string | null
}

/**
 * The Viewer component. It takes a base64 encoded string of the PDF file and renders it.
 *
 * @param param0 - props
 * @param param0.data - The base64 encoded string of the PDF file
 * @returns - The Viewer component
 */
export const Viewer = ({ data = null }: IViewerProps) => {
  const [documentData, setDocumentData] = useState<string | null>()

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
    try {
      const binary = base64ToBinary(data)
      setDocumentData(binary)
    } catch (error) {
      console.error(error)
      setDocumentData(null)
    }
  }, [data])

  return (
    <div
      id={'evilFlowersViewer'}
      className={
        'evilFlowersViewer w-full h-full flex items-center justify-center'
      }
    >
      <div
        className={'bg-gray-100 dark:bg-zinc-700 w-full h-full duration-200'}
      >
        <Document data={documentData} />
      </div>
    </div>
  )
}
