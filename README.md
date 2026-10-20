<img width="955" height="349" alt="image" src="https://github.com/user-attachments/assets/f2ed9e8c-42ad-44d5-9c67-5bb41963b27c" />
<img width="1876" height="724" alt="image" src="https://github.com/user-attachments/assets/bdec3ac9-7364-415a-aec2-367f7474583c" />
# TaskFlow — Backend API 🚀

**TaskFlow** adalah aplikasi manajemen proyek dan tugas berbasis *Kanban Board* (serupa dengan Trello) yang dirancang untuk membantu tim mengelola alur kerja, menentukan tenggat waktu (*deadline*), mengatur prioritas tugas, dan berkolaborasi secara efisien.

Repository ini berisi kode sumber backend yang dibangun menggunakan **NestJS**, **Prisma ORM**, dan **MySQL**.

---

## 🛠️ Tech Stack

*   **Framework:** NestJS (TypeScript)
*   **Database:** MySQL
*   **ORM:** Prisma ORM
*   **Authentication:** JWT (JSON Web Token) & Bcrypt
*   **API Protocol:** RESTful API (& WebSockets untuk komunikasi real-time)

---

## 📁 Struktur Folder Proyek

```text
taskflow-backend/
├── prisma/
│   └── schema.prisma          # Skema database & konfigurasi Prisma
├── src/
│   ├── common/                # Guards, Decorators, Interceptors, Filters
│   ├── config/                # Konfigurasi aplikasi & environment
│   ├── modules/               # Modul-modul domain aplikasi
│   │   ├── auth/              # Autentikasi (Register, Login)
│   │   ├── users/             # Manajemen profil & pengguna
│   │   ├── projects/          # Proyek & keanggotaan tim
│   │   ├── columns/           # Kolom Kanban (To Do, In Progress, Done)
│   │   ├── tasks/             # Kartu tugas, prioritas, & assignees
│   │   ├── comments/          # Komentar pada kartu tugas
│   │   └── notifications/     # Sistem notifikasi
│   ├── prisma/                # Global Prisma Module & Service
│   │   └── prisma.service.ts
│   ├── app.module.ts          # Root Module
│   └── main.ts                # Entry point aplikasi NestJS
├── .env                       # Variabel lingkungan (Environment Variables)
├── package.json
└── README.md
```

---

## 🗺️ Skema Relasi Database

Aplikasi ini menggunakan beberapa entitas utama dengan relasi sebagai berikut:

*   **User:** Menyimpan data pengguna dan kredensial.
*   **Project:** Menyimpan informasi proyek yang dibuat oleh pengguna.
*   **ProjectMember:** Relasi *many-to-many* antara pengguna dan proyek beserta peran (`OWNER`, `ADMIN`, `MEMBER`).
*   **Column:** Menampung kolom alur kerja Kanban di dalam suatu proyek.
*   **Task:** Menampung tugas/kartu pekerjaan dengan properti prioritas (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), posisi, dan tenggat waktu (*due date*).
*   **TaskAssignee:** Relasi penugasan anggota tim ke dalam tugas tertentu.
*   **Comment:** Komentar yang ditinggalkan anggota pada tugas.
*   **Notification:** Pesan pemberitahuan aktivitas untuk pengguna.

---

## 🔌 API Endpoints Ringkasan

### 🔑 Authentication (`/auth`)
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Pendaftaran akun baru |
| `POST` | `/auth/login` | Masuk dan dapatkan JWT Token |

### 📁 Projects (`/projects`)
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/projects` | Mengambil daftar proyek milik user |
| `POST` | `/projects` | Membuat proyek baru |
| `GET` | `/projects/:id` | Detail proyek beserta kolom & tugasnya |
| `POST` | `/projects/:id/members` | Menambahkan anggota tim ke proyek |

### 📋 Columns (`/columns`)
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/projects/:projectId/columns` | Menambah kolom baru pada board |
| `PATCH` | `/columns/:id` | Mengubah judul atau urutan posisi kolom |
| `DELETE` | `/columns/:id` | Menghapus kolom |

### 📌 Tasks (`/tasks`)
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/columns/:columnId/tasks` | Membuat tugas baru di kolom tertentu |
| `PATCH` | `/tasks/:id` | Mengubah detail/posisi tugas (pindah kolom) |
| `POST` | `/tasks/:id/assignees` | Menugaskan anggota tim ke tugas |
| `DELETE` | `/tasks/:id` | Menghapus tugas |

### 💬 Comments & Notifications (`/comments` & `/notifications`)
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/tasks/:taskId/comments` | Mengambil daftar komentar tugas |
| `POST` | `/tasks/:taskId/comments` | Mengirim komentar baru |
| `GET` | `/notifications` | Mengambil daftar notifikasi pengguna |

---

## ⚙️ Panduan Instalasi & Jalankan Lokal

### 1. Prasyarat
Pastikan komputer Anda telah terinstal:
*   [Node.js](https://nodejs.org/) (Versi 18 atau terbaru)
*   [MySQL Server](https://www.mysql.com/) (Aktif di lokal/XAMPP)

### 2. Clone Repository & Install Dependensi
```bash
git clone https://github.com/username/taskflow-backend.git
cd taskflow-backend
npm install
```

### 3. Konfigurasi Environment Variable (`.env`)
Buat file bernama `.env` di direktori utama (*root*) dan sesuaikan parameternya:

```env
# Koneksi Database MySQL
DATABASE_URL="mysql://root:password_mysql_kamu@localhost:3306/task_db"

# Kunci Rahasia JWT
JWT_SECRET="taskflow_super_secret_jwt_key_2026"

# Port Server
PORT=3000
```
> **Catatan:** Jika password MySQL Anda mengandung karakter khusus (seperti `@`, `#`, `$`), pastikan menggunakan format *URL Encoded* (misal `@` menjadi `%40`).

### 4. Sinkronkan Database dengan Prisma
Jalankan perintah berikut untuk membuat struktur tabel di database MySQL:

```bash
# Sinkronkan skema ke MySQL
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 5. Jalankan Aplikasi NestJS

```bash
# Mode Pembangunan (Development mode dengan hot-reload)
npm run start:dev

# Mode Produksi (Production build)
npm run build
npm run start:prod
```

Server backend akan berjalan secara lokal di: `http://localhost:3000`.

---

## 📝 Lisensi
Proyek ini dikembangkan di bawah lisensi [MIT](LICENSE).
