from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parent
OUTPUT = PROJECT_ROOT / "studyflow-api.zip"
INCLUDE_PATHS = [
    ROOT / "app",
    ROOT / ".ebextensions",
    ROOT / "Procfile",
    ROOT / "requirements.txt",
]


def iter_files():
    for path in INCLUDE_PATHS:
        if path.is_file():
            yield path
            continue

        for child in path.rglob("*"):
            if child.is_file() and "__pycache__" not in child.parts and child.suffix != ".pyc":
                yield child


def main() -> None:
    if OUTPUT.exists():
        OUTPUT.unlink()

    with ZipFile(OUTPUT, "w", ZIP_DEFLATED) as archive:
        for path in iter_files():
            archive.write(path, path.relative_to(ROOT).as_posix())

    print(f"Created {OUTPUT}")


if __name__ == "__main__":
    main()
