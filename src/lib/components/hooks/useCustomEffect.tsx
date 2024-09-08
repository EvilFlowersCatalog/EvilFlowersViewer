import { useEffect, useState } from 'react'

const useCustomEffect = (
  callback: () => void | (() => void),
  dependencies: any[]
) => {
  const [initialized, setInitialized] = useState<boolean>(false)

  useEffect(() => {
    // Skip first render
    if (!initialized) {
      setInitialized(true)
      return
    }

    // Execute callback and handle cleanup if provided
    const cleanup = callback()
    return () => {
      if (typeof cleanup === 'function') {
        cleanup()
      }
    }
  }, [initialized, ...dependencies])
}

export default useCustomEffect
