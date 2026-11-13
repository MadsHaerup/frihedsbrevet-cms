import { defineLiveCollection } from 'astro:content';
import { itemsLoader } from './lib/content/loader';

// Each type is its own collection (content/<type>/*.md), not one mixed folder.
export const collections = {
  articles: defineLiveCollection({ loader: itemsLoader('articles') }),
  videos: defineLiveCollection({ loader: itemsLoader('videos') }),
  podcasts: defineLiveCollection({ loader: itemsLoader('podcasts') }),
  newsletters: defineLiveCollection({ loader: itemsLoader('newsletters') }),
  graphics: defineLiveCollection({ loader: itemsLoader('graphics') }),
};
