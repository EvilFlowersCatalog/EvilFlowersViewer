// create loader (spinning wheel)
const loader = document.createElement('div')
loader.setAttribute(
  'class',
  'w-10 h-10 border-2 border-black dark:border-white border-t-2 border-t-blue-dark dark:border-t-blue-dark rounded-full animate-spin'
)

export default loader
