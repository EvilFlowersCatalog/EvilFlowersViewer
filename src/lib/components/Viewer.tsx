import { createElement, useEffect, useState } from 'react'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
// @ts-ignore
import * as PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import { base64ToBinary } from '../../utils'
import Document from './document/Document'
import { createRoot } from 'react-dom/client'
import i18n from '../../utils/i18n'
import { ViewerContext } from './ViewerContext'

pdfjs.GlobalWorkerOptions.workerSrc = PDFJSWorker
// pdfjs.GlobalWorkerOptions.workerSrc =
//   '../../../node_modules/pdfjs-dist/legacy/build/pdf.worker.js'

interface IViewerOptions {
  theme?: 'dark' | 'light'
  lang?: string
  citationBib?: string | null
  shareFunction?:
    | ((pages: string | null, expaireDate: string) => Promise<string>)
    | null
}

interface IViewerProps {
  data: string | null
  options: IViewerOptions | null
}

/**
 * The Viewer component. It takes a base64 encoded string of the PDF file and renders it.
 *
 * @param viewerProps IViewerProps, data -> base64, options -> IViewerOptions
 * @returns - The Viewer component
 */
export const Viewer = (viewerProps: IViewerProps) => {
  // Based options, cuz options are not required
  let basedOptions: IViewerOptions = {
    theme: 'dark',
    lang: 'en',
    citationBib: null,
    shareFunction: null,
  }

  // Update basedOptions with values from inputed options
  basedOptions = {
    ...basedOptions, // Spread the current values of basedOptions
    ...viewerProps.options, // Spread the values from inputed options, which will overwrite existing properties if they exist in both objects
  }

  const [theme, setTheme] = useState<'dark' | 'light' | undefined>(
    basedOptions.theme
  )
  const [documentData, setDocumentData] = useState<string | null>(null)

  useEffect(() => {
    // set given theme
    if (theme === 'dark') {
      setTheme('dark')
      document.getElementById('evilFlowersViewer')?.classList.add('dark')
    } else {
      setTheme('light')
      document.getElementById('evilFlowersViewer')?.classList.remove('dark')
    }

    // Set languege based on given language
    if (viewerProps.options?.lang === 'sk') {
      i18n.changeLanguage('sk')
    } else if (viewerProps.options?.lang === 'en') {
      i18n.changeLanguage('en')
    } else {
      i18n.changeLanguage('en')
    }
  }, [])

  // On every data change, convert it to binary and set it to the documentData state
  useEffect(() => {
    if (!viewerProps.data) return
    try {
      const binary = base64ToBinary(viewerProps.data)
      setDocumentData(binary)
    } catch (error) {
      console.error(error)
      setDocumentData(null)
    }
  }, [viewerProps.data])

  return (
    <ViewerContext.Provider
      value={{
        theme,
        setTheme,
        shareFunction: basedOptions.shareFunction,
      }}
    >
      <div
        id={'evilFlowersViewer'}
        className={
          'evilFlowersViewer w-full h-full flex items-center justify-center'
        }
      >
        <div
          className={
            'bg-zinc-300 dark:bg-zinc-700 w-full h-full duration-200 overflow-auto'
          }
        >
          <Document
            data={documentData}
            citationBibTeX={basedOptions.citationBib}
          />
        </div>
      </div>
    </ViewerContext.Provider>
  )
}

export const renderViewer = (
  rootId: string,
  data: string,
  options: IViewerOptions | null = null
) => {
  // if it was not created, create
  const root = createRoot(document.getElementById(rootId)!)
  // render
  root.render(createElement(() => <Viewer data={data} options={options} />))
}
