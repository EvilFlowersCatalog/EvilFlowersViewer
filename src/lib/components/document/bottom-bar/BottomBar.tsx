import { useDocumentContext } from '../../hooks/useDocumentContext'
import { useTranslation } from 'react-i18next'

// icons
import {
  AiOutlineDown,
  AiOutlineLeft,
  AiOutlineRight,
  AiOutlineUp,
} from 'react-icons/ai'

import Preview from './Preview'
import { ChangeEvent, ReactNode, useState, KeyboardEvent } from 'react'
import Tooltip from '../../helpers/Tooltip'
import { RENDERING_STATES } from '../../../../utils/enums'
import Button from '../../common/Button'
import Loader from '../../common/Loader'

/**
 * This method renders the bottom bar component
 * used to navigate through the document
 *
 * @param pagePreviews - number of previews to be rendered
 *
 * @returns The bottom bar component
 */
const BottomBar = () => {
  const {
    activePage,
    prevPage,
    nextPage,
    totalPages,
    setPage,
    previewRender,
    isEditMode,
    hideBottomBar,
    setHideBottomBar,
  } = useDocumentContext()
  const { t } = useTranslation()

  const [inputValue, setInputValue] = useState('')

  // handle when input changed
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value // get value
    const valueRegex = /^[0-9]*$/ // regex
    const valueInt = parseInt(value ? value : '1')
    if (valueRegex.test(value) && valueInt <= totalPages && valueInt > 0) {
      // if pass set input val
      setInputValue(value)
    }
  }

  // Handle enter
  const handleInputKey = async (e: KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (e.code === 'Enter' && inputValue) {
      // if enter adn input has value
      const value = parseInt(inputValue) // to int
      setPage(value)
      setInputValue('') // reset
    }
  }

  return (
    <div
      className={`flex py-2 w-full h-[230px] flex-col bg-white dark:bg-gray-dark-strong ${
        isEditMode ? 'h-[52px]' : hideBottomBar ? 'h-[75px]' : ''
      }`}
    >
      {!isEditMode && (
        <div className="relative flex justify-center">
          <Button
            toolTip={{ text: '', position: 'top' }}
            onClick={() => setHideBottomBar(!hideBottomBar)}
            icon={
              hideBottomBar ? (
                <AiOutlineUp size={16} />
              ) : (
                <AiOutlineDown size={15} />
              )
            }
          />
        </div>
      )}
      <div className="relative w-full flex justify-center items-center gap-0.5 select-none mt-1.5">
        <Button
          toolTip={{
            text:
              activePage !== 1 && previewRender !== RENDERING_STATES.RENDERING
                ? t('prevPage')
                : '',
            position: 'top',
          }}
          onClick={prevPage}
          icon={<AiOutlineLeft id="bottom-bar-left" size={15} />}
        />
        {previewRender === RENDERING_STATES.RENDERED ? (
          <span
            className={
              'text-sm flex items-center gap-0.5 text-black dark:text-white'
            }
          >
            <input
              placeholder={activePage.toString()}
              value={inputValue}
              name="page-input"
              className="w-[60px] py-0.5 p-1 mx-1 text-sm text-center outline-none border-none rounded-md bg-gray-light dark:bg-gray-dark-medium text-black dark:text-white"
              onChange={handleInputChange}
              onKeyDown={handleInputKey}
            />
            /<span className="mx-1">{totalPages}</span>
          </span>
        ) : (
          <div className="w-14 flex justify-center">
            <Loader size={20} />
          </div>
        )}
        <Button
          toolTip={{
            text:
              activePage !== totalPages &&
              previewRender !== RENDERING_STATES.RENDERING
                ? t('nextPage')
                : '',
            position: 'top',
          }}
          onClick={nextPage}
          icon={<AiOutlineRight id="bottom-bar-right" size={15} />}
        />
      </div>
      <Preview />
    </div>
  )
}

export default BottomBar
