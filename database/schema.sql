-- =========================================================
-- Library Loan API - Database Schema (Supabase / PostgreSQL)
-- Jalankan seluruh blok ini sekaligus di Supabase SQL Editor.
-- =========================================================

create table if not exists members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text unique,
  phone      text,
  address    text,
  created_at timestamptz not null default now()
);

create table if not exists books (
  id         uuid primary key default gen_random_uuid(),
  isbn       text unique,
  title      text not null,
  author     text not null,
  publisher  text,
  year       integer,
  stock      integer not null default 1 check (stock >= 0),
  created_at timestamptz not null default now()
);

create table if not exists loans (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete restrict,
  book_id     uuid not null references books(id)   on delete restrict,
  loan_date   date not null default current_date,
  due_date    date not null,
  return_date date,
  status      text not null default 'Dipinjam'
              check (status in ('Dipinjam', 'Dikembalikan', 'Terlambat')),
  notes       text,
  created_at  timestamptz not null default now(),
  constraint due_after_loan check (due_date >= loan_date)
);

create index if not exists idx_loans_status    on loans(status);
create index if not exists idx_loans_member_id on loans(member_id);
create index if not exists idx_loans_book_id   on loans(book_id);

-- =========================================================
-- Seed data (opsional, untuk pengujian)
-- =========================================================
insert into members (name, email, phone, address) values
  ('Budi Santoso', 'budi@email.com', '08123456789', 'Jl. Merdeka No. 10, Jakarta'),
  ('Siti Aminah',  'siti@email.com', '08129876543', 'Jl. Pemuda No. 5, Semarang')
on conflict (email) do nothing;

insert into books (isbn, title, author, publisher, year, stock) values
  ('978-602-03-3295-6', 'Laskar Pelangi', 'Andrea Hirata', 'Bentang Pustaka', 2005, 3),
  ('978-979-22-9168-2', 'Bumi Manusia', 'Pramoedya Ananta Toer', 'Lentera Dipantara', 1980, 2),
  ('978-0-13-110362-7', 'The C Programming Language', 'Kernighan & Ritchie', 'Prentice Hall', 1988, 1)
on conflict (isbn) do nothing;

-- =========================================================
-- Hardening (opsional, direkomendasikan)
-- Aktifkan RLS agar tabel TIDAK bisa diakses langsung lewat anon key
-- dari luar API. Jika diaktifkan, isi SUPABASE_KEY di server dengan
-- secret / service_role key (hanya di .env & Vercel, jangan di-commit).
-- =========================================================
-- alter table members enable row level security;
-- alter table books   enable row level security;
-- alter table loans   enable row level security;
