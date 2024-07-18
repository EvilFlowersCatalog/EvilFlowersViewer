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
import { ChangeEvent, useState, KeyboardEvent } from 'react'
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
      className={`efw-flex efw-py-2 efw-w-full efw-h-[230px] efw-flex-col efw-bg-white dark:efw-bg-gray-dark-strong ${
        isEditMode ? 'efw-h-[52px]' : hideBottomBar ? 'efw-h-[75px]' : ''
      }`}
    >
      {/* UP/DOWN hiding bottom bar */}
      {!isEditMode && (
        <div className="efw-relative efw-flex efw-justify-center">
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
      <div className="efw-relative efw-w-full efw-flex efw-justify-center efw-items-center efw-gap-0.5 efw-select-none efw-mt-1.5">
        {/* PREV PAGE */}
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
        {/* INPUT */}
        {previewRender === RENDERING_STATES.RENDERED ? (
          <span
            className={
              'efw-text-sm efw-flex efw-items-center efw-gap-0.5 efw-text-black dark:efw-text-white'
            }
          >
            <input
              placeholder={activePage.toString()}
              value={inputValue}
              name="page-input"
              className="efw-w-[60px] efw-py-0.5 efw-p-1 efw-mx-1 efw-text-sm efw-text-center efw-outline-none efw-border-none efw-rounded-md efw-bg-gray-light dark:efw-bg-gray-dark-medium efw-text-black dark:efw-text-white"
              onChange={handleInputChange}
              onKeyDown={handleInputKey}
            />
            /<span className="efw-mx-1">{totalPages}</span>
          </span>
        ) : (
          // LOADER when loading pages
          <div className="efw-w-14 efw-flex efw-justify-center">
            <Loader size={20} />
          </div>
        )}
        {/* NEXT PAGE */}
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
      {/* PREVIEW */}
      <Preview />
    </div>
  )
}

export default BottomBar
