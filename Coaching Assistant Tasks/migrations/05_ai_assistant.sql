-- Migration: create assistant_logs table for AI Assistant audit logging
-- Requires pgcrypto extension for gen_random_uuid()
create extension if not exists pgcrypto;

create table if not exists assistant_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  input jsonb not null,
  response jsonb,
  model text,
  ip text,
  created_at timestamptz default now()
);

create index if not exists assistant_logs_user_id_idx on assistant_logs(user_id);
create index if not exists assistant_logs_created_at_idx on assistant_logs(created_at);
