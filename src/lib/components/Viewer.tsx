import { createElement, useEffect, useState } from 'react'
import Document from './document/Document'
import { createRoot } from 'react-dom/client'
import i18n from '../../utils/i18n'
import { useTranslation } from 'react-i18next'
import { ImExit } from 'react-icons/im'
import { TypedArray } from 'pdfjs-dist/types/src/display/api'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'
import { ViewerContext } from './hooks/useViewerContext'
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

// For options in renderViewer
export interface IViewerOptions {
  theme?: 'dark' | 'light'
  lang?: string
  citationBib?: string | null
  shareFunction?:
    | ((pages: string | null, expaireDate: string) => Promise<string>)
    | null
  homeFunction?: (() => void) | null
  closeFunction?: (() => void) | null
  editPackage?: {
    saveLayerFunc: (
      svg: string,
      groupId: string,
      page: number
    ) => Promise<{ id: string; svg: string } | null>
    saveGroupFunc: (name: string) => Promise<void>
    updateLayerFunc: (
      id: string,
      svg: string,
      groupId: string,
      page: number
    ) => Promise<void>
    updateGroupFunc: (id: string, name: string) => Promise<void>
    deleteLayerFunc: (id: string) => Promise<void>
    deleteGroupFunc: (id: string) => Promise<void>
    getLayerFunc: (
      page: number,
      groupId: string
    ) => Promise<{ id: string; svg: string } | null> | null
    getGroupsFunc: () => Promise<{ id: string; name: string }[]>
  } | null
}

interface IConfigParams {
  download?: boolean
  share?: boolean
  print?: boolean
  edit?: boolean
}

interface IViewerParams {
  data: TypedArray | null
  options: IViewerOptions | null
  config: IConfigParams | null
}

/**
 * The Viewer component. It takes a typedArray arr of the PDF file and renders it.
 *
 * @param viewerParams IViewerParams, data -> typedArray | null, options -> IViewerOptions | null
 * @returns - The Viewer component
 */
export const Viewer = (viewerParams: IViewerParams) => {
  const [showHelp, setShowHelp] = useState<boolean>(false)
  const { t } = useTranslation()
  const options: IViewerOptions = {
    //base
    ...{
      theme: 'dark',
      lang: 'en',
      citationBib: null,
      shareFunction: null,
      homeFunction: null,
      editPackage: null,
    },
    //given
    ...viewerParams.options,
  }
  const config = {
    ...{
      download: false,
      share: false,
      print: false,
      edit: false,
    },
    ...viewerParams.config,
  }
  const [theme, setTheme] = useState<'dark' | 'light' | undefined>(
    options.theme
  )

  // When theme change
  useEffect(() => {
    document.body.classList.remove('efw-light', 'efw-dark')
    document.body.classList.add(theme ? `efw-${theme}` : 'efw-dark')
  }, [theme])

  // Set languege based on given language
  useEffect(() => {
    if (viewerParams.options?.lang === 'sk') {
      i18n.changeLanguage('sk')
    } else {
      i18n.changeLanguage('en')
    }
  }, [])

  return (
    <ViewerContext.Provider
      value={{
        theme,
        setTheme,
        shareFunction: options.shareFunction,
        homeFunction: options.homeFunction,
        closeFunction: options.closeFunction,
        editPackage: options.editPackage,
        setShowHelp,
        showHelp,
        config,
        citationBib: options.citationBib,
      }}
    >
      <div
        id={'evilFlowersViewer'}
        className={
          'efw-w-screen efw-h-screen efw-min-h-[690px] efw-overflow-auto efw-text-black dark:efw-text-white'
        }
      >
        <div
          className={
            'efw-flex efw-w-full efw-h-full efw-flex-col efw-justify-center efw-items-center efw-bg-gray-light dark:efw-bg-gray-dark-medium'
          }
        >
          {/* If data === null show return option */}
          {viewerParams.data === null ? (
            <>
              <h1 className="efw-uppercase efw-text-lg efw-font-extrabold">
                {t('loadPDFerror')}
              </h1>
              {options.homeFunction && (
                <button
                  onClick={() => options.homeFunction!()}
                  className={
                    'efw-py-1 efw-px-2.5 efw-rounded-md efw-bg-transparent'
                  }
                >
                  <ImExit size={30} />
                </button>
              )}
            </>
          ) : (
            // Else document
            <Document data={viewerParams.data} />
          )}
        </div>
      </div>
    </ViewerContext.Provider>
  )
}

interface IRenderViewerProps {
  rootId: string
  data: TypedArray
  options?: IViewerOptions | null
  config?: IConfigParams | null
}

export const renderViewer = ({
  rootId,
  data,
  options = null,
  config = null,
}: IRenderViewerProps) => {
  const root = createRoot(document.getElementById(rootId)!)

  // render
  root.render(
    createElement(() => (
      <Viewer data={data} options={options} config={config} />
    ))
  )
}
