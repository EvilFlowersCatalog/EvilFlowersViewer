import { useTranslation } from 'react-i18next'
import Tooltip from '../helpers/Tooltip'
import { useDocumentContext } from '../document/DocumentContext'
import { BiMenu, BiZoomIn, BiZoomOut } from 'react-icons/bi'
import { TbZoomReplace } from 'react-icons/tb'
import { AiOutlineClose } from 'react-icons/ai'

const Header = () => {
  const { t } = useTranslation()
  const { zoomIn, zoomOut, resetScale, scale, menu, setMenu } =
    useDocumentContext()

  return (
    <div
      className="fixed flex z-10 items-center justify-between top-0 left-0 right-0 bg-gray-50 dark:bg-gray-800"
      style={{ height: '50px' }}
    >
      <div className={'relative flex gap-2'} style={{ marginLeft: '25px' }}>
        <Tooltip
          title={!menu ? t('menuToolTip') : t('menuCloseToolTip')}
          placement="right"
        >
          <div
            onClick={() => setMenu(!menu)}
            className={
              'hover:bg-gray-200 hover:dark:bg-gray-900 py-1 px-3 border-none cursor-pointer duration-200 rounded-md flex items-center'
            }
          >
            {!menu ? (
              <BiMenu
                className={'w-[24px] h-[24px] text-gray-500 dark:text-gray-300'}
              />
            ) : (
              <AiOutlineClose
                className={'w-[24px] h-[24px] text-gray-500 dark:text-gray-300'}
              />
            )}
          </div>
        </Tooltip>
      </div>
      {/* ZOOM BUTTONS */}
      <div
        className={'relative flex items-center justify-center gap-1'}
        style={{ marginRight: '30px' }}
      >
        <Tooltip title={t('zoomIn')} placement="bottom">
          <div
            onClick={zoomIn}
            className={
              'hover:bg-gray-200 hover:dark:bg-gray-900 p-1 border-none cursor-pointer duration-200 rounded-md flex items-center'
            }
          >
            <BiZoomIn
              className={'w-[24px] h-[24px] text-gray-500 dark:text-gray-300'}
            />
          </div>
        </Tooltip>
        <Tooltip title={t('zoomOut')} placement="bottom">
          <div
            onClick={zoomOut}
            className={
              'hover:bg-gray-200 hover:dark:bg-gray-900 p-1 border-none cursor-pointer duration-200 rounded-md flex items-center'
            }
          >
            <BiZoomOut
              className={'w-[24px] h-[24px] text-gray-500 dark:text-gray-300'}
            />
          </div>
        </Tooltip>
        <Tooltip title={t('resetZoom')} placement="bottom">
          <div
            onClick={resetScale}
            className={
              'hover:bg-gray-200 hover:dark:bg-gray-900 p-1 border-none cursor-pointer duration-200 rounded-md flex items-center'
            }
          >
            <TbZoomReplace
              className={'w-[24px] h-[24px] text-gray-500 dark:text-gray-300'}
            />
          </div>
        </Tooltip>
        <span
          className={
            'text-sm text-center font-bold rounded-2 text-gray-500 dark:text-gray-300'
          }
          style={{ marginLeft: '10px' }}
        >
          {scale * 100}%
        </span>
      </div>
    </div>
  )
}

export default Header
