import { TextItem } from 'pdfjs-dist/types/src/display/api'

/**
 * Web worker for full-text search
 */
self.onmessage = (e) => {
  // keep matched string, page number, and information for highlighting: transformation matrix, width and height of text
  let matches: {
    text: string
    page: number
    transform: Array<number>
    width: number
    height: number
  }[] = []
  const pattern = e.data[0] as string
  const textContent = e.data[1] as { textItems: Array<TextItem>; page: number }[]
  const reg = new RegExp('.{0,20}' + pattern + '.{0,20}', 'gimu')
  textContent.sort((a, b) => {
    if (a.page < b.page) return -1
    return 1
  })
  textContent
    .map((content) => {
      content.textItems.map((textItem: any) => {
        const match: RegExpMatchArray | null = textItem.str.match(reg)
        if (match) {
          match.map((text, index) => {

            matches = [
              ...matches,
              {
                page: content.page,
                text: text,
                transform: textItem.transform,
                width: textItem.width,
                height: textItem.height,
              },
            ]
          })
        }
      })
    })
    .filter(Boolean)

  postMessage(matches)
}