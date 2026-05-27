# Codex Handoff

## Project

This is GPADAS, a Vite + React + TypeScript web app for generating Spanish front pages for ADAS, lab practices, final products, and custom work types for Preparatoria Siglo XXI / Universidad Autónoma de Yucatán.

Production URL:

- https://gpadas.vercel.app

GitHub repository:

- https://github.com/D4ND3R/gpadas

## Main Files

- `src/main.tsx`: full app logic and React UI.
- `src/styles.css`: form, preview, print, mobile, and cover-style CSS.
- `src/data/subjects.json`: editable subject catalog, teacher mapping, and semester/group subject lists.
- `public/assets/logo-strip.png`: top school logo strip from the reference PDF.
- `public/assets/school-stamp.png`: school stamp used on covers.
- `vercel.json`: Vercel build settings.

## Current Behavior

- App is in Spanish.
- Public/app name: `GPADAS`.
- Cover styles: `Base`, `Minimalista`, `Detallado`, `Moderno`.
- Internal style value `minimalista` is kept for the `Base` design so old cookies continue to load the original layout. The newer minimalist design uses internal value `limpio`.
- Orientations: `Vertical` and `Horizontal`.
- Work types: `ADA`, `Práctica de laboratorio`, `Producto final`, `Otro`.
- `Otro` shows a free-text work-name input.
- Number is optional and can be cleared. If blank, ADA/lab titles omit `#`.
- Dates are optional and can be cleared with the icon button.
- Semester, group, and subject all have `Ninguno` / blank options.
- Subject options depend on selected semester and group.
- Teacher is no longer user-selected. It is read-only in the form and comes from the selected subject in `src/data/subjects.json`.
- Participants are a dynamic list. Add with `+`, remove with trash.
- Cover label changes from `Alumno` to `Alumnos` when multiple participant names are present.
- Long names wrap instead of clipping.
- Cookies persist recurring/user-entered fields:
  - style
  - orientation
  - currentDate
  - deliveryDate
  - workType
  - customWorkType
  - workNumber
  - semester
  - group
  - subject
  - participants
- Reset clears app cookies and returns blank/none values for subject/date/number/semester/group, while keeping default style and orientation.

## Subject JSON Schema

`src/data/subjects.json` uses subject IDs so teacher names are edited in one place.

```json
{
  "subjects": {
    "diseno-multimedia": {
      "name": "Diseño multimedia",
      "teacher": "Oscar Ivan Huh Carvajal"
    }
  },
  "semesters": {
    "2": {
      "B": ["diseno-multimedia"]
    }
  }
}
```

To add a subject:

1. Add an entry under `subjects`.
2. Add its ID to the correct `semesters[semester][group]` arrays.

To change a teacher:

1. Edit the `teacher` value for the subject ID.

## Build

`npm run build` runs:

```bash
tsc --noEmit && vite build
```

This checks TypeScript without writing JS from `tsc`, then Vite bundles production assets into `dist/`.

## Preview

`npm run preview` serves the already-built `dist/` folder locally. Use it after `npm run build` to test behavior closer to Vercel production than `npm run dev`.

## Deploy

Vercel is linked to project `gpadas`. Production deploys run the configured build command and publish `dist/`.

Typical deploy:

```bash
vercel --prod --yes
```

If deploying from a temporary worktree, link it first:

```bash
vercel link --yes --project gpadas
vercel --prod --yes
```

## Notes For Future Codex

- Do not stage or revert unrelated local changes. At the time this file was created, `public/assets/school-stamp.png` had an unrelated local binary modification that was intentionally left unstaged.
- Browser verification has been done with the Codex Browser plugin against local preview and the public Vercel URL.
- `jspdf` and `html2canvas` are responsible for client-side PDF export.
- Mobile preview scales the document visually; PDF export temporarily renders at full page size by setting `isExporting`.
- The favicon is `public/favicon.svg`, a round SVG icon linked from `index.html`.
- License is proprietary / all rights reserved. See `LICENSE`.
