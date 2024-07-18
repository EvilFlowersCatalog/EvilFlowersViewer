import { MouseEvent } from 'react'
import { useDocumentContext } from '../../hooks/useDocumentContext'
import { RENDERING_STATES } from '../../../../utils/enums'
import useCustomEffect from '../../hooks/useCustomEffect'
import useRenderPage from '../../hooks/useRenderPage'
import loader from '../../common/RenderLoader'
import useViewerContext from '../../hooks/useViewerContext'
import LayerSVG from './LayerSVG'

interface ISinglePage {
  onDoubleClick: (event: MouseEvent<HTMLDivElement>) => void
}

/**
 * Returns the page component after rendering
 *
 * @returns Page component
 *
 */
const SinglePage = ({ onDoubleClick }: ISinglePage) => {
  const {
    pdf,
    activePage,
    scale,
    rerender,
    setPaginatorPageRender,
    screenHeight,
    hideBottomBar,
    setLayer,
    groupId,
    layer,
  } = useDocumentContext()

  const { editPackage } = useViewerContext()

  const renderPage = useRenderPage()

  useCustomEffect(() => {
    // set rendering
    setPaginatorPageRender(RENDERING_STATES.RENDERING)

    const loadPage = async () => {
      setLayer(null) // reset
      const view = document.getElementById('evilFlowersPageContent')
      view?.replaceChildren(loader) // set loader

      // Get layer for page
      if (editPackage && groupId) {
        const { getLayerFunc } = editPackage
        const l = await getLayerFunc(activePage, groupId)
        setLayer(l)
      }

      // render page
      await renderPage({
        view,
        edit: false,
        renderTextContext: true,
      })
    }

    loadPage().then(() => {
      setPaginatorPageRender(RENDERING_STATES.RENDERED)
    })
  }, [activePage, pdf, scale, rerender, screenHeight, hideBottomBar, groupId])

  return (
    <div id={'evilFlowersContent'} onDoubleClick={onDoubleClick}>
      <div className="efw-relative efw-w-fit efw-m-auto">
        {/* Content */}
        <div id={'evilFlowersPageContent'} />
        {/* Layer */}
        {layer && <LayerSVG />}
      </div>
    </div>
  )
}

export default SinglePage
