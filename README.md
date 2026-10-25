# Mazen Yasser — Boot Sequence Portfolio

A terminal-themed personal portfolio that mimics an SSH session boot sequence. Built with pure HTML, CSS, and vanilla JavaScript — no frameworks, no dependencies, no build step.

## Quick Start (Local)

```bash
# Any static file server works. For example:
python3 -m http.server 8000
# Then open http://localhost:8000
```

Or just open `index.html` directly in your browser.

## Deploy to GitHub Pages

1. Push this repo to GitHub (if you haven't already):
   ```bash
   git add .
   git commit -m "Initial portfolio"
   git push origin main
   ```

2. Go to your repo on GitHub → **Settings** → **Pages**

3. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`

4. Click **Save**. Your site will be live at:
   ```
   https://mazenyasser.github.io/
   ```

### Custom Domain (optional)

1. In **Settings → Pages**, enter your custom domain (e.g., `mazen.dev`)
2. Add a `CNAME` file to the repo root containing your domain:
   ```
   mazen.dev
   ```
3. Configure your DNS provider to point to GitHub Pages:
   - `A` records → GitHub's IPs (see [GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site))
   - Or a `CNAME` record → `mazenyasser.github.io`

## File Structure

```
├── index.html   ← Main page (all content lives here)
├── style.css    ← All styles (colors, layout, animations)
├── script.js    ← Interaction logic (typewriter, sequencing, easter eggs)
└── README.md    ← This file
```

## How to Edit Content

**All content is in `index.html`.** The JS only handles animation and interaction — you never need to touch `script.js` to change text.

- **About section:** Edit the `.about-name`, `.about-title`, and `.about-bio` elements
- **Projects:** Each `<div class="project-entry">` is one project. Copy/paste to add more.
- **Timeline:** Each `.git-log-entry` + `.commit-detail` pair is one milestone
- **Process table:** Edit the `<tr>` rows in the `.process-table`
- **Contact:** Edit the links in `#section-contact` and the title-bar links (`.titlebar-links`)
- **Easter eggs:** Edit the `EASTER_EGGS` object in `script.js`

## How to Change Colors

Edit the CSS variables at the top of `style.css`:

```css
:root {
  --bg:      #0d1117;   /* Background */
  --text:    #e6edf3;   /* Primary text */
  --accent:  #00ff9f;   /* Terminal green */
  --blue:    #58a6ff;   /* Links & highlights */
}
```

## The Intro

The intro plays on its own; space, Enter, or a click skips ahead to the end of the section being typed, and "skip intro" shows everything. After the first visit (or with reduced motion on) the page loads fully revealed. Add `?intro` to the URL to replay it.

## Link Previews

`og:url` and `og:image` in `index.html` are absolute URLs for https://mazenyasser.github.io/. Update both if the site moves to a custom domain, and recapture `og-image.png` when the bio changes.

## Easter Eggs

After the boot sequence completes, visitors can type commands into the terminal prompt. Try:

- `help` — list available commands
- `sudo` — nice try
- `neofetch` — ASCII art profile
- `vim` — friendly advice
- `ping` — pong!

## License

MIT — do whatever you want with it.
