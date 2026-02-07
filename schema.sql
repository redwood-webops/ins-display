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
    access_token TEXT
);

INSERT INTO posts (id, caption, media_type, media_url, permalink, timestamp)
VALUES
  ("17992650716868355", "test reel", "VIDEO", "https://scontent-sjc3-1.cdninstagram.com/o1/v/t2/f2/m86/AQMg71--RyXPQZWOr9z9B8DjzdgtVvP9zffVV0apM7J_4G1doCszKVM2q43ueVEHl7ZqipKSjLuQwg5-1rJG3NnEgWzl0-oM43I-ODU.mp4?_nc_cat=103&_nc_sid=5e9851&_nc_ht=scontent-sjc3-1.cdninstagram.com&_nc_ohc=xw3b23AIDHcQ7kNvwGHVte1&efg=eyJ2ZW5jb2RlX3RhZyI6Inhwdl9wcm9ncmVzc2l2ZS5JTlNUQUdSQU0uQ0xJUFMuQzMuNzIwLmRhc2hfYmFzZWxpbmVfMV92MSIsInhwdl9hc3NldF9pZCI6MTc4NTEwNzQ1Mjg2NjgzNDQsImFzc2V0X2FnZV9kYXlzIjowLCJ2aV91c2VjYXNlX2lkIjoxMDA5OSwiZHVyYXRpb25fcyI6NCwidXJsZ2VuX3NvdXJjZSI6Ind3dyJ9&ccb=17-1&_nc_gid=rRQlbq_15qOYhDFoDjbR2w&edm=ANo9K5cEAAAA&_nc_zt=28&vs=924f9d7f0bc4bae&_nc_vs=HBksFQIYUmlnX3hwdl9yZWVsc19wZXJtYW5lbnRfc3JfcHJvZC9BOTQwNDc4OTJEMTIzQkZFNjIxMDU2Rjc0NTk1OTZBM192aWRlb19kYXNoaW5pdC5tcDQVAALIARIAFQIYUWlnX3hwdl9wbGFjZW1lbnRfcGVybWFuZW50X3YyLzkwNDkyMjYyOERFQTI0NTdFMkEwRjcyRjYyQjdDMjg2X2F1ZGlvX2Rhc2hpbml0Lm1wNBUCAsgBEgAoABgAGwKIB3VzZV9vaWwBMRJwcm9ncmVzc2l2ZV9yZWNpcGUBMRUAACbwqp_Cpd21PxUCKAJDMywXQBCIMSbpeNUYEmRhc2hfYmFzZWxpbmVfMV92MREAdf4HZeadAQA&_nc_tpa=Q5bMBQG3Xi9ykfjVm7BJUZNmhex6Oh0xdXKvJIMNyO54GTAPxgwYavR279PfcWl3PtNN2q9W5xtLNUtmpw&oh=00_Afs7IV9hsiBaz3NWL05_tK0uAS3inSUPcl3jMPrSETbznA&oe=698463E0", "https://www.instagram.com/reel/DUURG6VAuCW/", "2026-02-04T00:57:17+0000"),
  ("17991550250916539", "test carousel", "CAROUSEL_ALBUM", "https://scontent-sjc3-1.cdninstagram.com/v/t51.82787-15/626232295_17851074138668344_8325654451847481894_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=102&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0FST1VTRUxfSVRFTS5iZXN0X2ltYWdlX3VybGdlbi5DMyJ9&_nc_ohc=m5M0d1Wu6A0Q7kNvwHBNVon&_nc_oc=Adn732MmjyqdCtSId6FcajsnoeDmgk9kSgLyQDiKNsCdD08G-X2uzv0KVId_Qk56Vyo&_nc_zt=23&_nc_ht=scontent-sjc3-1.cdninstagram.com&edm=ANo9K5cEAAAA&_nc_gid=rRQlbq_15qOYhDFoDjbR2w&oh=00_AftCfrem7LFw6RrO4SvIHxtDwrofU16qkin7mMWL-GwJCw&oe=698858DB", "https://www.instagram.com/p/DUUQzqHj2Md/", "2026-02-04T00:54:15+0000"),
  ("18030098063783991", "test test", "IMAGE", "https://scontent-sjc3-1.cdninstagram.com/v/t51.82787-15/626281252_17850833463668344_6639505513068036067_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=110&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiRkVFRC5iZXN0X2ltYWdlX3VybGdlbi5DMyJ9&_nc_ohc=32cmQajPqfUQ7kNvwGPZc7I&_nc_oc=Adk6zf54opjCvfcRG-jh1KoCO8P7Um7WKu_ZpeNGOcJe142AiJYp-9JHDnHt7OU1QeU&_nc_zt=23&_nc_ht=scontent-sjc3-1.cdninstagram.com&edm=ANo9K5cEAAAA&_nc_gid=rRQlbq_15qOYhDFoDjbR2w&oh=00_AfvNtFom9GOgXa3njtTgeZnoAhjJmcxFKQclQPJ98__COA&oe=69885765", "https://www.instagram.com/p/DUSFkIjjhdC/", "2026-02-03T04:37:32+0000"),
  ("17898367107383640", NULL, "IMAGE", "https://scontent-sjc3-1.cdninstagram.com/v/t51.82787-15/626232295_17851074138668344_8325654451847481894_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=102&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0FST1VTRUxfSVRFTS5iZXN0X2ltYWdlX3VybGdlbi5DMyJ9&_nc_ohc=m5M0d1Wu6A0Q7kNvwHBNVon&_nc_oc=Adn732MmjyqdCtSId6FcajsnoeDmgk9kSgLyQDiKNsCdD08G-X2uzv0KVId_Qk56Vyo&_nc_zt=23&_nc_ht=scontent-sjc3-1.cdninstagram.com&edm=ANo9K5cEAAAA&_nc_gid=rRQlbq_15qOYhDFoDjbR2w&oh=00_AftCfrem7LFw6RrO4SvIHxtDwrofU16qkin7mMWL-GwJCw&oe=698858DB", "https://www.instagram.com/p/DUUQzjjD22J/", "2026-02-04T00:54:14+0000"),
  ("17854795182573406", NULL, "IMAGE", "https://scontent-sjc6-1.cdninstagram.com/v/t51.82787-15/626125287_17851074135668344_905172829297894377_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=108&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0FST1VTRUxfSVRFTS5iZXN0X2ltYWdlX3VybGdlbi5DMyJ9&_nc_ohc=GN03KW0a2NQQ7kNvwFVe7lF&_nc_oc=AdlLD0cBQzkjOzUh1loVl7IaIIms0AY4NpSWzKo760qN-rVwQj-Sud8mUZ4hDG7NBL4&_nc_zt=23&_nc_ht=scontent-sjc6-1.cdninstagram.com&edm=ANo9K5cEAAAA&_nc_gid=rRQlbq_15qOYhDFoDjbR2w&oh=00_AfsVFkRl3BBce9C1CN_LlPG2kXYgxXEI0VPBUDPlrFeZrw&oe=69886573", "https://www.instagram.com/p/DUUQzjKj8Az/", "2026-02-04T00:54:14+0000"),
  ("17993843645865497", NULL, "IMAGE", "https://scontent-sjc3-1.cdninstagram.com/v/t51.82787-15/626175390_17851074132668344_3547085072385315927_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=105&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0FST1VTRUxfSVRFTS5iZXN0X2ltYWdlX3VybGdlbi5DMyJ9&_nc_ohc=8piep6_OM9kQ7kNvwH7UNtB&_nc_oc=AdnX8qRm_80ecF4RL2kDkAzdJ5YYGmSUzKiepbnMaSaTsebSuouDlpFZ-OGy3bFzR-E&_nc_zt=23&_nc_ht=scontent-sjc3-1.cdninstagram.com&edm=ANo9K5cEAAAA&_nc_gid=rRQlbq_15qOYhDFoDjbR2w&oh=00_AfslmbDJuweXtgpXIMbfmNBkJsMykquWPfiTZk0t_F1R3g&oe=69887159", "https://www.instagram.com/p/DUUQzjMD0qf/", "2026-02-04T00:54:14+0000");

INSERT INTO children (parent_id, child_id)
VALUES
  ("17991550250916539", "17898367107383640"),
  ("17991550250916539", "17854795182573406"),
  ("17991550250916539", "17993843645865497");
