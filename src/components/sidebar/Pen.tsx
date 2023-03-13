import { SIDEBAR_TABS } from '../../utils/enums'

interface IPenProps {
  setActiveSidebar: (bool: any) => void
}

const Pen = ({ setActiveSidebar }: IPenProps) => {
  const handleClick = () => {
    setActiveSidebar(SIDEBAR_TABS.NULL)
  }

  return (
    <div
      className={
        'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-60 h-60 bg-red-200'
      }
    >
      <button
        onClick={handleClick}
        className={'w-10 h-10 bg-purple-200 float-right'}
      ></button>
    </div>
  )
}
export default Pen
