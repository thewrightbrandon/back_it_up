INSERT INTO file_contents (content_hash, content)
    SELECT DISTINCT content_hash, content
        FROM files