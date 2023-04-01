import { useState } from 'react'
// import { FaMinus, FaPlus, FaAlignJustify } from 'react-icons/fa'
import { useDocumentContext } from '../document/DocumentContext'

const ZoomButton = ({
  icon,
  onClick,
}: {
  icon: string
  onClick: () => void
}) => (
  <button //Maybe todo tooltips for buttons
    className="w-9 h-9 px-2 py-2 rounded-md shadow-lg text-black bg-blue-300 hover:bg-blue-600 focus:outline-none"
    onClick={onClick}
  >
    {/* {icon == 'zoomIn' && <FaPlus />}
    {icon == 'zoomOut' && <FaMinus />}
    {icon == 'resetScale' && <FaAlignJustify />} */}
  </button>
)

const ZoomControls = () => {
  const { zoomIn, zoomOut, resetScale, scale } = useDocumentContext()

  return (
    <div className="fixed right-20 bottom-72 flex items-center flex-col gap-1 z-50">
      <ZoomButton icon="zoomIn" onClick={zoomIn} />
      <ZoomButton icon="zoomOut" onClick={zoomOut} />
      <ZoomButton icon="resetScale" onClick={resetScale} />
      <div className="w-16 h-9 py-2 rounded-md shadow-lg text-center bg-white">
        {scale * 100}%
      </div>
    </div>
  )
}

export default ZoomControls
