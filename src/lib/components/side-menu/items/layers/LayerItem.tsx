import { useState } from 'react'
import { MdDelete, MdModeEdit } from 'react-icons/md'
import { FaCheckCircle } from 'react-icons/fa'
import { IoMdRemoveCircle } from 'react-icons/io'
import { useDocumentContext } from '../../../hooks/useDocumentContext'
import { useTranslation } from 'react-i18next'

interface IEditAnotationParams {
  group: { id: string; name: string }
  update: (id: string, name: string) => void
  remove: (id: string) => void
}
const LayerItem = ({ group, update, remove }: IEditAnotationParams) => {
  const { setGroupId, setIsEditMode, groupId } = useDocumentContext()
  const { t } = useTranslation()
  const [input, setInput] = useState<string>(group.name)
  const [disabled, setDisabled] = useState<boolean>(true)

  return (
    <button
      className={`efw-rounded-md efw-bg-gray-light dark:efw-bg-gray-dark-medium efw-border-2 ${
        group.id === groupId
          ? 'efw-border-black dark:efw-border-white'
          : 'efw-border-transparent'
      } hover:efw-bg-opacity-50 dark:hover:efw-bg-opacity-50`}
      onClick={() => {
        if (!disabled) return
        setGroupId(group.id)
      }}
    >
      <div className="efw-flex efw-p-4 efw-pb-2 efw-items-center efw-gap-2">
        <input
          className="efw-bg-transparent efw-w-full efw-p-1 efw-border-b-2 disabled:efw-border-transparent efw-uppercase efw-font-bold disabled:efw-pointer-events-none efw-border-white efw-outline-none"
          name={group.id}
          onClick={(e) => e.stopPropagation()}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          disabled={disabled}
        />

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
      </div>
      <div
        className="efw-w-full efw-outline-none efw-text-center efw-uppercase efw-text-[12px] efw-py-2"
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) return
          setGroupId(group.id)
          setIsEditMode(true)
        }}
      >
        {t('editLayer')}
      </div>
    </button>
  )
}

export default LayerItem
