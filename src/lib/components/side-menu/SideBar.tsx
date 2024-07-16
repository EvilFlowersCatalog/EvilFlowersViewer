import { ReactNode } from 'react'
import cx from 'classnames'
import Tooltip from '../helpers/Tooltip'
import { useTranslation } from 'react-i18next'

// icons
import { AiOutlineDoubleLeft } from 'react-icons/ai'
import { SIDEBAR_TABS } from '../../../utils/enums'
import Button from '../common/Button'

interface ISidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
  children: ReactNode
  title: ReactNode
  setSidebar: (state: SIDEBAR_TABS) => void
}

const SideBar = ({
  open,
  setOpen,
  children,
  title,
  setSidebar,
}: ISidebarProps) => {
  const { t } = useTranslation()

  return (
    <div
      className={`absolute top-2.5 h-[calc(100vh-250px)] min-h-96 w-48 md:w-64 bg-white dark:bg-gray-dark-strong rounded-md flex justify-start items-center flex-col overflow-auto p-5 whitespace-pre-wrap z-10 transition-left duration-200',
        ${open ? 'left-[60px]' : '-left-[400px]'}
      `}
    >
      <div className="w-full flex justify-between items-center mb-5">
        {/* Title */}
        <span className={'text-lg font-extrabold uppercase'}>
          {(title as string).toLocaleLowerCase() === 'null' ? '' : title}
        </span>
        {/* Close button */}
        <Button
          toolTip={{ text: t('hidePanel'), position: 'left' }}
          onClick={() => {
            setSidebar(SIDEBAR_TABS.NULL)
            setOpen(false)
          }}
          icon={<AiOutlineDoubleLeft size={15} />}
        />
      </div>
      {/* Children container */}
      <div className="w-full flex-1">{children}</div>
    </div>
  )
}

export default SideBar
