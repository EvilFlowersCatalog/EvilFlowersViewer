import React from 'react'

import * as FaIcons from 'react-icons/fa'

export const SidebarData = [
  {
    title: 'Home',
    path: '/',
    icon: <FaIcons.FaHome />,
  },
  {
    path: '/tasks',
    icon: <FaIcons.FaSearch />,
  },
  {
    path: '/pen',
    icon: <FaIcons.FaPen />,
  },
  {
    path: '/citations',
    icon: <FaIcons.FaFileExport />,
  },
  {
    path: '/share',
    icon: <FaIcons.FaShareAlt />,
  },
  {
    path: '/info',
    icon: <FaIcons.FaInfoCircle />,
  },
  {
    path: '/download',
    icon: <FaIcons.FaDownload />,
  },
]

const Sidebar: React.FunctionComponent = () => {
  return (
    <>
      <div className="w-15 h-screen bg-blue-200 fixed top-0 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50">
        {SidebarData.map((item) => (
          <div className={'list-none flex items-center w-full h-90 px-2 py-5 '}>
            <button
              id={item.path}
              className={`px-5 py-2 text-lg text-white bg-blue-200 rounded-md hover:bg-blue-500 ${
                item.path === '/' ? 'mb-16' : 'mb-2'
              }`}
            >
              {item.icon}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
export default Sidebar
