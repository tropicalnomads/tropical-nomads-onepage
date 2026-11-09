-- Tables follow packages/shared schemas. Lookup indexes follow lookups.ts.
-- The issued-ticket secret is stored and is not indexed.

create table catalog_envelope (
  name text primary key,
  document jsonb not null
);

create table party (
  id text primary key,
  title text not null,
  type text,
  date_start timestamptz not null,
  date_end text,
  timezone text,
  duration_hours numeric,
  venue_id text,
  venue jsonb,
  lineup_raw text,
  stages jsonb,
  card_artists jsonb,
  partner_ids text[] not null default '{}',
  timetable_festival_id text,
  media jsonb,
  description text,
  organizer text,
  images jsonb,
  links jsonb,
  source jsonb,
  offers jsonb,
  document jsonb not null,
  source_order integer not null
);

create table artist (
  id text primary key,
  name text not null,
  country text,
  iso_country text,
  country_flag text,
  genres jsonb,
  agencies jsonb,
  labels jsonb,
  stage text,
  document jsonb not null,
  source_order integer not null
);

create table venue (
  id text primary key,
  name text,
  city text,
  country text,
  iso_country text,
  address text,
  geo jsonb,
  map_url text,
  document jsonb not null,
  source_order integer not null
);

create table partner (
  id text primary key,
  name text not null,
  city text not null,
  handle text not null,
  instagram text not null,
  document jsonb not null,
  source_order integer not null
);

create table label (
  id text primary key,
  name text not null,
  document jsonb not null,
  source_order integer not null
);

create table agency (
  id text primary key,
  name text not null,
  document jsonb not null,
  source_order integer not null
);

create table social_link (
  id text primary key,
  platform text not null,
  label text not null,
  handle text not null,
  url text not null,
  document jsonb not null,
  source_order integer not null
);

create table calendar_entry (
  id text primary key,
  artist_id text not null,
  party_id text not null
);

create table profile (
  sub text primary key,
  email text not null,
  email_verified boolean not null,
  username text not null,
  given_name text not null,
  family_name text not null,
  display_name text,
  avatar_key text,
  phone text,
  city text,
  region text,
  postal_code text,
  country text,
  created_at text not null,
  updated_at text not null,
  status text not null,
  role text not null,
  locale text,
  billing_address_id text,
  document jsonb not null
);

create table profile_provider (
  profile_sub text not null references profile (sub) on delete cascade,
  provider text not null,
  subject text not null,
  primary key (profile_sub, provider, subject)
);

create table billing_address (
  id text primary key,
  recipient_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  region text not null,
  postal_code text not null,
  country text not null,
  document jsonb not null
);

create table payment_method (
  id text primary key,
  user_id text not null,
  type text not null,
  provider_customer_reference text not null,
  provider_method_reference text not null,
  brand text not null,
  last4 text not null,
  expiry_month integer not null,
  expiry_year integer not null,
  billing_address_id text not null,
  status text not null,
  document jsonb not null
);

create table customer_order (
  id text primary key,
  user_id text not null,
  purpose text not null,
  lines jsonb not null,
  trace_id text not null,
  created_at text not null,
  document jsonb not null
);

create table payment_trace (
  id text primary key,
  user_id text not null,
  amount numeric not null,
  currency text not null,
  purpose text not null,
  reference text not null,
  status text not null,
  document jsonb not null
);

create table issued_ticket (
  id text primary key,
  party_id text not null,
  trace_id text not null,
  buyer_id text not null,
  secret text not null,
  created_at text not null,
  valid_for_entry boolean not null,
  document jsonb not null
);

create table check_in (
  id text primary key,
  ticket_id text,
  guest_id text,
  party_id text not null,
  at text not null,
  actor_id text not null,
  result text not null,
  reason text,
  document jsonb not null
);

create table door_invite (
  id text primary key,
  email text not null,
  user_id text,
  party_ids text[] not null default '{}',
  revoked boolean not null,
  document jsonb not null
);

create table guest_list (
  id text primary key,
  party_id text not null,
  name text not null,
  created_at text not null,
  guests jsonb not null,
  document jsonb not null
);

create table product (
  id text primary key,
  name text not null,
  image text not null,
  alt text not null,
  amount numeric not null,
  currency text,
  pickup text not null,
  stock_note text not null,
  document jsonb not null
);

create table stock_count (
  product_id text not null references product (id) on delete cascade,
  size text not null,
  count integer not null,
  primary key (product_id, size)
);

create table stock_correction (
  id text primary key,
  product_id text not null,
  size text not null,
  actor_id text not null,
  at text not null,
  old_count integer not null,
  new_count integer not null,
  document jsonb not null
);

create table marketing_consent (
  id text primary key,
  subject_kind text not null,
  subject_id text not null,
  purpose text not null,
  consented_at text not null,
  stopped_at text,
  stop_token text,
  document jsonb not null
);

create table email_template (
  id text primary key,
  purpose text not null,
  marketing boolean not null,
  subject text not null,
  body text not null,
  document jsonb not null
);

create table email_send (
  id text primary key,
  template_id text not null,
  recipient text not null,
  language text not null,
  purpose text not null,
  at text not null,
  document jsonb not null
);

create table outside_party (
  id text primary key,
  name text not null,
  document jsonb not null
);

create table artist_offer (
  id text primary key,
  outside_party_id text not null,
  artist_id text not null,
  send_id text not null,
  document jsonb not null
);

create table avatar (
  key text primary key,
  bytes bytea not null
);

create unique index lookup_partybyid on party (id);
create index lookup_partiesbydatestart on party (date_start);
create unique index lookup_artistbyid on artist (id);
create unique index lookup_venuebyid on venue (id);
create unique index lookup_partnerbyid on partner (id);
create unique index lookup_labelbyid on label (id);
create unique index lookup_agencybyid on agency (id);
create unique index lookup_sociallinkbyid on social_link (id);
create index lookup_calendarbyartist on calendar_entry (artist_id);
create index lookup_calendarbyparty on calendar_entry (party_id);
create unique index lookup_calendarentrybyid on calendar_entry (id);
create unique index lookup_calendarbyartistandparty on calendar_entry (artist_id, party_id);
create unique index lookup_profilebysub on profile (sub);
create unique index lookup_profilebyemail on profile (email);
create unique index lookup_profilebyusername on profile (username);
create unique index lookup_profilebyprovidersubject on profile_provider (provider, subject);
create index lookup_paymentmethodsbyuser on payment_method (user_id);
create unique index lookup_paymentmethodbyid on payment_method (id);
create unique index lookup_tracebyid on payment_trace (id);
create index lookup_tracesbyuser on payment_trace (user_id);
create unique index lookup_issuedticketbyid on issued_ticket (id);
create index lookup_ticketsbybuyer on issued_ticket (buyer_id);
create index lookup_ordersbyuser on customer_order (user_id);
create unique index lookup_orderbyid on customer_order (id);
create index lookup_invitebyuser on door_invite (user_id);
create index lookup_invitebyemail on door_invite (email);
create unique index lookup_invitebyid on door_invite (id);
create index lookup_checkinsbyticket on check_in (ticket_id);
create unique index lookup_checkinbyid on check_in (id);
create unique index lookup_productbyid on product (id);
create unique index lookup_stockbyproductandsize on stock_count (product_id, size);
create index lookup_correctionsbyproduct on stock_correction (product_id);
create unique index lookup_templatebyid on email_template (id);
create unique index lookup_consentbysubject on marketing_consent (subject_kind, subject_id);
create unique index lookup_consentbystoptoken on marketing_consent (stop_token);
create unique index lookup_outsidepartybyid on outside_party (id);
create unique index lookup_artistofferbyid on artist_offer (id);
