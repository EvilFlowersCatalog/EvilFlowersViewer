import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useViewerContext } from '../../ViewerContext'
import { useDocumentContext } from '../../document/DocumentContext'
import {
  BiDownload,
  BiHelpCircle,
  BiHome,
  BiInfoCircle,
  BiMenuAltLeft,
  BiMoon,
  BiSearch,
  BiSun,
} from 'react-icons/bi'
import {
  AiOutlinePlus,
  AiOutlineMinus,
  AiOutlineEdit,
  AiOutlineLeft,
  AiOutlineRight,
} from 'react-icons/ai'
import { RxQuote, RxShare2 } from 'react-icons/rx'

const Help = () => {
  const { t } = useTranslation()
  const { setShowHelp, theme, homeFunction, shareFunction } = useViewerContext()
  const { screenWidth, screenHeight, TOC, pdfCitation } = useDocumentContext()
  const [index, setIndex] = useState(homeFunction ? 0 : 1)
  const [indexPosition, setIndexPosition] = useState(0)
  const [yPositions] = useState<string[]>([
    '22px',
    '55px',
    '88px',
    '123px',
    '158px',
    '191px',
    '225px',
    '260px',
    '293px',
    '326px',
    '361px',
    // '395px',
  ])
  const [steps] = useState([
    homeFunction
      ? {
          icon: <BiHome className="help-icon" />,
          title: t('homeTitle'),
          description: t('homeDescription'),
          left: true,
          positionX: '80px',
          top: true,
          positionY: '',
          class: 'help-left-step',
        }
      : null,
    // {
    //   icon: <AiOutlineEdit className="help-icon" />,
    //   title: t('editTitle'),
    //   description: t('editDescription'),
    //   left: true,
    //   positionX: '80px',
    //   top: true,
    //   positionY: '',
    //   class: 'help-left-step',
    // },
    {
      icon: <BiSearch className="help-icon" />,
      title: t('searchTitle'),
      description: t('searchDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY: '',
      class: 'help-left-step',
    },
    pdfCitation
      ? {
          icon: <RxQuote className="help-icon" />,
          title: t('citationTitle'),
          description: t('citationDescription'),
          left: true,
          positionX: '80px',
          top: true,
          positionY: '',
          class: 'help-left-step',
        }
      : null,
    TOC && TOC.length > 0
      ? {
          icon: <BiMenuAltLeft className="help-icon" />,
          title: t('tocTitle'),
          description: t('tocDescription'),
          left: true,
          positionX: '80px',
          top: true,
          positionY: '',
          class: 'help-left-step',
        }
      : null,
    shareFunction
      ? {
          icon: <RxShare2 className="help-icon" />,
          title: t('shareTitle'),
          description: t('shareDescription'),
          left: true,
          positionX: '80px',
          top: true,
          positionY: '',
          class: 'help-left-step',
        }
      : null,
    {
      icon: <BiInfoCircle className="help-icon" />,
      title: t('infoTitle'),
      description: t('infoDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY: '',
      class: 'help-left-step',
    },
    {
      icon: <BiHelpCircle className="help-icon" />,
      title: t('helpTitle'),
      description: t('helpDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY: '',
      class: 'help-left-step',
    },
    {
      icon:
        theme === 'dark' ? (
          <BiMoon className="help-icon" />
        ) : (
          <BiSun className="help-icon" />
        ),
      title: t('themeTitle'),
      description: t('themeDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY: '',
      class: 'help-left-step',
    },
    {
      icon: <BiDownload className="help-icon" />,
      title: t('downloadTitle'),
      description: t('downloadDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY: '',
      class: 'help-left-step',
    },
    {
      icon: <AiOutlinePlus className="help-icon" />,
      title: t('zoomInTitle'),
      description: t('zoomInDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY: '',
      class: 'help-left-step',
    },
    {
      icon: <AiOutlineMinus className="help-icon" />,
      title: t('zoomOutTitle'),
      description: t('zoomOutDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY: '',
      class: 'help-left-step',
    },
    {
      icon: <AiOutlineLeft className="help-icon" />,
      title: t('previousTitle'),
      description: t('previousDescription'),
      left: true,
      positionX:
        document.getElementById('bottom-bar-left')?.getBoundingClientRect().x! +
        10 +
        'px',
      top: false,
      positionY:
        screenHeight -
        document.getElementById('bottom-bar-left')?.getBoundingClientRect()
          .bottom! +
        60 +
        'px',
      class: 'help-bottom-left-step',
    },
    {
      icon: <AiOutlineRight className="help-icon" />,
      title: t('nextTitle'),
      description: t('nextDescription'),
      left: false,
      positionX:
        screenWidth -
        document.getElementById('bottom-bar-right')?.getBoundingClientRect()
          .right! +
        10 +
        'px',
      top: false,
      positionY:
        screenHeight -
        document.getElementById('bottom-bar-right')?.getBoundingClientRect()
          .bottom! +
        60 +
        'px',
      class: 'help-bottom-right-step',
    },
  ])

  useEffect(() => {
    const bounding = document
      .getElementById('bottom-bar-left')
      ?.getBoundingClientRect()!
    steps[11]!.positionX = bounding.x + 8 + 'px'
    steps[11]!.positionY = screenHeight - bounding.bottom + 60 + 'px'
  }, [
    document.getElementById('bottom-bar-left')?.getBoundingClientRect().x,
    document.getElementById('bottom-bar-left')?.getBoundingClientRect().bottom,
  ])

  useEffect(() => {
    const bounding = document
      .getElementById('bottom-bar-right')
      ?.getBoundingClientRect()!
    steps[12]!.positionX = screenWidth - bounding.right + 8 + 'px'
    steps[12]!.positionY = screenHeight - bounding.bottom + 60 + 'px'
  }, [
    document.getElementById('bottom-bar-right')?.getBoundingClientRect().right,
    document.getElementById('bottom-bar-right')?.getBoundingClientRect().bottom,
  ])

  return (
    <div className="help-container">
      <div
        className={steps[index]!.class}
        style={
          steps[index]!.top
            ? { top: yPositions[indexPosition], left: steps[index]!.positionX }
            : steps[index]!.left
            ? {
                bottom: steps[index]!.positionY,
                left: steps[index]!.positionX,
              }
            : {
                bottom: steps[index]!.positionY,
                right: steps[index]!.positionX,
              }
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {steps[index]!.icon}
          <span className="help-title">{steps[index]!.title}</span>
        </div>
        <p
          className="help-description"
          dangerouslySetInnerHTML={{ __html: steps[index]!.description }}
        ></p>
        <div className="help-buttons-container">
          {index < steps.length - 1 && (
            <button
              className="help-skip-button"
              onClick={() => setShowHelp(false)}
            >
              {t('helpSkip')}
            </button>
          )}
          <button
            className="help-next-button"
            onClick={() => {
              let nextIndex = index
              do {
                nextIndex += 1
              } while (
                steps[nextIndex] === null &&
                nextIndex < steps.length - 1
              )
              steps[nextIndex] === null ? null : setIndex(nextIndex)
              nextIndex === steps.length ? setShowHelp(false) : null
              setIndexPosition(indexPosition + 1)
            }}
          >
            {index === steps.length - 1 ? t('helpDone') : t('helpNext')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Help
