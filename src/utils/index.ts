import { DEBOUNCE_TIMEOUT } from './enums'

export const debounce = (func: any, timeout = DEBOUNCE_TIMEOUT) => {
  let timer: any
  return (...args: any) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, timeout)
  }
}

export * from './base64'
