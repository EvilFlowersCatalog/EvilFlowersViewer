import React from 'react'
import { useState } from 'react'
import * as FaIcons from 'react-icons/fa'

import Home from './Home'

export const SidebarData = [
  {
    name: 'home',
    icon: <FaIcons.FaHome />,
  },
  {
    name: 'search',
    icon: <FaIcons.FaSearch />,
  },
  {
    name: 'pen',
    icon: <FaIcons.FaPen />,
  },
  {
    name: 'citations',
    icon: <FaIcons.FaFileExport />,
  },
  {
    name: 'share',
    icon: <FaIcons.FaShareAlt />,
  },
  {
    name: 'info',
    icon: <FaIcons.FaInfoCircle />,
  },
  {
    name: 'download',
    icon: <FaIcons.FaDownload />,
  },
]

const Sidebar: React.FunctionComponent = () => {
  const [homeIconClicked, setHomeIconClicked] = useState(false)
  const [searchIconClicked, setSearchIconClicked] = useState(false)
  const [penIconClicked, setPenIconClicked] = useState(false)
  const [citationsIconClicked, setCitationsIconClicked] = useState(false)
  const [shareIconClicked, setShareIconClicked] = useState(false)
  const [infoIconClicked, setInfoIconClicked] = useState(false)
  const [downloadIconClicked, setDownloadIconClicked] = useState(false)

  //function to set all to false and then set the one that was clicked to true
  const setIconsFalse = () => {
    setHomeIconClicked(false)
    setSearchIconClicked(false)
    setPenIconClicked(false)
    setCitationsIconClicked(false)
    setShareIconClicked(false)
    setInfoIconClicked(false)
    setDownloadIconClicked(false)
  }

  const toggleIconClicked = (icon: string) => {
    setIconsFalse()
    switch (icon) {
      case 'home':
        setHomeIconClicked((prevState) => !prevState)
        break
      case 'search':
        setSearchIconClicked((prevState) => !prevState)
        break
      case 'pen':
        setPenIconClicked((prevState) => !prevState)
        break
      case 'citations':
        setCitationsIconClicked((prevState) => !prevState)
        break
      case 'share':
        setShareIconClicked((prevState) => !prevState)
        break
      case 'info':
        setInfoIconClicked((prevState) => !prevState)
        break
      case 'download':
        setDownloadIconClicked((prevState) => !prevState)
        break
      default:
        break
    }
  }

  return (
    <>
      <div className="w-15 h-screen bg-blue-200 fixed top-0 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 z-10">
        {SidebarData.map((item) => (
          <div
            key={item.name}
            className={'list-none flex items-center w-full h-90 px-2 py-5 '}
          >
            <button
              id={item.name}
              className={`px-5 py-2 text-lg text-white bg-blue-200 rounded-md hover:bg-blue-500 ${
                item.name === 'home' ? 'mb-16' : 'mb-2'
              }`}
              onClick={() => toggleIconClicked(item.name)}
            >
              {item.icon}
            </button>
          </div>
        ))}
      </div>
      {homeIconClicked && <Home setHomeIconClicked={setHomeIconClicked} />}
      {searchIconClicked && <div className={'w-60 h-60 bg-red-200'}></div>}
      {penIconClicked && <div className={'w-60 h-60 bg-red-200'}></div>}
      {citationsIconClicked && <div className={'w-60 h-60 bg-red-200'}></div>}
      {shareIconClicked && <div className={'w-60 h-60 bg-red-200'}></div>}
      {infoIconClicked && <div className={'w-60 h-60 bg-red-200'}></div>}
      {downloadIconClicked && <div className={'w-60 h-60 bg-red-200'}></div>}
    </>
  )
}
export default Sidebar
