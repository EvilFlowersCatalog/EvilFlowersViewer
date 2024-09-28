import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { FaCheckCircle } from 'react-icons/fa'
import { IoMdAdd, IoMdRemoveCircle } from 'react-icons/io'
import useViewerContext from '../../../hooks/useViewerContext'
import Loader from '../../../common/Loader'
import LayerItem from './LayerItem'
import { useDocumentContext } from '../../../hooks/useDocumentContext'

const Layers = () => {
  const { t } = useTranslation()

  const { setGroupId, groupId } = useDocumentContext()
  const { editPackage } = useViewerContext()
  const { getGroupsFunc, updateGroupFunc, deleteGroupFunc, saveGroupFunc } =
    editPackage!
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [reload, setReload] = useState<boolean>(true)
  const [showInput, setShowInput] = useState<boolean>(false)
  const [input, setInput] = useState<string>('')

  // GET GROUPS
  useEffect(() => {
    ;(async () => {
      setShowInput(false)
      setInput('')
      const g = await getGroupsFunc()
      setGroups(g)
      setIsLoading(false)
    })()
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
    <div className="efw-flex efw-flex-col efw-h-full">
      {/* Loader */}
      {isLoading && (
        <div className="efw-flex efw-flex-1 efw-justify-center efw-items-center">
          <Loader size={50} />
        </div>
      )}
      {/* When loaded */}
      {!isLoading && (
        <div className="efw-flex efw-flex-col efw-justify-start efw-text-center efw-flex-1 efw-gap-4 efw-overflow-auto">
          <button
            className="efw-w-full efw-h-10 efw-flex efw-justify-center efw-items-center efw-bg-blue-dark efw-cursor-pointer hover:efw-bg-blue-light efw-rounded-md"
            onClick={() => setShowInput(true)}
          >
            <IoMdAdd size={30} color="white" />
          </button>

          {/* Groups */}
          {groups.length > 0 ? (
            <>
              <div
                className={`efw-w-full efw-p-4 efw-bg-gray-light dark:efw-bg-gray-dark-medium ${
                  groupId ? '' : 'efw-bg-opacity-50 dark:efw-bg-opacity-50'
                } hover:efw-bg-opacity-50 dark:hover:efw-bg-opacity-50 efw-rounded-md efw-cursor-pointer`}
                onClick={() => setGroupId('')}
              >
                {t('noneLayer')}
              </div>
              {groups.map((group, index) => (
                <LayerItem
                  key={index}
                  group={group}
                  update={update}
                  remove={remove}
                />
              ))}
            </>
          ) : (
            t('noLayer')
          )}
          {/* For adding group */}
          {showInput && (
            <div className="efw-flex efw-w-full efw-items-center efw-gap-2 efw-cursor-pointer">
              <input
                type="text"
                className="efw-w-full efw-p-2 efw-text-sm efw-border-none efw-rounded-md efw-bg-gray-light dark:efw-bg-gray-dark-medium efw-outline-none efw-text-black dark:efw-text-white"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder={t('layerName')}
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
    </div>
  )
}

export default Layers
