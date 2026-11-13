import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

// Author records live in one data file. Pieces reference them by id
// (`authors: ["jonas"]`) instead of copying a person into every entry.
// The pieces themselves are split by type in src/live.config.ts.
const users = defineCollection({
  loader: file('src/data/users.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
    password: z.string(),
    role: z.enum(['editor', 'contributor']),
  }),
});

export const collections = { users };
