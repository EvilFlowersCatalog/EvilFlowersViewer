import { Viewer } from './lib/components/Viewer'
//import { pdf_data } from './examples_PDF/samplePDF'
import { pdf_data } from './examples_PDF/latexSamplePDFdamaged'

/**
 *
 * @returns The App component that renders the Viewer component
 */
export function App() {
  return (
    <div className="App">
      <Viewer data={pdf_data} />
    </div>
  )
}

export default App
