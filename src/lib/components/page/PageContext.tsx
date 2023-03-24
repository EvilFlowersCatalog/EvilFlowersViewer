import { createContext } from 'react'

interface IPageContext {}

export default createContext<IPageContext | null>(null)
