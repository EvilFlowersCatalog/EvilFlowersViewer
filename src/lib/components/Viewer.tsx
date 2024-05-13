import { createElement, useEffect, useState } from 'react'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
// @ts-ignore
import * as PDFJSWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import Document from './document/Document'
import { createRoot } from 'react-dom/client'
import i18n from '../../utils/i18n'
import { ViewerContext } from './ViewerContext'
import { useTranslation } from 'react-i18next'
import { ImExit } from 'react-icons/im'
import { TypedArray } from 'pdfjs-dist/types/src/display/api'

pdfjs.GlobalWorkerOptions.workerSrc = PDFJSWorker
// Odkomentovať pri local používaní
// pdfjs.GlobalWorkerOptions.workerSrc =
//   '../../../node_modules/pdfjs-dist/legacy/build/pdf.worker.js'

interface IViewerOptions {
  theme?: 'dark' | 'light'
  lang?: string
  citationBib?: string | null
  shareFunction?:
    | ((pages: string | null, expaireDate: string) => Promise<string>)
    | null
  homeFunction?: (() => void) | null
  saveFunction?: ((svg: HTMLElement, name: string) => void) | null
  layersFunction?: ((page: number) => void) | null
}

interface IViewerProps {
  data: TypedArray | null
  options: IViewerOptions | null
}

/**
 * The Viewer component. It takes a base64 encoded string of the PDF file and renders it.
 *
 * @param viewerProps IViewerProps, data -> base64, options -> IViewerOptions
 * @returns - The Viewer component
 */
export const Viewer = (viewerProps: IViewerProps) => {
  const helpShown = localStorage.getItem('show-help')
  const [showHelp, setShowHelp] = useState<boolean>(false)

  // if does not exist, show for the first time
  if (!helpShown) {
    localStorage.setItem('show-help', JSON.stringify('shown'))
    setShowHelp(true)
  }
  const [documentData, setDocumentData] = useState<TypedArray | null | 'null'>(
    'null'
  )
  const { t } = useTranslation()

  // Based options, cuz options are not required
  let basedOptions: IViewerOptions = {
    theme: 'dark',
    lang: 'en',
    citationBib: null,
    shareFunction: null,
    homeFunction: null,
  }

  // Update basedOptions with values from inputed options
  basedOptions = {
    ...basedOptions, // Spread the current values of basedOptions
    ...viewerProps.options, // Spread the values from inputed options, which will overwrite existing properties if they exist in both objects
  }

  const [theme, setTheme] = useState<'dark' | 'light' | undefined>(
    basedOptions.theme
  )

  useEffect(() => {
    // set given theme
    if (theme === 'dark') {
      setTheme('dark')
      document.querySelector('body')?.setAttribute('data-theme', 'dark')
    } else {
      setTheme('light')
      document.querySelector('body')?.setAttribute('data-theme', 'light')
    }
  }, [theme])

  useEffect(() => {
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
    if (!viewerProps.data) {
      setDocumentData(null)
      return
    }
    try {
      setDocumentData(viewerProps.data)
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
        homeFunction: basedOptions.homeFunction,
        saveFunction: basedOptions.saveFunction,
        layersFunction: basedOptions.layersFunction,
        setShowHelp,
        showHelp,
      }}
    >
      <div id={'evilFlowersViewer'} className={'viewer-container'}>
        <div className={'viewer-inner-container'}>
          {documentData === null && (
            <>
              <h1 className="document-load-error">{t('loadPDFerror')}</h1>
              {basedOptions.homeFunction && (
                <div
                  onClick={() => basedOptions.homeFunction!()}
                  className={'viewer-back-button'}
                >
                  <ImExit className={'viewer-button-icon'} />
                </div>
              )}
            </>
          )}
          {documentData === 'null' && (
            <div className="viewer-loader-small"></div>
          )}
          {documentData !== 'null' && documentData && (
            <Document
              data={documentData}
              citationBibTeX={basedOptions.citationBib}
            />
          )}
        </div>
      </div>
    </ViewerContext.Provider>
  )
}

export const renderViewer = (
  rootId: string,
  data: TypedArray,
  options: IViewerOptions | null = null
) => {
  const root = createRoot(document.getElementById(rootId)!)

  // render
  root.render(createElement(() => <Viewer data={data} options={options} />))
}
