"""Package the static atlas and open tools for distribution."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
with ZipFile(root / "dist/canopy-atlas-source.zip", "w", ZIP_DEFLATED) as archive:
    paths = [root / "README.md", root / "LICENSE"]
    for directory in ("dist", "docs", "tools"):
        paths.extend(sorted((root / directory).rglob("*")))
    for path in paths:
        if path.is_file() and path.suffix not in {".zip", ".pyc"}:
            archive.write(path, path.relative_to(root).as_posix())
