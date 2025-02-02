UPDATE files
    SET content_id = file_contents.id
        FROM file_contents
            WHERE files.content_hash = file_contents.content_hash;