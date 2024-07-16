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
      className="flex flex-col h-4/5 w-20 border border-black dark:border-white rounded-md cursor-pointer"
      onClick={() => func(true)}
    >
      <div className="flex flex-col flex-1 justify-center items-center">
        {usage}
      </div>
      <span className="text-sm text-center">{specifier}</span>
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
    [EDIT_TOOLS.MOUSE]: <FiMousePointer size={30} className="mt-2.5" />,
    [EDIT_TOOLS.ERASER]: <LuEraser size={30} className="mt-2.5" />,
    [EDIT_TOOLS.PENCIL]: <GoPencil size={30} className="mt-2.5" />,
    [EDIT_TOOLS.LINE]: <HiOutlineMinus size={30} className="mt-2.5" />,
    [EDIT_TOOLS.CIRCLE]: <FiCircle size={30} className="mt-2.5" />,
    [EDIT_TOOLS.SQUARE]: <FiSquare size={30} className="mt-2.5" />,
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
          'w-full overflow-hidden flex gap-2.5 bg-white dark:bg-gray-dark-strong h-[150px] p-2'
        }
      >
        <div className="relative flex items-center">
          <Button
            onClick={() => {
              setElements([])
              setActiveEditTool(EDIT_TOOLS.MOUSE)
              setIsEditMode(false)
            }}
            icon={<MdCancel size={25} color="red" />}
          />
          <div className="relative flex flex-col gap-3.5 justify-center h-full border-r border-black dark:border-white pr-2.5">
            <Button
              onClick={() => {
                setEditStage(EDIT_STAGES.NULL)
                setGroupId('')
                setGroupsModalVisibility(true)
              }}
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
          <div className="w-full h-full flex justify-between items-center gap-4">
            <div className="flex items-start h-full gap-4 py-1.5">
              <EditTools />
              <EditToolOption />
            </div>
            <EditColors />
          </div>
        ) : (
          <div className="flex w-full min-w-[100px] h-full justify-end items-center gap-4">
            <EditMobileButton
              usage={toolIcons[activeEditTool]}
              specifier={t('editTool')}
              func={setToolChangerVisibility}
              child={<FaChevronDown />}
            />
            <EditMobileButton
              usage={
                <div
                  className="w-full h-full rounded-t-md"
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
