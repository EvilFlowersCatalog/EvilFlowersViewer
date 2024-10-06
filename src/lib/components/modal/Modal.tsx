import { ReactNode, KeyboardEvent, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../common/Button'
import { useDocumentContext } from '../hooks/useDocumentContext'

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
  const { umamiTrack } = useDocumentContext()

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
          className="efw-fixed efw-overflow-hidden efw-h-full efw-inset-0 efw-flex efw-justify-center efw-items-center efw-z-20"
          ref={ref}
          onKeyDown={onKeyDown}
          tabIndex={-1}
        >
          {/* Container for hiding after click */}
          <div
            className="efw-absolute efw-flex efw-left-0 efw-right-0 efw-bottom-0 efw-top-0 efw-justify-center efw-items-center efw-bg-black efw-bg-opacity-80"
            onClick={onClose}
          ></div>
          {/* Container for modal */}
          <div className="efw-relative efw-z-30 efw-flex efw-min-w-[200px] efw-w-5/6 efw-px-2.5 md:efw-w-2/3 lg:efw-w-1/2 xl:efw-w-1/3 efw-max-h-[70%] efw-flex-col efw-overflow-hidden efw-py-8 md:efw-px-12 efw-rounded-md efw-bg-white dark:efw-bg-gray-dark-strong">
            <h4 className="efw-text-xl efw-font-extrabold efw-uppercase efw-mb-5 efw-w-full efw-text-center">
              {title}
            </h4>
            {children}
            <div className="efw-w-full efw-flex efw-justify-end efw-items-center efw-gap-2.5 efw-mt-7">
              {label && (
                <button
                  className="efw-text-sm efw-flex efw-justify-center efw-items-center efw-py-1 efw-px-2.5 efw-rounded-md efw-border-none efw-bg-blue-dark hover:efw-bg-blue-light efw-text-white efw-gap-4 efw-cursor-pointer"
                  onClick={onClick}
                >
                  {label} {icon}
                </button>
              )}
              {onClose && (
                <Button
                  icon={t('close')}
                  onClick={() => {
                    umamiTrack('Viewer Modal Close Button')
                    onClose()
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ModalWrapper
