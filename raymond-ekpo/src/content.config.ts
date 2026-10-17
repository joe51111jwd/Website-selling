import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One file per service. The file name is the id used in links (?service=rewrite).
const services = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/services' }),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    price: z.string(),
    priceMin: z.number(),
    priceMax: z.number(),
    priceNote: z.string(),
    // The two short lines printed on the term sheet
    for: z.string(),
    youGet: z.string(),
    // The services page
    bestFor: z.string(),
    covers: z.array(z.string()),
    receive: z.array(z.string()),
    needs: z.string(),
    note: z.string().optional(),
    cta: z.string(),
  }),
});

const slide = z.object({
  headline: z.string(),
  points: z.array(z.string()),
});

// Notes, analyses and (later) client case studies.
const work = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    dek: z.string(),
    kind: z.enum(['analysis', 'case-study']),
    topic: z.string(),
    date: z.coerce.date(),
    order: z.number().default(99),
    // Analyses built on invented examples must say so
    illustrative: z.boolean().default(false),
    example: z
      .object({ slide: z.string(), before: slide, after: slide })
      .optional(),
    // Case studies only. Every outcome must be one the client has agreed to and can be checked.
    client: z.string().optional(),
    stage: z.string().optional(),
    sector: z.string().optional(),
    outcome: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { services, work };
