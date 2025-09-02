import os
import shutil
import frontmatter

from typing import Optional, Union
from glob import glob
from fire import Fire

# This script is used to sync data from Obsidian to Archive.


def sync_to_archive(
    dest_path: str,
    source_path: str = ".",
    key_tags: Optional[dict] = None,
    dry_run: bool = False
):
    """
    Sync markdown files from source_path to dest_path.
    If key_tags is provided (e.g. {"tags": ["foo"], "categories": ["bar"]}),
    only sync files where ALL specified keys contain at least one of the given tags.
    If dry_run is True, only print the actions without executing them.
    """
    print(
        f"Syncing from {source_path} to {dest_path} with key_tags {key_tags}")
    files = glob(os.path.join(source_path, '*.md'))
    for file_path in files:
        match = False
        if key_tags:
            for key, tags in key_tags.items():
                if not isinstance(tags, list):
                    tags = [tags]
                if any(check_markdown_yaml(file_path, key, tag) for tag in tags):
                    match = True
                else:
                    match = False
                    break
        if match:
            print(f"Would copy {file_path} to {dest_path}")
            if not dry_run:
                shutil.copy(file_path, dest_path)
                # insert title if not present
                title = os.path.splitext(os.path.basename(file_path))[0]
                insert_title_to_markdown(os.path.join(
                    dest_path, os.path.basename(file_path)), title)
        else:
            print(f"Skipping {file_path}, does not match key_tags {key_tags}")


def check_markdown_yaml(file_path: str, key_name: str, value: str) -> bool:
    post = frontmatter.load(file_path)
    if key_name in post:
        key_value = post[key_name]
        if isinstance(key_value, list):
            return value in key_value
        else:
            return value == key_value
    return False


def insert_title_to_markdown(file_path: str, title: str):
    post = frontmatter.load(file_path)
    if 'title' not in post:
        post['title'] = title
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(frontmatter.dumps(post))
        print(f"Inserted title '{title}' into {file_path}")
    else:
        print(f"File {file_path} already has a title: {post['title']}")


if __name__ == "__main__":
    Fire(sync_to_archive)
