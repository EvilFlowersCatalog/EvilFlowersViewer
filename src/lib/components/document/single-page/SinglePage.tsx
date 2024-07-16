import { MouseEvent } from 'react'
import { useDocumentContext } from '../../hooks/useDocumentContext'
import { RENDERING_STATES } from '../../../../utils/enums'
import useCustomEffect from '../../hooks/useCustomEffect'
import useRenderPage from '../../hooks/useRenderPage'
import loader from '../../common/RenderLoader'

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
  } = useDocumentContext()

  const renderPage = useRenderPage()

  useCustomEffect(() => {
    setPaginatorPageRender(RENDERING_STATES.RENDERING)

    const loadPage = async () => {
      const view = document.getElementById('evilFlowersPageContent')
      view?.replaceChildren(loader)

      await renderPage({
        view,
        edit: false,
        renderTextContext: true,
      })
    }

    loadPage().then(() => {
      setPaginatorPageRender(RENDERING_STATES.RENDERED)
    })
  }, [activePage, pdf, scale, rerender, screenHeight, hideBottomBar])

  return (
    <div id={'evilFlowersContent'} onDoubleClick={onDoubleClick}>
      <div id={'evilFlowersPageContent'}></div>
    </div>
  )
}

export default SinglePage
