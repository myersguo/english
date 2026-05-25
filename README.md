# Simple English

Offline-first Basic English learning app for Ogden's 850 core words. The same React/Vite codebase powers the H5/Web experience and the Capacitor Android/iOS shells.

Web: https://myersguo.github.io/english/

## Features

- 850 Basic English words grouped as Operations, General, Picturable, Qualities, and Opposites.
- Chinese meanings and English definitions generated from ECDICT when available.
- Original short example sentence for every word.
- Category browsing, search, word detail cards, favorites, learned marks, local progress, and quiz modes.
- Quiz modes: English to Chinese, Chinese to English, spelling.
- Local-only persistence through browser storage; no account or backend.

## Commands

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run build:pages
pnpm run validate:data
pnpm run generate:data
```

`pnpm run build:pages` writes the GitHub Pages artifact to `publish/` with the `/english/` asset base.

## Native Shells

```bash
pnpm run build
npx cap sync android
npx cap open android
```

iOS files are present under `ios/`, but local iOS dependency sync requires full Xcode as the active developer directory:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
npx cap sync ios
npx cap open ios
```

## Data Sources

- Word list grouping: Wiktionary `Appendix:Basic English word list`.
- Dictionary definitions/translations: ECDICT where entries exist, with local fallback labels.
- Example sentences are generated locally and are not copied from third-party sentence collections.
