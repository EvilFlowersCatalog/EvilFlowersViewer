import { ReactNode, useState } from 'react'
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
          className={cx('tool-tip-container', {
            'tool-tip-container-visible': visible,
            'tool-tip-container-hidden': !visible,
            'tool-tip-right': placement === 'right',
            'tool-tip-left': placement === 'left',
            'tool-tip-top': placement === 'top',
            'tool-tip-bottom': placement === 'bottom',
          })}
        >
          <span className={'tool-tip-text'}>{title}</span>
        </div>
      )}
      {children}
    </div>
  )
}

export default Tooltip
