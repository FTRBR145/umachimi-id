import pygit2
from pathlib import Path
import json
from blake3 import blake3

def ls_tree(tree: pygit2.Tree, parent=Path(""), skip_trees=False):
    for e in tree:
        path = parent / e.name
        if isinstance(e, pygit2.Tree):
            if not skip_trees:
                yield path
            yield from ls_tree(e, path, skip_trees)
        else:
            yield path

def main():
    with open("index_base.json") as f:
        index = json.load(f)
    index["files"] = []

    repo = pygit2.Repository('.')
    tree = repo.revparse_single('HEAD').tree

    ld_tree = None
    for e in tree:
        if e.name == "localized_data" and isinstance(e, pygit2.Tree):
            ld_tree = e
            break

    if not ld_tree:
        print("[Error] localized_data tree not found")
        return

    hasher = blake3(max_threads=blake3.AUTO)
    for path in ls_tree(ld_tree, skip_trees=True):
        if path.name == ".gitignore":
            continue

        print(path)
        fs_path = "localized_data" / path

        data = fs_path.read_bytes()
        if path.suffix.lower() in ('.json', '.txt', '.md'):
            data = data.replace(b'\r\n', b'\n')

        hasher.update(data)
        file_hash = hasher.digest()
        hasher.reset()

        index["files"].append({
            'path': path.as_posix(),
            'hash': file_hash.hex(),
            'size': len(data)
        })

    with open("index.json", "w", encoding="utf-8", newline='\n') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()