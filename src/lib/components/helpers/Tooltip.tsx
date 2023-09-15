import { ReactNode, useEffect, useState } from 'react'
import cx from 'classnames'

interface ITooltipProps {
  children: ReactNode
  title?: string
  placement?: 'left' | 'right' | 'top' | 'bottom'
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
          className={cx(
            'tooltip absolute bg-gray-50 dark:bg-gray-800 py-1 px-2 shadow-md text-xs rounded-md border border-gray-200 dark:border-gray-500 border-solid duration-200 pointer-events-none',
            {
              'opacity-100 scale-100': visible,
              'opacity-0 scale-95': !visible,
              'right left-14 top-0': placement === 'right',
              'left right-5 top-0': placement === 'left',
              'bottom-12': placement === 'top',
            }
          )}
          style={{ top: placement === 'bottom' ? '40px' : '', zIndex: 9999 }}
        >
          <span
            className={
              'text-gray-600 dark:text-gray-300 font-semibold w-max max-w-[150px] inline-block'
            }
            style={{ whiteSpace: 'pre-wrap' }}
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
