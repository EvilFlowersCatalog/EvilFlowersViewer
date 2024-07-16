import { Circle } from '@uiw/react-color'
import { useState } from 'react'
import { useDocumentContext } from '../../../../hooks/useDocumentContext'
import useViewerContext from '../../../../hooks/useViewerContext'

const EditColors = () => {
  const [colors] = useState<string[]>([
    '#000000',
    '#ffffff',
    '#808080',
    '#00bcd4',
    '#2196f3',
    '#3f51b5',
    '#673ab7',
    '#9c27b0',
    '#e91e63',
    '#ff0000',
    '#ff5722',
    '#ff9800',
    '#ffc107',
    '#ffeb3b',
    '#cddc39',
    '#8bc34a',
    '#009688',
    '#795548',
  ])

  const { editHexColor, setEditHexColor } = useDocumentContext()
  const { theme } = useViewerContext()

  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <div
        className={`rounded-md h-10 w-10 border-2 border-black dark:border-white border-opacity-50`}
        style={{ backgroundColor: editHexColor }}
      ></div>
      <Circle
        className="flex mt-4 w-60"
        colors={colors}
        color={editHexColor}
        pointProps={{
          style: {
            marginRight: 10,
            marginBottom: 10,
            border:
              theme === 'dark'
                ? '2px solid rgba(255, 255, 255, 0.5)'
                : '2px solid rgba(0, 0, 0, 0.5)',
            padding: 12,
          },
        }}
        onChange={(color) => setEditHexColor(color.hex)}
      />
    </div>
  )
}

export default EditColors
