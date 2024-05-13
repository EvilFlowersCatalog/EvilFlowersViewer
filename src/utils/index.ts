import { DEBOUNCE_TIMEOUT } from './enums'

/**
 * Debounces a function
 *
 * @param func - function to be debounced
 * @param timeout - timeout in ms
 * @returns - debounced function
 */
export const debounce = (func: any, timeout = DEBOUNCE_TIMEOUT) => {
  let timer: any
  return (...args: any) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, timeout)
  }
}
export * from './i18n'
