import type { ILayer } from '@/assets/utils/interfaces';

const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Store layers per page, keyed by groupId-pageNumber
const layerStore = new Map<string, ILayer>();
let layerIdCounter = 0;

export const saveLayerFunc = async (
  svg: string,
  groupId: string,
  page: number
): Promise<ILayer> => {
  await delay(2000);

  const layerId = `layer-${++layerIdCounter}`;
  const layer: ILayer = { id: layerId, svg };
  const key = `${groupId}-${page}`;
  
  layerStore.set(key, layer);
  
  return layer;
};

export const updateLayerFunc = async (
  id: string,
  svg: string,
  groupId: string,
  page: number
) => {
  await delay(2000);

  const key = `${groupId}-${page}`;
  const layer: ILayer = { id, svg };
  
  layerStore.set(key, layer);
};

export const getLayerFunc = async (
  page: number,
  groupId: string
): Promise<{ id: string; svg: string } | null> => {
  await delay(2000);

  const key = `${groupId}-${page}`;
  const layer = layerStore.get(key);
  
  return layer || null;
};
export const saveGroupFunc = async (name: string) => {
  await delay(2000);

  console.log(name, 'saved');
  return { response: { id: '1' } };
};
export const getGroupsFunc = async (): Promise<
  { id: string; name: string }[]
> => {
  await delay(2000);

  return [{ id: '1', name: 'jeden' }];
};

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
  };

  await delay(2000);
  return 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley';
};

export const examplePrintFunction = async (pages: string | null) => {
  // create submit
  const params = {
    acquisition_id: 'will be in elvira app',
    range: pages,
  };

  await delay(2000);
  return 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley';
};

export const homeFunction = () => {
  console.log('home');
};
export const closeFunction = () => {
  console.log('close');
};

export const exampleCitation: string = `@article {exmaple-citation,
  abstract = {Tento dokument je teostovací s testovaciou citáciou na skúšku, čiže pohodička, neviem čo ďaľej napísať},
  author = {FIIT STU TvojTatkoRecords},
  doi = {69.696969/testujemeSpolu},
  journal = {Napal rytmausa},
  keywords = {citation},
  number = {6},
  title = {Toto je testovacia citácia testovaného pdfka},
  volume = {0},
  year = {1950}
}`;
