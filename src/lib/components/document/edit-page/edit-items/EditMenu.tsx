import { useDocumentContext } from '../../../hooks/useDocumentContext'
import { useTranslation } from 'react-i18next'
import EditColors from './edit-tools/EditColors'
import EditToolOption from './edit-tools/EditToolOptions'
import { FaChevronDown } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { EDIT_STAGES, EDIT_TOOLS } from '../../../../../utils/enums'
import { FiCircle, FiMousePointer, FiSquare } from 'react-icons/fi'
import { LuEraser } from 'react-icons/lu'
import { GoPencil } from 'react-icons/go'
import { HiOutlineMinus } from 'react-icons/hi2'
import { MdCancel } from 'react-icons/md'
import { LuLayers } from 'react-icons/lu'
import useViewerContext from '../../../hooks/useViewerContext'
import Button from '../../../common/Button'
import EditColorsModal from './edit-modals/EditColorsModal'
import EditToolsModal from './edit-modals/EditToolsModal'
import EditGroupsModal from './edit-modals/EditGroupsModal'
import EditTools from './edit-tools/EditTools'
import { RiDeleteBin6Line } from 'react-icons/ri'
import { BiSave } from 'react-icons/bi'

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
    <div
      className="efw-flex efw-flex-col efw-h-4/5 efw-w-20 efw-border efw-border-black dark:efw-border-white efw-rounded-md efw-cursor-pointer"
      onClick={() => func(true)}
    >
      <div className="efw-flex efw-flex-col efw-flex-1 efw-justify-center efw-items-center">
        {usage}
      </div>
      <span className="efw-text-sm efw-text-center">{specifier}</span>
    </div>
  )
}

/**
 * Shows edit posibilities
 * @returns - Edit component
 */
const EditMenu = () => {
  const {
    screenWidth,
    editHexColor,
    activeEditTool,
    setIsEditMode,
    setElements,
    setActiveEditTool,
    saveLayer,
    layer,
    setLayer,
    setEditStage,
    setGroupId,
    editStage,
  } = useDocumentContext()
  const { editPackage } = useViewerContext()
  const { deleteLayerFunc } = editPackage!
  const { t } = useTranslation()

  const [colorChangerVisibility, setColorChangerVisibility] =
    useState<boolean>(false)
  const [toolChangerVisibility, setToolChangerVisibility] =
    useState<boolean>(false)
  const [groupsModalVisibility, setGroupsModalVisibility] =
    useState<boolean>(true)
  const toolIcons = {
    [EDIT_TOOLS.MOUSE]: <FiMousePointer size={30} className="efw-mt-2.5" />,
    [EDIT_TOOLS.ERASER]: <LuEraser size={30} className="efw-mt-2.5" />,
    [EDIT_TOOLS.PENCIL]: <GoPencil size={30} className="efw-mt-2.5" />,
    [EDIT_TOOLS.LINE]: <HiOutlineMinus size={30} className="efw-mt-2.5" />,
    [EDIT_TOOLS.CIRCLE]: <FiCircle size={30} className="efw-mt-2.5" />,
    [EDIT_TOOLS.SQUARE]: <FiSquare size={30} className="efw-mt-2.5" />,
  }

  const deleteLayer = async () => {
    try {
      setEditStage(EDIT_STAGES.WORKING)
      if (layer) {
        await deleteLayerFunc(layer.id)
        setLayer(null)
      }
      const svg = document.getElementById('evilFlowersPaintSVG')!
      svg.replaceChildren()
    } catch {
    } finally {
      setEditStage(EDIT_STAGES.DONE)
    }
  }

  const handleCloseEditPage = () => {
    if (editStage === EDIT_STAGES.DONE) {
      setElements([])
      setActiveEditTool(EDIT_TOOLS.MOUSE)
      setIsEditMode(false)
    }
  }

  const handleOpenGroups = () => {
    if (editStage === EDIT_STAGES.DONE) {
      setEditStage(EDIT_STAGES.NULL)
      setGroupId('')
      setGroupsModalVisibility(true)
    }
  }

  useEffect(() => {
    if (screenWidth > 699) {
      setToolChangerVisibility(false)
      setColorChangerVisibility(false)
    }
  }, [screenWidth])

  return (
    <>
      <div
        className={
          'efw-w-full efw-overflow-hidden efw-flex efw-gap-2.5 efw-bg-white dark:efw-bg-gray-dark-strong efw-h-[150px] efw-p-2'
        }
      >
        <div className="efw-relative efw-flex efw-items-center">
          <Button
            onClick={handleCloseEditPage}
            icon={<MdCancel size={25} color="red" />}
          />
          <div className="efw-relative efw-flex efw-flex-col efw-gap-3.5 efw-justify-center efw-h-full efw-border-r efw-border-black dark:efw-border-white efw-pr-2.5">
            <Button
              onClick={handleOpenGroups}
              toolTip={{ position: 'right', text: t('groups') }}
              icon={<LuLayers size={23} />}
            />
            <Button
              onClick={() => {
                const svg = document.getElementById('evilFlowersPaintSVG')!
                if (svg.childNodes.length > 0) saveLayer()
                else setElements([])
              }}
              toolTip={{ position: 'right', text: t('save') }}
              icon={<BiSave size={25} />}
            />
            <Button
              onClick={deleteLayer}
              toolTip={{ position: 'right', text: t('delete') }}
              icon={<RiDeleteBin6Line size={22} />}
            />
          </div>
        </div>
        {screenWidth > 699 ? (
          <div className="efw-w-full efw-h-full efw-flex efw-justify-between efw-items-center efw-gap-4">
            <div className="efw-flex efw-items-start efw-h-full efw-gap-4 efw-py-1.5">
              <EditTools />
              <EditToolOption />
            </div>
            <EditColors />
          </div>
        ) : (
          <div className="efw-flex efw-w-full efw-min-w-[100px] efw-h-full efw-justify-end efw-items-center efw-gap-4">
            <EditMobileButton
              usage={toolIcons[activeEditTool]}
              specifier={t('editTool')}
              func={setToolChangerVisibility}
              child={<FaChevronDown />}
            />
            <EditMobileButton
              usage={
                <div
                  className="efw-w-full efw-h-full efw-rounded-t-md"
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
      {colorChangerVisibility && (
        <EditColorsModal
          visible={colorChangerVisibility}
          setVisible={setColorChangerVisibility}
        />
      )}
      {toolChangerVisibility && (
        <EditToolsModal
          visible={toolChangerVisibility}
          setVisible={setToolChangerVisibility}
        />
      )}
      {groupsModalVisibility && (
        <EditGroupsModal
          visible={groupsModalVisibility}
          setVisible={setGroupsModalVisibility}
        />
      )}
    </>
  )
}
export default EditMenu
