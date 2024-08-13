import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useDocumentContext } from '../hooks/useDocumentContext'
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
import useViewerContext from '../hooks/useViewerContext'
import { LuLayers } from 'react-icons/lu'

const Help = () => {
  const { t } = useTranslation()
  const { setShowHelp, theme, homeFunction, shareFunction, editPackage } =
    useViewerContext()
  const { screenWidth, screenHeight, TOC, pdfCitation } = useDocumentContext()
  const [index, setIndex] = useState(homeFunction ? 0 : editPackage ? 1 : 2)
  const [indexPosition, setIndexPosition] = useState(0)
  const [yPositions] = useState<string[]>([
    '23px', // Home
    '59px', // Layer
    '92px', // Search
    '127px', // Citation
    '163px', // TOC
    '198px', // Share
    '232px', // Info
    '267px', // Help
    '303px', // Theme change
    '338px', // Download
    '373px', // Zoom In
    '407px', // Zoom out
  ])

  // css for each type of help step
  const [tailwindcss] = useState<{ [key: string]: string }>({
    container:
      'efw-fixed efw-w-1/4 efw-min-w-[180px] efw-h-fit efw-bg-blue-dark efw-border-2 efw-border-white efw-rounded-tr-md efw-rounded-b-md efw-p-2.5 efw-flex efw-flex-col efw-justify-between efw-select-none efw-animate-blinking before:efw-animate-blinking',
    'left-step': `befor:efw-content-[''] before:efw-absolute before:-efw-top-0.5 before:-efw-left-[42px] before:efw-w-10 before:efw-border-b-2 before:efw-border-blue-dark`,
    'bottom-right-step': `efw-rounded-md efw-rounded-br-none befor:efw-content-[''] before:efw-absolute before:-efw-bottom-10 before:-efw-right-0.5 before:efw-h-[45px] before:efw-border-l-2 before:efw-border-blue-dark`,
    'bottom-left-step': `efw-rounded-md efw-rounded-bl-none befor:efw-content-[''] before:efw-absolute before:-efw-bottom-10 before:-efw-left-0.5 before:efw-h-[45px] before:efw-border-l-2 before:efw-border-blue-dark`,
  })
  const [steps] = useState([
    // HOME
    homeFunction
      ? {
          icon: <BiHome size={30} />,
          title: t('homeTitle'),
          description: t('homeDescription'),
          left: true,
          positionX: '80px',
          top: true,
          positionY: '',
          class: `${tailwindcss['container']} ${tailwindcss['left-step']}`,
        }
      : null,
    // LAYERS
    editPackage
      ? {
          icon: <LuLayers size={30} />,
          title: t('layersTitle'),
          description: t('layersDescription'),
          left: true,
          positionX: '80px',
          top: true,
          positionY: '',
          class: `${tailwindcss['container']} ${tailwindcss['left-step']}`,
        }
      : null,
    // SEARCH
    {
      icon: <BiSearch size={30} />,
      title: t('searchTitle'),
      description: t('searchDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY: '',
      class: `${tailwindcss['container']} ${tailwindcss['left-step']}`,
    },
    // CITATION
    pdfCitation
      ? {
          icon: <RxQuote size={30} />,
          title: t('citationTitle'),
          description: t('citationDescription'),
          left: true,
          positionX: '80px',
          top: true,
          positionY: '',
          class: `${tailwindcss['container']} ${tailwindcss['left-step']}`,
        }
      : null,
    // TOC
    TOC && TOC.length > 0
      ? {
          icon: <BiMenuAltLeft size={30} />,
          title: t('tocTitle'),
          description: t('tocDescription'),
          left: true,
          positionX: '80px',
          top: true,
          positionY: '',
          class: `${tailwindcss['container']} ${tailwindcss['left-step']}`,
        }
      : null,
    // SHARE
    shareFunction
      ? {
          icon: <RxShare2 size={30} />,
          title: t('shareTitle'),
          description: t('shareDescription'),
          left: true,
          positionX: '80px',
          top: true,
          positionY: '',
          class: `${tailwindcss['container']} ${tailwindcss['left-step']}`,
        }
      : null,
    // INFO
    {
      icon: <BiInfoCircle size={30} />,
      title: t('infoTitle'),
      description: t('infoDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY: '',
      class: `${tailwindcss['container']} ${tailwindcss['left-step']}`,
    },
    // HELP
    {
      icon: <BiHelpCircle size={30} />,
      title: t('helpTitle'),
      description: t('helpDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY: '',
      class: `${tailwindcss['container']} ${tailwindcss['left-step']}`,
    },
    // THEME
    {
      icon: theme === 'dark' ? <BiMoon size={30} /> : <BiSun size={30} />,
      title: t('themeTitle'),
      description: t('themeDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY: '',
      class: `${tailwindcss['container']} ${tailwindcss['left-step']}`,
    },
    // DOWNLOAD
    {
      icon: <BiDownload size={30} />,
      title: t('downloadTitle'),
      description: t('downloadDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY: '',
      class: `${tailwindcss['container']} ${tailwindcss['left-step']}`,
    },
    // ZOOM IN
    {
      icon: <AiOutlinePlus size={30} />,
      title: t('zoomInTitle'),
      description: t('zoomInDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY: '',
      class: `${tailwindcss['container']} ${tailwindcss['left-step']}`,
    },
    // ZOOM OUT
    {
      icon: <AiOutlineMinus size={30} />,
      title: t('zoomOutTitle'),
      description: t('zoomOutDescription'),
      left: true,
      positionX: '80px',
      top: true,
      positionY: '',
      class: `${tailwindcss['container']} ${tailwindcss['left-step']}`,
    },
    // PREV PAGE
    {
      icon: <AiOutlineLeft size={30} />,
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
      class: `${tailwindcss['container']} ${tailwindcss['bottom-left-step']}`,
    },
    // NEXT PAGE
    {
      icon: <AiOutlineRight size={30} />,
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
      class: `${tailwindcss['container']} ${tailwindcss['bottom-right-step']}`,
    },
  ])

  // Update positions when element change
  useEffect(() => {
    const bounding = document
      .getElementById('bottom-bar-left')
      ?.getBoundingClientRect()!
    steps[steps.length - 1]!.positionX = bounding.x + 8 + 'px'
    steps[steps.length - 1]!.positionY =
      screenHeight - bounding.bottom + 60 + 'px'
  }, [
    document.getElementById('bottom-bar-left')?.getBoundingClientRect().x,
    document.getElementById('bottom-bar-left')?.getBoundingClientRect().bottom,
  ])

  // Update positions when element change
  useEffect(() => {
    const bounding = document
      .getElementById('bottom-bar-right')
      ?.getBoundingClientRect()!
    steps[steps.length - 1]!.positionX = screenWidth - bounding.right + 8 + 'px'
    steps[steps.length - 1]!.positionY =
      screenHeight - bounding.bottom + 60 + 'px'
  }, [
    document.getElementById('bottom-bar-right')?.getBoundingClientRect().right,
    document.getElementById('bottom-bar-right')?.getBoundingClientRect().bottom,
  ])

  return (
    <div className="efw-absolute efw-h-screen efw-w-screen efw-bg-black efw-bg-opacity-50 efw-z-50 efw-flex efw-justify-between efw-pb-12 efw-items-center efw-flex-col efw-overflow-auto">
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
        <div className="efw-flex efw-items-center efw-gap-5 efw-mb-2.5 efw-text-white">
          {steps[index]!.icon}
          <span className="efw-text-lg efw-font-extrabold efw-uppercase efw-italic">
            {steps[index]!.title}
          </span>
        </div>
        <p
          className="efw-text-sm efw-text-white"
          dangerouslySetInnerHTML={{ __html: steps[index]!.description }}
        ></p>
        <div className="efw-flex efw-mt-5 efw-justify-evenly efw-items-center">
          {/* SKIP BUTTON */}
          {index < steps.length - 1 && (
            <button
              className="efw-text-sm efw-font-bold efw-py-1 efw-px-2 efw-text-sky-200 efw-bg-transparent efw-outline-none efw-cursor-pointer efw-border-b-2 efw-border-transparent efw-duration-200 hover:efw-text-white hover:efw-border-white"
              onClick={() => setShowHelp(false)}
            >
              {t('helpSkip')}
            </button>
          )}
          {/* NEXT BUTTON */}
          <button
            className="efw-text-sm efw-font-bold efw-py-1 efw-px-2 efw-text-white efw-bg-transparent efw-rounded-md efw-outline-none efw-cursor-pointer hover:efw-text-blue-dark hover:efw-bg-white efw-duration-200"
            onClick={() => {
              // find next possible step
              let nextIndex = index
              do {
                nextIndex += 1
              } while (
                steps[nextIndex] === null &&
                nextIndex < steps.length - 1
              )
              // if it's not null set index
              steps[nextIndex] === null ? null : setIndex(nextIndex)
              // check if its last step
              nextIndex === steps.length ? setShowHelp(false) : null
              // rise index for YPositions
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
