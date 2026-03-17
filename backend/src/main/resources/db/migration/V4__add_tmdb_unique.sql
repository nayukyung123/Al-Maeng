-- V4__add_unique_to_contents_tmdb_id.sql

ALTER TABLE contents
    ADD CONSTRAINT contents_tmdb_id_unique UNIQUE (tmdb_id);