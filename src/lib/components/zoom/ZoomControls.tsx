import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'

// icons
import { CgZoomIn, CgZoomOut } from 'react-icons/cg'
import { TbZoomReplace } from 'react-icons/tb'
import { useDocumentContext } from '../document/DocumentContext'

// components
import Tooltip from '../helpers/Tooltip'

interface IZoomButtonProps {
  onClick: () => void
  icon: ReactNode
  tooltipText?: string
}

const ZoomButton = ({ onClick, icon, tooltipText }: IZoomButtonProps) => {
  return (
    <Tooltip title={tooltipText}>
      <button
        onClick={onClick}
        className={
          'bg-transparent border-none padding-4 hover:bg-gray-50 dark:hover:bg-gray-900 rounded cursor-pointer duration-200 flex items-center'
        }
      >
        {icon}
      </button>
    </Tooltip>
  )
}

const ZoomControls = () => {
  const { t } = useTranslation()
  const { zoomIn, zoomOut, resetScale, scale } = useDocumentContext()

  return (
    <div
      className={
        'fixed left-6 bottom-10 bg-gray-50 dark:bg-gray-800 flex gap-2 p-2 rounded-xl shadow-lg justify-center items-center duration-200 flex-col md:flex-row md:w-auto'
      }
    >
      <ZoomButton
        onClick={zoomIn}
        tooltipText={t('zoomIn')}
        icon={
          <CgZoomIn
            className={cx('duration-200', {
              'w-[24px] h-[24px] text-gray-500 dark:text-gray-300 hover:text-gray-700':
                scale < 2.5,
              'w-[24px] h-[24px] text-gray-300 dark:text-gray-500': scale >= 2.5,
            })}
          />
        }
      />
      <ZoomButton
        onClick={zoomOut}
        tooltipText={t('zoomOut')}
        icon={
          <CgZoomOut
            className={cx('duration-200', {
              'w-[24px] h-[24px] text-gray-500 dark:text-gray-300 hover:text-gray-700':
                scale > 1,
              'w-[24px] h-[24px] text-gray-300 dark:text-gray-500': scale <= 1,
            })}
          />
        }
      />
      <ZoomButton
        onClick={resetScale}
        tooltipText={t('resetZoom')}
        icon={
          <TbZoomReplace
            className={
              'w-[24px] h-[24px] text-gray-500 dark:text-gray-300 hover:text-gray-700 duration-200'
            }
          />
        }
      />
      <span
        className={
          'text-sm font-bold p-2 rounded-2 w-12 text-gray-500 dark:text-gray-300 text-center'
        }
      >
        {scale * 100 + '%'}
      </span>
    </div>
  )
}

export default ZoomControls
