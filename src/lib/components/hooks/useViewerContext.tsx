import { createContext, useContext } from 'react'
import { IViewerOptions } from '../Viewer'

interface IViewerContext extends IViewerOptions {
  setTheme: (theme: 'dark' | 'light') => void
  setShowHelp: (show: boolean) => void
  showHelp: boolean
  config: {
    download: boolean
    share: boolean
    print: boolean
    edit: boolean
  }
}
export const ViewerContext = createContext<IViewerContext | null>(null)

const useViewerContext = (): IViewerContext => {
  const context = useContext(ViewerContext)

  // if null throw error
  if (context === null) throw Error('ViewerContext is null.')

  return context
}

export default useViewerContext
