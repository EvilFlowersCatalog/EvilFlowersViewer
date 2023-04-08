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
            'tooltip absolute -top-6 -translate-x-1/3 bg-gray-50 shadow-md px-2 py-1 text-xs rounded-md border border-gray-200 border-solid duration-200 pointer-events-none',
            {
              'opacity-100 scale-100': visible,
              'opacity-0 scale-95': !visible,
              'right left-24 top-0': placement === 'right',
              'left right-0 top-0': placement === 'left',
            }
          )}
        >
          <span className={'text-gray-600 font-semibold w-max inline-block'}>
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  )
}

export default Tooltip
