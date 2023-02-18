import PageContext from './PageContext'

const Page = () => {
  return <PageContext.Provider value={{}}>
    <div id={'evilFlowersPage'}/>
  </PageContext.Provider>
}

export default Page
