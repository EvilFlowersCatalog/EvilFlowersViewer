import { createContext } from 'react'

interface IPageContext {}

/**
 * Context for the Page component
 * 
 */
export default createContext<IPageContext | null>(null)
