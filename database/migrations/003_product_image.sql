create table product_image (
  product_id text primary key references product (id) on delete cascade,
  content_type text not null,
  bytes bytea not null
);
