import { useDocumentContext } from '../../DocumentContext'
import { TfiSave } from 'react-icons/tfi'
import { useTranslation } from 'react-i18next'
import EditColors from './colors/EditColors'
import EditTools from './tools/EditTools'
import EditToolOption from './tool-option/EditToolOptions'
import { FaChevronDown } from 'react-icons/fa'
import { ChangeEvent, useState } from 'react'
import { EDIT_TOOLS } from '../../../../../utils/enums'
import { FiCircle, FiMousePointer, FiSquare } from 'react-icons/fi'
import ModalWrapper from '../../../modal/Modal'
import { LuEraser } from 'react-icons/lu'
import { GoPencil } from 'react-icons/go'
import { HiOutlineMinus } from 'react-icons/hi2'
import { MdCancel } from 'react-icons/md'
import { LuLayers } from 'react-icons/lu'
import { useViewerContext } from '../../../ViewerContext'

interface IEditMobileButton {
  usage: any
  specifier: string
  func: (bool: boolean) => void
  child: any
}
const EditMobileButton = ({
  usage,
  specifier,
  func,
  child,
}: IEditMobileButton) => {
  return (
    <div className="edit-mobile-button">
      <div className="edit-mobile-button-usage">
        {usage}
        <span className="edit-mobile-specifier">{specifier}</span>
      </div>
      <div className="edit-mobile-button-choose" onClick={() => func(true)}>
        {child}
      </div>
    </div>
  )
}

/**
 * Shows edit posibilities
 * @returns - Edit component
 */
const EditMenu = () => {
  const {
    isEditMode,
    screenWidth,
    editHexColor,
    activeEditTool,
    setIsEditMode,
    activePage,
    setElements,
    setActiveEditTool,
  } = useDocumentContext()
  const { t } = useTranslation()
  const [colorChangerVisibility, setColorChangerVisibility] =
    useState<boolean>(false)
  const [toolChangerVisibility, setToolChangerVisibility] =
    useState<boolean>(false)
  const [layersModalVisibility, setLayersModalVisibility] =
    useState<boolean>(false)
  const [saveModalVisibility, setSaveModalVisibility] = useState<boolean>(false)
  const [saveInput, setSaveInput] = useState<string>('')
  const toolIcons = {
    [EDIT_TOOLS.MOUSE]: <FiMousePointer className="edit-mobile-tool" />,
    [EDIT_TOOLS.ERASER]: <LuEraser className="edit-mobile-tool" />,
    [EDIT_TOOLS.PENCIL]: <GoPencil className="edit-mobile-tool" />,
    [EDIT_TOOLS.LINE]: <HiOutlineMinus className="edit-mobile-tool" />,
    [EDIT_TOOLS.CIRCLE]: <FiCircle className="edit-mobile-tool" />,
    [EDIT_TOOLS.SQUARE]: <FiSquare className="edit-mobile-tool" />,
  }

  const { saveFunction, layersFunction } = useViewerContext()

  const savePaint = () => {
    const svg = document.getElementById('evilFlowersPaintSVG')!
    saveFunction!(svg, saveInput)
    setElements([])
    svg.replaceChildren()
  }

  return (
    <>
      {colorChangerVisibility && (
        <ModalWrapper
          isOpen={colorChangerVisibility}
          onClose={() => setColorChangerVisibility(false)}
        >
          <div className="edit-modal-colors">
            <EditColors />
          </div>
        </ModalWrapper>
      )}
      {toolChangerVisibility && (
        <ModalWrapper
          isOpen={toolChangerVisibility}
          onClose={() => setToolChangerVisibility(false)}
        >
          <div className="edit-modal-tools">
            <EditTools />
            <EditToolOption />
          </div>
        </ModalWrapper>
      )}
      {layersModalVisibility && (
        <ModalWrapper
          isOpen={layersModalVisibility}
          onClose={() => setLayersModalVisibility(false)}
          onClick={() => setLayersModalVisibility(false)}
          label={'pick'}
        >
          <div></div>
        </ModalWrapper>
      )}
      {saveModalVisibility && (
        <ModalWrapper
          isOpen={saveModalVisibility}
          onClose={() => {
            setSaveInput('')
            setSaveModalVisibility(false)
          }}
          onClick={() => {
            setSaveInput('')
            setSaveModalVisibility(false)
            savePaint()
          }}
          label={saveInput && t('save')}
        >
          <span className="edit-save-text">{t('editSetName')}</span>
          <input
            className="edit-save-input"
            type="text"
            placeholder="Name"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSaveInput(e.target.value)
            }}
            onKeyDown={(e) => {
              e.stopPropagation()
            }}
          />
        </ModalWrapper>
      )}
      <div
        className={`edit-container ${!isEditMode && 'edit-container-hidden'}`}
      >
        <div className="edit-left-menu">
          <div
            className="viewer-button"
            onClick={() => {
              setElements([])
              setActiveEditTool(EDIT_TOOLS.MOUSE)
              setIsEditMode(false)
            }}
          >
            <MdCancel className="viewer-button-icon" style={{ color: 'red' }} />
          </div>
          {saveFunction && (
            <div
              className="viewer-button edit-save-button-container"
              onClick={() => {
                const svg = document.getElementById('evilFlowersPaintSVG')!
                if (svg.childNodes.length > 0) setSaveModalVisibility(true)
                else setElements([])
              }}
            >
              <TfiSave className="viewer-button-icon" />
              <span className="edit-save-button-text">{t('save')}</span>
            </div>
          )}
          {layersFunction && (
            <div
              className="viewer-button edit-save-button-container"
              onClick={() => {
                layersFunction(activePage)
                setLayersModalVisibility(true)
              }}
            >
              <LuLayers className="viewer-button-icon" />
              <span className="edit-save-button-text">{t('layers')}</span>
            </div>
          )}
        </div>
        {screenWidth > 699 ? (
          <div className="edit-menu">
            <div className="edit-buttons-container">
              <EditTools />
              <EditToolOption />
            </div>
            <EditColors />
          </div>
        ) : (
          <div className="edit-mobile-menu-container">
            <EditMobileButton
              usage={toolIcons[activeEditTool]}
              specifier={t('editTool')}
              func={setToolChangerVisibility}
              child={<FaChevronDown />}
            />
            <EditMobileButton
              usage={
                <div
                  className="edit-mobile-color"
                  style={{ backgroundColor: editHexColor }}
                ></div>
              }
              specifier={t('editColor')}
              func={setColorChangerVisibility}
              child={<FaChevronDown />}
            />
          </div>
        )}
      </div>
    </>
  )
}
export default EditMenu
