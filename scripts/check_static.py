from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = sorted(ROOT.glob("**/index.html"))

class Audit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = False
        self.h1 = 0
        self.viewport = False
        self.description = False
        self.canonical = False
        self.local_refs = []

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "meta" and data.get("name") == "viewport":
            self.viewport = True
        if tag == "meta" and data.get("name") == "description" and data.get("content","").strip():
            self.description = True
        if tag == "link" and data.get("rel") == "canonical" and data.get("href"):
            self.canonical = True
        if tag == "h1":
            self.h1 += 1
        if tag in {"script","link"}:
            ref = data.get("src") or data.get("href")
            if ref and not urlparse(ref).scheme and not ref.startswith("#"):
                self.local_refs.append(ref)

    def handle_data(self, data):
        if getattr(self, "_in_title", False) and data.strip():
            self.title = True

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "title":
            self._in_title = True
        if tag == "meta" and data.get("name") == "viewport":
            self.viewport = True
        if tag == "meta" and data.get("name") == "description" and data.get("content","").strip():
            self.description = True
        if tag == "link" and data.get("rel") == "canonical" and data.get("href"):
            self.canonical = True
        if tag == "h1":
            self.h1 += 1
        if tag in {"script","link"}:
            ref = data.get("src") or data.get("href")
            if ref and not urlparse(ref).scheme and not ref.startswith("#"):
                self.local_refs.append(ref)

errors = []
for file in HTML_FILES:
    audit = Audit()
    audit.feed(file.read_text(encoding="utf-8"))
    rel = file.relative_to(ROOT)
    if not audit.title:
        errors.append(f"{rel}: missing title")
    if not audit.viewport:
        errors.append(f"{rel}: missing viewport")
    if not audit.description:
        errors.append(f"{rel}: missing meta description")
    if not audit.canonical:
        errors.append(f"{rel}: missing canonical")
    if audit.h1 != 1:
        errors.append(f"{rel}: expected exactly one h1, got {audit.h1}")
    for ref in audit.local_refs:
        clean = ref.split("?")[0].split("#")[0]
        candidate = (file.parent / clean).resolve()
        if not candidate.exists():
            errors.append(f"{rel}: missing local asset {ref}")

for required in ["robots.txt","sitemap.xml","assets/styles.css","assets/site.js","docs/ARCHITECTURE.md"]:
    if not (ROOT / required).exists():
        errors.append(f"missing required file: {required}")

if errors:
    print("STATIC CHECK: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print(f"STATIC CHECK: PASS ({len(HTML_FILES)} HTML pages)")
