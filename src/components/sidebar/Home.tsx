import React from 'react'

interface ChildProps {
  setHomeIconClicked: (bool: any) => void
}

const Home: React.FC<ChildProps> = (props: any) => {
  const handleClick = () => {
    props.setHomeIconClicked(false)
    console.log('home icon clicked')
  }

  return (
    <div
      className={
        'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-60 h-60 bg-red-200'
      }
    >
      <button
        onClick={handleClick}
        className={'w-10 h-10 bg-blue-200 float-right'}
      ></button>
    </div>
  )
}
export default Home
