import { ReactNode, useEffect, useState } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import { useTranslation } from 'react-i18next'

interface IInfoProps {}

interface IPdfMetadataProps {
  title?: string
  pages?: number
  creationDate?: string
  description?: string
  identificator?: number
  author?: string
}

interface IInfoRowProps {
  title: ReactNode
  value: ReactNode
}

const InfoRow = ({ title, value }: IInfoRowProps) => (
  <div className={'mx-4'}>
    <div className={'flex flex-col'}>
      <span className={'text-xs text-gray-400 dark:text-gray-500'}>{title}</span>
      <span className={'text-sm dark:text-gray-300'}>{value}</span>
    </div>
  </div>
)

/**
 * Shows the document information based on metadata from the document
 * in a sidebar component
 * 
 * @param param0 - props
 * @param param0.setActiveSidebar - function to set sidebar state
 
 * @returns - The document information sidebar component
 */
const Info = () => {
  const { t } = useTranslation()
  const { pdf } = useDocumentContext()
  const [metadata, setMetadata] = useState<any>([])

  const result: IPdfMetadataProps = {
    title: metadata?.Title,
    pages: metadata?.Pages,
    // TODO parse date into readable format
    creationDate: metadata?.CreationDate,
    description: metadata?.Description,
    identificator: metadata?.Identificator,
    author: metadata?.Author,
  }

  useEffect(() => {
    pdf
      ?.getMetadata()
      .then((meta) => {
        setMetadata(meta.info)
      })
      .catch((err) => {
        console.error(err)
      })
  }, [pdf])

  return (
    <div className={'flex flex-col'}>
      {Object.keys(result)
        .filter((key) => result[key as keyof IPdfMetadataProps])
        .map((key) => (
          <InfoRow
            key={key}
            title={t(key)}
            value={result[key as keyof IPdfMetadataProps]}
          />
        ))}
    </div>
  )
}
export default Info
