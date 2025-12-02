// 'use client'
import React from 'react'

export const ViewportContext = React.createContext({})

const ViewportProvider = ({ children }) => {
  const [width, setWidth] = React.useState(0)
  const [height, setHeight] = React.useState(0)

  const handleWindowResize = () => {
    setWidth(window.innerWidth)
    setHeight(window.innerHeight)
  }

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      handleWindowResize()
      // Your client-side code that uses window goes here
    }
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [])

  return <ViewportContext.Provider value={{ width, height }}>{children}</ViewportContext.Provider>
}

export default ViewportProvider
