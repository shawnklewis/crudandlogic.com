# crudandlogic.com

Source for [crudandlogic.com](https://crudandlogic.com): a single static page served by GitHub Pages from the `main` branch root. No build step.

## Edit

- Content: `index.html`
- Styling: `assets/css/site.css` (palette variables at the top)
- Discord invite: search `index.html` for `DISCORD_INVITE`. Each marked link needs the new URL.

## Test

```bash
python tests/check_site.py
```

Checks files, links, anchors, metadata, headings and copy. Uses only the Python standard library.

## Deploy

Push to `main`. GitHub Pages publishes within a minute or two.

## Domain

DNS is on Cloudflare, DNS-only (grey cloud): apex A/AAAA records → GitHub Pages IPs, `www` CNAME → `kurtnelle.github.io`. Custom domain is set by the `CNAME` file and in repo Settings → Pages. If you turn on the Cloudflare proxy, use SSL mode **Full (strict)**, never Flexible.
