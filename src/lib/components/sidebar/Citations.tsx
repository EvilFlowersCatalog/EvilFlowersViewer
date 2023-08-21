import { SIDEBAR_TABS } from '../../../utils/enums'

interface ICitationsProps {
  setActiveSidebar: (bool: any) => void
}

/**
 * Component for citation generation modal
 * 
 * @param param0 - props
 * @param param0.setActiveSidebar - function to set active sidebar
 * @returns - Citaitons component
 * 
 */
const Citations = ({ setActiveSidebar }: ICitationsProps) => {
  const handleClick = () => {
    setActiveSidebar(SIDEBAR_TABS.NULL)
  }

  return (
    <div
      className={
        'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-60 h-60 bg-purple-200'
      }
    >
      <button
        onClick={handleClick}
        className={'w-10 h-10 bg-blue-200 float-right'}
      ></button>
    </div>
  )
}
export default Citations
