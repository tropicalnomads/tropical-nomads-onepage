-- Admin events, ticket capacity metadata, and the sealed QR secret.
-- Existing catalog rows stay published. The secret column stays a lookup-free text field.

alter table party add column origin text not null default 'catalog';
alter table party add column publication text not null default 'published';
alter table party add column revisions jsonb not null default '[]'::jsonb;
alter table party add column offers_managed boolean not null default false;

alter table party add constraint party_origin_check check (origin in ('catalog', 'admin'));
alter table party add constraint party_publication_check check (publication in ('draft', 'published'));

alter table issued_ticket add column secret_box text;
