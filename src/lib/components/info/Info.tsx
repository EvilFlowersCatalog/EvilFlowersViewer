import { ReactNode, useEffect, useState } from 'react'
import { useDocumentContext } from '../document/DocumentContext'
import { useTranslation } from 'react-i18next'

interface IPdfMetadataProps {
  Author?: string
  Title?: string
  Pages?: number
  CreationDate?: string
  ModificationDate?: string
  Description?: string
  Identificator?: number
  Creator?: string
  Keywords?: string
  Producer?: string
  Subject?: string
  PDFFormatVersion?: string
}

interface IInfoRowProps {
  title: ReactNode
  value: ReactNode
}

const InfoRow = ({ title, value }: IInfoRowProps) => (
  <div className={'info-container'}>
    <span className={'info-title'}>{title}</span>
    <span className={'info-content'}>{value}</span>
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
    Author: metadata?.Author,
    Title: metadata?.Title,
    Pages: metadata?.Pages,
    CreationDate: metadata?.CreationDate,
    ModificationDate: metadata?.ModDate,
    Description: metadata?.Description,
    Identificator: metadata?.Identificator,
    Creator: metadata?.Creator,
    Keywords: metadata?.Keywords,
    Producer: metadata?.Producer,
    Subject: metadata?.Subject,
    PDFFormatVersion: metadata?.PDFFormatVersion,
  }

  const formatDate = (dateString: string): string => {
    const year = Number(dateString.substring(2, 4))
    const month = Number(dateString.substring(6, 2)) - 1
    const day = Number(dateString.substring(8, 2))
    const hour = Number(dateString.substring(10, 2))
    const minute = Number(dateString.substring(12, 2))
    const second = Number(dateString.substring(14, 2))
    const newDate = new Date(year, month, day, hour, minute, second)
    return newDate.toLocaleString([], {
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

  useEffect(() => {
    pdf
      ?.getMetadata()
      .then((meta: any) => {
        if (meta.info.CreationDate.substr(0, 2) == 'D:') {
          const creationDateString = meta.info.CreationDate
          const formattedCreationDate = formatDate(creationDateString)
          meta.info.CreationDate = formattedCreationDate
        }
        if (meta.info.ModDate.substr(0, 2) == 'D:') {
          const modDateString = meta.info.ModDate
          const formattedCreationDate = formatDate(modDateString)
          meta.info.ModDate = formattedCreationDate
        }
        setMetadata(meta.info)
      })
      .catch((err) => {
        console.error(err)
      })
  }, [pdf])

  return (
    <>
      {Object.keys(result)
        .filter((key) => result[key as keyof IPdfMetadataProps])
        .map((key) => (
          <InfoRow
            key={key}
            title={t(key)}
            value={result[key as keyof IPdfMetadataProps]}
          />
        ))}
    </>
  )
}
export default Info
