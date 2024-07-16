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
      className="flex items-center p-4 rounded-md bg-gray-light dark:bg-gray-dark-medium hover:bg-opacity-50 dark:hover:bg-opacity-50"
      onClick={() => {
        setGroupId(group.id)
        setVisible(false)
      }}
    >
      <input
        className="bg-transparent p-1 border-b-2 disabled:border-transparent border-white outline-none"
        name={group.id}
        onClick={(e) => e.stopPropagation()}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        disabled={disabled}
      />
      <span className="flex-1"></span>
      <div
        className="flex h-full items-center gap-2"
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
        <div className="flex justify-center">
          <Loader size={50} />
        </div>
      )}
      {!isLoading && (
        <div className="flex flex-col justify-center text-center flex-1 gap-4 overflow-auto">
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
            <div className="flex w-full items-center gap-2 cursor-pointer">
              <input
                type="text"
                className="w-full p-2 text-sm border-none rounded-md bg-gray-light dark:bg-gray-dark-medium outline-none text-black dark:text-white"
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
            className="w-full p-4 text-center uppercase border-blue-dark bg-blue-dark hover:bg-opacity-50 rounded-md cursor-pointer"
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
