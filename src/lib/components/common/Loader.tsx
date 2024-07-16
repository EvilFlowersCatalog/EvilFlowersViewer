interface ILoaderProps {
  size: number
}

const Loader = ({ size }: ILoaderProps) => {
  return (
    <div style={{ height: size + 'px', width: size + 'px' }}>
      <div className="efw-w-full efw-h-full efw-border-4 efw-border-black dark:efw-border-white efw-border-t-4 efw-border-t-blue-dark dark:efw-border-t-blue-dark efw-rounded-full efw-animate-spin"></div>
    </div>
  )
}

export default Loader
