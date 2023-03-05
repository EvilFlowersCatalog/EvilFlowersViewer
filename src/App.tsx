import Viewer from './components/Viewer'
import { pdf_data } from './examples_PDF/samplePDF'

export function App() {
  return (
    <div className="App">
      <Viewer data={pdf_data} />
    </div>
  )
}

export default App