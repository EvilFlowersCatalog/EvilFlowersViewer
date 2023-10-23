import { useState } from 'react'
import { BiSmile } from 'react-icons/bi'
import { RgbaColorPicker } from 'react-colorful'

/**
 * Shows the sidebar component for annotation creation
 * @returns - The sidebar component for annotation creation
 */
const Pen = () => {
  const [penButtons, setPenButtons] = useState<{ icon: JSX.Element }[]>([
    {
      icon: <BiSmile className="viewer-button-icon" />,
    },
    {
      icon: <BiSmile className="viewer-button-icon" />,
    },
    {
      icon: <BiSmile className="viewer-button-icon" />,
    },
    {
      icon: <BiSmile className="viewer-button-icon" />,
    },
    {
      icon: <BiSmile className="viewer-button-icon" />,
    },
    {
      icon: <BiSmile className="viewer-button-icon" />,
    },
    {
      icon: <BiSmile className="viewer-button-icon" />,
    },
    {
      icon: <BiSmile className="viewer-button-icon" />,
    },
  ])
  const [color, setColor] = useState({ r: 200, g: 150, b: 35, a: 0.5 })

  return (
    <div className="pen-container">
      <div className="pen-buttons-container">
        {penButtons.map(({ icon }) => (
          <div className="viewer-button">{icon}</div>
        ))}
      </div>
      <div className="pen-changers-container">
        <RgbaColorPicker color={color} onChange={setColor} />;
      </div>
    </div>
  )
}
export default Pen
