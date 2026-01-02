# Repository Guidelines

## Project Structure & Module Organization
`src/app` holds the Next.js UI. Root-level files like `src/app/page.tsx`,
`src/app/layout.tsx`, and `src/app/globals.css` define the shared layout and theme.
Static helpers (fonts, icons) live alongside the app entry. Supporting docs live in
`docs/`, and helper assets or scripts stay in `agents/`. As the app grows, keep
reusable components, hooks, and utilities grouped under descriptive folders in `src/`.

## Build, Test, and Development Commands
- `npm run dev`: start the local Next.js server at `http://localhost:3000` with Fast Refresh.
- `npm run build`: create the production build via `next build`.
- `npm start`: serve the production build with `next start`.
- `npm run lint`: run `next lint` to check code style and Next.js conventions.

## Coding Style & Naming Conventions
Use TypeScript and Tailwind CSS. Components should be PascalCase exports, hooks and
utility functions in camelCase, and files focused on a single concern (page, layout,
hook). Prefer prop destructuring. Keep class names as Tailwind utility strings and
run `npm run lint` before submitting changes.

## Testing Guidelines
No automated test suite is configured yet. Validate changes manually using
`npm run dev`. If tests are added later, prefer React Testing Library + Jest or
Vitest, name files like `Component.test.tsx`, and document new commands here.

## Commit & Pull Request Guidelines
Follow Conventional Commit prefixes such as `feat:`, `fix:`, or `chore:` with a
present-tense summary. In PRs, explain the user impact, list commands run, link
relevant issues, and include screenshots for UI changes.

## Security & Configuration Tips
Keep credentials out of git; use `.env.local` for secrets like `SPOTIFY_CLIENT_ID`
or `GEMINI_API_KEY`. Document required env vars in `next.config.mjs` or project
docs and rotate OAuth secrets if they leak.
