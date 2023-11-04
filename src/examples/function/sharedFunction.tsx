export const exampleShareFunction = async (
  pages: string | null,
  expaireDate: string
) => {
  // create submit
  const params = {
    acquisition_id: 'will be in my app',
    range: pages ?? null,
    type: 'shared',
    expires_at: expaireDate, // ISO
  }
  console.log(params)

  /**
   * CALL ENDPOINT (WE JUST PLAY THAT THIS IS ENDPOINT)
   */
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))
  await delay(2000)

  // returned url for entry
  // return ''
  return 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley'
}
