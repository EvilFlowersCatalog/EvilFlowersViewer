import { ReactNode, useState } from 'react'

interface ITooltipProps {
  children: ReactNode
  title?: string
  placement?: 'left' | 'right' | 'top'
}

const Tooltip = ({ children, title, placement = 'top' }: ITooltipProps) => {
  const [visible, setVisible] = useState(false)

  return (
    <div
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {title && (
        <div
          className={`efw-absolute efw-flex efw-justify-start efw-items-center efw-py-1.5 efw-px-2.5 efw-rounded-md efw-border efw-border-black dark:efw-border-white efw-z-50 efw-bg-white dark:efw-bg-black efw-pointer-events-none efw-select-none',
            ${visible ? 'efw-opacity-100' : 'efw-opacity-0'}
            ${placement === 'right' ? 'efw-left-14' : ''}
            ${placement === 'left' ? 'efw-right-14' : ''}
            ${placement === 'top' ? 'efw-bottom-10' : ''}`}
        >
          <span
            className={'efw-text-[12px] efw-w-max efw-text-start efw-max-w-40'}
          >
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  )
}

export default Tooltip
