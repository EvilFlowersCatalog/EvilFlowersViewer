import { useTranslation } from 'react-i18next'
import Tooltip from '../helpers/Tooltip'
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
  BiZoomIn,
  BiZoomOut,
} from 'react-icons/bi'
import { PiCaretUpDownBold } from 'react-icons/pi'
import { LuChevronsLeftRight } from 'react-icons/lu'
import { TbZoomReplace } from 'react-icons/tb'
import { useViewerContext } from '../ViewerContext'
import { SIDEBAR_TABS, SIDEBAR_TAB_NAMES } from '../../../utils/enums'
import { useEffect, useState } from 'react'
import { RxQuote, RxShare2 } from 'react-icons/rx'
import Citations from '../citation/Citations'
import ShareQRCode from '../share/ShareQRCode'
import Outline from '../outline/Outline'
import Sidebar from '../sidebar/Sidebar'
import Search from '../search/Search'
import Info from '../info/Info'
import Share from '../share/Share'

const Menu = () => {
  const [activeSidebar, setActiveSidebar] = useState<SIDEBAR_TABS>(
    SIDEBAR_TABS.NULL
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [citationVisibile, setCitationVisible] = useState<boolean>(false)
  const [shareQRVisibility, setShareQRVisibility] = useState<boolean>(false)
  const [tocVisibility, setTocVisibility] = useState<boolean>(false)
  const [link, setLink] = useState<string>('')
  const sidebarNames = SIDEBAR_TAB_NAMES()

  const { t } = useTranslation()
  const {
    zoomIn,
    zoomOut,
    resetScale,
    scale,
    downloadDocument,
    pdfCitation,
    pdfViewing,
    setPdfViewing,
    outline,
    screenWidth,
  } = useDocumentContext()
  const { theme, setTheme, shareFunction, homeFunction, setShowIntro } =
    useViewerContext()

  const handleModeChange = () => {
    if (theme === 'light') {
      setTheme('dark')
      document.getElementById('evilFlowersViewer')?.classList.add('dark')
    } else {
      setTheme('light')
      document.getElementById('evilFlowersViewer')?.classList.remove('dark')
    }
  }

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
          className={
            homeFunction ? 'viewer-button-icon' : 'viewer-button-icon-deactive'
          }
        />
      ),
      tooltipText: homeFunction ? t('homeToolTip') : t('homeNoneToolTip'),
      onClick: () => (homeFunction ? homeFunction() : null),
    },
    // SEARCH
    {
      name: t('search'),
      icon: <BiSearch className={'viewer-button-icon'} />,
      tooltipText: t('fullTextSearch'),
      onClick: () => {
        setActiveSidebar(
          activeSidebar === SIDEBAR_TABS.SEARCH
            ? SIDEBAR_TABS.NULL
            : SIDEBAR_TABS.SEARCH
        )
      },
    },
    // TOC
    {
      name: t('toc'),
      icon: (
        <BiMenuAltLeft
          className={
            outline && outline.length
              ? 'viewer-button-icon'
              : 'viewer-button-icon-deactive'
          }
        />
      ),
      tooltipText:
        outline && outline.length ? t('tocToolTip') : t('tocNoneToolTip'),
      onClick: () => {
        outline && outline.length ? setTocVisibility(true) : null
        setActiveSidebar(SIDEBAR_TABS.NULL)
      },
    },
    // PEN
    // {
    //   name: t('pen'),
    //   icon: (
    //     <BiPencil
    //       className={'w-[24px] h-[24px] text-gray-500 dark:text-gray-300'}
    //     />
    //   ),
    //   tooltipText: t('penToolTip'),
    //   onClick: () =>
    //     setActiveSidebar(
    //       activeSidebar === SIDEBAR_TABS.PEN
    //         ? SIDEBAR_TABS.NULL
    //         : SIDEBAR_TABS.PEN
    //     ),
    // },
    // CITATION
    {
      name: t('citations'),
      icon: (
        <RxQuote
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
    // SHARE
    {
      name: t('share'),
      icon: (
        <RxShare2
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
      icon: <BiInfoCircle className={'viewer-button-icon'} />,
      tooltipText: t('infoToolTip'),
      onClick: () =>
        setActiveSidebar(
          activeSidebar === SIDEBAR_TABS.INFO
            ? SIDEBAR_TABS.NULL
            : SIDEBAR_TABS.INFO
        ),
    },
    // DOWNLOAD
    {
      name: t('download'),
      icon: <BiDownload className={'viewer-button-icon'} />,
      tooltipText: t('downloadToolTip'),
      onClick: () => {
        downloadDocument()
        setActiveSidebar(SIDEBAR_TABS.NULL)
      },
    },
    // HELP
    {
      name: t('help'),
      icon: <BiHelpCircle className={'viewer-button-icon'} />,
      tooltipText: t('help'),
      onClick: () => {
        setShowIntro(true)
      },
    },
    // THEME
    {
      name: t(''),
      icon:
        theme === 'light' ? (
          <BiSun className={'viewer-button-icon'} />
        ) : (
          <BiMoon className={'viewer-button-icon'} />
        ),
      tooltipText: theme === 'light' ? t('lightMode') : t('darkMode'),
      onClick: () => {
        handleModeChange()
      },
    },
    // ZOOM IN
    {
      name: t(''),
      icon: <BiZoomIn className={'viewer-button-icon'} />,
      tooltipText: t('zoomIn'),
      onClick: () => {
        zoomIn()
      },
    },
    // ZOOM OUT
    {
      name: t(''),
      icon: <BiZoomOut className={'viewer-button-icon'} />,
      tooltipText: t('zoomOut'),
      onClick: () => {
        zoomOut()
      },
    },
    // RESET ZOOM
    {
      name: t(''),
      icon: <TbZoomReplace className={'viewer-button-icon'} />,
      tooltipText: t('resetZoom'),
      onClick: () => {
        resetScale()
      },
    },
  ]

  return (
    <>
      <Sidebar
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
      </Sidebar>
      <div className={'menu-container'}>
        {SidebarItems.slice(0, SidebarItems.length - 3).map((item, i) => (
          <div className={'menu-buttons-container'} key={i}>
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
        {screenWidth > 959 && (
          <div className="menu-pdf-viewing-button-container">
            <Tooltip
              title={
                pdfViewing === 'paginator' ? t('pdfUpDown') : t('pdfLeftRight')
              }
              placement="right"
            >
              <div
                onClick={() =>
                  setPdfViewing(
                    pdfViewing === 'paginator' ? 'scroll' : 'paginator'
                  )
                }
                className={'viewer-button'}
              >
                {pdfViewing === 'paginator' ? (
                  <PiCaretUpDownBold className={'viewer-button-icon'} />
                ) : (
                  <LuChevronsLeftRight className={'viewer-button-icon'} />
                )}
              </div>
            </Tooltip>
          </div>
        )}
        <div className="menu-zoom-buttons-container">
          {SidebarItems.slice(SidebarItems.length - 3).map((item, i) => (
            <div className={'menu-buttons-container'} key={i}>
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
          <span className={'menu-scale-percentage'}>{scale * 100}%</span>
        </div>
      </div>
      {citationVisibile && (
        <Citations setCitationVisible={setCitationVisible} />
      )}
      {shareQRVisibility && (
        <ShareQRCode setShareQRVisibility={setShareQRVisibility} link={link} />
      )}
      {tocVisibility && <Outline setTocVisibility={setTocVisibility} />}
    </>
  )
}

export default Menu
