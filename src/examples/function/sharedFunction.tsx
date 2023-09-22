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
  return 'https://evilflowers.jakubdubec.me/data/v1/acquisitions/d9445797-42d0-499a-a158-82c08b4dc511'
}
