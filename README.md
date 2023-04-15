# EvilFlowersViewer - PDF Viewer based on pdf.js

## Introduction

EvilFlowersViewer is a PDF viewer based on pdf.js library that allows users to view and interact with PDF documents directly in the browser. This project is being developed by a university team, and aims to provide a reliable and efficient PDF viewer that is easy to use and customize.

## Features
  - PDF document rendering directly in the browser
  - Zoom in and out of documents
  - Page navigation through a page thumbnail view
  - Text search within documents
  

### Features Under Development
  - Citation export
  - Customizable user interface with themes
  - Annotation tools for highlighting and commenting on text
  - and more...

## Getting started

To get started with EvilFlowersViewer, follow these steps:

1. Install EvilFLowersViewerPackage:

```bash
npm install @evilflowers/evilflowersviewer
```

2. Import the Viewer component into your project:

```ts
import { Viewer } from '@evilflowers/evilflowersviewer'
import '@evilflowers/evilflowersviewer/dist/style.css'
```

3. Use Viewer component in your JSX:


```tsx
const MyPdfWrapper = (props) => {
  return (
    <Viewer data={base64Data} />
  )
}
```

### Demo

Check out our [demo](https://tp2022-t16.evilflowers.org/demo) for an interactive demo of EvilFlowersViewer. On the demo page, you can see how the project was developed through different sprints, with detailed documentation and descriptions of each sprint goal and task. You can also explore the different features of EvilFlowersViewer.

## Contributing

We welcome contributions from the community to help make EvilFlowersViewer even better. To contribute, please follow these steps:

1. Fork the EvilFlowersViewer repository
2. Create a new branch for your changes
3. Make your changes and commit them with a clear commit message
4. Push your changes to your forked repository
5. Create a pull request to merge your changes into the main EvilFlowersViewer repository