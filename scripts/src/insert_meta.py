import frontmatter
from fire import Fire

def insert_property_to_markdown(*file_paths, key: str, value: str):
    """
    Insert a key-value pair into the YAML frontmatter of a markdown file.
    If the key already exists, it will be updated with the new value.
    """
    for file_path in file_paths:
        insert_key_value(file_path, key, value)

def insert_key_value(file_path: str, key: str, value: str):
    post = frontmatter.load(file_path)
    if key in post:
        if isinstance(post[key], list):
            if value not in post[key]:
                post[key].append(value)
        else:
            post[key] = value
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(frontmatter.dumps(post))
    print(f"Inserted/Updated '{key}: {value}' in {file_path}")


if __name__ == "__main__":
    Fire(insert_property_to_markdown)
