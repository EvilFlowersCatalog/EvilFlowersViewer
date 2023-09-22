import { ReactNode, KeyboardEvent, useRef, useEffect } from 'react'
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
  const ref: any = useRef(null)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    ref.current.focus()!
  }, [])

  return (
    <>
      {isOpen && (
        <div
          className="modal-container"
          ref={ref}
          onKeyDown={onKeyDown}
          tabIndex={-1}
        >
          <div
            className="modal-close-background-container"
            onClick={onClose}
          ></div>
          <div className="modal-main-container">
            {children}
            <div className="modal-buttons-container">
              {label && (
                <button className="modal-button" onClick={onClick}>
                  {label} {icon}
                </button>
              )}
              <div className="viewer-button" onClick={onClose}>
                {t('close')}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ModalWrapper
