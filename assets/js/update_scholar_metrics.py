"""Refresh portfolio metrics from a Google Scholar profile.

This script is intended to run from GitHub Actions. It updates:
- assets/js/radarplotdata.json
- assets/js/coauthor_data.json

Google Scholar does not provide an official public API, so this uses the
scholarly package and keeps existing values when Scholar does not expose a
metric cleanly.
"""

from __future__ import annotations

import json
import math
import os
from collections import Counter
from itertools import combinations
from pathlib import Path

from scholarly import scholarly


PROFILE_ID = os.environ.get("SCHOLAR_PROFILE_ID", "I6wblyMAAAAJ")
SELF_NAMES = {
    "Suraj A. Yadav",
    "Suraj Yadav",
    "S. A. Yadav",
    "SA Yadav",
}
TOP_COAUTHOR_COUNT = 18
ROOT = Path(__file__).resolve().parents[2]
RADAR_PATH = ROOT / "assets" / "js" / "radarplotdata.json"
COAUTHOR_PATH = ROOT / "assets" / "js" / "coauthor_data.json"


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as file:
        return json.load(file)


def write_json(path: Path, data: dict) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
        file.write("\n")


def round_up(value: int, step: int, minimum: int = 1) -> int:
    if value <= 0:
        return minimum
    return max(minimum, int(math.ceil(value / step) * step))


def normalize_name(name: str) -> str:
    return " ".join(name.replace("*", "").replace("\n", " ").split()).strip(" ,")


def canonical_name(name: str) -> str:
    clean = normalize_name(name)
    return "Suraj A. Yadav" if clean in SELF_NAMES else clean


def split_authors(author_text: str) -> list[str]:
    if not author_text:
        return []
    normalized = author_text.replace(" and ", ",")
    return [canonical_name(author) for author in normalized.split(",") if normalize_name(author)]


def classify_publication(bib: dict) -> str:
    venue = " ".join(
        str(bib.get(key, ""))
        for key in ("journal", "conference", "booktitle", "venue", "publisher", "citation")
    ).lower()
    title = str(bib.get("title", "")).lower()

    if "arxiv" in venue or "preprint" in venue or "preprint" in title:
        return "Preprints"
    if any(term in venue for term in ("chapter", "book", "elsevier")) and "journal" not in bib:
        return "Book chapters"
    if any(term in venue for term in ("conference", "symposium", "igarss", "proceedings", "spie", "isprs", "ursi")):
        return "Conference proceedings"
    return "Journal articles"


def publication_bib(publication: dict) -> dict:
    try:
        filled = scholarly.fill(publication)
        return filled.get("bib", publication.get("bib", {}))
    except Exception:
        return publication.get("bib", {})


def build_coauthor_network(publications: list[dict]) -> dict:
    author_counts: Counter[str] = Counter()
    publication_authors: list[list[str]] = []

    for publication in publications:
        authors = split_authors(publication.get("author", ""))
        if not authors:
            continue
        unique_authors = list(dict.fromkeys(authors))
        publication_authors.append(unique_authors)
        author_counts.update(unique_authors)

    top_coauthors = [
        name
        for name, _ in sorted(
            ((name, count) for name, count in author_counts.items() if name != "Suraj A. Yadav"),
            key=lambda item: (-item[1], item[0]),
        )[:TOP_COAUTHOR_COUNT]
    ]
    authors = ["Suraj A. Yadav", *top_coauthors]
    index = {author: idx for idx, author in enumerate(authors)}
    matrix = [[0 for _ in authors] for _ in authors]

    for authors_for_publication in publication_authors:
        visible_authors = [author for author in authors_for_publication if author in index]
        for source, target in combinations(visible_authors, 2):
            matrix[index[source]][index[target]] += 1
            matrix[index[target]][index[source]] += 1

    return {
        "authors": authors,
        "matrix": matrix,
        "author_counts": dict(sorted(author_counts.items(), key=lambda item: (-item[1], item[0]))),
    }


def main() -> None:
    existing_radar = load_json(RADAR_PATH)
    existing_raw = existing_radar.get("rawData", {})

    author = scholarly.search_author_id(PROFILE_ID)
    author_details = scholarly.fill(author)
    publications = [publication_bib(publication) for publication in author_details.get("publications", [])]

    publication_counts = Counter(classify_publication(publication) for publication in publications)
    coauthor_data = build_coauthor_network(publications)
    coauthor_total = len(
        [name for name in coauthor_data["author_counts"] if name != "Suraj A. Yadav"]
    )

    raw_data = {
        "Citations": int(author_details.get("citedby", existing_raw.get("Citations", 0)) or 0),
        "h-index": int(author_details.get("hindex", existing_raw.get("h-index", 0)) or 0),
        "i10-index": int(author_details.get("i10index", existing_raw.get("i10-index", 0)) or 0),
        "Journal articles": publication_counts.get("Journal articles", existing_raw.get("Journal articles", 0)),
        "Conference proceedings": publication_counts.get(
            "Conference proceedings", existing_raw.get("Conference proceedings", 0)
        ),
        "Conference presentations": existing_raw.get("Conference presentations", 0),
        "Book chapters": publication_counts.get("Book chapters", existing_raw.get("Book chapters", 0)),
        "Co-authors": coauthor_total,
        "Co-institutions": existing_raw.get("Co-institutions", 0),
    }

    max_values = {
        "Citations": round_up(raw_data["Citations"], 100, 100),
        "h-index": round_up(raw_data["h-index"], 5, 5),
        "i10-index": round_up(raw_data["i10-index"], 5, 5),
        "Journal articles": round_up(raw_data["Journal articles"], 5, 5),
        "Conference proceedings": round_up(raw_data["Conference proceedings"], 5, 5),
        "Conference presentations": round_up(raw_data["Conference presentations"], 5, 5),
        "Book chapters": round_up(raw_data["Book chapters"], 5, 5),
        "Co-authors": round_up(raw_data["Co-authors"], 10, 10),
        "Co-institutions": round_up(raw_data["Co-institutions"], 10, 10),
    }

    write_json(RADAR_PATH, {"maxValues": max_values, "rawData": raw_data})
    write_json(COAUTHOR_PATH, coauthor_data)


if __name__ == "__main__":
    main()
