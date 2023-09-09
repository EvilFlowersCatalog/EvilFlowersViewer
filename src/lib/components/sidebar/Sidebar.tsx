import { ReactNode } from 'react'
import cx from 'classnames'
import Tooltip from '../helpers/Tooltip'

// icons
import { MdKeyboardDoubleArrowLeft } from 'react-icons/md'

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
      className={cx('fixed duration-200 w-64 h-[80vh] z-10 flex', {
        'left-0': open,
        '-left-64': !open,
      })}
    >
      <div className={'bg-gray-50 dark:bg-gray-800 rounded-lg m-6 w-full shadow-lg flex flex-col overflow-auto duration-200'}>
        <div className={'header p-4 flex justify-between'}>
          <span className={'text-gray-700 dark:text-gray-300 font-semibold'}>{title}</span>
          <div className={'relative'}>
            <Tooltip title={t('hidePanel')} placement={'left'}>
              <MdKeyboardDoubleArrowLeft
                className={'ml-auto text-gray-500 w-[20px] h-[20px] dark:text-gray-300 cursor-pointer hover:text-gray-700 dark:hover:text-gray-500 duration-200'}
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
