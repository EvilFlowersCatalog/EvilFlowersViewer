import { Viewer } from './lib/components/Viewer'
import { pdf_data } from './examples/pdf/latexSamplePDF'
import { exampleShareFunction } from './examples/function/sharedFunction'
import { saveFunction, layersFunction } from './examples/function/editFunctions'
import { exampleCitation } from './examples/citation/citation'

const homeFunction = () => {
  console.log('home')
}

interface IExample {
  theme?: 'dark' | 'light'
  lang?: string
  citationBib?: string | null
  shareFunction?:
    | ((pages: string | null, expaireDate: string) => Promise<string>)
    | null
  homeFunction?: (() => void) | null
  saveFunction?: ((svg: HTMLElement, name: string) => void) | null
  layersFunction?: ((page: number) => void) | null
}

const inputOptions: IExample = {
  citationBib: exampleCitation,
  shareFunction: exampleShareFunction,
  homeFunction: homeFunction,
  saveFunction: saveFunction,
  layersFunction: layersFunction,
  // theme: 'light',
  lang: 'en',
}

interface IZoteroExample {
  title: string
  year?: string
  journalTitle?: string
  firstPage?: number
  lastPage?: number
  publisher?: string
  doi?: string
  isbn?: string
  abstract?: string
  authors: string
  pdfUrl: string
}
const zoteroExample: IZoteroExample = {
  title: 'nieco',
  year: '2000',
  journalTitle: 'nieco',
  doi: '20nieco',
  abstract: 'Totot je test zotera',
  authors: 'Jozef, nieco; Ahoj, janko',
  firstPage: 1,
  lastPage: 99,
  publisher: 'Evil flowers',
  pdfUrl: 'https://nieco.com',
}

/**
 *
 * @returns The App component that renders the Viewer component
 */
export function App() {
  return (
    <div className="App">
      <Viewer data={pdf_data} options={inputOptions} zotero={zoteroExample} />
    </div>
  )
}

export default App
