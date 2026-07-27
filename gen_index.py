import os
from pathlib import Path
import json
from blake3 import blake3

def main():
    with open("index_base.json", "r", encoding="utf-8") as f:
        index = json.load(f)
    index["files"] = []

    ld_dir = Path("localized_data")
    if not ld_dir.exists():
        print("[Error] localized_data directory not found")
        return

    for root, dirs, files in os.walk(ld_dir):
        for f in files:
            if f == ".gitignore":
                continue
            full_path = Path(root) / f
            rel_path = full_path.relative_to(ld_dir)

            with open(full_path, "rb") as file_obj:
                raw_bytes = file_obj.read()
            TEXT_EXTENSIONS = {'.json', '.txt', '.md', '.yaml', '.yml', '.csv'}
            if rel_path.suffix.lower() in TEXT_EXTENSIONS:
                clean_bytes = raw_bytes.replace(b"\r\n", b"\n")
            else:
                clean_bytes = raw_bytes

            hasher = blake3(clean_bytes, max_threads=blake3.AUTO)
            file_hash = hasher.hexdigest()

            index["files"].append({
                'path': rel_path.as_posix(),
                'hash': file_hash,
                'size': len(clean_bytes)
            })

    # Sort files by path for deterministic index.json output
    index["files"].sort(key=lambda x: x['path'])

    with open("index.json", "w", encoding="utf-8", newline='\n') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated index.json with {len(index['files'])} files.")

if __name__ == "__main__":
    main()