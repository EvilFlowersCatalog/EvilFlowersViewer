import { PDFDocumentProxy } from 'pdfjs-dist'
import { createContext, useContext } from 'react'

import {
  EDIT_STAGES,
  EDIT_TOOLS,
  RENDERING_STATES,
  SIDEBAR_TABS,
} from '../../../utils/enums'

/**
 * Document context
 */
interface TOCItemDoc {
  isExpanded: any
  title: string
  pageNumber: number
  level: number
  children: TOCItemDoc[]
}
interface IDocumentContext {
  pdf?: PDFDocumentProxy
  activePage: number
  prevActivePage: number
  setPage: (page: number) => void
  menu: boolean
  setMenu: (visibility: boolean) => void
  pdfCitation: { citation: string; type: string; format: string } | null
  downloadDocument: () => void
  downloadCitation: () => void
  copyCitation: () => void
  changeCitationFormat: (format: string, type: string) => void
  nextPage: () => void
  prevPage: () => void
  searchPage: (n: number) => void
  scale: number
  desiredScale: number
  setDesiredScale: (desiredScale: number) => void
  zoomIn: () => void
  zoomOut: () => void
  rerender: Object
  paginatorPageRender: RENDERING_STATES
  setPaginatorPageRender: (state: RENDERING_STATES) => void
  totalPages: number
  TOC: TOCItemDoc[] | undefined
  setTOC: (outline: TOCItemDoc[] | undefined) => void
  previewRender: RENDERING_STATES
  setPreviewRender: (state: RENDERING_STATES) => void
  screenWidth: number
  screenHeight: number
  setActiveSidebar: (activity: SIDEBAR_TABS) => void
  activeSidebar: SIDEBAR_TABS
  citationVisibile: boolean
  setCitationVisible: (state: boolean) => void
  tocVisibility: boolean
  setTocVisibility: (state: boolean) => void
  handleModeChange: () => void
  basedPdfCitation: string | undefined | null
  setBasedPdfCitation: (citation: string | undefined) => void
  isEditMode: boolean
  setIsEditMode: (isEdit: boolean) => void
  activeEditTool: EDIT_TOOLS
  setActiveEditTool: (tool: EDIT_TOOLS) => void
  editHexColor: string
  setEditHexColor: (hex: string) => void
  editLineSize: number
  setEditLineSize: (lineSize: number) => void
  svgWidth: number
  setSvgWidth: (width: number) => void
  svgHeight: number
  setSvgHeight: (width: number) => void
  editOpacity: number
  setEditOpacity: (opacity: number) => void
  hideBottomBar: boolean
  setHideBottomBar: (hideBottomBar: boolean) => void
  saveLayer: () => void
  groupId: string
  setGroupId: (groupId: string) => void
  editLayer: { id: string; svg: string } | null
  layer: { id: string; svg: string } | null
  setLayer: (layer: { id: string; svg: string } | null) => void
  editStage: EDIT_STAGES
  setEditStage: (editStage: EDIT_STAGES) => void
  resizeElements: (children: any, width: number, height: number) => void
}

export const DocumentContext = createContext<IDocumentContext | null>(null)

/**
 * Returns the document context
 *
 * @throws {Error}
 * This error is thrown if context is null
 *
 * @returns {IDocumentContext}
 */
export const useDocumentContext = (): IDocumentContext => {
  const context = useContext(DocumentContext)

  if (context === null) throw Error('DocumentContext is null.')

  return context
}
