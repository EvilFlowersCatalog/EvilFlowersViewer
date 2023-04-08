import { ReactNode } from 'react'
import cx from 'classnames'
import Tooltip from '../helpers/Tooltip'

// icons
import { ReactComponent as ChevronsLeft } from '../../../assets/icons/chevrons-left.svg'
import { useTranslation } from 'react-i18next'

interface ISidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
  children: ReactNode
  title: ReactNode
}

const Sidebar = ({ open, setOpen, children, title }: ISidebarProps) => {
  const { t } = useTranslation()

  return (
    <div
      className={cx('fixed top-0 duration-200 w-64 h-full z-10 flex', {
        'left-0': open,
        '-left-64': !open,
      })}
    >
      <div
        className={
          'bg-white rounded-lg m-6 w-full shadow-lg flex flex-col overflow-y-scroll'
        }
      >
        <div className={'header p-4 flex justify-between'}>
          <span className={'text-gray-700 font-semibold'}>{title}</span>
          <div className={'relative'}>
            <Tooltip title={t('hidePanel')} placement={'left'}>
              <ChevronsLeft
                className={'ml-auto text-gray-500 cursor-pointer hover:text-gray-700 duration-200'}
                onClick={() => setOpen(false)}
              />
            </Tooltip>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Sidebar
