CREATE TABLE snapshots (
    id SERIAL PRIMARY KEY, -- automatically increments unique snapshot ID
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- defaults to real time timestamp
);