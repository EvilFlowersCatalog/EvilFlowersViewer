import { ReactNode } from 'react'
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
      className={`efw-absolute efw-top-2.5 efw-h-[calc(100vh-250px)] efw-min-h-96 efw-w-48 md:efw-w-64 efw-bg-white dark:efw-bg-gray-dark-strong efw-rounded-md efw-flex efw-justify-start efw-items-center efw-flex-col efw-overflow-auto efw-p-5 efw-whitespace-pre-wrap efw-z-10 efw-transition-left efw-duration-200',
        ${open ? 'efw-left-[60px]' : '-efw-left-[400px]'}
      `}
    >
      <div className="efw-w-full efw-flex efw-justify-between efw-items-center efw-mb-5">
        {/* Title */}
        <span className={'efw-text-lg efw-font-extrabold efw-uppercase'}>
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
      <div className="efw-w-full efw-flex-1">{children}</div>
    </div>
  )
}

export default SideBar
