-- Guest list price, where it is used, and the two lists every party keeps.

alter table guest_list add column amount numeric not null default 0;
alter table guest_list add column channel text not null default 'door';
alter table guest_list add column locked boolean not null default false;
alter table guest_list add column capacity integer;
