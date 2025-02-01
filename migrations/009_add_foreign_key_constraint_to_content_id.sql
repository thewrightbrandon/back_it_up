ALTER TABLE files
    ADD CONSTRAINT fk_files_content_id
        FOREIGN KEY (content_id) REFERENCES file_contents(id);