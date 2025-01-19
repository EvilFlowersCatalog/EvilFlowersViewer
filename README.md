# EvilFlowersViewer

PDF Viewer based on pdf.js

## Introduction

EvilFlowersViewer is a PDF viewer based on pdf.js library that allows users to view and interact with PDF documents
directly in the browser. This project is being developed by a university team, and aims to provide a reliable and
efficient PDF viewer that is easy to use and customize.

## Features

- PDF document rendering directly in the browser
- Zoom in and out of documents
- Page navigation through a page thumbnail view
- Text search within documents
- Share the entire document or with selected pages
- Citation export in BibTeX, BibLaTeX, RIS and bibliography
- Print the entire document or with selected pages
- Downdload document
- Changing themes
- Fullscreen mode
- Editing document

## Features Under Development

## Getting started

To get started with EvilFlowersViewer, follow these steps:

1. Install EvilFLowersViewerPackage:

```bash
npm install @evilflowers/evilflowersviewer
```

2. Import the renderViewer function into your project:

```ts
import { renderPDFViewer } from '@evilflowers/evilflowersviewer';
```

3. Use renderViewer function:

```tsx
renderPDFViewer(rootId, base64, options, config);
```

# Viewer Options and Properties Documentation

| Input                         | Description                                                                         |
| -------------------------     | ----------------------------------------------------------------------------------- |
| rootId                        | ID of your component where you use the `renderViewer` function.                     |
| base64                        | String containing the Base64 format of the PDF.                                     |
| options                       | Optional object consisting of theme, language, citationBib, homeFunction, etc.      |
| options.theme                 | 'dark' or 'light'. Determines the viewer's theme.                                   |
| options.lang                  | 'sk' or 'en'. Specifies the language of the viewer.                                 |
| options.citationBib           | String or null. Contains the citation of the document (e.g., `@article{name, ...}`). |
| options.homeFunction          | Function (type: `() => void`) or null. Redirects to the home view.                  |
| options.closeFunction         | Function (type: `() => void`) or null. Closes the viewer.                           |
| options.shareFunction         | Function (type: `(pages: string | null, expaireDate: string) => Promise<string>`) or null. Generates a shareable link for the document. |
| shareFunction.pages           | String with selected pages (e.g., '1,3-6,10') or null (indicating no pages).        |
| shareFunction.expaireDate     | ISO string specifying the lifespan of the shared document.                          |
| shareFunction => return       | Returns a string containing the link to the shared document.                        |
| options.printFunction         | Function (type: `(pages: string | null) => Promise<string>`) or null. Generates a printable version of the selected pages. |
| options.editPackage           | Optional object for managing edit features, containing the following functions:     |
| editPackage.saveGroupFunc     | Function (type: `(name: string) => Promise<{ response: { id: string } }>`). Saves a new group and returns its ID. |
| editPackage.getGroupsFunc     | Function (type: `() => Promise<{ id: string; name: string }[]>`). Retrieves all available groups. |
| editPackage.saveLayerFunc     | Function (type: `(svg: string, groupId: string, page: number) => Promise<ILayer | null>`). Saves a new layer to a group on a specific page. |
| editPackage.updateLayerFunc | Function (type: `(id: string, svg: string, groupId: string, page: number) => Promise<void>`). Updates an existing layer in a group on a specific page. |
| editPackage.getLayerFunc  | Function (type: `(page: number, groupId: string) => Promise<ILayer | null> | null`). Retrieves a layer from a group on a specific page. |
| config                    | Optional configuration object controlling viewer features.                          |
| config.download           | Boolean. Enables or disables the download feature.                                  |
| config.share              | Boolean. Enables or disables the share feature.                                     |
| config.print              | Boolean. Enables or disables the print feature.                                     |
| config.edit               | Boolean. Enables or disables the edit feature.                                      |



## Contributing

We welcome contributions from the community to help make EvilFlowersViewer even better. To contribute, please follow
these steps:

1. Fork the EvilFlowersViewer repository
2. Create a new branch for your changes
3. Make your changes and commit them with a clear commit message
4. Push your changes to your forked repository
5. Create a pull request to merge your changes into the main EvilFlowersViewer repository

## Acknowledgment

This open-source project is maintained by students and PhD candidates of the
[Faculty of Informatics and Information Technologies](https://www.fiit.stuba.sk/) at the Slovak University of
Technology. The software is utilized by the university, aligning with its educational and research activities. We
appreciate the faculty's support of our work and their contribution to the open-source community.

![](docs/images/fiit.png)
