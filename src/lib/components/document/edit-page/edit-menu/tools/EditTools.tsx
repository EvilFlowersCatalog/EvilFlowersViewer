import { GoPencil } from 'react-icons/go'
import { FiCircle, FiMousePointer, FiSquare } from 'react-icons/fi'
import { LuEraser } from 'react-icons/lu'
import { HiOutlineMinus } from 'react-icons/hi'
import { useEffect, useState } from 'react'
import { useDocumentContext } from '../../../DocumentContext'
import { EDIT_TOOLS } from '../../../../../../utils/enums'

const EditTools = () => {
  const [editButtons, setEditButtons] = useState<
    { icon: JSX.Element; name: EDIT_TOOLS; active: boolean }[]
  >([
    {
      name: EDIT_TOOLS.MOUSE,
      icon: <FiMousePointer className="viewer-button-icon" />,
      active: false,
    },
    {
      name: EDIT_TOOLS.ERASER,
      icon: <LuEraser className="viewer-button-icon" />,
      active: false,
    },
    {
      name: EDIT_TOOLS.PENCIL,
      icon: <GoPencil className="viewer-button-icon" />,
      active: true,
    },
    {
      name: EDIT_TOOLS.LINE,
      icon: <HiOutlineMinus className="viewer-button-icon" />,
      active: false,
    },
    {
      name: EDIT_TOOLS.CIRCLE,
      icon: <FiCircle className="viewer-button-icon" />,
      active: false,
    },
    {
      name: EDIT_TOOLS.SQUARE,
      icon: <FiSquare className="viewer-button-icon" />,
      active: false,
    },
  ])
  const { activeEditTool, setActiveEditTool } = useDocumentContext()

  useEffect(() => {
    setEditButtons(
      editButtons.map((item) => ({
        ...item,
        active: item.name === activeEditTool,
      }))
    )
  }, [activeEditTool])

  return (
    <div className="edit-tools-container">
      {editButtons.map((item, index) => (
        <div
          key={index}
          className="viewer-button"
          style={
            item.active
              ? { border: '2px solid var(--text-color)' }
              : { border: '2px solid transparent' }
          }
          onClick={() => {
            setActiveEditTool(item.name)
          }}
        >
          {item.icon}
        </div>
      ))}
    </div>
  )
}

export default EditTools
