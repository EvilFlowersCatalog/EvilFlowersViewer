import { useState } from 'react'
import {
  FaAngleDown,
  FaAngleUp,
  FaAngleRight,
  FaAngleLeft,
} from 'react-icons/fa'
import { useDocumentContext } from '../document/DocumentContext'

const ZoomButton = ({
  icon,
  onClick,
}: {
  icon: string
  onClick: () => void
}) => (
  <button
    className="w-7 h-7 rounded-md shadow-lg text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 focus:outline-none"
    onClick={onClick}
  >
    <i className={icon}></i>
  </button>
)

const ZoomControls = () => {
  const { zoomIn, zoomOut, setScale } = useDocumentContext()

  return (
    <div className="fixed right-200 top-200 flex flex-col gap-4 z-50">
      <ZoomButton icon="fas fa-plus" onClick={zoomIn} />
      <ZoomButton icon="fas fa-minus" onClick={zoomOut} />
      {/* <ZoomButton icon="fas fa-compress" onClick={setScale} /> */}
    </div>
  )
}

export default ZoomControls
