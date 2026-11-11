-- Curated calendar headliners. Null means the event has no stored list.
-- An empty jsonb array is an explicit empty list.

alter table party add column headliners jsonb;
