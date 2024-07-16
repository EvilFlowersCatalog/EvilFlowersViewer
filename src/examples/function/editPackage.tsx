const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
let nieco =
  '<svg xmlns="http://www.w3.org/2000/svg" width="362" height="549"><rect stroke="#ff0000" opacity="1" stroke-width="16" stroke-linecap="round" fill="none" rx="50%" x="101" y="189" width="167" height="205"></rect></svg>'
let nieco1 =
  '<svg xmlns="http://www.w3.org/2000/svg" width="362" height="549"><rect stroke="#ff0000" opacity="1" stroke-width="16" stroke-linecap="round" fill="none" rx="50%" x="101" y="189" width="167" height="205"></rect></svg>'

export const saveLayerFunc = async (
  svg: HTMLElement,
  groupId: string,
  page: number
) => {
  await delay(2000)
  console.log(svg, 'saved')
}
export const saveGroupFunc = async (name: string) => {
  await delay(2000)

  console.log(name, 'saved')
}
export const updateLayerFunc = async (id: string, svg: HTMLElement) => {
  await delay(2000)

  nieco = svg.outerHTML

  console.log(id, svg, 'updated')
}
export const updateGroupFunc = async (id: string, name: string) => {
  await delay(2000)

  console.log(id, name, 'updated')
}
export const deleteLayerFunc = async (id: string) => {
  await delay(2000)

  console.log(id, 'deleted')
}
export const deleteGroupFunc = async (id: string) => {
  await delay(2000)

  console.log(id, 'deleted')
}
export const getLayerFunc = async (
  page: number,
  groupId: string
): Promise<{ id: string; svg: string } | null> => {
  await delay(2000)

  if (page === 1)
    return {
      id: '1',
      svg: nieco,
    }
  else
    return {
      id: '2',
      svg: nieco1,
    }
}
export const getGroupsFunc = async (): Promise<
  { id: string; name: string }[]
> => {
  await delay(2000)

  return [
    { id: '1', name: 'jeden' },
    { id: '2', name: 'dva' },
    { id: '3', name: 'tri' },
    { id: '4', name: 'štyri' },
  ]
}
