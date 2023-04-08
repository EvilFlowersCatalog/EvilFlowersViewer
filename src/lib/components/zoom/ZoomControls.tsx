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
          'bg-transparent border-none padding-4 hover:bg-gray-50 rounded cursor-pointer duration-200'
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
        'fixed left-64 bottom-1/4 bg-white flex gap-2 p-2 rounded-xl shadow-lg justify-center items-center'
      }
    >
      <ZoomButton
        onClick={zoomIn}
        tooltipText={t('zoomIn')}
        icon={
          <ZoomIn
            className={cx('duration-200', {'stroke-gray-500 hover:stroke-gray-700': scale < 2.5, 'stroke-gray-300': scale >= 2.5})}
          />
        }
      />
      <ZoomButton
        onClick={zoomOut}
        tooltipText={t('zoomOut')}
        icon={
          <ZoomOut
            className={cx('duration-200', {'stroke-gray-500 hover:stroke-gray-700': scale > 0.5, 'stroke-gray-300': scale <= 0.5})}
          />
        }
      />
      <ZoomButton
        onClick={resetScale}
        tooltipText={t('resetZoom')}
        icon={
          <Screen
            className={'stroke-gray-500 hover:stroke-gray-700 duration-200'}
          />
        }
      />
      <span
        className={
          'text-sm font-bold p-2 rounded-2 w-12 text-gray-500 text-center'
        }
      >
        {scale * 100} %
      </span>
    </div>
  )
}

export default ZoomControls
