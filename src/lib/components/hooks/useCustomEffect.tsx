import { useEffect, useState } from 'react'

const useCustomEffect = (callback: () => void, dependencies: any[]) => {
  const [initialization, setInitialization] = useState<boolean>(false)

  useEffect(() => {
    // Skip first render
    if (!initialization) {
      setInitialization(true)
      return
    }

    callback()
  }, [...dependencies, initialization])
}

export default useCustomEffect
