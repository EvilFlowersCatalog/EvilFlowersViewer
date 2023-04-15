import React, { useContext, useEffect } from 'react'
import { useState } from 'react'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'

//utils
import { SIDEBAR_TABS, SIDEBAR_TAB_NAMES } from '../../../utils/enums'

// icons
import { ReactComponent as SearchIcon } from '../../../assets/icons/search.svg'
import { ReactComponent as DownloadIcon } from '../../../assets/icons/download.svg'
import { ReactComponent as InfoIcon } from '../../../assets/icons/info-circle.svg'
import { ReactComponent as QuoteIcon } from '../../../assets/icons/quote.svg'
import { ReactComponent as ShareIcon } from '../../../assets/icons/share-2.svg'
import { ReactComponent as PencilIcon } from '../../../assets/icons/pencil.svg'
import { ReactComponent as SunIcon } from '../../../assets/icons/sun.svg'
import { ReactComponent as MoonIcon } from '../../../assets/icons/moon.svg'

// components
import Home from './Home'
import Search from './Search'
import Pen from './Pen'
import Citations from './Citations'
import Share from './Share'
import Info from './Info'
import Download from './Download'
import Tooltip from '../helpers/Tooltip'
import Sidebar from './Sidebar'

interface IToolsProps {
  [x: string]: any
  config: any
}

/**
 * The sidebar component
 *
 * @returns - Sidebar component
 */
const Tools = (config: IToolsProps) => {
  const { t } = useTranslation()
  const [activeSidebar, setActiveSidebar] = useState<SIDEBAR_TABS>(
    SIDEBAR_TABS.NULL
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [mode, setMode] = useState<'light' | 'dark'>(
    localStorage.theme ?? 'light'
  )
  const sidebarNames = SIDEBAR_TAB_NAMES()

  const modaButton = config.modeButton ? config.modeButton : true

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

  const handleModeChange = () => {
    if (mode === 'light') {
      localStorage.theme = 'dark'
      setMode('dark')
      document.getElementById('evilFlowersViewer')?.classList.add('dark')
    } else {
      localStorage.theme = 'light'
      setMode('light')
      document.getElementById('evilFlowersViewer')?.classList.remove('dark')
    }
  }

  const SidebarItems = [
    {
      name: 'search',
      icon: (
        <SearchIcon
          className={cx('duration-200', {
            'stroke-gray-800 dark:stroke-gray-200':
              activeSidebar === SIDEBAR_TABS.SEARCH,
            'stroke-gray-500 dark:stroke-gray-300':
              activeSidebar !== SIDEBAR_TABS.SEARCH,
          })}
        />
      ),
      tooltipText: t('fullTextSearch'),
      onClick: () => {
        setActiveSidebar(SIDEBAR_TABS.SEARCH)
      },
      config: config.searchButton ? config.searchButton : true,
    },
    {
      name: 'pen',
      icon: <PencilIcon className={'stroke-gray-500 dark:stroke-gray-300'} />,
      tooltipText: 'Document editing',
      onClick: () => setActiveSidebar(SIDEBAR_TABS.PEN),
      config: config.penButton ? config.penButton : true,
    },
    {
      name: 'citations',
      icon: <QuoteIcon className={'stroke-gray-500 dark:stroke-gray-300'} />,
      tooltipText: 'Generate citations',
      onClick: () => setActiveSidebar(SIDEBAR_TABS.CITATIONS),
      config: config.citationsButton ? config.citationsButton : true,
    },
    {
      name: 'share',
      icon: <ShareIcon className={'stroke-gray-500 dark:stroke-gray-300'} />,
      tooltipText: 'Share document',
      onClick: () => setActiveSidebar(SIDEBAR_TABS.SHARE),
      config: config.shareButton ? config.shareButton : true,
    },
    {
      name: 'info',
      icon: <InfoIcon className={'stroke-gray-500 dark:stroke-gray-300'} />,
      tooltipText: 'Document information',
      onClick: () => setActiveSidebar(SIDEBAR_TABS.INFO),
      config: config.infoButton ? config.infoButton : true,
    },
    {
      name: 'download',
      icon: <DownloadIcon className={'stroke-gray-500 dark:stroke-gray-300'} />,
      tooltipText: 'Download document',
      onClick: () => setDownloadOpen(true),
      config: config.downloadButton ? config.downloadButton : true,
    },
  ]

  const editSidebarItems = () => {
    SidebarItems.forEach((item, i) => {
      if (item.config === false) {
        SidebarItems.splice(i, 1)
      }
    })
  }

  editSidebarItems()

  return (
    <>
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        title={sidebarNames[activeSidebar]}
      >
        {activeSidebar === SIDEBAR_TABS.SEARCH && <Search />}
        {activeSidebar === SIDEBAR_TABS.SHARE && (
          <Share
            setActiveSidebar={setActiveSidebar}
            text="Some text before share"
            title="Share Title"
          />
        )}
        {activeSidebar === SIDEBAR_TABS.INFO && <Info />}
      </Sidebar>
      <div
        className={cx(
          'fixed top-6 left-6 bg-white dark:bg-gray-800 z-10 rounded-lg shadow-lg flex flex-col gap-2 p-2 duration-200',
          { 'left-6': !sidebarOpen, 'left-64': sidebarOpen }
        )}
      >
        {SidebarItems.map((item, i) => (
          <div className={'relative'} key={i}>
            <Tooltip title={item.tooltipText} placement="right">
              <button
                id={item.name}
                onClick={item.onClick}
                className={
                  'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-900 border-none cursor-pointer duration-200 rounded-md flex items-center'
                }
              >
                {item.icon}
              </button>
            </Tooltip>
          </div>
        ))}
        {modaButton && (
          <div className={'relative mt-8 mb-2'}>
            <Tooltip
              title={mode === 'light' ? t('darkMode') : t('lightMode')}
              placement="right"
            >
              <button
                id={'mode'}
                onClick={handleModeChange}
                className={
                  'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-900 border-none cursor-pointer duration-200 rounded-md flex items-center'
                }
              >
                {mode === 'light' ? (
                  <MoonIcon
                    className={'stroke-gray-500 dark:stroke-gray-300'}
                  />
                ) : (
                  <SunIcon className={'stroke-gray-500 dark:stroke-gray-300'} />
                )}
              </button>
            </Tooltip>
          </div>
        )}
      </div>
      {/* {activeSidebar === SIDEBAR_TABS.HOME && (
        <Home setActiveSidebar={setActiveSidebar} />
      )}
      {activeSidebar === SIDEBAR_TABS.SEARCH && (
        <Search setActiveSidebar={setActiveSidebar} />
      )}
      {activeSidebar === SIDEBAR_TABS.PEN && (
        <Pen setActiveSidebar={setActiveSidebar} />
      )}
      {activeSidebar === SIDEBAR_TABS.CITATIONS && (
        <Citations setActiveSidebar={setActiveSidebar} />
      )}
      {activeSidebar === SIDEBAR_TABS.INFO && (
        <Info setActiveSidebar={setActiveSidebar} />
      )} */}
      <Download
        setOpen={setDownloadOpen}
        open={downloadOpen}
        text="Some text before download"
        title="Download Title"
      />
    </>
  )
}

export default Tools
