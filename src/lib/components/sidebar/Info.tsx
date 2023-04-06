import { useEffect, useState } from 'react'
import { SIDEBAR_TABS } from '../../../utils/enums'
import { useDocumentContext } from '../document/DocumentContext'

interface IInfoProps {
  setActiveSidebar: (bool: any) => void
}

interface IPdfMetadataProps {
  title: string
  pages: number
  creationDate: string
  description: string
  identificator: number
  author: string
}

/**
 * Shows the document information based on metadata from the document
 * in a sidebar component
 * 
 * @param param0 - props
 * @param param0.setActiveSidebar - function to set sidebar state
 
 * @returns - The document information sidebar component
 */
const Info = ({ setActiveSidebar }: IInfoProps) => {
  const { pdf } = useDocumentContext()
  const [metadata, setMetadata] = useState<any>([])

  const handleClick = () => {
    setActiveSidebar(SIDEBAR_TABS.NULL)
  }

  const result: IPdfMetadataProps = {
    title: metadata?.Title ?? 'No title',
    pages: metadata?.Pages ?? 0,
    creationDate: metadata?.CreationDate ?? 'No creation date',
    description: metadata?.Description ?? 'No description',
    identificator: metadata?.Identificator ?? 0,
    author: metadata?.Author ?? 'No author',
  }

  useEffect(() => {
    pdf?.getMetadata().then((meta) => {
      setMetadata(meta.info)
    })
    .catch((err) => {
      console.error(err)
    }
    )
  }, [pdf])

  return (
    <div className="w-30 h-screen bg-blue-200 fixed top-200 x-100 y-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 z-10 overflow-auto">
        <button
          className="px-30 py-2 text-lg text-black bg-blue-100 rounded-md hover:bg-blue-500 mr-1"
          onClick={handleClick}
        ></button>
      <div className="bg-blue-100 rounded-lg p-4">
        <div className="flex flex-row">
          <div className="font-bold w-28">Title:</div>
          <div className="font-medium">{result.title}</div>
        </div>
      </div>
      <div className="bg-blue-100 rounded-lg p-4">
        <div className="flex flex-row">
          <div className="font-bold w-28">Pages:</div>
          <div className="font-medium">{result.pages}</div>
        </div>
      </div>
      <div className="bg-blue-100 rounded-lg p-4">
        <div className="flex flex-row">
          <div className="font-bold w-28">Date:</div>
          <div className="font-medium">{result.creationDate}</div>
        </div>
      </div>
      <div className="bg-blue-100 rounded-lg p-4">
        <div className="flex flex-row">
          <div className="font-bold w-28">Description:</div>
          <div className="font-medium">{result.description}</div>
        </div>
      </div>
      <div className="bg-blue-100 rounded-lg p-4">
        <div className="flex flex-row">
          <div className="font-bold w-28">Identificator:</div>
          <div className="font-medium">{result.identificator}</div>
        </div>
      </div>
      <div className="bg-blue-100 rounded-lg p-4">
        <div className="flex flex-row">
          <div className="font-bold w-28">Author:</div>
          <div className="font-medium">{result.author}</div>
        </div>
      </div>
    </div>
  )
}
export default Info
