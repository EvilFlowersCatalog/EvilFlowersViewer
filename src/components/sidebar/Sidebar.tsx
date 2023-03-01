import React from 'react'

import { SidebarData } from './SidebarData'


const Sidebar: React.FunctionComponent = () => {
    return (
        <>

            <div className="w-15 h-screen bg-blue-200 fixed top-0 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50">

                {SidebarData.map((item, index) => {
                    return (
                        <div className={"list-none flex items-center w-full h-90 px-2 py-5 "}>
                            <button id={item.path} className={`px-5 py-2 text-lg text-white bg-blue-200 rounded-md hover:bg-blue-500 ${item.path === '/' ? 'mb-16' : 'mb-2'}`}>
                                {item.icon}
                            </button>

                        </div>
                    )
                })}
            </div>
        </>
    )
}
export default Sidebar