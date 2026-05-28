import re
from dataclasses import dataclass

import bleach
from markdown_it import MarkdownIt


@dataclass(frozen=True)
class RenderedMarkdown:
    html: str
    toc: list[dict[str, str | int]]


ALLOWED_TAGS = {
    "a",
    "blockquote",
    "br",
    "code",
    "div",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "span",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "ul",
}
ALLOWED_ATTRIBUTES = {
    "*": ["id", "class"],
    "a": ["href", "title", "rel"],
    "img": ["src", "alt", "title", "width", "height"],
    "th": ["align"],
    "td": ["align"],
}
ALLOWED_PROTOCOLS = {"http", "https", "mailto"}


def render_markdown(markdown: str) -> RenderedMarkdown:
    parser = MarkdownIt("commonmark", {"html": False}).enable("table")
    tokens = parser.parse(markdown)
    toc: list[dict[str, str | int]] = []

    for index, token in enumerate(tokens):
        if token.type != "heading_open":
            continue
        inline = tokens[index + 1] if index + 1 < len(tokens) else None
        title = inline.content.strip() if inline is not None and inline.type == "inline" else ""
        level = int(token.tag[1])
        anchor = _slugify(title)
        token.attrSet("id", anchor)
        toc.append({"id": anchor, "title": title, "level": level})

    rendered = parser.renderer.render(tokens, parser.options, {})
    return RenderedMarkdown(html=sanitize_html(rendered), toc=toc)


def render_inline_markdown(markdown: str) -> str:
    parser = MarkdownIt("commonmark", {"html": False})
    return sanitize_html(parser.render(markdown))


def sanitize_html(html: str) -> str:
    return bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
    )


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9а-яА-ЯёЁ]+", "-", value.strip().lower()).strip("-")
    return slug or "section"
