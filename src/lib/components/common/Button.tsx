import { ReactNode } from 'react'
import Tooltip from '../helpers/Tooltip'

interface IButtonProps {
  onClick?: () => void
  icon: ReactNode
  toolTip?: {
    text: string
    position: 'left' | 'right' | 'top'
  }
}

const Button = ({
  onClick,
  icon,
  toolTip = { text: '', position: 'top' },
}: IButtonProps) => {
  return (
    <Tooltip title={toolTip.text} placement={toolTip.position}>
      <div
        onClick={onClick}
        className={
          'efw-py-1 efw-px-2 efw-flex efw-items-center efw-justify-center efw-cursor-pointer efw-outline-none efw-border-none efw-rounded-md efw-bg-transparent hover:efw-bg-gray-light dark:hover:efw-bg-gray-dark-medium'
        }
      >
        {icon}
      </div>
    </Tooltip>
  )
}

export default Button
