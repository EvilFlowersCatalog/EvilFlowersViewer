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

/**
 * The sidebar component
 *
 * @returns - Sidebar component
 */
const Tools = () => {
  const { t } = useTranslation()
  const [activeSidebar, setActiveSidebar] = useState<SIDEBAR_TABS>(
    SIDEBAR_TABS.NULL
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const sidebarNames = SIDEBAR_TAB_NAMES()

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

  const SidebarItems = [
    {
      name: 'search',
      icon: (
        <SearchIcon
          className={cx('duration-200', {
            'stroke-gray-800': activeSidebar === SIDEBAR_TABS.SEARCH,
            'stroke-gray-500': activeSidebar !== SIDEBAR_TABS.SEARCH,
          })}
        />
      ),
      tooltipText: t('fullTextSearch'),
      // TODO: remove closing sidebar on icon click
      onClick: () => {
        setActiveSidebar(SIDEBAR_TABS.SEARCH)
      },
    },
    {
      name: 'pen',
      icon: <PencilIcon className={'stroke-gray-500'} />,
      tooltipText: 'Document editing',
      onClick: () => setActiveSidebar(SIDEBAR_TABS.PEN),
    },
    {
      name: 'citations',
      icon: <QuoteIcon className={'stroke-gray-500'} />,
      tooltipText: 'Generate citations',
      onClick: () => setActiveSidebar(SIDEBAR_TABS.CITATIONS),
    },
    {
      name: 'share',
      icon: <ShareIcon className={'stroke-gray-500'} />,
      tooltipText: 'Share document',
      onClick: () => setActiveSidebar(SIDEBAR_TABS.SHARE),
    },
    {
      name: 'info',
      icon: <InfoIcon className={'stroke-gray-500'} />,
      tooltipText: 'Document information',
      onClick: () => setActiveSidebar(SIDEBAR_TABS.INFO),
    },
    {
      name: 'download',
      icon: <DownloadIcon className={'stroke-gray-500'} />,
      tooltipText: 'Download document',
      onClick: () => setDownloadOpen(true),
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
        {activeSidebar === SIDEBAR_TABS.SHARE && (
          <Share
            setActiveSidebar={setActiveSidebar}
            text="Some text before share"
            title="Share Title"
          />
        )}
      </Sidebar>
      <div
        className={cx(
          'fixed top-6 left-6 bg-white z-10 rounded-lg shadow-lg flex flex-col gap-2 p-2 duration-200',
          { 'left-6': !sidebarOpen, 'left-64': sidebarOpen }
        )}
      >
        {SidebarItems.map((item) => (
          <div className={'relative'}>
            <Tooltip title={item.tooltipText} placement="right">
              <button
                id={item.name}
                onClick={item.onClick}
                className={
                  'bg-transparent hover:bg-gray-100 border-none cursor-pointer duration-200 rounded-md'
                }
              >
                {item.icon}
              </button>
            </Tooltip>
          </div>
        ))}
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
      {activeSidebar === SIDEBAR_TABS.SHARE && (
        <Share
          setActiveSidebar={setActiveSidebar}
          text="Some text before share"
          title="Share Title"
        />
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
