export const STATUSES = ['Idea', 'Draft', 'Review', 'Published'] as const;
export const TYPES = ['Article', 'Video', 'Podcast', 'Newsletter', 'Graphic'] as const;
/** Editorial sections, shown as the kicker above a title */
export const SECTIONS = ['Fri Politik', 'Fri Finans', 'Fri Forsvar', 'Fri Tænkning', 'Fri Mads'] as const;
export type Status = (typeof STATUSES)[number];
export type ContentType = (typeof TYPES)[number];

/** One live collection per piece type — folders under `content/`. */
export const COLLECTION_FOR = {
  Article: 'articles',
  Video: 'videos',
  Podcast: 'podcasts',
  Newsletter: 'newsletters',
  Graphic: 'graphics',
} as const satisfies Record<ContentType, string>;

export const COLLECTIONS = Object.values(COLLECTION_FOR);
export type CollectionName = (typeof COLLECTIONS)[number];

export const collectionFor = (type: ContentType): CollectionName => COLLECTION_FOR[type];

export const typeForCollection = (folder: string): ContentType | undefined =>
  (Object.entries(COLLECTION_FOR) as [ContentType, string][]).find(([, name]) => name === folder)?.[0];

export const collectionLabel = (type: string) =>
  ({ Article: 'Articles', Video: 'Videos', Podcast: 'Podcasts', Newsletter: 'Newsletters', Graphic: 'Graphics' })[type] ?? 'Content';

export interface ContentItem {
  title: string;
  status: Status;
  type: ContentType;
  /** user ids */
  authors: string[];
  /** user id of whoever created the piece */
  createdBy: string;
  /** YYYY-MM-DD */
  deadline: string;
  archived: boolean;
  /** Editorial section shown as the kicker, e.g. "Fri Politik" */
  section?: string;
  /** Optional cover image URL */
  cover?: string;
  /** Caption under the header image */
  caption?: string;
  /** ISO timestamp of first publication */
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Markdown notes / brief */
  body: string;
}
