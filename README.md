# GrimFolio Docs

Static documentation site for [GrimFolio](https://grimfolio.com), deployed at [docs.grimfolio.com](https://docs.grimfolio.com).

## Stack

Static HTML + CSS + vanilla JS. No framework. No CMS. Deployed via Cloudflare Pages.

## Before every deploy

```
node generate-index.js
```

This regenerates `search-index.json` from all HTML files. Do not skip this step — search will be stale or broken otherwise.

## Deploy

Push to `main`. Cloudflare Pages builds automatically.

**Never run `wrangler deploy` from this repo.** This is a separate static site, not a Worker.

## Adding content

- Wiki pages: edit the relevant `.html` file
- Blog posts: add a new file in `blog/`, add it to the `PAGES` array in `generate-index.js`, add it to the blog nav and `blog/index.html`
- Screenshots: drop PNGs into `images/`
- After any content change: `node generate-index.js` then push

## DNS

CNAME: `docs.grimfolio.com` → Cloudflare Pages deployment URL.
Custom domain set in Cloudflare Pages project settings.
