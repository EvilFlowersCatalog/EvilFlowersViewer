import { ReactNode, KeyboardEvent, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../common/Button'

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
  onClose?: () => void
  onClick?: () => void
  icon?: React.ReactElement<any, any> | null
  children: ReactNode
  title: string
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
  title,
}: Props) => {
  const { t } = useTranslation()
  const ref: any = useRef(null)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose && onClose()
    }
  }

  // Focus on container
  useEffect(() => {
    ref.current.focus()!
  }, [])

  return (
    <>
      {isOpen && (
        <div
          className="fixed overflow-hidden h-full inset-0 flex justify-center items-center z-20"
          ref={ref}
          onKeyDown={onKeyDown}
          tabIndex={-1}
        >
          {/* Container for hiding after click */}
          <div
            className="absolute flex left-0 right-0 bottom-0 top-0 justify-center items-center bg-black bg-opacity-80"
            onClick={onClose}
          ></div>
          {/* Container for modal */}
          <div className="relative z-30 flex min-w-[200px] w-5/6 px-2.5 md:w-2/3 lg:w-1/2 xl:w-1/3 max-h-[70%] flex-col overflow-hidden py-8 md:px-12 rounded-md bg-white dark:bg-gray-dark-strong">
            <h4 className="text-xl font-extrabold uppercase mb-5 w-full text-center">
              {title}
            </h4>
            {children}
            <div className="w-full flex justify-end items-center gap-2.5 mt-7">
              {label && (
                <button
                  className="text-sm flex justify-center items-center py-1 px-2.5 rounded-md border-none bg-blue-dark hover:bg-blue-light text-white gap-4 cursor-pointer"
                  onClick={onClick}
                >
                  {label} {icon}
                </button>
              )}
              {onClose && <Button icon={t('close')} onClick={onClose} />}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ModalWrapper
