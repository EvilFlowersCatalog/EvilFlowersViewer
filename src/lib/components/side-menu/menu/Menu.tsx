import { useTranslation } from 'react-i18next'
import Tooltip from '../../helpers/toolTip/Tooltip'
import { useDocumentContext } from '../../document/DocumentContext'
import {
  BiDownload,
  BiHelpCircle,
  BiHome,
  BiInfoCircle,
  BiMenuAltLeft,
  BiMoon,
  BiSearch,
  BiSun,
} from 'react-icons/bi'
import { AiOutlinePlus, AiOutlineMinus, AiOutlineEdit } from 'react-icons/ai'
import { useViewerContext } from '../../ViewerContext'
import { SIDEBAR_TABS, SIDEBAR_TAB_NAMES } from '../../../../utils/enums'
import { useEffect, useState } from 'react'
import { RxQuote, RxShare2 } from 'react-icons/rx'
import Citations from '../items/citation/Citations'
import ShareQRCode from '../items/share/ShareQRCode'
import Toc from '../items/toc/Toc'
import Bar from '../bar/Bar'
import Search from '../items/search/Search'
import Info from '../items/info/Info'
import Share from '../items/share/Share'
import Edit from '../items/edit/Edit'

const Menu = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [link, setLink] = useState<string>('')
  const sidebarNames = SIDEBAR_TAB_NAMES()
  const [shareQRVisibility, setShareQRVisibility] = useState<boolean>(false)

  const { t } = useTranslation()
  const {
    zoomIn,
    zoomOut,
    downloadDocument,
    pdfCitation,
    TOC,
    activeSidebar,
    setActiveSidebar,
    citationVisibile,
    setCitationVisible,
    tocVisibility,
    setTocVisibility,
    handleModeChange,
    scale,
  } = useDocumentContext()
  const { theme, shareFunction, homeFunction, setShowHelp } = useViewerContext()

  useEffect(() => {
    if (activeSidebar === SIDEBAR_TABS.NULL) {
      setSidebarOpen(false)
    } else {
      setSidebarOpen(true)
    }
  }, [activeSidebar])

  const SidebarItems = [
    // HOME
    {
      name: t('home'),
      icon: (
        <BiHome
          id="menu-home"
          className={
            homeFunction ? 'viewer-button-icon' : 'viewer-button-icon-deactive'
          }
        />
      ),
      tooltipText: homeFunction ? t('homeToolTip') : t('homeNoneToolTip'),
      onClick: () => (homeFunction ? homeFunction() : null),
    },
    // EDIT
    // {
    //   name: t('edit'),
    //   icon: <AiOutlineEdit id="menu-edit" className={'viewer-button-icon'} />,
    //   tooltipText: t('editToolTip'), //'NOT WORKING YET',
    //   onClick: () =>
    //     //null,
    //     setActiveSidebar(
    //       activeSidebar === SIDEBAR_TABS.EDIT
    //         ? SIDEBAR_TABS.NULL
    //         : SIDEBAR_TABS.EDIT
    //     ),
    // },
    // SEARCH
    {
      name: t('search'),
      icon: <BiSearch id="menu-search" className={'viewer-button-icon'} />,
      tooltipText: t('fullTextSearch'),
      onClick: () => {
        setActiveSidebar(
          activeSidebar === SIDEBAR_TABS.SEARCH
            ? SIDEBAR_TABS.NULL
            : SIDEBAR_TABS.SEARCH
        )
      },
    },
    // CITATION
    {
      name: t('citations'),
      icon: (
        <RxQuote
          id="menu-citation"
          className={
            pdfCitation ? 'viewer-button-icon' : 'viewer-button-icon-deactive'
          }
        />
      ),
      tooltipText: pdfCitation
        ? t('citationsToolTip')
        : t('citationNoneToolTip'),
      onClick: () => {
        pdfCitation ? setCitationVisible(true) : null
        setActiveSidebar(SIDEBAR_TABS.NULL)
      },
    },
    // TOC
    {
      name: t('toc'),
      icon: (
        <BiMenuAltLeft
          id="menu-toc"
          className={
            TOC && TOC.length
              ? 'viewer-button-icon'
              : 'viewer-button-icon-deactive'
          }
        />
      ),
      tooltipText:
        TOC && TOC.length > 0 ? t('tocToolTip') : t('tocNoneToolTip'),
      onClick: () => {
        TOC && TOC.length > 0 ? setTocVisibility(true) : null
        setActiveSidebar(SIDEBAR_TABS.NULL)
      },
    },
    // SHARE
    {
      name: t('share'),
      icon: (
        <RxShare2
          id="menu-share"
          className={
            shareFunction ? 'viewer-button-icon' : 'viewer-button-icon-deactive'
          }
        />
      ),
      tooltipText: shareFunction ? t('shareToolTip') : t('notShareToolTip'),
      onClick: () =>
        shareFunction
          ? setActiveSidebar(
              activeSidebar === SIDEBAR_TABS.SHARE
                ? SIDEBAR_TABS.NULL
                : SIDEBAR_TABS.SHARE
            )
          : null,
    },
    // INFO
    {
      name: t('info'),
      icon: <BiInfoCircle id="menu-info" className={'viewer-button-icon'} />,
      tooltipText: t('infoToolTip'),
      onClick: () =>
        setActiveSidebar(
          activeSidebar === SIDEBAR_TABS.INFO
            ? SIDEBAR_TABS.NULL
            : SIDEBAR_TABS.INFO
        ),
    },
    // HELP
    {
      name: t('help'),
      icon: <BiHelpCircle id="menu-help" className={'viewer-button-icon'} />,
      tooltipText: t('help'),
      onClick: () => {
        setShowHelp(true)
      },
    },
    // THEME
    {
      name: t(''),
      icon:
        theme === 'light' ? (
          <BiSun id="menu-theme" className={'viewer-button-icon'} />
        ) : (
          <BiMoon id="menu-theme" className={'viewer-button-icon'} />
        ),
      tooltipText: theme === 'light' ? t('lightMode') : t('darkMode'),
      onClick: () => {
        handleModeChange()
      },
    },
    // DOWNLOAD
    {
      name: t('download'),
      icon: <BiDownload id="menu-download" className={'viewer-button-icon'} />,
      tooltipText: t('downloadToolTip'),
      onClick: () => {
        downloadDocument()
        setActiveSidebar(SIDEBAR_TABS.NULL)
      },
    },
    // ZOOM IN
    {
      name: t(''),
      icon: (
        <AiOutlinePlus
          id="menu-zoom-in"
          className={
            scale === 3 ? 'viewer-button-icon-deactive' : 'viewer-button-icon'
          }
        />
      ),
      tooltipText: t('zoomIn'),
      onClick: () => {
        zoomIn()
      },
    },
    // ZOOM OUT
    {
      name: t(''),
      icon: (
        <AiOutlineMinus
          id="menu-zoom-out"
          className={
            scale === 0.25
              ? 'viewer-button-icon-deactive'
              : 'viewer-button-icon'
          }
        />
      ),
      tooltipText: t('zoomOut'),
      onClick: () => {
        zoomOut()
      },
    },
  ]

  return (
    <>
      <Bar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        setSidebar={setActiveSidebar}
        title={sidebarNames[activeSidebar]}
      >
        {activeSidebar === SIDEBAR_TABS.SEARCH && <Search />}
        {activeSidebar === SIDEBAR_TABS.EDIT && <Edit />}
        {activeSidebar === SIDEBAR_TABS.INFO && <Info />}
        {activeSidebar === SIDEBAR_TABS.SHARE && (
          <Share
            setLink={setLink}
            setShareQRVisibility={setShareQRVisibility}
          />
        )}
      </Bar>
      <div className={'side-menu-container'}>
        {SidebarItems.slice(0, SidebarItems.length - 2).map((item, i) => (
          <div className={'side-menu-buttons-container'} key={i}>
            <Tooltip title={item.tooltipText} placement="right">
              <div
                id={item.name}
                onClick={item.onClick}
                className={'viewer-button'}
              >
                {item.icon}
              </div>
            </Tooltip>
          </div>
        ))}
        <div className="side-menu-zoom-buttons-container">
          {SidebarItems.slice(SidebarItems.length - 2).map((item, i) => (
            <div className={'side-menu-buttons-container'} key={i}>
              <Tooltip title={item.tooltipText} placement="right">
                <div
                  id={item.name}
                  onClick={item.onClick}
                  className={'viewer-button'}
                >
                  {item.icon}
                </div>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>
      {citationVisibile && (
        <Citations setCitationVisible={setCitationVisible} />
      )}
      {shareQRVisibility && (
        <ShareQRCode setShareQRVisibility={setShareQRVisibility} link={link} />
      )}
      {tocVisibility && <Toc setTocVisibility={setTocVisibility} />}
    </>
  )
}

export default Menu
