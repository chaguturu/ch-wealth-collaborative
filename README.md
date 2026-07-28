This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## ISEE Vocabulary trainer (`/vocab`)

A standalone study tool at `/vocab`. No login, no API calls, no database: the word
list ships with the bundle and progress lives in `localStorage` on the device, so
the page is statically prerendered and works offline once loaded.

- **212 words** across the three ISEE levels: Lower (grades 5-6), Middle (7-8),
  Upper (9-12). Each entry has a definition, part of speech, synonyms, antonyms,
  and an example sentence.
- **Three drills**: flashcards with self-grading, a meaning quiz (closest synonym
  or definition), and sentence completion (fill in the blank).
- **Leitner scheduling**: a word moves up a box when answered correctly and drops
  to box 1 when missed. Boxes come back after 1, 2, 4, 8, and 21 days. "Smart
  review" builds a session from what is due, weakest words first, interleaved
  with new ones.
- Word list with search and filters, starring, day streak, and a daily goal.

Source layout:

| Path | Purpose |
| --- | --- |
| `src/data/vocab/` | Word lists, one file per level, plus sentence helpers |
| `src/lib/vocab/progress.ts` | Leitner boxes, streaks, stats, persistence |
| `src/lib/vocab/session.ts` | Deck building and multiple-choice generation |
| `src/components/vocab/` | Screens (home, flashcards, quiz, word list, results) |

To add words, append entries to the relevant file in `src/data/vocab/`. Mark the
target word form in the example sentence with `[brackets]`; that one annotation
drives both the highlighted example and the sentence-completion blank. Wrong
answers are generated at runtime from other words in the same level, skipping any
that share meaning with the prompt.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
