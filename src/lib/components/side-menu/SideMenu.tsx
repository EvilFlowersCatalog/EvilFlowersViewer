import { useTranslation } from 'react-i18next'
import { useDocumentContext } from '../hooks/useDocumentContext'
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
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai'
import { SIDEBAR_TABS, SIDEBAR_TAB_NAMES } from '../../../utils/enums'
import { useEffect, useState } from 'react'
import { RxQuote, RxShare2 } from 'react-icons/rx'
import Citations from './items/Citations'
import ShareQRCode from './items/share/ShareQRCode'
import Toc from './items/Toc'
import SideBar from './SideBar'
import Search from './items/search/Search'
import Info from './items/Info'
import Share from './items/share/Share'
import useViewerContext from '../hooks/useViewerContext'
import Button from '../common/Button'
import Layers from './items/layers/Layers'
import { RiPrinterLine } from 'react-icons/ri'
import { useParams } from 'react-router-dom'

const SideMenu = () => {
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
    printDocument,
    scale,
    umamiTrack,
  } = useDocumentContext()
  const { theme, shareFunction, homeFunction, setShowHelp, config } =
    useViewerContext()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [link, setLink] = useState<string>('')
  const sidebarNames = SIDEBAR_TAB_NAMES()
  const [shareQRVisibility, setShareQRVisibility] = useState<boolean>(false)
  const { 'entry-id': entryId } = useParams()

  // When sidebar change
  useEffect(() => {
    if (activeSidebar === SIDEBAR_TABS.NULL) {
      setSidebarOpen(false)
    } else {
      setSidebarOpen(true)
    }
  }, [activeSidebar])

  const SideMenuItems = [
    // HOME
    homeFunction
      ? {
          name: t('home'),
          icon: <BiHome id="menu-home" size={23} />,
          tooltipText: t('homeToolTip'),
          onClick: () => {
            umamiTrack('Viewer Home Button')
            homeFunction()
          },
        }
      : null,
    // EDIT
    // editPackage && config.edit
    //   ? {
    //       name: t('groups'),
    //       icon: <IoLayersOutline id="menu-edit" size={23} />,
    //       tooltipText: t('layers'),
    //       onClick: () =>{
    //         umamiTrack('Viewer Edit Button')
    //         setActiveSidebar(
    //           activeSidebar === SIDEBAR_TABS.LAYERS
    //             ? SIDEBAR_TABS.NULL
    //             : SIDEBAR_TABS.LAYERS
    //         )}
    //     }
    //   : null,
    // SEARCH
    {
      name: t('search'),
      icon: <BiSearch id="menu-search" size={23} />,
      tooltipText: t('fullTextSearch'),
      onClick: () => {
        umamiTrack('Viewer Search Button')
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
          icon: <RxQuote id="menu-citation" size={23} />,
          tooltipText: t('citationsToolTip'),
          onClick: () => {
            umamiTrack('Viewer Citation Button', { entryId })

            setCitationVisible(true)
            setActiveSidebar(SIDEBAR_TABS.NULL)
          },
        }
      : null,
    // TOC
    TOC && TOC.length > 0
      ? {
          name: t('toc'),
          icon: <BiMenuAltLeft id="menu-toc" size={23} />,
          tooltipText: t('tocToolTip'),
          onClick: () => {
            umamiTrack('Viewer TOC Button')

            setTocVisibility(true)
            setActiveSidebar(SIDEBAR_TABS.NULL)
          },
        }
      : null,
    // SHARE
    shareFunction && config.share
      ? {
          name: t('share'),
          icon: <RxShare2 id="menu-share" size={23} />,
          tooltipText: t('shareToolTip'),
          onClick: () => {
            umamiTrack('Viewer Share Button', { entryId })

            setActiveSidebar(
              activeSidebar === SIDEBAR_TABS.SHARE
                ? SIDEBAR_TABS.NULL
                : SIDEBAR_TABS.SHARE
            )
          },
        }
      : null,
    // INFO
    {
      name: t('info'),
      icon: <BiInfoCircle id="menu-info" size={23} />,
      tooltipText: t('infoToolTip'),
      onClick: () => {
        umamiTrack('Viewer Info Button')

        setActiveSidebar(
          activeSidebar === SIDEBAR_TABS.INFO
            ? SIDEBAR_TABS.NULL
            : SIDEBAR_TABS.INFO
        )
      },
    },
    // HELP
    {
      name: t('help'),
      icon: <BiHelpCircle id="menu-help" size={23} />,
      tooltipText: t('help'),
      onClick: () => {
        umamiTrack('Viewer Help Button')

        setShowHelp(true)
      },
    },
    // THEME
    {
      name: t(''),
      icon:
        theme === 'light' ? (
          <BiSun id="menu-theme" size={23} />
        ) : (
          <BiMoon id="menu-theme" size={23} />
        ),
      tooltipText: theme === 'light' ? t('lightMode') : t('darkMode'),
      onClick: () => {
        umamiTrack('Viewer Theme Button', { theme })

        handleModeChange()
      },
    },
    // DOWNLOAD
    config.download
      ? {
          name: t('download'),
          icon: <BiDownload id="menu-download" size={23} />,
          tooltipText: t('downloadToolTip'),
          onClick: () => {
            umamiTrack('Viewer Download Button', { entryId })

            downloadDocument()
            setActiveSidebar(SIDEBAR_TABS.NULL)
          },
        }
      : null,
    // PRINT
    config.print
      ? {
          name: t('print'),
          icon: <RiPrinterLine id="menu-download" size={23} />,
          tooltipText: t('printToolTip'),
          onClick: () => {
            umamiTrack('Viewer Print Button', { entryId })

            printDocument()
            setActiveSidebar(SIDEBAR_TABS.NULL)
          },
        }
      : null,
    // ZOOM IN
    {
      name: t(''),
      icon: <AiOutlinePlus id="menu-zoom-in" size={23} />,
      tooltipText: t('zoomIn'),
      onClick: () => {
        // updated value
        scale < 3 &&
          umamiTrack('Viewer Zoom in Button', {
            scale,
          })

        zoomIn()
      },
    },
    // ZOOM OUT
    {
      name: t(''),
      icon: <AiOutlineMinus id="menu-zoom-out" size={23} />,
      tooltipText: t('zoomOut'),
      onClick: () => {
        scale > 0.25 &&
          umamiTrack('Viewer Zoom out Button', {
            scale,
          })

        zoomOut()
      },
    },
  ]

  return (
    <>
      {/* Sidebar container */}
      <SideBar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        setSidebar={setActiveSidebar}
        title={sidebarNames[activeSidebar]}
      >
        {activeSidebar === SIDEBAR_TABS.SEARCH && <Search />}
        {activeSidebar === SIDEBAR_TABS.LAYERS && <Layers />}
        {activeSidebar === SIDEBAR_TABS.INFO && <Info />}
        {activeSidebar === SIDEBAR_TABS.SHARE && (
          <Share
            setLink={setLink}
            setShareQRVisibility={setShareQRVisibility}
          />
        )}
      </SideBar>
      <div
        className={`efw-relative efw-w-[50px] efw-flex efw-justify-start efw-items-center efw-flex-col efw-py-2 efw-bg-white dark:efw-bg-gray-dark-strong efw-z-10 efw-gap-1`}
      >
        {/* Sidemenu items */}
        {SideMenuItems.filter((item) => item !== null).map((item, i) => (
          <Button
            key={i}
            onClick={item!.onClick}
            icon={item!.icon}
            toolTip={{ text: item!.tooltipText, position: 'right' }}
          />
        ))}
      </div>
      {/* Modal for citation */}
      {citationVisibile && (
        <Citations setCitationVisible={setCitationVisible} />
      )}
      {/* Modal for qrcode share */}
      {shareQRVisibility && (
        <ShareQRCode setShareQRVisibility={setShareQRVisibility} link={link} />
      )}
      {/* Modal for TOC */}
      {tocVisibility && <Toc setTocVisibility={setTocVisibility} />}
    </>
  )
}

export default SideMenu
