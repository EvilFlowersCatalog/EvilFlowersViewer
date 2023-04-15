import { Viewer } from './lib/components/Viewer'
//import { pdf_data } from './examples_PDF/samplePDF'
import { pdf_data } from './examples_PDF/outlinedSamplePDF'

export function App() {
  return (
    <div className="App">
      <Viewer data={pdf_data} />
    </div>
  )
}

export default App
