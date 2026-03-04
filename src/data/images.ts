export type Category =
  | 'nature' | 'architecture' | 'people' | 'abstract'
  | 'animals' | 'food' | 'technology' | 'fashion';

export interface GalleryImage {
  id: number;
  seed: number;
  cat: Category;
  tags: string[];
  w: number;
  h: number;
  url: string;
  thumb: string;
}

export const CAT_LABELS: Record<Category, string> = {
  nature: 'Nature', architecture: 'Architecture', people: 'People',
  abstract: 'Abstract', animals: 'Animals', food: 'Food',
  technology: 'Technology', fashion: 'Fashion',
};

const TAGS: Record<Category, string[]> = {
  nature:       ['forest','mountains','ocean','sunrise','botanical','landscape','misty','wild','dusk','serene'],
  architecture: ['brutalist','minimal','glass','historic','urban','geometric','skyline','modern','arch','concrete'],
  people:       ['portrait','candid','emotion','light','shadow','monochrome','lifestyle','gaze','solitude','street'],
  abstract:     ['texture','pattern','gradient','macro','experimental','form','color','noise','motion','layers'],
  animals:      ['wildlife','domestic','exotic','underwater','aerial','macro','feathers','fur','eye','motion'],
  food:         ['artisan','organic','plated','market','closeup','vibrant','rustic','café','harvest','minimal'],
  technology:   ['circuit','neon','interface','futuristic','data','code','dark','sharp','signal','grid'],
  fashion:      ['editorial','street','minimal','couture','accessories','texture','monochrome','studio','drape','light'],
};

const ASPECTS: [number, number][] = [
  [400,600],[600,400],[500,500],[800,450],
  [450,600],[600,350],[420,420],[750,430],
  [380,560],[560,380],[400,400],[700,400],
];

const CATS = Object.keys(TAGS) as Category[];
const SEEDS = Array.from({ length: 80 }, (_, i) => (i + 1) * 11);

export const GALLERY: GalleryImage[] = SEEDS.map((seed, i) => {
  const cat  = CATS[i % CATS.length];
  const tags = [...TAGS[cat]].sort(() => Math.random() - 0.5).slice(0, 3);
  const [w, h] = ASPECTS[i % ASPECTS.length];
  return { id: i, seed, cat, tags, w, h,
    url:   `https://picsum.photos/seed/${seed}/${w}/${h}`,
    thumb: `https://picsum.photos/seed/${seed}/300/300`,
  };
});
