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
  - Select wanted pages (1, 3-5, 10) or none (means whole document)
  - Choose lifespan expectancy (1 day, 7 days, 30 days)
  - Click on share where your function will take care of given inputs
  - Your function returns link for your shared document
  - Our viewer will generate QR Code of given link
- Citation export in BibTeX, BibLaTeX, RIS and bibliography
- Changing themes

## Features Under Development

- Annotation tools for highlighting and commenting on text
- Editing with pen
- and more...

## Getting started

To get started with EvilFlowersViewer, follow these steps:

1. Install EvilFLowersViewerPackage:

```bash
npm install @evilflowers/evilflowersviewer
```

2. Update your project architecture (.json)

```json
"architect": {
    "build": {
        "options": {
            "assets": [
                {
                    "glob": "**/*",
                    "input": "node_modules/@evilflowers/evilflowersviewer/dist/assets/",
                    "output": "/assets/"
                }
            ],
            "styles": [
                "node_modules/@evilflowers/evilflowersviewer/dist/styles.css"
            ]
        }
    }
}
```

3. Import the renderViewer function into your project:

```ts
import { renderViewer } from '@evilflowers/evilflowersviewer'
```

4. Use renderViewer function:

```tsx
renderViewer(rootId, base64, options)
```

| Input                     | Description                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------- |
| rootId                    | id of your component where you use renderViewer func                                |
| base64                    | string that contains base64 formatt of pdf                                          |
| options                   | not required object consisting of theme, lang, citationBib, shareFunction           |
| options.theme             | 'dark' or 'light'                                                                   |
| options.lang              | 'sk' or 'en'                                                                        |
| options.citationBib       | string containing bib citation of given document examaple: '@article{name,\n ....}' |
| options.shareFunction     | type: (pages: string / null, expaireDate: string) => Promise<string>                |
| options.homeFunction      | type: () => void                                                                    |
| shareFunction.pages       | string containing selected pages (1,3-6,10) or null (means it's empty)              |
| shareFunction.expaireDate | string containing lifespan of shared document, the end. ISO                         |
| shareFunction => return   | link for your shared document as string                                             |

## Examples

Examples of functions shareFunction and homeFunction

1. shareFunction:

```ts
private shareFunction = async (pages: string | null, expireDate: string) => {
    // creat whatever object
    const yourObject = {
      range: pages,
      expires_at: expireDate,
    };
    let link = '';

    // yout endpoint
    await this.yourService
      .yourFunction(yourObject)
      .toPromise()
      .then((res) => {
        link = res.url;
      })
      .catch((err) => {
        console.log('Error:', err);
      });

    // returned your link
    return link;
  };
```

2. homeFunction:

```ts
private homeFunction = () => {
    this.router.navigateByUrl('/path-to/whatever-you-want');
};
```

## Contributing

We welcome contributions from the community to help make EvilFlowersViewer even better. To contribute, please follow
these steps:

1. Fork the EvilFlowersViewer repository
2. Create a new branch for your changes
3. Make your changes and commit them with a clear commit message
4. Push your changes to your forked repository
5. Create a pull request to merge your changes into the main EvilFlowersViewer repository
