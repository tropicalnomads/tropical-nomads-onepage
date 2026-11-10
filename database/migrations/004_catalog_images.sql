create table party_image (
  party_id text primary key references party (id) on delete cascade,
  content_type text not null,
  bytes bytea not null
);

create table artist_image (
  artist_id text primary key references artist (id) on delete cascade,
  content_type text not null,
  bytes bytea not null
);
