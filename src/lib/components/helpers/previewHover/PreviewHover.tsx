import { ReactNode, useCallback, useEffect, useState } from 'react'
import cx from 'classnames'
import { useDocumentContext } from '../../document/DocumentContext'

interface IPreviewHover {
  pageNumber: number
  children: ReactNode
  right: number
}

const PreviewHover = ({ pageNumber, children, right }: IPreviewHover) => {
  const [visible, setVisible] = useState(false)
  let canSet = false
  const { pdf, screenWidth } = useDocumentContext()

  const renderPage = useCallback(async () => {
    const doc = document.getElementById('preview-page-show' + pageNumber)!
    return await new Promise((resolve) => {
      pdf?.getPage(pageNumber).then((page) => {
        let desiredHeight = window.outerHeight * 0.6
        let viewport = page.getViewport({ scale: 1 })
        let scale = desiredHeight / viewport.height
        viewport = page.getViewport({ scale: scale })

        const canvas = document.createElement('canvas')
        canvas.setAttribute('style', 'border-radius: 10px;')
        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.width = viewport.width + 'px'
        canvas.style.height = viewport.height + 'px'
        const context = canvas.getContext('2d')

        const renderContext = {
          canvasContext: context as Object,
          viewport: viewport,
        }
        const renderTask = page.render(renderContext)
        renderTask.promise.then(() => {
          doc.replaceChildren(canvas)
        })
      })
    })
  }, [])

  useEffect(() => {
    renderPage()
  }, [])

  return (
    <div
      onMouseEnter={() => {
        canSet = true
        setTimeout(() => {
          if (canSet) {
            setVisible(true)
          }
        }, 500)
      }}
      onMouseLeave={() => {
        canSet = false
        setVisible(false)
      }}
    >
      <div
        className={cx('preview-hover-container', {
          'preview-hover-container-visible': visible,
          'preview-hover-container-hidden': !visible,
        })}
        style={right !== 0 ? { right: right + 'px' } : {}}
      >
        <div id={'preview-page-show' + pageNumber}></div>
      </div>
      {children}
    </div>
  )
}

export default PreviewHover
