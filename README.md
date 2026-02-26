# csv.repair 📊🧾

## Your broken CSV ends here.

## A free, browser-based tool for analyzing, querying, and repairing broken or oversized CSV files. No file uploads — everything runs locally in your browser. Your data never leaves your machine.

**[Live at → csv.repair](https://csv.repair)**

![ezgif-4cf755f7ce5f2be7](https://github.com/user-attachments/assets/1a8eae2c-1048-41f9-a422-12dbb737af94)



---

## Features

- **Massive file support** — Load and browse CSV files with millions of rows using virtual scrolling
- **Inline cell editing** — Double-click any cell to edit. Navigate with Tab, Enter, Escape
- **Undo / Redo** — Full edit history with up to 50 steps (Ctrl+Z / Ctrl+Y)
- **Search & Replace** — Find and replace across all cells with match highlighting (Ctrl+F)
- **SQL queries** — Run SQL queries directly on your CSV data using AlaSQL
- **Auto-repair** — One-click fix for whitespace, empty rows, and common issues (Ctrl+Shift+R)
- **Repair templates** — Standardize dates, lowercase emails, normalize phone numbers, fix encoding, remove duplicates, and more
- **Column statistics** — View total, unique, empty counts, detected data type, min/max/avg for numeric columns
- **Column charts** — Histogram for numeric data, pie chart for categorical data (powered by Recharts)
- **Health diagnostics** — Instantly identify structural issues, malformed rows, and encoding problems
- **Context menu** — Right-click to add/delete rows and columns
- **Column sorting** — Sort ascending, descending, or reset
- **Change diff preview** — Review all changes before exporting
- **Dark / Light mode** — Toggle between themes, preference saved in localStorage
- **Keyboard shortcuts** — Full shortcut support (press `?` to view all)
- **CSV export** — Download the repaired file
- **Drag & drop** — Drop a CSV file anywhere to load it
- **PWA** — Installable as a Progressive Web App on Android and iOS
- **100% client-side** — No server, no uploads, no tracking. Your data stays private.

## Tech Stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) — build tool and dev server
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [PapaParse](https://www.papaparse.com/) — CSV parsing with Web Workers
- [AlaSQL](https://alasql.org/) — SQL queries on in-memory data
- [Recharts](https://recharts.org/) — data visualization
- [wouter](https://github.com/molefrog/wouter) — lightweight routing

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm

### Installation

```bash
git clone https://github.com/hsr88/csv-repair.git
cd csv-repair
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5000`.

### Production Build

```bash
npx vite build
```

The output will be in `dist/public/`.

## Project Structure

```
client/
├── index.html                  # HTML entry point with SEO meta tags
├── public/
│   ├── favicon.png             # App icon
│   ├── og-image.png            # Open Graph social sharing image
│   └── manifest.json           # PWA manifest
└── src/
    ├── App.tsx                 # Router setup
    ├── main.tsx                # Entry point
    ├── pages/
    │   ├── csv-repair.tsx      # Main CSV repair tool (editor, SQL, charts, templates, health check)
    │   ├── blog.tsx            # Blog listing and article pages
    │   ├── about.tsx           # About page
    │   ├── faq.tsx             # FAQ page
    │   └── privacy-policy.tsx  # Privacy Policy
    ├── data/
    │   └── blog-posts.ts       # Blog article content
    └── components/
        ├── navigation.tsx      # Header, footer, and responsive navigation
        └── theme-provider.tsx  # Dark/light theme toggle
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Main CSV repair tool |
| `/blog` | Blog — guides and tutorials |
| `/blog/:slug` | Individual blog article |
| `/about` | About the project |
| `/faq` | Frequently asked questions |
| `/privacy` | Privacy policy |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+F` | Search & Replace |
| `Ctrl+S` | Export CSV |
| `Ctrl+Shift+R` | Auto-Repair |
| `?` | Show all shortcuts |

## Contributing

Contributions are welcome! Feel free to open issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## Support

If you find this tool useful, consider supporting development:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20csv.repair-ff5f5f?logo=ko-fi&logoColor=white)](https://ko-fi.com/hsr)

## License

MIT

## Author

Made by [hsr88](https://github.com/hsr88)
