ALTER TABLE files
    ADD CONSTRAINT unique_file_per_snapshot UNIQUE (filename, relative_path, snapshot_id);