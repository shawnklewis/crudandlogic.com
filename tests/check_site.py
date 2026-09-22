"""Static checks for the crudandlogic.com site.

Run from the repo root:  python tests/check_site.py
"""
import re
import unittest
import xml.etree.ElementTree as ET
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
        self.anchors = []
        self._last_comment = None
        self._in_title, self._skip = False, 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        for key in ("href", "src", "srcset"):
            if a.get(key):
                self.links.append(a[key].split(",")[0].split()[0])
        if tag == "a" and a.get("href"):
            self.anchors.append((a["href"], self._last_comment))
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
        self._last_comment = data.strip()

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
                     if p.is_file() and p.suffix in (".html", ".css", ".svg", ".xml", ".txt", ".md", ".js")
                     and "docs" not in p.parts and ".superpowers" not in p.parts
                     and ".git" not in p.parts
                     and "gamma.app" in p.read_text(encoding="utf-8")]
        self.assertEqual(offenders, [])

    def test_sitemap_is_valid_xml(self):
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        root = ET.parse(ROOT / "sitemap.xml").getroot()
        locs = root.findall(".//sm:loc", ns)
        self.assertEqual(len(locs), 1)
        self.assertEqual(locs[0].text, "https://crudandlogic.com/")
        robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
        self.assertIn("Sitemap: https://crudandlogic.com/sitemap.xml", robots)


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
        bad = [h for h, c in self.page.anchors
               if h.startswith("https://discord.gg/") and c != "DISCORD_INVITE"]
        self.assertEqual(bad, [])
        self.assertTrue(any(h.startswith("https://discord.gg/") for h, c in self.page.anchors))

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
