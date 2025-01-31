CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    content_hash TEXT UNIQUE NOT NULL,
    snapshot_id INTEGER NOT NULL,
    content BYTEA,
    relative_path TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE -- file associates with a snapshot, file automatically deleted if snapshot is deleted
);