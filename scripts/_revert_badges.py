"""One-shot helper: re-encode underscores as %5F in Colab badge URLs across
chapter notebooks, so the jupyter-book -> LaTeX -> PDF path doesn't choke on
unescaped underscores. The sync_to_code_demos script undoes this encoding
when copying to code_demos/.

Delete this file after running once; it is not part of the regular workflow.
"""
from __future__ import annotations

import re
import pathlib

# Character class contains " and \ -- defined outside the main pattern
# because shell-escaping them inside a -c string is a nightmare.
FILENAME_CHARS = r'[^"\\]+?'

PAT = re.compile(
    r'(colab\.research\.google\.com/github/KarAnalytics/code)_(demos/blob/main/)'
    + r'(' + FILENAME_CHARS + r')'
    + r'(\.ipynb)'
)


def encode(m: re.Match) -> str:
    return (
        m.group(1) + "%5F" + m.group(2)
        + m.group(3).replace("_", "%5F")
        + m.group(4)
    )


def main() -> None:
    root = pathlib.Path(__file__).resolve().parent.parent / "chapters"
    changed = 0
    for fp in root.rglob("*.ipynb"):
        text = fp.read_text(encoding="utf-8")
        new = PAT.sub(encode, text)
        if new != text:
            fp.write_text(new, encoding="utf-8")
            print(f"  reverted: {fp.relative_to(root.parent)}")
            changed += 1
    print(f"total reverted: {changed}")


if __name__ == "__main__":
    main()
