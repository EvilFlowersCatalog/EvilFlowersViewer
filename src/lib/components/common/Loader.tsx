interface ILoaderProps {
  size: number
}

const Loader = ({ size }: ILoaderProps) => {
  return (
    <div style={{ height: size + 'px', width: size + 'px' }}>
      <div className="w-full h-full border-4 border-black dark:border-white border-t-4 border-t-blue-dark dark:border-t-blue-dark rounded-full animate-spin"></div>
    </div>
  )
}

export default Loader
