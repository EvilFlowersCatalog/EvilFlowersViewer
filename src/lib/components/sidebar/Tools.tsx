import { ReactNode, useEffect, useState } from 'react'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'
import { useDocumentContext } from '../document/DocumentContext'

//utils
import { SIDEBAR_TABS, SIDEBAR_TAB_NAMES } from '../../../utils/enums'

// icons
import {
  BiDownload,
  BiInfoCircle,
  BiMoon,
  BiPencil,
  BiSearch,
  BiSun,
  BiMenuAltLeft,
  BiHome,
} from 'react-icons/bi'
import { RxQuote, RxShare2 } from 'react-icons/rx'

// components
import Search from './Search'
import Share from './Share'
import Info from './Info'
import Tooltip from '../helpers/Tooltip'
import Sidebar from './Sidebar'
import Citations from './Citations'
import { useViewerContext } from '../ViewerContext'
import ShareQRCode from './ShareQRCode'
import Outline from '../outline/Outline'

interface IZoomButtonProps {
  onClick: () => void
  icon: ReactNode
  tooltipText?: string
}

/**
 * The sidebar component
 *
 * @returns - Sidebar component
 */
const Tools = () => {
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
  const { downloadDocument, pdfCitation, outline, menu } = useDocumentContext()
  const { theme, setTheme, shareFunction, homeFunction } = useViewerContext()

  useEffect(() => {
    if (activeSidebar === SIDEBAR_TABS.NULL) {
      setSidebarOpen(false)
    } else {
      setSidebarOpen(true)
    }
  }, [activeSidebar])

  useEffect(() => {
    if (!sidebarOpen) setActiveSidebar(SIDEBAR_TABS.NULL)
  }, [sidebarOpen])

  useEffect(() => {
    if (!menu) setActiveSidebar(SIDEBAR_TABS.NULL)
  }, [menu])

  const handleModeChange = () => {
    if (theme === 'light') {
      setTheme('dark')
      document.getElementById('evilFlowersViewer')?.classList.add('dark')
    } else {
      setTheme('light')
      document.getElementById('evilFlowersViewer')?.classList.remove('dark')
    }
  }

  // Buttons in tools
  const SidebarItems = [
    // HOME
    {
      name: t('home'),
      icon: (
        <BiHome
          className={
            homeFunction
              ? 'w-[24px] h-[24px] text-gray-500 dark:text-gray-300'
              : 'w-[24px] h-[24px] text-gray-300 dark:text-gray-500'
          }
        />
      ),
      tooltipText: homeFunction ? t('homeToolTip') : t('homeNoneToolTip'),
      onClick: () => (homeFunction ? homeFunction() : null),
    },
    // SEARCH
    {
      name: t('search'),
      icon: (
        <BiSearch
          className={cx('duration-200', {
            'w-[24px] h-[24px] text-gray-800 dark:text-gray-200':
              activeSidebar === SIDEBAR_TABS.SEARCH,
            'w-[24px] h-[24px] text-gray-500 dark:text-gray-300':
              activeSidebar !== SIDEBAR_TABS.SEARCH,
          })}
        />
      ),
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
              ? 'w-[24px] h-[24px] text-gray-500 dark:text-gray-300'
              : 'w-[24px] h-[24px] text-gray-300 dark:text-gray-500'
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
            pdfCitation
              ? 'w-[24px] h-[24px] text-gray-500 dark:text-gray-300'
              : 'w-[24px] h-[24px] text-gray-300 dark:text-gray-500'
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
            shareFunction
              ? 'w-[24px] h-[24px] text-gray-500 dark:text-gray-300'
              : 'w-[24px] h-[24px] text-gray-300 dark:text-gray-500'
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
      icon: (
        <BiInfoCircle
          className={'w-[24px] h-[24px] text-gray-500 dark:text-gray-300'}
        />
      ),
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
      icon: (
        <BiDownload
          className={'w-[24px] h-[24px] text-gray-500 dark:text-gray-300'}
        />
      ),
      tooltipText: t('downloadToolTip'),
      onClick: () => {
        downloadDocument()
        setActiveSidebar(SIDEBAR_TABS.NULL)
      },
    },
  ]

  return (
    <>
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
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
      {menu && (
        <div
          className={cx(
            'fixed left-6 bg-gray-50 dark:bg-gray-800 z-10 rounded-lg shadow-lg flex items-center flex-col duration-200 p-2',
            { 'left-6': !sidebarOpen, 'left-64': sidebarOpen }
          )}
          style={{ top: '66px' }}
        >
          {SidebarItems.map((item, i) => (
            <div className={'relative'} key={i}>
              <Tooltip title={item.tooltipText} placement="right">
                <div
                  id={item.name}
                  onClick={item.onClick}
                  className={
                    'hover:bg-gray-200 hover:dark:bg-gray-900 p-2 border-none cursor-pointer duration-200 rounded-md flex items-center'
                  }
                >
                  {item.icon}
                </div>
              </Tooltip>
            </div>
          ))}
          <div className={'relative mt-4'}>
            <Tooltip
              title={theme === 'light' ? t('lightMode') : t('darkMode')}
              placement="right"
            >
              <div
                id={'mode'}
                onClick={handleModeChange}
                className={
                  'hover:bg-gray-200 dark:hover:bg-gray-900 p-2 border-none cursor-pointer duration-200 rounded-md flex items-center'
                }
              >
                {theme === 'light' ? (
                  <BiSun
                    className={
                      'w-[24px] h-[24px] text-gray-500 dark:text-gray-300'
                    }
                  />
                ) : (
                  <BiMoon
                    className={
                      'w-[24px] h-[24px] text-gray-500 dark:text-gray-300'
                    }
                  />
                )}
              </div>
            </Tooltip>
          </div>
        </div>
      )}
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

export default Tools
