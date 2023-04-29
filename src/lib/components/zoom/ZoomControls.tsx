import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'

// icons
import { ReactComponent as ZoomIn } from '../../../assets/icons/zoom-in.svg'
import { ReactComponent as ZoomOut } from '../../../assets/icons/zoom-out.svg'
import { ReactComponent as Screen } from '../../../assets/icons/maximize.svg'
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
        'fixed left-6 md:left-64 bottom-6 bg-white dark:bg-gray-800 flex gap-2 p-2 rounded-xl shadow-lg justify-center items-center duration-200 flex-col md:flex-row w-8 md:w-auto'
      }
    >
      <ZoomButton
        onClick={zoomIn}
        tooltipText={t('zoomIn')}
        icon={
          <ZoomIn
            className={cx('duration-200', {
              'stroke-gray-500 dark:stroke-gray-300 hover:stroke-gray-700':
                scale < 2.5,
              'stroke-gray-300 dark:stroke-gray-500': scale >= 2.5,
            })}
          />
        }
      />
      <ZoomButton
        onClick={zoomOut}
        tooltipText={t('zoomOut')}
        icon={
          <ZoomOut
            className={cx('duration-200', {
              'stroke-gray-500 dark:stroke-gray-300 hover:stroke-gray-700':
                scale > 1,
              'stroke-gray-300 dark:stroke-gray-500': scale <= 1,
            })}
          />
        }
      />
      <ZoomButton
        onClick={resetScale}
        tooltipText={t('resetZoom')}
        icon={
          <Screen
            className={
              'stroke-gray-500 dark:stroke-gray-300 hover:stroke-gray-700 duration-200'
            }
          />
        }
      />
      <span
        className={
          'text-sm font-bold p-2 rounded-2 w-12 text-gray-500 dark:text-gray-300 text-center'
        }
      >
        {scale * 100} %
      </span>
    </div>
  )
}

export default ZoomControls
