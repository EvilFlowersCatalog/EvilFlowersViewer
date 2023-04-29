import { ReactNode, useEffect, useState } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import { useTranslation } from 'react-i18next'

interface IInfoProps {}

interface IPdfMetadataProps {
  author?: string
  title?: string
  pages?: number
  creationDate?: string
  description?: string
  identificator?: number
  //TODO: first letter should be lowercase, this has been changed to uppercase just to make it work for the preview
  Creator?: string
  Keywords?: string
  Producer?: string
}

interface IInfoRowProps {
  title: ReactNode
  value: ReactNode
}

const InfoRow = ({ title, value }: IInfoRowProps) => (
  <div className={'mx-4'}>
    <div className={'flex flex-col'}>
      <span className={'text-xs text-gray-400 dark:text-gray-500'}>
        {title}
      </span>
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

  let result: IPdfMetadataProps = {
    author: metadata?.Author,
    title: metadata?.Title,
    pages: metadata?.Pages,
    // TODO parse date into readable format
    creationDate: metadata?.CreationDate,
    description: metadata?.Description,
    identificator: metadata?.Identificator,
    Creator: metadata?.Creator,
    Keywords: metadata?.Keywords,
    Producer: metadata?.Producer,
  }

  useEffect(() => {
    pdf
      ?.getMetadata()
      .then((meta: any) => {
        //formatting of date
        if (meta.info.CreationDate.substr(0, 2) == 'D:') {
          const dateString = meta.info.CreationDate
          const year = Number(dateString.substr(2, 4))
          const month = Number(dateString.substr(6, 2)) - 1
          const day = Number(dateString.substr(8, 2))
          const hour = Number(dateString.substr(10, 2))
          const minute = Number(dateString.substr(12, 2))
          const second = Number(dateString.substr(14, 2))
          const date = new Date(year, month, day, hour, minute, second)
          meta.info.CreationDate = date.toLocaleString([], {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            timeZoneName: 'short',
          })
        }
        setMetadata(meta.info)
        console.log(meta.info)
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
