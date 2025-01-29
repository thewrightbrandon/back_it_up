CREATE TABLE files (
    id SERIAL PRIMARY KEY, -- automatically increments unique snapshot ID
    filename TEXT NOT NULL, -- name of the file, cannot be empty
    content_hash TEXT UNIQUE NOT NULL, -- SHA-256 hash of file content (ensures no dupes), cannot be empty
    snapshot_id INTEGER NOT NULL, -- foreign key linking to snapshots table, cannot be empty
    content BYTEA, -- stores content of file in variable-length binary string
    FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE -- file associates with a snapshot, file automatically deleted if snapshot is deleted
);