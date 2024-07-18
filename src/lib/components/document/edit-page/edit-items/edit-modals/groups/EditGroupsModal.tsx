import { useTranslation } from 'react-i18next'
import ModalWrapper from '../../../../../modal/Modal'
import useCustomEffect from '../../../../../hooks/useCustomEffect'
import useViewerContext from '../../../../../hooks/useViewerContext'
import { useState } from 'react'
import Loader from '../../../../../common/Loader'
import { MdDelete, MdModeEdit } from 'react-icons/md'
import { FaCheckCircle } from 'react-icons/fa'
import { IoMdRemoveCircle } from 'react-icons/io'
import { useDocumentContext } from '../../../../../hooks/useDocumentContext'
import EditAnotation from './EditAnotation'

interface IEditAnotationModalParams {
  visible: boolean
  setVisible: (visible: boolean) => void
  choosing?: boolean
}

const EditGroupsModal = ({
  visible,
  setVisible,
  choosing = false,
}: IEditAnotationModalParams) => {
  const { t } = useTranslation()

  const { setIsEditMode, editGroupId, setGroupId } = useDocumentContext()
  const { editPackage } = useViewerContext()
  const { getGroupsFunc, updateGroupFunc, deleteGroupFunc, saveGroupFunc } =
    editPackage!
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [reload, setReload] = useState<boolean>(true)
  const [showInput, setShowInput] = useState<boolean>(false)
  const [input, setInput] = useState<string>('')

  // GET GROUPS
  useCustomEffect(async () => {
    setShowInput(false)
    setInput('')
    const g = await getGroupsFunc()
    setGroups(g)
    setIsLoading(false)
  }, [reload])

  // Save group
  const save = async () => {
    if (input) {
      setIsLoading(true)
      await saveGroupFunc(input)
      setReload(!reload)
    }
  }

  // Update group
  const update = async (id: string, name: string) => {
    setIsLoading(true)
    await updateGroupFunc(id, name)
    setReload(!reload)
  }

  // Remove group
  const remove = async (id: string) => {
    setIsLoading(true)
    await deleteGroupFunc(id)
    setReload(!reload)
  }

  return (
    <ModalWrapper
      isOpen={visible}
      title={t('chooseGroups')}
      label={choosing ? null : t('groupNew')}
      onClick={choosing ? undefined : () => setShowInput(true)}
      onClose={
        choosing
          ? () => setVisible(false)
          : () => (editGroupId ? setVisible(false) : setIsEditMode(false))
      }
    >
      {/* Loader */}
      {isLoading && (
        <div className="efw-flex efw-justify-center">
          <Loader size={50} />
        </div>
      )}
      {/* When loaded */}
      {!isLoading && (
        <div className="efw-flex efw-flex-col efw-justify-center efw-text-center efw-flex-1 efw-gap-4 efw-overflow-auto">
          {/* For no group */}
          {choosing && (
            <button
              className="efw-flex efw-items-center efw-p-4 efw-rounded-md efw-bg-gray-light dark:efw-bg-gray-dark-medium hover:efw-bg-opacity-50 dark:hover:efw-bg-opacity-50"
              onClick={() => {
                setGroupId('')
                setVisible(false)
              }}
            >
              {t('none')}
            </button>
          )}
          {/* Groups */}
          {groups.length > 0
            ? groups.map((group) => (
                <EditAnotation
                  key={group.id}
                  group={group}
                  setVisible={setVisible}
                  update={update}
                  remove={remove}
                  choosing={choosing}
                />
              ))
            : t('noGroups')}
          {/* For adding group */}
          {showInput && (
            <div className="efw-flex efw-w-full efw-items-center efw-gap-2 efw-cursor-pointer">
              <input
                type="text"
                className="efw-w-full efw-p-2 efw-text-sm efw-border-none efw-rounded-md efw-bg-gray-light dark:efw-bg-gray-dark-medium efw-outline-none efw-text-black dark:efw-text-white"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder={t('groupName')}
                name="new group"
              />
              <FaCheckCircle size={19} color="green" onClick={save} />
              <IoMdRemoveCircle
                size={22}
                color="red"
                onClick={() => setShowInput(false)}
              />
            </div>
          )}
        </div>
      )}
    </ModalWrapper>
  )
}

export default EditGroupsModal
