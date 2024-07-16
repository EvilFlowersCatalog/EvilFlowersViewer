import { GoPencil } from 'react-icons/go'
import { FiCircle, FiMousePointer, FiSquare } from 'react-icons/fi'
import { LuEraser } from 'react-icons/lu'
import { HiOutlineMinus } from 'react-icons/hi'
import { useEffect, useState } from 'react'
import { useDocumentContext } from '../../../../hooks/useDocumentContext'
import { EDIT_TOOLS } from '../../../../../../utils/enums'

const EditTools = () => {
  const [editButtons, setEditButtons] = useState<
    { icon: JSX.Element; name: EDIT_TOOLS; active: boolean }[]
  >([
    {
      name: EDIT_TOOLS.MOUSE,
      icon: <FiMousePointer size={23} />,
      active: false,
    },
    {
      name: EDIT_TOOLS.ERASER,
      icon: <LuEraser size={23} />,
      active: false,
    },
    {
      name: EDIT_TOOLS.PENCIL,
      icon: <GoPencil size={23} />,
      active: true,
    },
    {
      name: EDIT_TOOLS.LINE,
      icon: <HiOutlineMinus size={23} />,
      active: false,
    },
    {
      name: EDIT_TOOLS.CIRCLE,
      icon: <FiCircle size={23} />,
      active: false,
    },
    {
      name: EDIT_TOOLS.SQUARE,
      icon: <FiSquare size={23} />,
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
    <div className="grid grid-cols-2 gap-2 h-full">
      {editButtons.map((item, index) => (
        <div
          key={index}
          className={`py-1 px-2 flex items-center justify-center cursor-pointer outline-none border-none rounded-md hover:bg-gray-light dark:hover:bg-gray-dark-medium
            ${
              item.active
                ? 'bg-gray-light dark:bg-gray-dark-medium'
                : 'bg-transparent'
            }`}
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
