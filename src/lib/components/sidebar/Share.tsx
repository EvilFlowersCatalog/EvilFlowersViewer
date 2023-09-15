import { ChangeEvent, FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiInfoCircle } from 'react-icons/bi'
import Tooltip from '../helpers/Tooltip'
import { RxShare2 } from 'react-icons/rx'
import { useDocumentContext } from '../document/DocumentContext'
import { useViewerContext } from '../ViewerContext'

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
    // update expaire
    const updatedExpaireOptions = expaireOptions.map((item) => ({
      ...item,
      active: item.name === expaire.name,
    }))
    setExpaire(expaire.value)

    setExpaireOptions(updatedExpaireOptions)
  }

  return (
    <div className={'px-4 text-center gap-2'}>
      <form className={'w-full'} onSubmit={handleSubmit}>
        <div className={'flex flex-row'}>
          <input
            className={
              'w-full pl-2 py-1 text-sm rounded-md bg-gray-200 dark:bg-gray-900 border border-solid dark:border-gray-500 dark:text-gray-300 outline-none focus:outline-none duration-300'
            }
            placeholder={t('shareSearch')}
            value={input}
            onChange={handleInput}
            onKeyDown={(e) => {
              e.stopPropagation()
            }}
          />
          <div>
            <Tooltip placement="left" title={t('shareSearchInfoToolTip')}>
              <BiInfoCircle
                className={
                  'w-[18px] h-[18px] ml-3 mt-1 text-blue-600 dark:text-blue-300'
                }
              />
            </Tooltip>
          </div>
        </div>
        <div className="mt-3 text-left">
          <span className="text-sm text-gray-800 dark:text-gray-200">
            {t('shareExpaire')}
          </span>
          <div className={'flex-row gap-6 mt-2 flex justify-center'}>
            {expaireOptions.map((item, i) => (
              <div
                key={i}
                className={`text-sm px-2 py-1 bg-none top-0 bottom-0 end-0 text-gray-900 dark:text-gray-100 hover:bg-gray-400 hover:dark:bg-gray-500 rounded-md border-none ${
                  item.active
                    ? 'bg-gray-400 dark:bg-gray-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleExpare(item)}
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>
        {!isInappropriate && (
          <button
            className="w-full mt-10 py-2 flex align-center justify-center bg-none bg-blue-500 text-gray-100 rounded-md border-none hover:bg-blue-600 duration-300"
            type="submit"
            style={{ cursor: 'pointer' }}
          >
            <RxShare2 className={'w-[24px] h-[24px] text-white'} />
          </button>
        )}
      </form>
    </div>
  )
}
export default Share
