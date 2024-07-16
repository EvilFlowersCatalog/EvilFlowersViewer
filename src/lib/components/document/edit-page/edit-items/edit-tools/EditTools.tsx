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
    <div className="efw-grid efw-grid-cols-2 efw-gap-2 efw-h-full">
      {editButtons.map((item, index) => (
        <div
          key={index}
          className={`efw-py-1 efw-px-2 efw-flex efw-items-center efw-justify-center efw-cursor-pointer efw-outline-none efw-border-none efw-rounded-md hover:efw-bg-gray-light dark:hover:efw-bg-gray-dark-medium
            ${
              item.active
                ? 'efw-bg-gray-light dark:efw-bg-gray-dark-medium'
                : 'efw-bg-transparent'
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
