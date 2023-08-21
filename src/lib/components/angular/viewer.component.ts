import { AfterViewInit, Component, OnChanges } from '@angular/core'
import App from '../../App'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'

@Component({
  selector: 'app-my-component',
  template: `<div [id]="rootId"></div>`,
})

/**
 * This is a wrapper component that will render the React component
 * in the Angular component.
 * 
 */
export class AppWrapperComponent implements OnChanges, AfterViewInit {
  public rootId = 'feeling-form-root'
  private hasViewLoaded = false

  public ngOnChanges() {
    console.log('test changed')
    this.renderComponent()
  }

  public ngAfterViewInit() {
    console.log('test init')
    this.hasViewLoaded = true
    this.renderComponent()
  }

  private renderComponent() {
    console.log('test render')
    if (!this.hasViewLoaded) {
      return
    }

    const root = createRoot(document.getElementById(this.rootId)!)
    root.render(createElement(App))
    console.log('test rendered')
  }
}
