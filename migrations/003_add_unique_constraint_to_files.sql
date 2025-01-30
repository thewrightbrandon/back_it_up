ALTER TABLE files
    ADD CONSTRAINT unique_filename_snapshot UNIQUE (filename, snapshot_id);