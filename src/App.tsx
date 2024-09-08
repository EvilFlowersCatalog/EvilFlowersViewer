import { Viewer } from './lib/components/Viewer'
import pdf from './examples/pdf/Eye Tracking Methodology.pdf'
import { exampleShareFunction } from './examples/function/sharedFunction'
import { exampleCitation } from './examples/citation/citation'
import { useEffect, useState } from 'react'
import { TypedArray } from 'pdfjs-dist/types/src/display/api'
import {
  saveLayerFunc,
  saveGroupFunc,
  updateLayerFunc,
  updateGroupFunc,
  deleteLayerFunc,
  deleteGroupFunc,
  getLayerFunc,
  getGroupsFunc,
} from './examples/function/editPackage'

const homeFunction = () => {
  console.log('home')
}

const App = () => {
  const [data, setData] = useState<TypedArray | null>(null)

  useEffect(() => {
    const fetchAndConvertPDF = async () => {
      try {
        const response = await fetch(pdf)
        const arrayBuffer = await response.arrayBuffer()
        const typedArray = new Uint8Array(arrayBuffer)
        setData(typedArray)
      } catch (error) {
        setData(null)
      }
    }

    fetchAndConvertPDF()
  }, [])

  return (
    <Viewer
      data={data}
      options={{
        citationBib: exampleCitation,
        shareFunction: exampleShareFunction,
        homeFunction: homeFunction,
        editPackage: {
          saveLayerFunc,
          saveGroupFunc,
          updateLayerFunc,
          updateGroupFunc,
          deleteLayerFunc,
          deleteGroupFunc,
          getLayerFunc,
          getGroupsFunc,
        },
        lang: 'sk',
      }}
      config={{
        edit: false,
        download: true,
        print: true,
        share: true,
      }}
    />
  )
}

export default App
