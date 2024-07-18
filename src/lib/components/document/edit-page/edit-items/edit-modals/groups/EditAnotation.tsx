import { useState } from 'react'
import { useDocumentContext } from '../../../../../hooks/useDocumentContext'
import { MdDelete, MdModeEdit } from 'react-icons/md'
import { FaCheckCircle } from 'react-icons/fa'
import { IoMdRemoveCircle } from 'react-icons/io'

interface IEditAnotationParams {
  group: { id: string; name: string }
  setVisible: (visible: boolean) => void
  update: (id: string, name: string) => void
  remove: (id: string) => void
  choosing: boolean
}
const EditAnotation = ({
  group,
  setVisible,
  update,
  remove,
  choosing,
}: IEditAnotationParams) => {
  const { setEditGroupId, setGroupId } = useDocumentContext()
  const [input, setInput] = useState<string>(group.name)
  const [disabled, setDisabled] = useState<boolean>(true)

  return (
    <button
      className="efw-flex efw-items-center efw-p-4 efw-rounded-md efw-bg-gray-light dark:efw-bg-gray-dark-medium hover:efw-bg-opacity-50 dark:hover:efw-bg-opacity-50"
      onClick={() => {
        if (!disabled) return
        if (choosing) setGroupId(group.id)
        else setEditGroupId(group.id)
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
      {!choosing && (
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
              <MdDelete
                size={20}
                color="red"
                onClick={() => remove(group.id)}
              />
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
      )}
    </button>
  )
}

export default EditAnotation
