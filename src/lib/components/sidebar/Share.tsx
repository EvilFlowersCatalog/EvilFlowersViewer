import { useState } from 'react'
import { SIDEBAR_TABS } from '../../../utils/enums'
import ModalWrapper from '../modal/Modal'

interface IShareProps {
  setActiveSidebar: (bool: any) => void
  title: string
  text: string
}

/**
 * Returns the share modal component
 * 
 * @param param0 - props
 * @param param0.setActiveSidebar - function to set sidebar state
 * @param param0.title - title of modal
 * @param param0.text - text of modal
 * 
 * @returns - The share modal component
 */

const Share = ({ setActiveSidebar, title, text }: IShareProps) => {
  const [isOpen, setIsOpen] = useState(true)

  const handleClick = () => {
    setIsOpen(false)
    setActiveSidebar(SIDEBAR_TABS.NULL)
  }

  return (
    <div>
      <ModalWrapper
        label="Share"
        isOpen={isOpen}
        onClose={() => handleClick()}
      >
        <h2 className="text-lg font-medium leading-6 text-gray-900">{title}</h2>
        <div className="mt-3 text-sm text-gray-500">
          <p>{text}</p>
        </div>
      </ModalWrapper>
    </div>
  )
}
export default Share
