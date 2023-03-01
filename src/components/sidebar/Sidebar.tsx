import React from 'react'

import { SidebarData } from './SidebarData'

import { useState } from 'react'

const Sidebar: React.FunctionComponent = () => {
    const [close, setClose] = useState(false)
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

//to={item.path} 
/*
const SidebarMenu = styled.div`
    width: 80px;
    height: 100vh;
    background-color: #9EDCFF;
    position: fixed;
    top: 0;
    transition: .6s;
`

const MenuItems = styled.li`
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: start;
    width: 100%;
    height: 90px;
    padding: 1rem 0 1.25rem;
`

const MenuItemLinks = styled.div`
    display: flex;
    align-items: center;
    padding: 0 2rem;
    font-size: 20px;
    text-decoration: none;
    margin-bottom: ${props => props.to === "/" ? "1.5em" : ""};
    color: #ffffff;
    

    &:hover {
        background-color: #ffffff;
        color: #000080;
        width: 100%;
        height: 45px;
        width:
        text-align: center;
        border-radius: 5px;
    }
`
*/
export default Sidebar