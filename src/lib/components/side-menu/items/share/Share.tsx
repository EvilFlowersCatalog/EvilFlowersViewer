import { ChangeEvent, FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiInfoCircle } from 'react-icons/bi'
import { RxShare2 } from 'react-icons/rx'
import useViewerContext from '../../../hooks/useViewerContext'
import Button from '../../../common/Button'
import { useParams } from 'react-router-dom'

interface IShareParams {
  setLink: (link: string) => void
  setShareQRVisibility: (mode: boolean) => void
}

/**
 * Returns the share modal component
 *
 * @param params - IShareParams, link -> link for download
 *
 * @returns - The share component
 */
const Share = (params: IShareParams) => {
  const { 'entry-id': entryId } = useParams()

  const [input, setInput] = useState<string>('')
  const [expaire, setExpaire] = useState<number>(24)
  const [isInappropriate, setIsInappropriate] = useState<boolean>(false)
  const [expaireOptions, setExpaireOptions] = useState([
    {
      name: '1d',
      value: 24,
      active: true,
    },
    {
      name: '7d',
      value: 7 * 24,
      active: false,
    },
    {
      name: '30d',
      value: 30 * 24,
      active: false,
    },
  ])
  const { t } = useTranslation()
  const { shareFunction } = useViewerContext()

  /**
   * function for handling submit form
   * @param event FormEvent -> inputs
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    umami.track('Viewer Share Document Button', { entryId })

    if (isInappropriate) {
      // if it's inappropriate (1,4, or 1,5-), return
      return
    }
    params.setLink('') // reset link
    params.setShareQRVisibility(true) // open ShareQRCode component

    if (shareFunction) {
      // function exists
      let expaireDate = new Date() // create new date
      expaireDate.setHours(expaireDate.getHours() + expaire) // set hours with setted expaire (+ 24(day) / +24*7(week) / +24*30(month))

      const expaireDateISO: string = expaireDate.toISOString() // ISO string format
      const pages: string | null = input ? input : null // if empty set to null
      setInput('') // reset input

      let givenLink: string = await shareFunction(pages, expaireDateISO)
      givenLink = givenLink ? givenLink : 'error'
      params.setLink(givenLink)
    }
  }

  /**
   * funtion for handling input
   * @param event ChangeEvent
   */
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const eventInput = event.target.value
    const pattern = /^((([0-9]+),?)*|(([0-9]+)-?))*$/ // only 1,2-6,10,3....
    const pattern2 = /^.*(([0-9]+)-([0-9]+)-)+$/ // only ...1-2- // not accepting

    if (pattern.test(eventInput) && !pattern2.test(eventInput)) {
      setInput(eventInput)
      if (
        eventInput[eventInput.length - 1] === ',' ||
        eventInput[eventInput.length - 1] === '-'
      ) {
        // if string ends with , or - do not share
        setIsInappropriate(true)
      } else {
        // it's okay
        setIsInappropriate(false)
      }
    }
  }

  /**
   * Funtion for handling buttons click by expaire options
   * @param expaire choosed expaire option
   */
  const handleExpare = (expaire: {
    name: string
    value: number
    active: boolean
  }) => {
    umami.track('Viewer Share Lifespan Button', { lifespan: expaire.name })
    // update expaire
    const updatedExpaireOptions = expaireOptions.map((item) => ({
      ...item,
      active: item.name === expaire.name,
    }))
    setExpaire(expaire.value)

    setExpaireOptions(updatedExpaireOptions)
  }

  return (
    <form
      className={
        'efw-w-full efw-h-full efw-flex efw-flex-col efw-justify-start efw-items-center'
      }
      onSubmit={handleSubmit}
    >
      <div
        className={'efw-w-full efw-flex efw-justify-between efw-items-center'}
      >
        {/* Pages input */}
        <input
          className={
            'efw-w-4/5 efw-p-2 efw-text-sm efw-border-none efw-rounded-md efw-bg-gray-light dark:efw-bg-gray-dark-medium efw-outline-none efw-text-black dark:efw-text-white'
          }
          placeholder={t('shareSearch')}
          name="share-input"
          value={input}
          onChange={handleInput}
          onKeyDown={(e) => {
            e.stopPropagation()
          }}
        />
        {/* Info button */}
        <Button
          toolTip={{ text: t('shareSearchInfoToolTip'), position: 'left' }}
          icon={<BiInfoCircle size={20} className="efw-text-blue-light" />}
        />
      </div>
      <div className="efw-w-full efw-flex efw-justify-start efw-flex-col efw-mt-2.5">
        <span className="efw-text-sm efw-w-full efw-flex efw-justify-start efw-flex-col efw-mt-2.5">
          {t('shareExpaire')}
        </span>
        <div
          className={
            'efw-flex efw-w-full efw-justify-between efw-items-center efw-mt-2.5'
          }
        >
          {/* Button for exparation */}
          {expaireOptions.map((item, i) => (
            <div
              key={i}
              className={`efw-py-1 efw-px-2.5 efw-flex efw-items-center efw-justify-center efw-rounded-md efw-cursor-pointer efw-border-none efw-outline-none hover:efw-bg-gray-light dark:hover:efw-bg-gray-dark-medium ${
                item.active
                  ? 'efw-bg-gray-light dark:efw-bg-gray-dark-medium'
                  : 'efw-bg-transparent'
              }`}
              onClick={() => handleExpare(item)}
            >
              {item.name}
            </div>
          ))}
        </div>
      </div>
      <span className="efw-flex-1"></span>
      {/* Hide button if there is bad input */}
      {!isInappropriate && (
        <button
          className="efw-w-full efw-py-2.5 efw-flex efw-border-none efw-rounded-md efw-justify-center efw-items-center efw-bg-blue-dark efw-cursor-pointer hover:efw-bg-blue-light"
          type="submit"
        >
          <RxShare2 size={20} color="white" />
        </button>
      )}
    </form>
  )
}
export default Share
