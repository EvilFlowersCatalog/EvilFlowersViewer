import { ReactNode } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import { useTranslation } from 'react-i18next'

/**
 * ModalWrapper
 * @param label - Label of the caller button
 * @param isOpen - Is the modal open?
 * @param onClose - Function to close the modal
 * @param children - Children of the modal
 * @constructor
 * @returns {JSX.Element}
 *
 */
type Props = {
  label?: string | null
  isOpen: boolean
  onClose: () => void
  onClick?: () => void
  icon?: React.ReactElement<any, any> | null
  children: ReactNode
}

/**
 *
 * @param label - Label of the caller button
 * @param isOpen - Is the modal open?
 * @param onClose - Function to close the modal
 * @param children - Children of the modal
 *
 * @returns Modal window based on the label from props
 */
const ModalWrapper = ({
  label = null,
  isOpen,
  onClose,
  onClick,
  children,
  icon = null,
}: Props) => {
  const { t } = useTranslation()
  return (
    <>
      {isOpen && (
        <div className="fixed z-20 inset-0 overflow-none">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity bg-black dark:bg-grey opacity-80"></div>
            <div className="relative z-30 opacity-100 inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-50 dark:bg-gray-800 shadow-lg rounded-lg">
              <div className="absolute top-0 right-0 pt-4 pr-4"></div>
              <div className="mt-2">{children}</div>
              <div className="mt-4 flex justify-end">
                {label && (
                  <button
                    className="inline-flex justify-center items-center py-2 px-4 border-none shadow-sm text-sm font-medium rounded-md text-gray-100 bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                    style={{ cursor: 'pointer' }}
                    onClick={onClick}
                  >
                    {label} {icon}
                  </button>
                )}
                <button
                  className="inline-flex justify-center py-2 px-4 bg-transparent border-none hover:bg-gray-300 dark:hover:bg-gray-900 rounded text-gray-900 dark:text-gray-200 text-center duration-200"
                  style={{ cursor: 'pointer' }}
                  onClick={onClose}
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ModalWrapper
