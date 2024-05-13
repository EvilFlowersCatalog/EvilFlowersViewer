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

/**
 *
 * @returns The App component that renders the Viewer component
 */
export function App() {
  return (
    <div className="App">
      <Viewer data={null} options={inputOptions} />
    </div>
  )
}

export default App
