# crudandlogic.com GitHub Pages Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Gamma-hosted crudandlogic.com with a hand-written, Editorial-styled static site on GitHub Pages, then cut the domain over with no downtime.

**Architecture:** One static `index.html` + one stylesheet + self-hosted logo, served by GitHub Pages from the `main` branch root of the public repo `kurtnelle/crudandlogic.com`. A stdlib-only Python script (`tests/check_site.py`) is the test suite: it checks files, links, anchors, metadata, headings, and that the copy carried over. DNS stays on Cloudflare (DNS-only records pointing at GitHub).

**Tech Stack:** HTML5, CSS (custom properties, grid), ~10 lines of vanilla JS, Google Fonts (Fraunces, Inter), Python 3.13 stdlib (tests), `gh` CLI, `curl`.

**Spec:** `docs/superpowers/specs/2026-09-22-github-pages-migration-design.md`

## Global Constraints

- Palette: bg `#faf8f4`, surface `#ffffff`, ink `#1a1a1a`, border `#ebe6dc`, single accent indigo `#4338ca`. Light theme only.
- Fonts: Fraunces (500/700) headings, Inter (400–700) body, from Google Fonts.
- No build step. No dependencies. No framework.
- All asset paths in `index.html` are **relative** (so `kurtnelle.github.io/crudandlogic.com/` preview works).
- `404.html` is **self-contained** (inline CSS, no relative references), because Pages serves it at any path depth.
- Copy carried over word for word from the live page (except hero headline/kicker per mockup).
- Contact email: `contact@crudandlogic.com`. Discord invite: `https://discord.gg/N3jy7qHt` (expired; every use is preceded by `<!-- DISCORD_INVITE -->`).
- No `gamma.app` references anywhere in the site.
- Canonical URL: `https://crudandlogic.com/`.
- Mobile: 16px minimum side gutter, no horizontal scroll; layout breakpoint 760px.
- **Deviation from spec (deliberate):** the logo fallback is `logo.jpg` not `logo.png` (Gamma's PNG is 1.2 MB). `CNAME` is added in the cutover task, not up front, because a `CNAME` file in the branch would redirect the preview URL to the domain while Gamma still serves it.
- Commits end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## File Map

| File | Responsibility |
|---|---|
| `tests/check_site.py` | Static test suite (stdlib `unittest` + `html.parser`) |
| `index.html` | All page content, head metadata, nav toggle script |
| `assets/css/site.css` | All styling for `index.html` |
| `assets/img/logo.webp`, `assets/img/logo.jpg` | Logo illustration, 1200×800 |
| `favicon.svg` | "C&L" monogram |
| `404.html` | Self-contained not-found page |
| `robots.txt`, `sitemap.xml`, `.nojekyll` | Crawling / Pages behavior |
| `README.md` | How to edit, test, deploy |
| `CNAME` | Custom domain (cutover task only) |

---

### Task 1: Test suite

**Files:**
- Create: `tests/check_site.py`

**Interfaces:**
- Produces: `python tests/check_site.py` exits 0 when the site is valid and prints one line per test (`unittest` verbosity 2). Later tasks run it as their test.

- [ ] **Step 1: Write the test suite**

```python
"""Static checks for the crudandlogic.com site.

Run from the repo root:  python tests/check_site.py
"""
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent

REQUIRED_FILES = [
    "index.html", "404.html", "assets/css/site.css",
    "assets/img/logo.webp", "assets/img/logo.jpg", "favicon.svg",
    "robots.txt", "sitemap.xml", ".nojekyll", "README.md",
]
SECTION_IDS = ["top", "why", "path", "services", "mentorship",
               "development", "difference", "contact"]
COPY = [
    "Tutorial Traps", "Architecture Gaps", "Professional Divide",
    "creating a fragile foundation",
    "Basic CRUD", "System Design",
    "think like a systems developer",
    "Mentorship & Training", "Application Development", "Code Reviews",
    "MVPs & Architecture",
    "Learn Modern Tech", "Weekly Check-ins", "Real Projects", "Professional Feedback",
    "C# and .NET 10 for robust backend systems",
    "Blazor for interactive web interfaces",
    "SQL Server or PostgreSQL for reliable data storage",
    "Comprehensive automated testing",
    "Scalable systems that grow with your needs",
    "Understanding", "Best Practices", "Documentation", "Team Integration",
    "not just code writers",
    "Book a Free Discovery Call", "Join Our Mentorship Community",
    "Start Your Development Project",
]
EXTERNAL = re.compile(r"^(https?:|mailto:|tel:|data:|#|//)")


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.links, self.headings, self.imgs = set(), [], [], []
        self.meta, self.comments, self.text = {}, [], []
        self.title, self.lang, self.canonical = "", None, None
        self._in_title, self._skip = False, 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        for key in ("href", "src", "srcset"):
            if a.get(key):
                self.links.append(a[key].split(",")[0].split()[0])
        if re.fullmatch(r"h[1-6]", tag):
            self.headings.append(int(tag[1]))
        if tag == "img":
            self.imgs.append(a)
        if tag == "meta" and (a.get("name") or a.get("property")):
            self.meta[a.get("name") or a.get("property")] = a.get("content", "")
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")
        if tag == "html":
            self.lang = a.get("lang")
        if tag == "title":
            self._in_title = True
        if tag in ("script", "style"):
            self._skip += 1

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag in ("script", "style"):
            self._skip -= 1

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        elif not self._skip:
            self.text.append(data)

    def handle_comment(self, data):
        self.comments.append(data.strip())

    @property
    def plain(self):
        return re.sub(r"\s+", " ", " ".join(self.text))


def parse(name):
    page = Page()
    page.feed((ROOT / name).read_text(encoding="utf-8"))
    return page


def local_refs(page):
    return [u for u in page.links if not EXTERNAL.match(u)]


class SiteFiles(unittest.TestCase):
    def test_required_files_exist(self):
        missing = [f for f in REQUIRED_FILES if not (ROOT / f).is_file()]
        self.assertEqual(missing, [])

    def test_cname_if_present(self):
        cname = ROOT / "CNAME"
        if not cname.exists():
            self.skipTest("CNAME is added at cutover")
        self.assertEqual(cname.read_text(encoding="utf-8").strip(), "crudandlogic.com")

    def test_no_gamma_references(self):
        offenders = [str(p.relative_to(ROOT)) for p in ROOT.rglob("*")
                     if p.suffix in (".html", ".css", ".svg", ".xml", ".txt")
                     and "docs" not in p.parts and ".superpowers" not in p.parts
                     and "gamma.app" in p.read_text(encoding="utf-8")]
        self.assertEqual(offenders, [])


class IndexPage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.page = parse("index.html")

    def test_local_references_resolve(self):
        broken = [u for u in local_refs(self.page)
                  if not (ROOT / unquote(urlsplit(u).path)).is_file()]
        self.assertEqual(broken, [])

    def test_fragment_links_have_targets(self):
        dangling = [u for u in self.page.links
                    if u.startswith("#") and len(u) > 1 and u[1:] not in self.page.ids]
        self.assertEqual(dangling, [])

    def test_section_ids(self):
        self.assertEqual([i for i in SECTION_IDS if i not in self.page.ids], [])

    def test_head_metadata(self):
        p = self.page
        self.assertEqual(p.lang, "en")
        self.assertIn("C.R.U.D & Logic", p.title)
        self.assertTrue(p.meta.get("description"))
        self.assertNotIn("Get a Quote", p.meta["description"])
        self.assertEqual(p.canonical, "https://crudandlogic.com/")
        self.assertTrue(p.meta.get("og:image", "").startswith("https://crudandlogic.com/"))
        self.assertEqual(p.meta.get("twitter:card"), "summary_large_image")

    def test_heading_structure(self):
        h = self.page.headings
        self.assertEqual(h.count(1), 1, "exactly one h1")
        self.assertEqual(h[0], 1)
        jumps = [(a, b) for a, b in zip(h, h[1:]) if b > a + 1]
        self.assertEqual(jumps, [])

    def test_images_have_alt_and_size(self):
        for img in self.page.imgs:
            self.assertTrue(img.get("alt"), img)
            self.assertTrue(img.get("width") and img.get("height"), img)

    def test_copy_carried_over(self):
        text = self.page.plain
        self.assertEqual([c for c in COPY if c not in text], [])

    def test_contact_links(self):
        links = self.page.links
        self.assertIn("mailto:contact@crudandlogic.com", links)
        self.assertIn("mailto:contact@crudandlogic.com?subject=Discovery%20call", links)
        self.assertTrue(any(u.startswith("https://discord.gg/") for u in links))
        self.assertIn("DISCORD_INVITE", self.page.comments)

    def test_hero_ctas(self):
        self.assertIn("#mentorship", self.page.links)
        self.assertIn("#contact", self.page.links)


class NotFoundPage(unittest.TestCase):
    def test_self_contained(self):
        page = parse("404.html")
        self.assertEqual(local_refs(page), [])
        self.assertEqual(page.headings.count(1), 1)
        self.assertIn("https://crudandlogic.com/", page.links)


if __name__ == "__main__":
    unittest.main(verbosity=2)
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `python tests/check_site.py`
Expected: `FAILED` — `test_required_files_exist` lists all 10 files; IndexPage/NotFoundPage error with `FileNotFoundError`.

- [ ] **Step 3: Commit**

```bash
git add tests/check_site.py
git commit -m "Add static site test suite"
```

---

### Task 2: Static assets

**Files:**
- Create: `assets/img/logo.webp`, `assets/img/logo.jpg`, `favicon.svg`, `robots.txt`, `sitemap.xml`, `.nojekyll`

**Interfaces:**
- Produces: `assets/img/logo.webp` and `assets/img/logo.jpg` at 1200×800 (referenced by Task 3 with `width="1200" height="800"`), `favicon.svg` (referenced as `favicon.svg`).

- [ ] **Step 1: Download the logo from Gamma's image proxy**

```bash
mkdir -p assets/img
SRC="https://cdn.gamma.app/nas2r81bui7mh6a/edited-images/1aNHbvt30d1PKBgRhnDsW.png"
curl -fsSL -o assets/img/logo.webp "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:1200/format:webp/$SRC"
curl -fsSL -o assets/img/logo.jpg  "https://imgproxy.gamma.app/resize/quality:85/resizing_type:fit/width:1200/format:jpg/$SRC"
ls -l assets/img
```
Expected: `logo.webp` ≈ 38 KB, `logo.jpg` under 200 KB. Open `assets/img/logo.jpg` with the Read tool and confirm it is the "CRUD & Logic" illustration.

- [ ] **Step 2: Create `favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#4338ca"/><text x="32" y="41" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="24" font-weight="700" fill="#faf8f4">C&amp;L</text></svg>
```

- [ ] **Step 3: Create `robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://crudandlogic.com/sitemap.xml
```

- [ ] **Step 4: Create `sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://crudandlogic.com/</loc>
    <lastmod>2026-09-22</lastmod>
  </url>
</urlset>
```

- [ ] **Step 5: Create empty `.nojekyll`**

```bash
touch .nojekyll
```

- [ ] **Step 6: Run tests**

Run: `python tests/check_site.py`
Expected: still FAILED; `test_required_files_exist` now lists only `index.html`, `404.html`, `assets/css/site.css`, `README.md`.

- [ ] **Step 7: Commit**

```bash
git add assets/img favicon.svg robots.txt sitemap.xml .nojekyll
git commit -m "Add logo, favicon, robots, sitemap"
```

---

### Task 3: Home page (index.html + site.css)

**Files:**
- Create: `assets/css/site.css`, `index.html`

**Interfaces:**
- Consumes: `assets/img/logo.webp`, `assets/img/logo.jpg` (1200×800), `favicon.svg`.
- Produces: section ids `top why path services mentorship development difference contact`, `main#main`, `#nav-links`, `.nav-toggle`, `#year`.

- [ ] **Step 1: Create `assets/css/site.css`**

```css
:root {
  --bg: #faf8f4;
  --surface: #ffffff;
  --ink: #1a1a1a;
  --text: #4a4a4a;
  --line: #ebe6dc;
  --accent: #4338ca;
  --serif: "Fraunces", Georgia, "Times New Roman", serif;
  --sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --maxw: 1100px;
  --radius: 10px;
  --header-h: 64px;
}

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
body { margin: 0; background: var(--bg); color: var(--text); font: 400 1rem/1.65 var(--sans); }
img { display: block; max-width: 100%; height: auto; }
a { color: var(--accent); }
h1, h2, h3 { margin: 0; font-family: var(--serif); font-weight: 500; line-height: 1.15; color: var(--ink); }
p { margin: 0; }
[id] { scroll-margin-top: var(--header-h); }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; border-radius: 4px; }

.container { width: 100%; max-width: var(--maxw); margin: 0 auto; padding: 0 24px; }
@media (max-width: 600px) { .container { padding: 0 16px; } }

.skip-link { position: absolute; left: 16px; top: -60px; z-index: 100; padding: 10px 14px; border-radius: 6px; background: var(--ink); color: #fff; text-decoration: none; }
.skip-link:focus { top: 12px; }

/* Header */
.site-header { position: sticky; top: 0; z-index: 50; background: rgba(250, 248, 244, .92); -webkit-backdrop-filter: saturate(1.2) blur(8px); backdrop-filter: saturate(1.2) blur(8px); border-bottom: 1px solid var(--line); }
.nav { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: var(--header-h); }
.brand { font-family: var(--serif); font-weight: 700; font-size: 1.15rem; color: var(--ink); text-decoration: none; }
.nav-links { display: flex; gap: 28px; margin: 0; padding: 0; list-style: none; }
.nav-links a { font-size: .95rem; font-weight: 500; color: var(--ink); text-decoration: none; }
.nav-links a:hover { color: var(--accent); }
.nav-toggle { display: none; }

@media (max-width: 760px) {
  .nav { flex-wrap: wrap; }
  .nav-links { flex-wrap: wrap; gap: 18px; }
  .js .nav-toggle { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--ink); cursor: pointer; }
  .js .nav-links { display: none; width: 100%; flex-direction: column; gap: 0; padding: 4px 0 12px; }
  .js .nav-links.open { display: flex; }
  .js .nav-links a { display: block; padding: 12px 0; border-top: 1px solid var(--line); }
}

/* Shared */
.kicker { margin-bottom: 14px; font-size: .75rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); }
.btns { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
.btn { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 22px; border: 1px solid var(--ink); border-radius: 8px; font-size: .95rem; font-weight: 600; text-decoration: none; transition: background-color .15s, border-color .15s, color .15s; }
.btn-primary { background: var(--ink); color: var(--bg); }
.btn-primary:hover { background: var(--accent); border-color: var(--accent); }
.btn-secondary { background: transparent; color: var(--ink); }
.btn-secondary:hover { border-color: var(--accent); color: var(--accent); }
@media (prefers-reduced-motion: reduce) { .btn { transition: none; } }

/* Hero */
.hero { padding: 72px 0 88px; }
.hero-grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: 56px; align-items: center; }
.hero h1 { font-size: clamp(2.25rem, 5vw, 3.5rem); letter-spacing: -.01em; }
.hero h1 em { font-style: italic; color: var(--accent); }
.lead { max-width: 34em; margin-top: 20px; font-size: 1.125rem; }
.hero-art img { border-radius: 6px; box-shadow: 0 24px 48px -24px rgba(26, 26, 26, .3); }

/* Sections */
.section { padding: 88px 0; }
.section--alt { background: var(--surface); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.section-head { max-width: 40em; margin-bottom: 44px; }
.section-head h2 { font-size: clamp(1.85rem, 3.6vw, 2.6rem); }

.grid { display: grid; gap: 20px; margin: 0; padding: 0; list-style: none; }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

.card { padding: 28px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
.section--alt .card { background: var(--bg); }
.card h3 { margin-bottom: 8px; font-size: 1.3rem; }
.marker { display: block; margin-bottom: 10px; font-family: var(--serif); font-size: .95rem; color: var(--accent); }

.steps li { position: relative; }
@media (min-width: 961px) {
  .steps li:not(:last-child)::after { content: "\2192"; position: absolute; top: 50%; right: -17px; transform: translateY(-50%); padding: 2px 0; background: var(--bg); font-family: var(--serif); line-height: 1; color: var(--accent); }
}

.pull { max-width: 46em; margin: 56px 0 0; padding: 8px 0 8px 28px; border-left: 3px solid var(--accent); }
.pull p { font-family: var(--serif); font-size: clamp(1.25rem, 2.4vw, 1.6rem); font-style: italic; line-height: 1.4; color: var(--ink); }

.features { gap: 36px 48px; }
.feature { padding-left: 20px; border-left: 2px solid var(--line); }
.feature h3 { margin-bottom: 6px; font-size: 1.2rem; }

.checklist { margin: 12px 0 0; padding: 0; list-style: none; }
.checklist li { position: relative; margin-top: 10px; padding-left: 22px; }
.checklist li::before { content: ""; position: absolute; top: .62em; left: 0; width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }

.closing { max-width: 44em; margin-top: 48px; font-size: 1.1rem; color: var(--ink); }

.contact-card { display: flex; flex-direction: column; }
.contact-card p { flex: 1; margin-bottom: 24px; }
.contact-card .btn { align-self: flex-start; }

/* Footer */
.site-footer { padding: 40px 0; background: var(--ink); color: #cfcac0; font-size: .9rem; }
.site-footer a { color: #fff; }
.site-footer :focus-visible { outline-color: #a5b4fc; }
.footer-inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 28px; }
.footer-brand { font-family: var(--serif); font-size: 1.05rem; color: #fff; }
.footer-links { display: flex; gap: 20px; margin: 0; padding: 0; list-style: none; }

@media (max-width: 960px) {
  .grid-3 { grid-template-columns: 1fr; }
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 760px) {
  .hero { padding: 40px 0 56px; }
  .hero-grid { grid-template-columns: 1fr; gap: 36px; }
  .section { padding: 60px 0; }
}
@media (max-width: 600px) {
  .grid-2, .grid-4 { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>C.R.U.D &amp; Logic: Software Mentorship &amp; Development</title>
  <meta name="description" content="Create, Read, Update, Delete — and the Business Logic that makes it real. A boutique software mentorship and development service. Follow the flow of good decisions, from fundamentals to architecture.">
  <link rel="canonical" href="https://crudandlogic.com/">
  <meta name="theme-color" content="#faf8f4">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://crudandlogic.com/">
  <meta property="og:title" content="C.R.U.D &amp; Logic">
  <meta property="og:description" content="A boutique software mentorship and development service. Follow the flow of good decisions, from fundamentals to architecture.">
  <meta property="og:image" content="https://crudandlogic.com/assets/img/logo.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="800">
  <meta property="og:image:alt" content="C.R.U.D &amp; Logic illustration">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="C.R.U.D &amp; Logic">
  <meta name="twitter:description" content="A boutique software mentorship and development service. Follow the flow of good decisions, from fundamentals to architecture.">
  <meta name="twitter:image" content="https://crudandlogic.com/assets/img/logo.jpg">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,500&amp;family=Inter:wght@400;500;600;700&amp;display=swap">
  <link rel="stylesheet" href="assets/css/site.css">
  <script>document.documentElement.classList.add("js");</script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <header class="site-header">
    <nav class="container nav" aria-label="Primary">
      <a class="brand" href="#top">C.R.U.D &amp; Logic</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Menu">
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
      <ul class="nav-links" id="nav-links">
        <li><a href="#mentorship">Mentorship</a></li>
        <li><a href="#development">Development</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <main id="main">
    <section class="hero" id="top">
      <div class="container hero-grid">
        <div>
          <p class="kicker">Software mentorship &amp; development</p>
          <h1>Create, Read, Update, Delete — <em>and the logic that makes it real.</em></h1>
          <p class="lead">A boutique software mentorship and development service. Follow the flow of good decisions, from fundamentals to architecture.</p>
          <div class="btns">
            <a class="btn btn-primary" href="#mentorship">Start Learning</a>
            <a class="btn btn-secondary" href="#contact">Get a Quote</a>
          </div>
        </div>
        <picture class="hero-art">
          <source srcset="assets/img/logo.webp" type="image/webp">
          <img src="assets/img/logo.jpg" width="1200" height="800" alt="C.R.U.D &amp; Logic illustration: a developer at a laptop beside a code window">
        </picture>
      </div>
    </section>

    <section class="section section--alt" id="why">
      <div class="container">
        <div class="section-head">
          <p class="kicker">The problem</p>
          <h2>Why Guidance Matters</h2>
        </div>
        <ul class="grid grid-3">
          <li class="card">
            <span class="marker">1</span>
            <h3>Tutorial Traps</h3>
            <p>Self-taught developers often follow code examples without understanding the underlying context, creating a fragile foundation.</p>
          </li>
          <li class="card">
            <span class="marker">2</span>
            <h3>Architecture Gaps</h3>
            <p>Understanding how to write a function is different from knowing how to design systems that scale and maintain integrity over time.</p>
          </li>
          <li class="card">
            <span class="marker">3</span>
            <h3>Professional Divide</h3>
            <p>The internet is full of noise, but we provide direct mentorship that bridges the gap between hobbyist coding and professional development.</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="section" id="path">
      <div class="container">
        <div class="section-head">
          <p class="kicker">The path</p>
          <h2>From CRUD to Architecture</h2>
        </div>
        <ol class="grid grid-3 steps">
          <li class="card">
            <span class="marker">I.</span>
            <h3>Basic CRUD</h3>
            <p>Learn the fundamentals of data operations that power all applications.</p>
          </li>
          <li class="card">
            <span class="marker">II.</span>
            <h3>System Design</h3>
            <p>Understand how components interact within larger applications.</p>
          </li>
          <li class="card">
            <span class="marker">III.</span>
            <h3>Architecture</h3>
            <p>Master creating scalable, maintainable systems that solve real business problems.</p>
          </li>
        </ol>
        <blockquote class="pull">
          <p>We don't just teach you how to write code — we show you how to think like a systems developer, supporting and extending software architecture with confidence.</p>
        </blockquote>
      </div>
    </section>

    <section class="section section--alt" id="services">
      <div class="container">
        <div class="section-head">
          <p class="kicker">Services</p>
          <h2>What We Do</h2>
        </div>
        <ul class="grid grid-2">
          <li class="card">
            <h3>Mentorship &amp; Training</h3>
            <p>Personalized guidance to level up your development skills through hands-on learning and direct feedback.</p>
          </li>
          <li class="card">
            <h3>Application Development</h3>
            <p>Custom business solutions built with modern technologies and best practices in mind.</p>
          </li>
          <li class="card">
            <h3>Code Reviews</h3>
            <p>Expert analysis of your existing codebase to identify improvements and resolve challenging bugs.</p>
          </li>
          <li class="card">
            <h3>MVPs &amp; Architecture</h3>
            <p>From quick prototypes to comprehensive architectural guidance for your next big project.</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="section" id="mentorship">
      <div class="container">
        <div class="section-head">
          <p class="kicker">Mentorship</p>
          <h2>Software Mentorship</h2>
        </div>
        <ul class="grid grid-2 features">
          <li class="feature">
            <h3>Learn Modern Tech</h3>
            <p>Master C#, .NET, and clean coding practices that make your skills immediately valuable.</p>
          </li>
          <li class="feature">
            <h3>Weekly Check-ins</h3>
            <p>Regular Discord sessions to review progress, answer questions, and provide guidance.</p>
          </li>
          <li class="feature">
            <h3>Real Projects</h3>
            <p>Follow along with actual development work to see how professionals approach problems.</p>
          </li>
          <li class="feature">
            <h3>Professional Feedback</h3>
            <p>Get detailed code reviews and architectural insights that accelerate your growth.</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="section section--alt" id="development">
      <div class="container">
        <div class="section-head">
          <p class="kicker">Development</p>
          <h2>Business App Development</h2>
        </div>
        <div class="grid grid-3">
          <div class="card">
            <h3>Modern Technology Stack</h3>
            <ul class="checklist">
              <li>C# and .NET 10 for robust backend systems</li>
              <li>Blazor for interactive web interfaces</li>
              <li>SQL Server or PostgreSQL for reliable data storage</li>
            </ul>
          </div>
          <div class="card">
            <h3>Quality-Focused Approach</h3>
            <ul class="checklist">
              <li>Clean, maintainable codebases</li>
              <li>Comprehensive automated testing</li>
              <li>Detailed documentation and knowledge transfer</li>
            </ul>
          </div>
          <div class="card">
            <h3>Business-Driven Solutions</h3>
            <ul class="checklist">
              <li>Elegant UIs with powerful business logic</li>
              <li>Internal tools and public-facing products</li>
              <li>Scalable systems that grow with your needs</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="difference">
      <div class="container">
        <div class="section-head">
          <p class="kicker">Our approach</p>
          <h2>Our Difference</h2>
        </div>
        <ul class="grid grid-4 features">
          <li class="feature">
            <h3>Understanding</h3>
            <p>You don't just build it — you comprehend why it works.</p>
          </li>
          <li class="feature">
            <h3>Best Practices</h3>
            <p>Version control, coding standards, and pattern recognition.</p>
          </li>
          <li class="feature">
            <h3>Documentation</h3>
            <p>Learn how to create and follow professional design documentation.</p>
          </li>
          <li class="feature">
            <h3>Team Integration</h3>
            <p>Develop communication skills essential for professional environments.</p>
          </li>
        </ul>
        <p class="closing">We train for the real world of software development, focusing on the comprehensive skills that make developers valuable team members, not just code writers.</p>
      </div>
    </section>

    <section class="section section--alt" id="contact">
      <div class="container">
        <div class="section-head">
          <p class="kicker">Contact</p>
          <h2>Let's Connect</h2>
        </div>
        <ul class="grid grid-3">
          <li class="card contact-card">
            <h3>Book a Free Discovery Call</h3>
            <p>Let's discuss your goals and see if we're the right fit for your development journey or project needs.</p>
            <a class="btn btn-primary" href="mailto:contact@crudandlogic.com?subject=Discovery%20call">Book a Call</a>
          </li>
          <li class="card contact-card">
            <h3>Join Our Mentorship Community</h3>
            <p>Connect with like-minded developers in our Discord server where learning and collaboration happen daily.</p>
            <!-- DISCORD_INVITE -->
            <a class="btn btn-secondary" href="https://discord.gg/N3jy7qHt">Join Discord</a>
          </li>
          <li class="card contact-card">
            <h3>Start Your Development Project</h3>
            <p>Whether you need mentorship or a complete business application, we're ready to deliver exceptional results.</p>
            <a class="btn btn-secondary" href="mailto:contact@crudandlogic.com">Contact Us</a>
          </li>
        </ul>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <p><span class="footer-brand">C.R.U.D &amp; Logic</span> &nbsp;© <span id="year">2026</span></p>
      <ul class="footer-links">
        <li><a href="mailto:contact@crudandlogic.com">contact@crudandlogic.com</a></li>
        <!-- DISCORD_INVITE -->
        <li><a href="https://discord.gg/N3jy7qHt">Discord</a></li>
      </ul>
    </div>
  </footer>

  <script>
    (function () {
      var toggle = document.querySelector(".nav-toggle");
      var links = document.getElementById("nav-links");
      function setOpen(open) {
        toggle.setAttribute("aria-expanded", String(open));
        links.classList.toggle("open", open);
      }
      toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
      links.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
      document.getElementById("year").textContent = new Date().getFullYear();
    })();
  </script>
</body>
</html>
```

- [ ] **Step 3: Run tests**

Run: `python tests/check_site.py`
Expected: all IndexPage tests PASS. `test_required_files_exist` still fails listing `404.html`, `README.md`; NotFoundPage errors (no `404.html`).

- [ ] **Step 4: Commit**

```bash
git add index.html assets/css/site.css
git commit -m "Build Editorial home page"
```

---

### Task 4: 404 page and README

**Files:**
- Create: `404.html`, `README.md`

- [ ] **Step 1: Create `404.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page not found · C.R.U.D &amp; Logic</title>
  <meta name="robots" content="noindex">
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px 16px; background: #faf8f4; color: #4a4a4a; font: 400 1rem/1.65 Georgia, "Times New Roman", serif; text-align: center; }
    p.code { margin: 0 0 8px; font: 600 .75rem/1 system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #4338ca; }
    h1 { margin: 0 0 12px; font-weight: 500; font-size: 2.4rem; line-height: 1.15; color: #1a1a1a; }
    a { display: inline-block; margin-top: 24px; padding: 12px 22px; border-radius: 8px; background: #1a1a1a; color: #faf8f4; font: 600 .95rem system-ui, sans-serif; text-decoration: none; }
    a:hover { background: #4338ca; }
    a:focus-visible { outline: 3px solid #4338ca; outline-offset: 3px; }
  </style>
</head>
<body>
  <main>
    <p class="code">404</p>
    <h1>This page doesn't exist.</h1>
    <p>It may have moved when the site was rebuilt.</p>
    <a href="https://crudandlogic.com/">Back to C.R.U.D &amp; Logic</a>
  </main>
</body>
</html>
```

- [ ] **Step 2: Create `README.md`**

````markdown
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
````

- [ ] **Step 3: Run tests**

Run: `python tests/check_site.py`
Expected: `OK (skipped=1)` — only `test_cname_if_present` skipped.

- [ ] **Step 4: Commit**

```bash
git add 404.html README.md
git commit -m "Add 404 page and README"
```

---

### Task 5: Visual verification

**Files:**
- Modify (only if issues are found): `assets/css/site.css`, `index.html`

- [ ] **Step 1: Open locally in the browser pane**

Navigate the browser pane to `file:///H:/Source/repos/CrudandLogicSite/index.html`.

- [ ] **Step 2: Check each viewport**

For each of: `resize_window` preset `mobile` (375×812), preset `tablet` (768×1024), then `width 1280 height 800`:
- Screenshot the hero and scroll through every section.
- Run in the page: `document.documentElement.scrollWidth <= window.innerWidth` → must be `true` (no horizontal scroll).
- Mobile only: click the menu button, confirm the links appear and `aria-expanded="true"`; click "Contact", confirm the menu closes and the page scrolls to Let's Connect.
- Desktop: click Start Learning → lands on Software Mentorship with its heading not hidden under the sticky header; Get a Quote → Let's Connect.
- `read_console_messages` with `onlyErrors: true` → empty.

Reset with `resize_window` preset `desktop` afterwards.

- [ ] **Step 3: Fix and re-test**

If any issue is found, fix it in `site.css`/`index.html`, re-run `python tests/check_site.py` (expect `OK (skipped=1)`) and repeat the affected check.

- [ ] **Step 4: Commit (only if changes were made)**

```bash
git add index.html assets/css/site.css
git commit -m "Fix layout issues found in visual check"
```

---

### Task 6: Publish to GitHub Pages (preview URL)

**Files:** none (remote setup)

- [ ] **Step 1: Check the account's user-site domain**

Run: `gh api repos/kurtnelle/kurtnelle.github.io/pages --jq .cname`
Expected: 404 / no output → preview URL is `https://kurtnelle.github.io/crudandlogic.com/`. If it prints a domain `X`, the preview URL is `https://X/crudandlogic.com/` instead.

- [ ] **Step 2: Create the public repo and push**

```bash
gh repo create kurtnelle/crudandlogic.com --public --source . --remote origin --push --description "C.R.U.D & Logic website" --homepage "https://crudandlogic.com"
```
Expected: repo URL printed, `main` pushed.

- [ ] **Step 3: Enable Pages from `main` root**

```bash
gh api -X POST repos/kurtnelle/crudandlogic.com/pages -f "source[branch]=main" -f "source[path]=/"
```
Expected: JSON with `"html_url": "https://kurtnelle.github.io/crudandlogic.com/"`.

- [ ] **Step 4: Wait for the build**

Run until it prints `built` (checks about every 20 seconds, up to about 5 minutes): `gh api repos/kurtnelle/crudandlogic.com/pages/builds/latest --jq .status`

- [ ] **Step 5: Verify the preview**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://kurtnelle.github.io/crudandlogic.com/
curl -s -o /dev/null -w "%{http_code}\n" https://kurtnelle.github.io/crudandlogic.com/assets/css/site.css
curl -s -o /dev/null -w "%{http_code}\n" https://kurtnelle.github.io/crudandlogic.com/assets/img/logo.webp
```
Expected: `200` three times. Then open the preview URL in the browser pane at desktop width and confirm it renders styled with the logo.

---

### Task 7: Domain cutover

**Files:**
- Create: `CNAME`

- [ ] **Step 1: Hand the DNS changes to the owner**

Tell the user to make these changes in the Cloudflare dashboard → crudandlogic.com → DNS, and to reply when done. All records must be **DNS only (grey cloud)**:
- Delete the existing apex A records pointing to Gamma (`3.136.232.26`, `3.137.108.170`) and the `www` CNAME to `sites.gamma.app`.
- Add `A` `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- Add `AAAA` `@` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
- Add `CNAME` `www` → `kurtnelle.github.io`
- *(Recommended)* GitHub → Settings → Pages → Verified domains → add `crudandlogic.com`, and create the TXT record it shows.

**Stop here and wait for the user's confirmation.**

- [ ] **Step 2: Confirm DNS has propagated**

Run: `Resolve-DnsName crudandlogic.com -Type A -Server 1.1.1.1` and `Resolve-DnsName www.crudandlogic.com -Server 1.1.1.1`
Expected: only `185.199.108–111.153`; `www` → `kurtnelle.github.io`.

- [ ] **Step 3: Add CNAME, test, push**

```bash
printf "crudandlogic.com\n" > CNAME
python tests/check_site.py
```
Expected: `OK` with no skips.
```bash
git add CNAME
git commit -m "Point GitHub Pages at crudandlogic.com"
git push
```

- [ ] **Step 4: Set the custom domain**

```bash
gh api -X PUT repos/kurtnelle/crudandlogic.com/pages -f cname=crudandlogic.com
```

- [ ] **Step 5: Wait for the certificate, then enforce HTTPS**

Poll: `gh api repos/kurtnelle/crudandlogic.com/pages --jq .https_certificate.state` until `approved` (usually minutes, up to about an hour). Then:
```bash
gh api -X PUT repos/kurtnelle/crudandlogic.com/pages -F https_enforced=true
```

- [ ] **Step 6: Verify end to end**

```bash
curl -sI https://crudandlogic.com/ | head -1
curl -sI http://crudandlogic.com/ | grep -i -E "^(HTTP|location)"
curl -sI https://www.crudandlogic.com/ | grep -i -E "^(HTTP|location)"
curl -s -o /dev/null -w "%{http_code}\n" https://crudandlogic.com/does-not-exist
```
Expected: `HTTP/2 200`; http → `301` to `https://crudandlogic.com/`; www → `301` to `https://crudandlogic.com/`; `404`. Open `https://crudandlogic.com` in the browser pane and confirm the new site renders.

- [ ] **Step 7: Hand off the remaining owner steps**

Tell the user to:
- disconnect the custom domain in Gamma;
- *(optional)* switch the Cloudflare records to proxied with SSL/TLS mode **Full (strict)** and **Always Use HTTPS** on;
- send a non-expiring Discord invite, to replace the `DISCORD_INVITE` links.
