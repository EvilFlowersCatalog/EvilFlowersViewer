import { useState } from 'react'
import { SIDEBAR_TABS } from '../../../utils/enums'
import ModalWrapper from '../modal/Modal'

interface IHomeProps {
  setOpen: (open: boolean) => void
  open: boolean
  title: string
  text: string
}

/**
 * Component for document download modal
 *
 * @param param0 - Download component props
 * @param param0.setActiveSidebar - function to set active button in sidebar
 * @param param0.title - title of the modal
 * @param param0.text - text of the modal
 *
 *
 * @returns - Download component
 */
const Download = ({ open, setOpen, title, text }: IHomeProps) => {
  return (
    <div>
      <ModalWrapper
        label="Download"
        isOpen={open}
        onClose={() => setOpen(false)}
      >
        <h2 className="text-lg font-medium leading-6 text-gray-500 dark:text-gray-300">{title}</h2>
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-300">
          <p>{text}</p>
        </div>
      </ModalWrapper>
    </div>
  )
}
export default Download
