import { createElement, useEffect, useState } from 'react'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
// @ts-ignore
import * as PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import { base64ToBinary } from '../../utils'
import Document from './document/Document'
import { createRoot } from 'react-dom/client'
import { useTranslation } from 'react-i18next'
import { ViewerContext } from './ViewerContext'

pdfjs.GlobalWorkerOptions.workerSrc = PDFJSWorker
//pdfjs.GlobalWorkerOptions.workerSrc = '../../../node_modules/pdfjs-dist/legacy/build/pdf.worker.js'

interface IViewerOptions {
  theme?: 'dark' | 'light';
  lang?: string;
  citationBib?: string | null;
  shareFunction?: ((pages: string | null, expaireDate: string) => Promise<string>) | null,
}

interface IViewerProps {
  data: string | null;
  options: IViewerOptions;
}

/**
 * The Viewer component. It takes a base64 encoded string of the PDF file and renders it.
 *
 * @param viewerProps IViewerProps, data -> base64, options -> IViewerOptions
 * @returns - The Viewer component
 */
export const Viewer = (viewerProps: IViewerProps) => {
  const [theme, setTheme] = useState<'dark' | 'light' | undefined>(viewerProps.options.theme);

  const [documentData, setDocumentData] = useState<string | null>(null)
  const { i18n } = useTranslation()

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  }

  useEffect(() => {
    // set given theme
    if (theme === 'dark') {
      setTheme('dark')
      document.getElementById('evilFlowersViewer')?.classList.add('dark')
    } else {
      setTheme('light');
      document.getElementById('evilFlowersViewer')?.classList.remove('dark')
    }

    // Set langauge
    if (viewerProps.options.lang === 'en') {
      changeLanguage('en');
    } else if (viewerProps.options.lang === 'sk') {
      changeLanguage('sk');
    } else { // anything else 'en' // for now
      changeLanguage('en');
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
        shareFunction: viewerProps.options.shareFunction
      }}
    >
      <div
        id={'evilFlowersViewer'}
        className={
          'evilFlowersViewer w-full h-full flex items-center justify-center'
        }
      >
        <div
          className={'bg-gray-100 dark:bg-zinc-700 w-full h-full duration-200'}
        >
          <Document data={documentData} citationBibTeX={viewerProps.options.citationBib} />
        </div>
      </div>
    </ViewerContext.Provider>
  )
}

export const renderViewer = (rootId: string, data: string, options: IViewerOptions | null = null) => {
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
    ...options,   // Spread the values from inputed options, which will overwrite existing properties if they exist in both objects
  }
  const root = createRoot(document.getElementById(rootId)!)
  root.render(createElement(() => <Viewer data={data} options={basedOptions} />))
}
