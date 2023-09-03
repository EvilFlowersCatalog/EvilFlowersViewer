import { createContext, useContext } from 'react'

interface IViewerContext {
  theme: 'dark' | 'light' | undefined
  setTheme: (theme: 'dark' | 'light') => void
  shareFunction?: ((pages: string | null, expaireDate: string) => Promise<string>) | null
}

export const ViewerContext = createContext<IViewerContext | null>(null)

/**
 * Returns the viewer context
 *
 * @throws {Error}
 * This error is thrown if context is null
 *
 * @returns {IViewerContext}
 */
export const useViewerContext = (): IViewerContext => {
  const context = useContext(ViewerContext)

  if (context === null) throw Error('ViewerContext is null.')

  return context
}
