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
          className={`absolute flex justify-start items-center py-1.5 px-2.5 rounded-md border border-black dark:border-white z-50 bg-white dark:bg-black pointer-events-none select-none',
            ${visible ? 'opacity-100' : 'opacity-0'}
            ${placement === 'right' ? 'left-14' : ''}
            ${placement === 'left' ? 'right-14' : ''}
            ${placement === 'top' ? 'bottom-10' : ''}`}
        >
          <span className={'text-[12px] w-max text-start max-w-40'}>
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  )
}

export default Tooltip
