DROP TABLE IF EXISTS children;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    caption TEXT,
    media_type TEXT NOT NULL,
    media_url TEXT,
    permalink TEXT,
    timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS children (
    parent_id TEXT NOT NULL REFERENCES posts(id),
    child_id TEXT NOT NULL REFERENCES posts(id),
    PRIMARY KEY (parent_id, child_id)
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL,
    profile_picture_url TEXT,
    followers_count INTEGER,
    media_count INTEGER,
    access_token TEXT,
    access_token_expires_at TEXT
);
