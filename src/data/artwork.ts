export interface Artwork {
  id: number;
  title: string;
  image_id: string;
  artist: string;
  medium: string;
  categories: string[];
  w: number;
  h: number;
  thumbUrl: string;
  fullUrl: string;
}

export function similarityScore(a: Artwork, b: Artwork): number {
  let s = 0;
  a.categories.forEach(c => { if (b.categories.includes(c)) s += 2; });
  return s;
}

export async function fetchArtworks(): Promise<Artwork[]> {
  const fields = 'id,title,image_id,thumbnail,artist_display,medium_display,classification_titles';
  const url = `https://api.artic.edu/api/v1/artworks?limit=100&page=1&fields=${fields}`;

  const res = await fetch(url, { headers: { 'AIC-User-Agent': 'spiral-gallery/1.0' } });
  if (!res.ok) throw new Error('API error');
  const data = await res.json();

  const items: Artwork[] = [];
  for (const d of data.data) {
    if (!d.image_id || !d.thumbnail?.width || !d.thumbnail?.height) continue;
    items.push({
      id:         d.id,
      title:      d.title || 'Untitled',
      image_id:   d.image_id,
      artist:     (d.artist_display || 'Unknown').split('\n')[0].slice(0, 60),
      medium:     d.medium_display || '',
      categories: (d.classification_titles || []).slice(0, 4),
      w:          d.thumbnail.width,
      h:          d.thumbnail.height,
      thumbUrl:   `https://www.artic.edu/iiif/2/${d.image_id}/full/300,/0/default.jpg`,
      fullUrl:    `https://www.artic.edu/iiif/2/${d.image_id}/full/800,/0/default.jpg`,
    });
    if (items.length >= 80) break;
  }
  return items;
}
