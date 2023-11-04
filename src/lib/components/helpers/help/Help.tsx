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
  const { setShowHelp, theme } = useViewerContext()
  const { screenWidth, screenHeight } = useDocumentContext()
  const [index, setIndex] = useState(0)
  const [steps] = useState([
    {
      icon: <BiHome className="help-icon" />,
      title: t('homeTitle'),
      description: t('homeDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY:
        document.getElementById('menu-home')?.getBoundingClientRect().y! +
        10 +
        'px',
      class: 'help-left-step',
    },
    // {
    //   icon: <AiOutlineEdit className="help-icon" />,
    //   title: t('editTitle'),
    //   description: t('editDescription'),
    //   left: true,
    //   positionX: '80px',
    //   top: true,
    //   positionY:
    //     document.getElementById('menu-edit')?.getBoundingClientRect().y! +
    //     10 +
    //     'px',
    //   class: 'help-left-step',
    // },
    {
      icon: <BiSearch className="help-icon" />,
      title: t('searchTitle'),
      description: t('searchDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY:
        document.getElementById('menu-search')?.getBoundingClientRect().y! +
        10 +
        'px',
      class: 'help-left-step',
    },
    {
      icon: <RxQuote className="help-icon" />,
      title: t('citationTitle'),
      description: t('citationDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY:
        document.getElementById('menu-citation')?.getBoundingClientRect().y! +
        10 +
        'px',
      class: 'help-left-step',
    },
    {
      icon: <BiMenuAltLeft className="help-icon" />,
      title: t('tocTitle'),
      description: t('tocDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY:
        document.getElementById('menu-toc')?.getBoundingClientRect().y! +
        10 +
        'px',
      class: 'help-left-step',
    },
    {
      icon: <RxShare2 className="help-icon" />,
      title: t('shareTitle'),
      description: t('shareDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY:
        document.getElementById('menu-share')?.getBoundingClientRect().y! +
        10 +
        'px',
      class: 'help-left-step',
    },
    {
      icon: <BiInfoCircle className="help-icon" />,
      title: t('infoTitle'),
      description: t('infoDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY:
        document.getElementById('menu-info')?.getBoundingClientRect().y! +
        10 +
        'px',
      class: 'help-left-step',
    },
    {
      icon: <BiHelpCircle className="help-icon" />,
      title: t('helpTitle'),
      description: t('helpDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY:
        document.getElementById('menu-help')?.getBoundingClientRect().y! +
        10 +
        'px',
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
      positionY:
        document.getElementById('menu-theme')?.getBoundingClientRect().y! +
        10 +
        'px',
      class: 'help-left-step',
    },
    {
      icon: <BiDownload className="help-icon" />,
      title: t('downloadTitle'),
      description: t('downloadDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY:
        document.getElementById('menu-download')?.getBoundingClientRect().y! +
        10 +
        'px',
      class: 'help-left-step',
    },
    {
      icon: <AiOutlinePlus className="help-icon" />,
      title: t('zoomInTitle'),
      description: t('zoomInDescription'),
      left: true,
      positionX: '80px',
      top: false,
      positionY:
        screenHeight -
        document.getElementById('menu-zoom-in')?.getBoundingClientRect()
          .bottom! +
        10 +
        'px',
      class: 'help-left-bottom-step',
    },
    {
      icon: <AiOutlineMinus className="help-icon" />,
      title: t('zoomOutTitle'),
      description: t('zoomOutDescription'),
      left: true,
      positionX: '80px',
      top: false,
      positionY:
        screenHeight -
        document.getElementById('menu-zoom-out')?.getBoundingClientRect()
          .bottom! +
        10 +
        'px',
      class: 'help-left-bottom-step',
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
      positionY: '225px',
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
      positionY: '225px',
      class: 'help-bottom-right-step',
    },
  ])

  // reset position of last 2 steps
  useEffect(() => {
    steps[steps.length - 2].positionX =
      document.getElementById('bottom-bar-left')?.getBoundingClientRect().x! +
      8 +
      'px'
    steps[steps.length - 1].positionX =
      screenWidth -
      document.getElementById('bottom-bar-right')?.getBoundingClientRect()
        .right! +
      8 +
      'px'
  }, [screenWidth])

  return (
    <div className="help-container">
      <div
        className={steps[index].class}
        style={
          steps[index].top
            ? { top: steps[index].positionY, left: steps[index].positionX }
            : steps[index].left
            ? { bottom: steps[index].positionY, left: steps[index].positionX }
            : { bottom: steps[index].positionY, right: steps[index].positionX }
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {steps[index].icon}
          <span className="help-title">{steps[index].title}</span>
        </div>
        <p
          className="help-description"
          dangerouslySetInnerHTML={{ __html: steps[index].description }}
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
              index + 1 > steps.length - 1
                ? setShowHelp(false)
                : setIndex(Math.min(index + 1, steps.length - 1))
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
