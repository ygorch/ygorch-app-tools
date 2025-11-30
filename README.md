# Ygor's Tools

A centralized hub for useful web tools, built with Next.js 16 and Tailwind CSS.

## Features

### Image Reducer
A client-side image compression and resizing tool.
- **Client-Side Processing**: All image manipulation happens in the browser for privacy and speed.
- **Resize Options**: Small (840px), Medium (1280px), Large (2880px).
- **Compression Options**: Target specific file sizes (200kb, 500kb, 1mb, 2mb).
- **History**: Keeps a 30-day history of processed images in the browser's IndexedDB.
- **Offline Capable**: Once loaded, it works without a backend.

## Architecture

- **Next.js 16**: Using the App Router.
- **Tailwind CSS**: For styling.
- **IndexedDB**: For local storage of large image blobs (using `idb` library).
- **i18n**: Lightweight client-side internationalization (EN, PT, ES) based on `navigator.language`.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Logic Overview

### Image Processing
Located in `app/utils/imageProcessor.ts`, uses `browser-image-compression` to resize and compress images. It iteratively adjusts quality to meet target file sizes.

### History Storage
Located in `app/utils/historyStorage.ts`, uses IndexedDB to store processed images. On save, it automatically checks for and removes items older than 30 days.

### Internationalization
Located in `app/hooks/useLanguage.tsx`, a React Context provider that detects the browser language on mount and provides the appropriate translation object from `app/locales/translations.ts`.
