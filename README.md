# A Book to Say Goodbye — Digital Edition

A beautiful, page-turning HTML book built from your manuscript.

## How to read it

1. Open **`index.html`** in your browser (Chrome or Edge recommended).
2. Click **Open the book**.
3. Turn pages with:
   - **Arrow keys** or **Space**
   - **Click** the left/right edges of the page
   - **Swipe** on mobile

## Features

- Real book layout with two-page spread on desktop
- Cover, chapter opener pages, and back cover
- Elegant paper texture, serif typography, and rose accents
- **Contents** menu to jump to any chapter
- **Night** mode for late-night reading
- **Focus** mode for fullscreen reading
- Urdu quotes rendered with proper Nastaliq font
- 40 pages of your full story

## If you edit the book text

After changing `A Book to Say Goodbye.md`, rebuild the pages:

```bash
python build_book.py
```

Then refresh the browser.

## Publish to GitHub

This folder is already a git repo with an initial commit on `main`.

1. Log in to GitHub (one time):

```powershell
gh auth login
```

2. Create the repo and push:

```powershell
.\publish.ps1
```

Or manually:

```powershell
gh repo create a-book-to-say-goodbye --public --source=. --remote=origin --push --description "A Book to Say Goodbye by Prena Dhomwja"
```

To host the book online, turn on **GitHub Pages** for the repo and set the source to the `main` branch root. Then open `https://YOUR_USERNAME.github.io/a-book-to-say-goodbye/`.

## Share or gift it

Copy the whole folder:

- `index.html`
- `css/style.css`
- `js/book-data.js`
- `js/reader.js`

Zip it and send it to anyone. They can open `index.html` offline — no internet needed after fonts are cached.

---

*Choose yourself. That is not the end of love. It is the beginning of loving correctly.*
