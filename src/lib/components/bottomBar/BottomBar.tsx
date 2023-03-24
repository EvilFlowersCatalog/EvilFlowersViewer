import { useState } from 'react'
// import {
//   FaAngleDown,
//   FaAngleUp,
//   FaAngleRight,
//   FaAngleLeft,
// } from 'react-icons/fa'
import { useDocumentContext } from '../document/DocumentContext'

const BottomBar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(true)
  const { pdf, activePage, prevPage, nextPage, setPage } = useDocumentContext()
  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState)
  }

  let pagePreviews = 7 //temp static value just for now.

  return (
    <div className="flex flex-col items-center justify-center bg-blue-300 py-5 fixed bottom-0 left-0 w-full">
      <div className="flex justify-between items-center w-full mb-4 px-10">
        <div></div>

        <button
          className={`px-5 py-2 text-lg text-black bg-blue-200 rounded-md hover:bg-blue-500`}
          onClick={toggleDropdown}
        >
          {/* {isDropdownOpen ? <FaAngleDown /> : <FaAngleUp />} */}
        </button>
        <div className="text-white">
          <input
            type="text"
            value={activePage}
            pattern="[0-9]*" //fix for only number input
            onChange={setPage}
            className="w-7 bg-gray-200 text-black rounded-md mr-2 pl-2"
          ></input>
          of {pdf?.numPages}
        </div>
      </div>
      {isDropdownOpen && (
        <div className="flex items-center justify-center bg-blue-200 p-3 rounded-lg">
          <button
            className={
              'px-5 py-2 text-lg text-black bg-blue-200 rounded-md hover:bg-blue-500'
            }
            onClick={prevPage}
          >
            {/* <FaAngleLeft /> */}
          </button>
          {Array.from({ length: pagePreviews }).map((_, index) => (
            <div key={index} className="h-20 w-12 bg-white mr-3 ml-3"></div>
          ))}
          <button
            className={
              'px-5 py-2 text-lg text-black bg-blue-200 rounded-md hover:bg-blue-500'
            }
            onClick={nextPage}
          >
            {/* <FaAngleRight /> */}
          </button>
        </div>
      )}
    </div>
  )
}

export default BottomBar
