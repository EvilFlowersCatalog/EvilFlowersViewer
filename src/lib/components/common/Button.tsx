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
          'py-1 px-2 flex items-center justify-center cursor-pointer outline-none border-none rounded-md bg-transparent hover:bg-gray-light dark:hover:bg-gray-dark-medium'
        }
      >
        {icon}
      </div>
    </Tooltip>
  )
}

export default Button
