# Frihedsbrevet – Editorial Tracker

Internt værktøj til at følge indholdsstykker i produktion og fordele ansvar, bygget som en funktionel løsning på casen *"Frihedsbrevet – Editorial Tracker"*. Teknologi: Astro 7 (SSR), Markdown, Netlify.

**Live:** https://frihedsbrevet-cms.netlify.app

```bash
npm install
npm run dev          # http://localhost:4321
npm test             # enhedstests
npm run build && npm start
```

## Demo-logins

Klik på en bruger på login-siden, eller brug:

| Rolle | E-mail | Adgangskode |
|---|---|---|
| Redaktør | mads@frihedsbrevet.dk | editor123 |
| Bidragyder | mia@frihedsbrevet.dk | writer123 |
| Bidragyder | andreas@frihedsbrevet.dk | writer123 |
| Bidragyder | frederikke@frihedsbrevet.dk | writer123 |
| Bidragyder | flemming@frihedsbrevet.dk | writer123 |
| Bidragyder | anders@frihedsbrevet.dk | writer123 |

Login er bevidst simpelt (hardcodede brugere, signeret cookie), så det er nemt at afprøve.

## Kernekrav

| Område | Krav | Status | Hvor |
|---|---|---|---|
| **Login** | Simpel login med hardcodede/mock-brugere | ✅ | `src/pages/[lang]/login.astro`, `src/lib/auth.ts`, `src/data/users.json` |
| | Mindst to roller: Redaktør (alt) og Bidragyder (kun eget) | ✅ | `src/middleware.ts`, `src/lib/content/rules.ts` (`canManage`) |
| **Backend** | `ContentItem` med titel, status (Idea/Draft/Review/Published), forfattere, deadline, type | ✅ | `src/lib/model.ts` (+ cover, billedtekst, sektion, arkiveret m.m.) |
| | Hent alle indholdsstykker | ✅ | `GET /api/items` |
| | Opret nyt indholdsstykke | ✅ | `POST /api/items` |
| | Opdatér status | ✅ | `PATCH /api/items/:id`, `POST /api/items/:id` med `intent=status` |
| | Filtrér efter brugerrolle | ✅ | håndhæves på serveren i `src/lib/content/items.ts` |
| **Frontend** | Loginskærm | ✅ | `/da/login` |
| | Dashboard med liste grupperet/filtrérbar efter status | ✅ | faner (Alle, Idea, Draft, Review, Published, Arkiveret), typefilter, live søgning og sortérbare kolonner (stigende/faldende) |
| | Viser hvem der har oprettet/arbejder på stykket og deadline | ✅ | kolonner "Arbejder på" og deadline med markering af overskredne |
| | Formular til nyt indholdsstykke | ✅ | "Nyt stykke" åbner editoren i en modal |
| | Indholdsvisning: publicér | ✅ | knappen **Publicér** / **Opdatér live** |
| | Indholdsvisning: redigér | ✅ | editor som modal eller fuld side (`/da/content/:id`) |
| | Indholdsvisning: arkivér | ✅ | **Arkivér** (kan gendannes); stykker kan også slettes permanent |

## Valgfrie udvidelser

| Udvidelse | Status | Beskrivelse |
|---|---|---|
| Rig tekst-editor (WYSIWYG) | ✅ | Fed, kursiv, understreg, overskrift, lister, citat, link, kodeblok. Gemmes som Markdown. |
| Billeder | ✅ | Upload (komprimeres i browseren til WebP, med statusindikator) eller URL, alt-tekst og billedtekst, udskiftning ved klik |
| Layout-blokke | ✅ | Sektioner med 2/3 kolonner, bredde, mellemrum og justering, callout, pull quote, skillelinje |
| Drag & drop | ✅ | Træk blokke og sektioner for at omarrangere |
| Initial (drop cap) | ✅ | Gør første bogstav i et afsnit stort |
| Indlejring | ✅ | YouTube, Vimeo og Spotify (øvrige links bliver til et linkkort) |
| Forhåndsvisning som publiceret | ✅ | Samme skabelon som den offentlige side, med skift mellem **medlem** og **besøgende** (betalingsmur) |
| Offentlig publicering | ✅ | Ét site: `/da/artikler/:id`. Kun live stykker findes offentligt. |
| Publiceringsregler | ✅ | Et publiceret stykke kan ikke gå tilbage til kladde, men kan opdateres live |
| Hosting på Netlify | ✅ | Netlify Blobs til lager, CDN-cache med tags og purge ved publicering/opdatering/arkivering/sletning |
| Flersproget (i18n) | ✅ | Dansk (standard) og engelsk, `/da/…` og `/en/…` |
| Live søgning | ✅ | Søger mens man skriver, uden sidegenindlæsning |
| Sidetransitioner | ✅ | Astro `ClientRouter` med view transitions |
| Mørk tilstand | ✅ | Følger systemets indstilling |

## Sådan bruger løsningen Astro

- **Content collections** – `src/content.config.ts`: medarbejdere (`src/data/users.json`) via `file()`-loaderen. `src/live.config.ts`: én *live collection* pr. type (`content/articles`, `videos`, `podcasts`, `newsletters`, `graphics`). Stykker er Markdown-filer, hvor frontmatter er metadata og brødteksten er selve indholdet.
- **Markdown** – blokke som Markdown ikke kan udtrykke (callout, pull quote, figur med billedtekst, indlejringer, initial, sektioner) gemmes som rå HTML-linjer og saneres ved visning (`src/lib/sanitize.ts`).
- **i18n** – manuel routing med `da` som standard (`astro.config.mjs`). Sproget huskes i en cookie.
- **Endpoints** – `src/pages/api/`*:
  - `POST /api/login`, `POST /api/logout`
  - `GET /api/items?status=&type=` · `POST /api/items`
  - `GET|PATCH|DELETE /api/items/:id`
  - `POST /api/items/:id` med `intent=publish|update|archive|restore|delete|status|save`
  - `POST /api/upload` (billeder, 8 MB) → serveres fra `/uploads/*`, `POST /api/preview`

## Roller

- **Redaktør** ser og administrerer alle stykker.
- **Bidragyder** ser og administrerer kun stykker, vedkommende har oprettet eller er medforfatter på. Det håndhæves på serveren, ikke kun i UI'et.

## Publicering og Netlify

Ét site leverer både editoren (bag login) og de offentlige artikelsider.

- **Offentlig URL:** `/da/artikler/<id>` (og `/en/artikler/<id>`). Kun live, ikke-arkiverede stykker findes; kladder giver 404. Besøgende får åbningen plus medlemsboksen, indloggede medarbejdere ser hele stykket.
- **Regler:** et publiceret stykke kan ikke tilbage til kladde. Redaktører og journalister redigerer det og trykker **Opdatér live**. Arkivering tager det ned.
- **Lager:** lokale filer i udvikling, **Netlify Blobs** på Netlify. Mappen `content/` fylder lageret første gang.
- **Cache:** offentlige sider caches på Netlifys CDN, tagges `article-<id>` og varierer på session-cookien. Publicering, opdatering, arkivering og sletning rydder tagget.

Deploy: `netlify login`, `netlify init` (eller forbind repoet i Netlify), sæt `SESSION_SECRET` (se `.env.example`) og deploy. Adapteren skifter automatisk (`astro.config.mjs`): Netlify på Netlify, Node ellers.

## Projektstruktur

```
src/
  scripts/            klientkode, én mappe pr. funktion
    boot.ts           ét indgangspunkt: kobler siden på ved indlæsning / astro:page-load
    menus/            dropdown-menuer
    search/           live søgning
    shared/           i18n-tekster, selectors, html-hjælpere
    editor/           artikeleditoren
      serialize.ts    HTML → Markdown (ren funktion, testet)
      commands.ts, formatting.ts, selection.ts   værktøjslinjens handlinger
      paste.ts, upload.ts, boxes.ts, preview.ts, form.ts, dialog.ts
      blocks/         håndtag, blokbjælke, træk-og-slip
  styles/             én fil pr. område; index.css bestemmer rækkefølgen
  components/         Editor.astro + editor/ (bjælke, værktøjslinje, bokse, sidebar)
  lib/
    content/          items (CRUD), validate, rules (publiceringsregler), loader
    storage/          fil- og blobs-lager bag samme interface
  i18n/               index + messages/{da,en}.ts
```
