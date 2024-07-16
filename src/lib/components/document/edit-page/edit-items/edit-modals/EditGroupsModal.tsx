import { useTranslation } from 'react-i18next'
import ModalWrapper from '../../../../modal/Modal'
import useCustomEffect from '../../../../hooks/useCustomEffect'
import useViewerContext from '../../../../hooks/useViewerContext'
import { useState } from 'react'
import Loader from '../../../../common/Loader'
import { MdDelete, MdModeEdit } from 'react-icons/md'
import { FaCheckCircle } from 'react-icons/fa'
import { IoMdRemoveCircle } from 'react-icons/io'
import { useDocumentContext } from '../../../../hooks/useDocumentContext'

interface IAnotationParams {
  group: { id: string; name: string }
  setVisible: (visible: boolean) => void
  update: (id: string, name: string) => void
  remove: (id: string) => void
}
const Anotation = ({ group, setVisible, update, remove }: IAnotationParams) => {
  const { setGroupId } = useDocumentContext()
  const [input, setInput] = useState<string>(group.name)
  const [disabled, setDisabled] = useState<boolean>(true)

  return (
    <button
      className="efw-flex efw-items-center efw-p-4 efw-rounded-md efw-bg-gray-light dark:efw-bg-gray-dark-medium hover:efw-bg-opacity-50 dark:hover:efw-bg-opacity-50"
      onClick={() => {
        setGroupId(group.id)
        setVisible(false)
      }}
    >
      <input
        className="efw-bg-transparent efw-p-1 efw-border-b-2 disabled:efw-border-transparent disabled:efw-pointer-events-none efw-border-white efw-outline-none"
        name={group.id}
        onClick={(e) => e.stopPropagation()}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        disabled={disabled}
      />
      <span className="efw-flex-1"></span>
      <div
        className="efw-flex efw-h-full efw-items-center efw-gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {disabled ? (
          <>
            <MdModeEdit
              size={20}
              color="green"
              onClick={() => setDisabled(false)}
            />
            <MdDelete size={20} color="red" onClick={() => remove(group.id)} />
          </>
        ) : (
          <>
            <FaCheckCircle
              size={19}
              color="green"
              onClick={() => {
                if (input) update(group.id, input)
              }}
            />
            <IoMdRemoveCircle
              size={22}
              color="red"
              onClick={() => {
                setInput(group.name)
                setDisabled(true)
              }}
            />
          </>
        )}
      </div>
    </button>
  )
}

interface IEditAnotationModalParams {
  visible: boolean
  setVisible: (visible: boolean) => void
}

const EditGroupsModal = ({
  visible,
  setVisible,
}: IEditAnotationModalParams) => {
  const { t } = useTranslation()

  const { editPackage } = useViewerContext()
  const { getGroupsFunc, updateGroupFunc, deleteGroupFunc, saveGroupFunc } =
    editPackage!
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [reload, setReload] = useState<boolean>(true)
  const [showInput, setShowInput] = useState<boolean>(false)
  const [input, setInput] = useState<string>('')

  useCustomEffect(async () => {
    try {
      const g = await getGroupsFunc()
      setGroups(g)
      setIsLoading(false)
    } catch {
      setGroups([])
    }
  }, [reload])

  const save = async () => {
    if (input) {
      try {
        setIsLoading(true)
        await saveGroupFunc(input)
        setReload(!reload)
      } catch {}
    }
  }

  const update = async (id: string, name: string) => {
    try {
      setIsLoading(true)
      await updateGroupFunc(id, name)
      setReload(!reload)
    } catch {}
  }

  const remove = async (id: string) => {
    try {
      setIsLoading(true)
      await deleteGroupFunc(id)
      setReload(!reload)
    } catch {}
  }

  return (
    <ModalWrapper isOpen={visible} title={t('chooseGroups')}>
      {isLoading && (
        <div className="efw-flex efw-justify-center">
          <Loader size={50} />
        </div>
      )}
      {!isLoading && (
        <div className="efw-flex efw-flex-col efw-justify-center efw-text-center efw-flex-1 efw-gap-4 efw-overflow-auto">
          {groups.length > 0
            ? groups.map((group) => (
                <Anotation
                  key={group.id}
                  group={group}
                  setVisible={setVisible}
                  update={update}
                  remove={remove}
                />
              ))
            : t('noGroups')}
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
          <button
            className="efw-w-full efw-p-4 efw-text-center efw-uppercase efw-border-blue-dark efw-bg-blue-dark hover:efw-bg-opacity-50 efw-rounded-md efw-cursor-pointer"
            onClick={() => setShowInput(true)}
          >
            {t('groupNew')}
          </button>
        </div>
      )}
    </ModalWrapper>
  )
}

export default EditGroupsModal
