# crudandlogic.com: Gamma → GitHub Pages Migration

**Date:** 2026-09-22
**Status:** Approved design

## Goal

Move crudandlogic.com off Gamma to a GitHub Pages site. Keep the existing copy, give it a new "Editorial" visual design, and switch over with no downtime.

## Decisions

| Topic | Decision |
|---|---|
| Fidelity | Same content, new design |
| Stack | Plain HTML/CSS, no build step |
| Repo | New public repo `kurtnelle/crudandlogic.com`, Pages served from `main` / root |
| CTAs | In-page anchors; discovery call is a pre-filled `mailto:` |
| Images | Keep the logo illustration (self-hosted); drop the 3 Gamma-generated images and the Gamma theme background |
| Visual direction | **B: Editorial**, the approved mockup (`.superpowers/brainstorm/visual-direction.html`) |
| Theme | Light only |

## Visual Design (Editorial)

- **Palette:** page `#faf8f4` (warm off-white), alternate section `#ffffff`, text `#1a1a1a` / body `#555`, borders `#ebe6dc`, single accent indigo `#4338ca`.
- **Type:** Fraunces (500/700) for headings and numerals, Inter (400–700) for body and UI, both from Google Fonts.
- **Components:** uppercase letter-spaced indigo kicker above each section heading; white cards with 1px warm border; Roman-numeral markers (I., II., III.); dark primary button (`#1a1a1a` fill), outlined secondary button.
- **Layout:** max content width about 1100px, 16px minimum side gutter on phones, no horizontal scroll. Two-column hero on desktop, stacked below about 760px.
- **Motion:** none beyond hover/focus transitions and smooth anchor scrolling, disabled under `prefers-reduced-motion`.

## Page Structure

Sticky top nav: wordmark "C.R.U.D & Logic" · Mentorship · Development · Contact. On phones this collapses to a menu button.

| # | Section | Anchor | Content |
|---|---|---|---|
| 1 | Hero | `#top` | Headline "Create, Read, Update, Delete — *and the logic that makes it real.*"; lead copy; logo illustration. **Start Learning** → `#mentorship`, **Get a Quote** → `#contact` |
| 2 | Why Guidance Matters | `#why` | Tutorial Traps, Architecture Gaps, Professional Divide as numbered cards |
| 3 | From CRUD to Architecture | `#path` | I. Basic CRUD → II. System Design → III. Architecture, then the pull-quote "We don't just teach you how to write code — we show you how to think like a systems developer…" |
| 4 | What We Do | `#services` | 2×2 cards: Mentorship & Training, Application Development, Code Reviews, MVPs & Architecture |
| 5 | Software Mentorship | `#mentorship` | Learn Modern Tech, Weekly Check-ins, Real Projects, Professional Feedback |
| 6 | Business App Development | `#development` | Three columns (Modern Technology Stack, Quality-Focused Approach, Business-Driven Solutions), each with its bullet list |
| 7 | Our Difference | `#difference` | Understanding, Best Practices, Documentation, Team Integration, then the closing "real world" statement |
| 8 | Let's Connect | `#contact` | Book a Free Discovery Call (`mailto:contact@crudandlogic.com?subject=Discovery%20call`), Join Our Mentorship Community (Discord), Start Your Development Project (`mailto:contact@crudandlogic.com`) |
| 9 | Footer | — | © year, email, Discord |

All copy is carried over word for word from the live Gamma page, except the headline and kicker wording shown in the mockup.

Sections alternate between the off-white and white backgrounds.

### Discord invite

The current invite `https://discord.gg/N3jy7qHt` has **expired** (Discord API: "Unknown Invite"). The site uses a single constant URL in the markup, marked with an HTML comment `<!-- DISCORD_INVITE -->`, at each use. Until the owner supplies a non-expiring invite, the links point to the old URL.

## Files

```
index.html
404.html
assets/css/site.css
assets/img/logo.png        downloaded from Gamma (1200px)
assets/img/logo.webp       WebP copy, served via <picture>
favicon.svg                serif "C&L" monogram, indigo
CNAME                      crudandlogic.com
robots.txt                 allow all + sitemap reference
sitemap.xml                single URL
.nojekyll                  serve files as-is
.gitignore                 .superpowers/
README.md                  how to edit and deploy
```

JavaScript: a single inline script of about 10 lines that toggles the mobile nav (`aria-expanded`). The nav links stay usable without JS.

Note: with Pages serving the repo root, `docs/superpowers/` is publicly reachable as raw files. That's acceptable because it contains only design notes.

## SEO & Sharing

- `<title>`: "C.R.U.D & Logic: Software Mentorship & Development"
- Meta description: the hero lead, without the "Start Learning / Get a Quote" junk the Gamma export added.
- `link rel="canonical"` → `https://crudandlogic.com/`
- Open Graph + Twitter `summary_large_image` tags, image `https://crudandlogic.com/assets/img/logo.png`.
- `lang="en"`, `theme-color` `#faf8f4`.

## Accessibility

Meaningful `alt` on the logo, a skip-to-content link, visible `:focus-visible` outlines in indigo, text contrast of at least WCAG AA, and heading order h1 → h2 → h3.

## Hosting & Cutover

Records are changed by the owner in the Cloudflare dashboard (this session has no Cloudflare zone access).

1. Create repo, push, enable Pages (`main`, `/`). Verify at `https://kurtnelle.github.io/crudandlogic.com/` while Gamma still serves the domain. Assets use relative paths so the preview URL works.
2. *(Recommended)* Verify the domain for the GitHub account (TXT record) to prevent domain takeover.
3. In Cloudflare DNS, replace the Gamma records, keeping everything **DNS-only (grey cloud)**:
   - `crudandlogic.com` A → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `crudandlogic.com` AAAA → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `www` CNAME → `kurtnelle.github.io`
4. Set the custom domain `crudandlogic.com` on Pages. After certificate issuance, enable **Enforce HTTPS**. `www` redirects to the apex.
5. *(Optional)* Switch to proxied with SSL mode **Full (strict)** and Always Use HTTPS. Never use Flexible, because it causes redirect loops.
6. Disconnect the custom domain in Gamma.

### Cloudflare Total TLS: not pursued

Total TLS requires the paid Advanced Certificate Manager add-on, only applies to proxied hostnames, and adds coverage only for multi-level subdomains. Universal SSL (free) already covers the apex and `www`.

## Testing

- **Local:** open `index.html` in the browser pane at 375px, 768px and desktop widths. Check that every anchor scrolls to its section, the mobile menu opens and closes, the console has no errors, and there's no horizontal scroll.
- **Preview URL:** the same checks on `kurtnelle.github.io/crudandlogic.com`, including assets loading via relative paths.
- **After cutover:** `Resolve-DnsName` shows GitHub IPs; `https://crudandlogic.com` returns 200 with a valid cert; `http://` and `www` redirect to `https://crudandlogic.com/`; an unknown path serves `404.html`.

## Out of Scope

Contact form service, booking integration, blog/multi-page, analytics, dark mode, Cloudflare setting changes.
