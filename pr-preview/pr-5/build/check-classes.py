#!/usr/bin/env python3
"""Report class names used in prototype HTML that are absent from the committed
assets/application.css. CI does not rebuild the CSS, so a class that was never
emitted silently does nothing. Run from the repo root:

    python3 build/check-classes.py prototypes/<set>/*.html
"""
import re
import sys
import pathlib

# Resolved relative to this file, not the cwd, so the check is reproducible from
# anywhere. prototypes/<set>/.check-classes.py -> ../../assets/application.css
CSS_PATH = pathlib.Path(__file__).resolve().parent.parent / "assets" / "application.css"
CSS = CSS_PATH.read_text(encoding="utf-8")

# Utilities that only ever appear inside a variant selector, plus bare element
# hooks we set from JS — not worth flagging.
SKIP_PREFIXES = ("group", "peer")
BOUNDARY = set("{,:) >+~\n")

# Screens build some class strings by concatenation inside <script>, e.g.
#   '<span class="w-7 rounded-full ' + u.tone + ' text-white">'
# The naive attribute scrape then yields JS fragments ("+", "u.tone", quotes).
# Drop anything that cannot be a utility, and pass the interpolated values in
# explicitly with --extra so they still get checked.
PLAUSIBLE = re.compile(r"^[a-zA-Z][a-zA-Z0-9:_\[\]/.,%!#()-]*$")
JS_EXPR = re.compile(r"^[A-Za-z_$][A-Za-z0-9_$]*\.[A-Za-z0-9_$]+$")


def escaped(token: str) -> str:
    return re.sub(r"([^a-zA-Z0-9_-])", lambda m: "\\" + m.group(1), token)


def present(token: str) -> bool:
    needle = "." + escaped(token)
    start = 0
    while True:
        i = CSS.find(needle, start)
        if i == -1:
            return False
        nxt = CSS[i + len(needle)] if i + len(needle) < len(CSS) else "{"
        if nxt in BOUNDARY:
            return True
        start = i + 1


def variants_stripped(token: str):
    """`md:flex` and `dark:bg-x` compile to the same utility body; check the base."""
    while ":" in token:
        head, token = token.split(":", 1)
        if head.startswith("["):  # arbitrary variant, give up
            return None
    return token


args = sys.argv[1:]
extra = []
if "--extra" in args:
    i = args.index("--extra")
    extra = args[i + 1].split(",")
    args = args[:i] + args[i + 2:]

missing = {}
for path in args:
    html = pathlib.Path(path).read_text(encoding="utf-8")
    # Collapse JS concatenation inside class strings ("' + a.tone + '") so the
    # interpolated identifier is not mistaken for a utility. Pass the values it
    # can take via --extra instead.
    html = re.sub(r"'\s*\+\s*[\w.$\[\]']+\s*\+\s*'", " ", html)
    # Classes the page defines in its own <style> block (e.g. the `.md` markdown
    # skin on each set's index.html) are legitimately absent from the shared CSS.
    local = set()
    for block in re.findall(r"<style[^>]*>(.*?)</style>", html, re.S):
        local.update(re.findall(r"\.([a-zA-Z][\w-]*)", block))
    tokens = set(extra)
    for attr in re.findall(r'class="([^"]*)"', html):
        tokens.update(t for t in attr.split() if t)
    for token in sorted(tokens):
        if token.startswith(SKIP_PREFIXES):
            continue
        if not PLAUSIBLE.match(token) or JS_EXPR.match(token):
            continue
        if token in local:
            continue
        base = variants_stripped(token)
        if base is None:
            continue
        if present(token) or present(base):
            continue
        missing.setdefault(base, set()).add(pathlib.Path(path).name)

if missing:
    print(f"MISSING ({len(missing)}):")
    for token, files in sorted(missing.items()):
        print(f"  {token:<34} {', '.join(sorted(files))}")
    sys.exit(1)
print("all classes present in assets/application.css")
