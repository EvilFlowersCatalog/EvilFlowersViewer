export const base64ToBinary = (base64: string) => {
  let [headers, data] = base64.split(',')
  if(!data) data = headers

  let binaryArray = new Uint8Array(data.length)
  let raw

  try {
    raw = atob(data)
  } catch (error) {
    return null
  }

  try {
    for(let i = 0; i < raw.length; i++) {
      binaryArray[i] = raw.charCodeAt(i)
    }
  } catch (error) {
    return null
  }

  return raw
}