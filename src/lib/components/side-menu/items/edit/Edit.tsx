import { useEffect, useState } from 'react'
import { GoPencil } from 'react-icons/go'
import { PiHighlighterCircleFill } from 'react-icons/pi'
import { IoText } from 'react-icons/io5'
import { FiCircle, FiSquare } from 'react-icons/fi'
import { RgbaColorPicker } from 'react-colorful'
import { LuRectangleHorizontal } from 'react-icons/lu'
import { HiOutlineMinus } from 'react-icons/hi'
import { HiOutlinePaintBrush } from 'react-icons/hi2'

/**
 * Shows the sidebar component for annotation creation
 * @returns - The sidebar component for annotation creation
 */
const Edit = () => {
  const [active, setActive] = useState<string | null>()
  const [color, setColor] = useState({ r: 0, g: 0, b: 0, a: 1 })
  const [editButtons, setEditButtons] = useState<
    { icon: JSX.Element; name: string; active: boolean }[]
  >([
    {
      name: 'pencil',
      icon: <GoPencil className="viewer-button-icon" />,
      active: true,
    },
    {
      name: 'brush',
      icon: <HiOutlinePaintBrush className="viewer-button-icon" />,
      active: false,
    },
    {
      name: 'highlighter',
      icon: <PiHighlighterCircleFill className="viewer-button-icon" />,
      active: false,
    },
    {
      name: 'text',
      icon: <IoText className="viewer-button-icon" />,
      active: false,
    },
    {
      name: 'line',
      icon: <HiOutlineMinus className="viewer-button-icon" />,
      active: false,
    },
    {
      name: 'circle',
      icon: <FiCircle className="viewer-button-icon" />,
      active: false,
    },
    {
      name: 'rectangle',
      icon: <LuRectangleHorizontal className="viewer-button-icon" />,
      active: false,
    },
    {
      name: 'square',
      icon: <FiSquare className="viewer-button-icon" />,
      active: false,
    },
  ])

  useEffect(() => {
    const updatedEditButtons = editButtons.map((item) => ({
      ...item,
      active: item.name === active,
    }))
    setEditButtons(updatedEditButtons)
  }, [active])

  return (
    <div className="edit-container">
      <div className="edit-buttons-container">
        {editButtons.map((item, index) => (
          <div
            key={index}
            className="viewer-button"
            style={
              item.active
                ? { border: '1px solid var(--text-color)' }
                : { border: '1px solid transparent' }
            }
            onClick={() => setActive(item.name)}
          >
            {item.icon}
          </div>
        ))}
      </div>
      <div className="edit-changers-container">
        <RgbaColorPicker color={color} onChange={setColor} />
      </div>
    </div>
  )
}
export default Edit
