import { Circle } from '@uiw/react-color'
import { useState } from 'react'
import { useDocumentContext } from '../../../DocumentContext'

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

  return (
    <Circle
      className="edit-colors-container"
      colors={colors}
      color={editHexColor}
      onChange={(color) => setEditHexColor(color.hex)}
    />
  )
}

export default EditColors
