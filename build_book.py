"""Convert A Book to Say Goodbye.md into paginated book data for the HTML reader."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
MD_FILE = ROOT / "A Book to Say Goodbye.md"
OUT_FILE = ROOT / "js" / "book-data.js"

WORDS_PER_PAGE = 115
MIN_WORDS_BEFORE_BREAK = 80


def is_urdu_text(text: str) -> bool:
    return bool(re.search(r"[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]", text))


def md_inline(text: str) -> str:
    text = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", text)
    text = re.sub(r"_([^_]+)_", r"<em>\1</em>", text)
    return text


def word_count(html: str) -> int:
    plain = re.sub(r"<[^>]+>", " ", html)
    return len(plain.split())


def parse_markdown(content: str) -> list[dict]:
    lines = content.splitlines()
    blocks: list[dict] = []
    i = 0

    while i < len(lines):
        line = lines[i]

        if line.strip() == "---":
            i += 1
            continue

        if line.startswith("# Chapter"):
            chapter_num = line[2:].strip()
            i += 1
            subtitle = ""
            if i < len(lines) and lines[i].startswith("## "):
                subtitle = lines[i][3:].strip()
                i += 1
            blocks.append(
                {
                    "type": "chapter",
                    "number": chapter_num,
                    "title": subtitle,
                }
            )
            continue

        if line.startswith("# "):
            blocks.append({"type": "book-title", "text": line[2:].strip()})
            i += 1
            continue

        if line.startswith("## "):
            heading = line[3:].strip()
            blocks.append({"type": "section", "text": heading})
            i += 1
            continue

        if line.startswith("### "):
            blocks.append({"type": "subsection", "text": line[4:].strip()})
            i += 1
            continue

        if line.startswith("#### "):
            blocks.append({"type": "subsubsection", "text": line[5:].strip()})
            i += 1
            continue

        if line.strip() in {">", "> "}:
            i += 1
            continue

        if line.startswith("> "):
            quote_lines = []
            while i < len(lines) and (
                lines[i].startswith(">") or lines[i].strip() in {">", ""}
            ):
                if lines[i].startswith(">"):
                    content = lines[i][1:].strip()
                    if content:
                        quote_lines.append(content)
                i += 1
            if quote_lines:
                blocks.append({"type": "quote", "lines": quote_lines})
            continue

        if line.strip() == "":
            i += 1
            continue

        if line.startswith("**") and line.rstrip().endswith("**"):
            blocks.append({"type": "label", "text": line.strip("* ").strip()})
            i += 1
            continue

        para_lines = [line.strip()]
        i += 1
        while i < len(lines) and lines[i].strip() and not lines[i].startswith(("#", ">", "---", "**")):
            para_lines.append(lines[i].strip())
            i += 1
        blocks.append({"type": "paragraph", "text": " ".join(para_lines)})

    return blocks


def block_to_html(block: dict) -> str:
    t = block["type"]

    if t == "book-title":
        return ""

    if t == "chapter":
        return ""

    if t == "section":
        cls = "section-heading"
        if block.get("type") == "epilogue":
            cls += " epilogue-heading"
        return f'<h2 class="{cls}">{md_inline(block["text"])}</h2>'

    if t == "subsection":
        return f'<h3 class="subsection-heading">{md_inline(block["text"])}</h3>'

    if t == "subsubsection":
        return f'<h4 class="subsubsection-heading">{md_inline(block["text"])}</h4>'

    if t == "quote":
        inner = "<br>".join(md_inline(line) for line in block["lines"])
        urdu = is_urdu_text(inner)
        cls = "pull-quote urdu-quote" if urdu else "pull-quote"
        return f'<blockquote class="{cls}">{inner}</blockquote>'

    if t == "label":
        return f'<p class="quote-label">{md_inline(block["text"])}</p>'

    if t == "paragraph":
        text = block["text"]
        text = md_inline(text)
        urdu = is_urdu_text(text)
        if urdu and text.startswith("<em>") and text.endswith("</em>"):
            return f'<p class="transliteration">{text}</p>'
        if urdu:
            plain = re.sub(r"<[^>]+>", "", text)
            if is_urdu_text(plain):
                return f'<p class="urdu-text" dir="rtl" lang="ur">{plain}</p>'
        return f"<p>{text}</p>"

    return ""


def paginate(blocks: list[dict]) -> list[dict]:
    pages: list[dict] = []
    current_html: list[str] = []
    current_words = 0
    current_chapter = "Front Matter"
    pending_chapter: dict | None = None

    def flush(page_type: str = "content", extra: dict | None = None):
        nonlocal current_html, current_words
        if not current_html:
            return
        page = {
            "type": page_type,
            "chapter": current_chapter,
            "html": "".join(current_html),
        }
        if extra:
            page.update(extra)
        pages.append(page)
        current_html = []
        current_words = 0

    # Cover
    pages.append(
        {
            "type": "cover",
            "chapter": "Cover",
            "title": "A Book to Say Goodbye",
            "subtitle": "A memoir of love, silence, and choosing yourself",
            "author": "Prena Dhomwja",
            "dedication": [
                "For the version of me who stayed too long.",
                "For the version of me who is finally leaving with grace.",
            ],
        }
    )

    # Title / dedication page
    pages.append(
        {
            "type": "title-page",
            "chapter": "Front Matter",
            "title": "A Book to Say Goodbye",
            "html": (
                '<p class="lede">This is not a book about anger.</p>'
                "<p>It is an account of loving someone who slowly stopped choosing me, "
                "and of choosing myself when the silence became louder than every promise ever made.</p>"
                '<p class="signature">Written by Prena Dhomwja<br>In the quiet hours after midnight.<br>July 24</p>'
            ),
        }
    )

    i = 0
    while i < len(blocks):
        block = blocks[i]

        if block["type"] == "book-title":
            i += 1
            continue

        if block["type"] == "chapter":
            flush()
            pending_chapter = block
            current_chapter = block["title"] or block["number"]
            pages.append(
                {
                    "type": "chapter-opener",
                    "chapter": current_chapter,
                    "number": block["number"],
                    "title": block["title"],
                }
            )
            i += 1
            continue

        if block["type"] == "section":
            heading = block["text"]
            if heading.lower() == "about this book":
                flush()
                current_chapter = "About"
                i += 1
                continue
            html = block_to_html(block)
            words = word_count(html)
            if current_words + words > WORDS_PER_PAGE and current_words >= MIN_WORDS_BEFORE_BREAK:
                flush()
            current_html.append(html)
            current_words += words
            i += 1
            continue

        html = block_to_html(block)
        if not html:
            i += 1
            continue

        words = word_count(html)

        if current_words + words > WORDS_PER_PAGE and current_words >= MIN_WORDS_BEFORE_BREAK:
            flush()

        current_html.append(html)
        current_words += words
        i += 1

    flush()

    # Back cover
    pages.append(
        {
            "type": "back-cover",
            "chapter": "End",
            "html": (
                '<p class="back-quote">Choose yourself.</p>'
                "<p>That is not the end of love.<br>It is the beginning of loving correctly.</p>"
                '<p class="alvida" dir="rtl" lang="ur">الوداع</p>'
                '<p class="back-note">You were never too much.<br>You were simply too much for someone who was not enough.</p>'
                '<p class="cover-author">Written by Prena Dhomwja</p>'
            ),
        }
    )

    for idx, page in enumerate(pages):
        page["index"] = idx + 1
        page["total"] = len(pages)

    return pages


def main():
    content = MD_FILE.read_text(encoding="utf-8")
    blocks = parse_markdown(content)
    pages = paginate(blocks)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(pages, ensure_ascii=False, indent=2)
    OUT_FILE.write_text(f"window.BOOK_PAGES = {payload};\n", encoding="utf-8")
    print(f"Built {len(pages)} pages -> {OUT_FILE}")


if __name__ == "__main__":
    main()
