CREATE TABLE file_contents (
    id SERIAL PRIMARY KEY,
    content_hash TEXT UNIQUE NOT NULL,
    content BYTEA NOT NULL
);