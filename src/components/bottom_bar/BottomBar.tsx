import { useState } from 'react'

const BottomBar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(true)

  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState)
  }

  let pagePreviews = 7

  return (
    <div className="flex flex-col items-center justify-center bg-blue-300 py-5">
      <div className="flex justify-between items-center w-full mb-4 px-10">
        <button
          className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg focus:outline-none"
          onClick={toggleDropdown}
        >
          Sipka dole
        </button>
        <div className="text-white">
          Page <input className="w-8 bg-gray-200 text-black pl-2"></input> of 20
        </div>
      </div>
      {isDropdownOpen && (
        <div className="flex items-center justify-center bg-blue-200 p-3 rounded-lg">
          <button className="bg-gray-200 mr-8 p-3 rounded-lg w-20 focus:outline-none">
            Previous
          </button>
          {Array.from({ length: pagePreviews }).map((_, index) => (
            <div key={index} className="h-20 w-12 bg-white mr-4"></div>
          ))}
          <button className="ml-4 p-3 bg-gray-200 hover:bg-sky-700 rounded-lg w-20 focus:outline-none">
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default BottomBar
