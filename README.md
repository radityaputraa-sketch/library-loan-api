# 📚 Library Loan API

REST API sederhana untuk **pencatatan peminjaman buku perpustakaan**, dibangun dengan **Node.js + Express.js**, menggunakan **Supabase (PostgreSQL)** sebagai database, dan di-deploy ke **Vercel**.

> Responsi Praktikum Pemrograman Perangkat Bergerak (PPB) 2026

🔗 **Base URL Deployment:** `https://library-loan-api-kappa.vercel.app` ← _ganti dengan URL Vercel Anda_

---

## 1. Deskripsi & Tujuan Proyek

API ini mencatat transaksi peminjaman buku oleh anggota perpustakaan. Tujuannya:

- Menerapkan arsitektur **RESTful** (GET, POST, PUT, DELETE ↔ CRUD).
- Memisahkan kode ke **model – controller – router** (MVC-like).
- Menghubungkan Express dengan **Supabase** sebagai Backend-as-a-Service.
- Menyediakan **filter query** (contoh: `GET /api/loans?status=Terlambat`).
- Menggunakan **environment variables** dan siap **deploy** ke Vercel.

### Fitur

| Fitur | Keterangan |
|---|---|
| CRUD Peminjaman | Buat, lihat, ubah (termasuk proses pengembalian), hapus data pinjaman |
| CRUD Anggota & Buku | Data master yang direferensikan oleh pinjaman |
| Filter query | `status`, `member_id`, `book_id`, rentang `from`–`to`, `sort`, `order` |
| Status otomatis | Pinjaman yang lewat `due_date` otomatis berubah menjadi **Terlambat** |
| Manajemen stok | Stok buku −1 saat dipinjam, +1 saat dikembalikan/dihapus; tolak jika stok habis (409) |
| Validasi & error handling | UUID, format tanggal, status, body JSON; error Postgres dipetakan ke 400/404/409 |

---

## 2. Struktur Proyek

```
library-loan-api/
├── database/
│   └── schema.sql              # Skema tabel + seed data
├── postman/
│   └── Library_Loan_API.postman_collection.json
├── src/
│   ├── config/supabaseClient.js
│   ├── controllers/            # Logika request/response & aturan bisnis
│   │   ├── bookController.js
│   │   ├── loanController.js
│   │   └── memberController.js
│   ├── middlewares/errorHandler.js
│   ├── models/                 # Query ke Supabase
│   │   ├── bookModel.js
│   │   ├── loanModel.js
│   │   └── memberModel.js
│   ├── routes/                 # Pemetaan URL → controller
│   │   ├── bookRoutes.js
│   │   ├── loanRoutes.js
│   │   └── memberRoutes.js
│   ├── utils/httpError.js
│   └── index.js                # Entry point
├── .env.example
├── .gitignore
├── package.json
└── vercel.json
```

---

## 3. Struktur Data / Schema

```
members (1) ──< loans >── (1) books
```

### `members`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | default `gen_random_uuid()` |
| name | text | **wajib** |
| email | text | unik |
| phone | text | |
| address | text | |
| created_at | timestamptz | default `now()` |

### `books`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| isbn | text | unik |
| title | text | **wajib** |
| author | text | **wajib** |
| publisher | text | |
| year | integer | |
| stock | integer | default 1, `>= 0` |
| created_at | timestamptz | |

### `loans`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| member_id | uuid (FK → members.id) | **wajib** |
| book_id | uuid (FK → books.id) | **wajib** |
| loan_date | date | default hari ini |
| due_date | date | default `loan_date + 7 hari`, `>= loan_date` |
| return_date | date | diisi saat buku dikembalikan |
| status | text | `Dipinjam` \| `Dikembalikan` \| `Terlambat` |
| notes | text | |
| created_at | timestamptz | |

SQL lengkap ada di [`database/schema.sql`](database/schema.sql).

### Aturan Status

| Kondisi | Status |
|---|---|
| Belum dikembalikan & hari ini ≤ `due_date` | `Dipinjam` |
| Belum dikembalikan & hari ini > `due_date` | `Terlambat` (otomatis) |
| `return_date` diisi | `Dikembalikan` |

---

## 4. Daftar Endpoint

Base path: `/api`

### Loans (Peminjaman)
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/loans` | Semua pinjaman (+ data anggota & buku) |
| GET | `/api/loans?status=Terlambat` | Filter berdasarkan status |
| GET | `/api/loans?member_id=<uuid>` | Pinjaman milik satu anggota |
| GET | `/api/loans?book_id=<uuid>` | Riwayat pinjam satu buku |
| GET | `/api/loans?from=2026-10-01&to=2026-10-31` | Filter rentang `loan_date` |
| GET | `/api/loans?sort=due_date&order=asc` | Urutkan (`loan_date`, `due_date`, `return_date`, `created_at`) |
| GET | `/api/loans/:id` | Detail pinjaman |
| POST | `/api/loans` | Catat peminjaman baru |
| PUT | `/api/loans/:id` | Ubah / proses pengembalian |
| DELETE | `/api/loans/:id` | Hapus pinjaman |

Filter dapat dikombinasikan, mis. `/api/loans?status=Dipinjam&member_id=<uuid>`.

### Members & Books
| Method | Endpoint | Query opsional |
|---|---|---|
| GET / POST | `/api/members` | `search` (nama) |
| GET / PUT / DELETE | `/api/members/:id` | |
| GET / POST | `/api/books` | `search` (judul), `author`, `available=true\|false` |
| GET / PUT / DELETE | `/api/books/:id` | |

---

## 5. Contoh Request & Response

### POST `/api/members`
```json
{ "name": "Budi Santoso", "email": "budi@email.com", "phone": "08123456789", "address": "Jl. Merdeka No. 10, Jakarta" }
```
**201 Created**
```json
{
  "id": "a99b9ccf-18ba-4d80-a26a-71397bc608e1",
  "name": "Budi Santoso",
  "email": "budi@email.com",
  "phone": "08123456789",
  "address": "Jl. Merdeka No. 10, Jakarta",
  "created_at": "2026-10-09T03:12:44.120Z"
}
```

### POST `/api/books`
```json
{ "isbn": "978-602-03-3295-6", "title": "Laskar Pelangi", "author": "Andrea Hirata", "publisher": "Bentang Pustaka", "year": 2005, "stock": 3 }
```

### POST `/api/loans` — catat peminjaman
```json
{
  "member_id": "a99b9ccf-18ba-4d80-a26a-71397bc608e1",
  "book_id": "fd83c86e-de74-43f9-b0e0-60706000bc0f",
  "loan_date": "2026-10-09",
  "due_date": "2026-10-16",
  "notes": "Pinjam untuk tugas"
}
```
`loan_date` & `due_date` opsional (default: hari ini dan +7 hari).

**201 Created**
```json
{
  "id": "5ac0f46f-75a2-436b-9d88-e64e6390597c",
  "loan_date": "2026-10-09",
  "due_date": "2026-10-16",
  "return_date": null,
  "status": "Dipinjam",
  "notes": "Pinjam untuk tugas",
  "created_at": "2026-10-09T03:20:11.532Z",
  "member_id": "a99b9ccf-18ba-4d80-a26a-71397bc608e1",
  "book_id": "fd83c86e-de74-43f9-b0e0-60706000bc0f",
  "member": { "id": "a99b9ccf-...", "name": "Budi Santoso", "email": "budi@email.com", "phone": "08123456789" },
  "book": { "id": "fd83c86e-...", "isbn": "978-602-03-3295-6", "title": "Laskar Pelangi", "author": "Andrea Hirata" }
}
```

### GET `/api/loans?status=Terlambat`
**200 OK**
```json
{
  "count": 1,
  "filters": { "status": "Terlambat" },
  "data": [
    {
      "id": "08fc92db-c397-41ec-974f-ea40b024f32c",
      "loan_date": "2026-09-01",
      "due_date": "2026-09-08",
      "return_date": null,
      "status": "Terlambat",
      "member": { "name": "Siti Aminah", "...": "..." },
      "book": { "title": "Bumi Manusia", "...": "..." }
    }
  ]
}
```

### PUT `/api/loans/:id` — pengembalian buku
```json
{ "return_date": "2026-10-12" }
```
atau cukup `{ "status": "Dikembalikan" }` (return_date otomatis hari ini).

**200 OK** → `status` menjadi `"Dikembalikan"` dan stok buku bertambah 1.

### PUT `/api/loans/:id` — perpanjang masa pinjam
```json
{ "due_date": "2026-10-23", "notes": "Diperpanjang 1 minggu" }
```

### DELETE `/api/loans/:id`
```json
{ "message": "Loan deleted successfully" }
```

### Contoh Error
| Kasus | Status | Response |
|---|---|---|
| Status filter tidak dikenal | 400 | `{ "error": "Status tidak valid. Gunakan salah satu: Dipinjam, Dikembalikan, Terlambat" }` |
| `:id` bukan UUID | 400 | `{ "error": "Parameter id harus berupa UUID yang valid" }` |
| Data tidak ada | 404 | `{ "error": "Data tidak ditemukan", "details": "..." }` |
| Stok buku habis | 409 | `{ "error": "Stok buku \"Laskar Pelangi\" sedang habis" }` |
| Email/ISBN duplikat | 409 | `{ "error": "Data duplikat (nilai unik sudah dipakai)" }` |
| Hapus buku/anggota yang masih punya riwayat pinjam | 400 | `{ "error": "Relasi tidak valid: ..." }` |

---

## 6. Instalasi & Menjalankan Lokal

**Prasyarat:** Node.js ≥ 18, npm, akun Supabase.

1. **Clone repository**
   ```bash
   git clone https://github.com/<username>/library-loan-api.git
   cd library-loan-api
   npm install
   ```
2. **Siapkan database Supabase**
   - Buat project baru di [supabase.com](https://supabase.com).
   - Buka **SQL Editor → New query**, tempel isi `database/schema.sql`, klik **Run**.
   - Cek di **Table Editor** bahwa tabel `members`, `books`, `loans` sudah terbentuk.
3. **Konfigurasi environment**
   ```bash
   cp .env.example .env
   ```
   Isi dari **Project Settings → Data API** (Project URL) dan **API Keys**:
   ```env
   SUPABASE_URL=https://xxxxxxxx.supabase.co
   SUPABASE_KEY=eyJhbGciOi...
   PORT=3000
   ```
4. **Jalankan server**
   ```bash
   npm run dev     # mode development (nodemon)
   npm start       # mode biasa
   ```
   Output: `Server running on port 3000` → buka `http://localhost:3000`.
5. **Uji dengan Postman** — import `postman/Library_Loan_API.postman_collection.json`, set variabel `base_url` ke `http://localhost:3000` (atau URL Vercel).

### Deploy ke Vercel
1. Push repository ke GitHub (pastikan `.env` **tidak** ikut ter-commit).
2. Vercel → **Add New → Project** → import repository.
3. Tambahkan **Environment Variables** `SUPABASE_URL` dan `SUPABASE_KEY`.
4. Klik **Deploy**, lalu uji `https://library-loan-api-kappa.vercel.app/api/loans`.

---

## 7. Catatan Keamanan

- Kredensial hanya disimpan di `.env` / Environment Variables Vercel; `.env` masuk `.gitignore`.
- Body request di-*whitelist* per field (mencegah *mass assignment*, mis. mengubah `id` atau `status` saat create).
- Parameter `:id` dan query divalidasi sebelum menyentuh database.
- **Rekomendasi produksi:** aktifkan Row Level Security (blok di akhir `schema.sql`) dan gunakan *secret/service_role key* hanya di server, sehingga tabel tidak bisa diakses langsung dari luar API memakai anon key.

---

## 8. Link Deployment

🌐 **Vercel:** `https://library-loan-api-kappa.vercel.app`

| Coba langsung | |
|---|---|
| Info API | `https://library-loan-api-kappa.vercel.app/` |
| Semua pinjaman | `https://library-loan-api-kappa.vercel.app/api/loans` |
| Pinjaman terlambat | `https://library-loan-api-kappa.vercel.app/api/loans?status=Terlambat` |
