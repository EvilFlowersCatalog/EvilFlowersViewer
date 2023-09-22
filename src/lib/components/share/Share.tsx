import { ChangeEvent, FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiInfoCircle } from 'react-icons/bi'
import Tooltip from '../helpers/Tooltip'
import { RxShare2 } from 'react-icons/rx'
import { useDocumentContext } from '../document/DocumentContext'
import { useViewerContext } from '../ViewerContext'
import cx from 'classnames'

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
    <form className={'share-container'} onSubmit={handleSubmit}>
      <div className={'share-top-row'}>
        <input
          className={'share-input'}
          placeholder={t('shareSearch')}
          value={input}
          onChange={handleInput}
          onKeyDown={(e) => {
            e.stopPropagation()
          }}
        />
        <div className="share-info-button-container">
          <Tooltip placement="left" title={t('shareSearchInfoToolTip')}>
            <div className="viewer-button" style={{ cursor: 'default' }}>
              <BiInfoCircle
                className={'viewer-button-icon'}
                style={{ width: '20px', height: '20px', color: 'lightblue' }}
              />
            </div>
          </Tooltip>
        </div>
      </div>
      <div className="share-lifespan-container">
        <span className="share-lifespan-title">{t('shareExpaire')}</span>
        <div className={'share-lifespan-buttons-container'}>
          {expaireOptions.map((item, i) => (
            <div
              key={i}
              className={cx('share-lifespan-button', {
                'share-lifespan-button-active': item.active,
                'share-lifespan-button-no-active': !item.active,
              })}
              onClick={() => handleExpare(item)}
            >
              {item.name}
            </div>
          ))}
        </div>
      </div>
      {!isInappropriate && (
        <button className="share-button" type="submit">
          <RxShare2
            className={'viewer-button-icon'}
            style={{ color: 'white' }}
          />
        </button>
      )}
    </form>
  )
}
export default Share
