import { useTranslation } from 'react-i18next'
import Tooltip from '../helpers/toolTip/Tooltip'
import { useDocumentContext } from '../document/DocumentContext'
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
import { useViewerContext } from '../ViewerContext'
import { SIDEBAR_TABS, SIDEBAR_TAB_NAMES } from '../../../utils/enums'
import { useEffect, useState } from 'react'
import { RxQuote, RxShare2 } from 'react-icons/rx'
import Citations from './items/citation/Citations'
import ShareQRCode from './items/share/ShareQRCode'
import Toc from './items/toc/Toc'
import Bar from './bar/Bar'
import Search from './items/search/Search'
import Info from './items/info/Info'
import Share from './items/share/Share'

const SideMenu = () => {
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
    isEditMode,
    setIsEditMode,
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
    homeFunction
      ? {
          name: t('home'),
          icon: <BiHome id="menu-home" className={'viewer-button-icon'} />,
          tooltipText: t('homeToolTip'),
          onClick: () => homeFunction(),
        }
      : null,
    // EDIT
    // {
    //   name: t('edit'),
    //   icon: <AiOutlineEdit id="menu-edit" className={'viewer-button-icon'} />,
    //   tooltipText: isEditMode ? t('editCloseToolTip') : t('editToolTip'),
    //   onClick: () => setIsEditMode(!isEditMode),
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
    pdfCitation
      ? {
          name: t('citations'),
          icon: <RxQuote id="menu-citation" className={'viewer-button-icon'} />,
          tooltipText: t('citationsToolTip'),
          onClick: () => {
            setCitationVisible(true)
            setActiveSidebar(SIDEBAR_TABS.NULL)
          },
        }
      : null,
    // TOC
    TOC && TOC.length > 0
      ? {
          name: t('toc'),
          icon: (
            <BiMenuAltLeft id="menu-toc" className={'viewer-button-icon'} />
          ),
          tooltipText: t('tocToolTip'),
          onClick: () => {
            setTocVisibility(true)
            setActiveSidebar(SIDEBAR_TABS.NULL)
          },
        }
      : null,
    // SHARE
    shareFunction
      ? {
          name: t('share'),
          icon: <RxShare2 id="menu-share" className={'viewer-button-icon'} />,
          tooltipText: t('shareToolTip'),
          onClick: () =>
            setActiveSidebar(
              activeSidebar === SIDEBAR_TABS.SHARE
                ? SIDEBAR_TABS.NULL
                : SIDEBAR_TABS.SHARE
            ),
        }
      : null,
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
        {activeSidebar === SIDEBAR_TABS.INFO && <Info />}
        {activeSidebar === SIDEBAR_TABS.SHARE && (
          <Share
            setLink={setLink}
            setShareQRVisibility={setShareQRVisibility}
          />
        )}
      </Bar>
      <div
        className={'side-menu-container'}
        style={isEditMode ? { top: '155px' } : {}}
      >
        {SidebarItems.filter((item) => item !== null).map((item, i) => (
          <div className={'side-menu-buttons-container'} key={i}>
            <Tooltip title={item!.tooltipText} placement="right">
              <div
                id={item!.name}
                onClick={item!.onClick}
                className={'viewer-button'}
              >
                {item!.icon}
              </div>
            </Tooltip>
          </div>
        ))}
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

export default SideMenu
