# NutriTrack — Final MVP

NutriTrack adalah website pencatat nutrisi responsif yang dibuat menggunakan HTML, CSS, dan JavaScript. Aplikasi ini terhubung ke satu project Supabase untuk autentikasi dan penyimpanan data cloud, serta menggunakan Google Gemini melalui Supabase Edge Function untuk Nutri Coach.

## Fitur utama

- **Authentication:** registrasi, login, logout, verifikasi email (sesuai pengaturan Supabase), dan pemulihan password.
- **Remember me:** saat dicentang, sesi login disimpan di browser dan tetap ada setelah browser dibuka ulang; saat tidak dicentang, sesi hanya disimpan untuk sesi tab saat ini.
- **Dashboard:** ringkasan aktivitas dan nutrisi.
- **Profile & Settings:** profil, preferensi diet, satuan, dan pengaturan pengguna.
- **Goals & Calculator:** penghitungan dan penyimpanan target kalori serta makronutrisi.
- **Food Diary:** katalog makanan, makanan kustom, serta tambah/edit/hapus entri makanan.
- **Weight Tracking:** pencatatan, pengeditan, penghapusan, dan grafik riwayat berat badan.
- **Water Tracking:** pencatatan konsumsi air dan total harian.
- **Progress & Analytics:** ringkasan dan visualisasi perkembangan.
- **Nutri Coach:** percakapan AI berbasis Gemini dengan area chat yang dapat di-scroll sendiri dan input yang tetap terlihat.
- **Demo mode:** pengalaman demo lokal menggunakan data contoh; data demo tidak disinkronkan ke akun cloud.
- **Settings berbasis mode akun:** pada akun Supabase yang login, tombol reset demo dan penghapusan data demo lokal disembunyikan; pengelolaan password diarahkan ke Supabase Authentication. Kontrol demo hanya muncul saat menggunakan demo lokal.

## Dynamic and fluid motion

Antarmuka menggunakan transisi halaman, scroll-reveal untuk kartu dan daftar, feedback hover/press, animasi modal, serta transisi progress bar. Animasi dibuat dengan CSS dan IntersectionObserver tanpa library tambahan. Pengaturan aksesibilitas `prefers-reduced-motion` dihormati, sehingga pengguna yang mengurangi animasi di sistem/browser akan mendapat gerakan minimal.

## Cara menjalankan secara lokal

1. Extract ZIP.
2. Buka folder `NutriTrack-Supabase-Connected` di VS Code.
3. Buka `nutritrack_mvp/index.html` dan jalankan menggunakan ekstensi **Live Server**.
4. Pastikan koneksi internet aktif karena Supabase SDK, font, dan layanan cloud dimuat melalui internet.
5. Untuk login, registrasi akun masing-masing dan ikuti instruksi verifikasi email bila diminta.

Jangan membuka `index.html` dengan double-click atau `file://`. Gunakan Live Server atau server HTTP lokal lain. Browser membatasi sebagian perilaku autentikasi dan origin pada `file://`.

## Menggunakan di perangkat anggota tim

ZIP ini memakai konfigurasi frontend untuk project Supabase NutriTrack yang sama. Anggota tim tidak perlu membuat database atau project Supabase baru, memasang SQL, atau menambahkan Gemini API key di komputer mereka.

Setiap anggota:

1. Extract ZIP dan jalankan melalui Live Server (atau buka website yang sudah di-hosting).
2. Register dan login dengan akun masing-masing.
3. Gunakan koneksi internet agar data dapat tersinkronisasi dengan Supabase.

Semua pengguna menggunakan backend cloud yang sama, tetapi data akun dibatasi oleh Row Level Security (RLS) di Supabase. Jangan berbagi password akun. Data demo yang tersimpan di browser bersifat lokal dan tidak otomatis tersinkronisasi antarperangkat.

Untuk local server, gunakan port dan URL yang telah dimasukkan ke **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**. Jika memakai port atau domain berbeda, admin project perlu menambahkan URL tersebut ke allow-list. Untuk hosting statis, tambahkan domain website ke Redirect URLs dan atur Site URL sesuai domain produksi.

## Koneksi Supabase

Frontend memakai Supabase JavaScript SDK dan **publishable key** pada `backend/supabase-config.js`. Publishable key memang dirancang untuk aplikasi browser; semua akses data harus tetap dilindungi RLS. Jangan pernah mengganti publishable key dengan `service_role` atau Supabase secret key.

Tabel cloud yang digunakan aplikasi:

- `profiles`
- `nutrition_targets`
- `foods`
- `food_entries`
- `weight_logs`
- `water_logs`
- `coach_messages`

Struktur database dan kebijakan RLS sudah dipasang di project Supabase yang terhubung. Pengguna ZIP Final tidak perlu menjalankan SQL apa pun.

## Nutri Coach AI dan privasi

Nutri Coach memanggil Edge Function `nutri-coach` di Supabase. API key Google Gemini disimpan sebagai secret `GEMINI_API_KEY` di Supabase Edge Functions, bukan di browser dan bukan di ZIP Final.

Konfigurasi model backend saat ini:

- Model utama: `gemini-3.5-flash-lite`.
- Model cadangan: `gemini-3.8-flash` ketika model utama mengalami kegagalan sementara atau timeout.

Untuk permintaan AI, frontend hanya mengirim teks pertanyaan terbaru yang diketik pengguna. Profil, nama, email, tinggi/berat badan, target nutrisi, food diary, water log, riwayat berat badan, dan pesan chat sebelumnya tidak ikut dikirim ke Gemini. Riwayat percakapan pengguna yang login tetap dapat disimpan di tabel `coach_messages` pada Supabase, tetapi penyimpanan itu terpisah dari isi request yang dikirim ke Gemini.

Edge Function memiliki pemeriksaan sederhana untuk beberapa pola informasi pribadi dan medis. Pemeriksaan tersebut bersifat best-effort, bukan jaminan mendeteksi semua informasi sensitif. Jangan masukkan identitas, data kesehatan pribadi, diagnosis, informasi medis, atau informasi rahasia ke prompt. Ketentuan Gemini API free tier dapat mengizinkan penggunaan prompt dan jawaban untuk peningkatan layanan dan peninjauan manusia; gunakan hanya pertanyaan umum yang tidak sensitif.

Nutri Coach ditujukan untuk edukasi nutrisi dan kebiasaan sehat secara umum, bukan diagnosis, pengobatan, atau pengganti tenaga kesehatan profesional. Batas request Gemini mengikuti kuota free tier project Google dan dapat berubah. Jika kuota habis atau model sedang tidak tersedia, AI mungkin sementara tidak merespons.

## Struktur folder Final

```text
NutriTrack-Supabase-Connected/
  nutritrack_mvp/
    index.html
    style.css
    script.js
    entry.js
    README.md
    backend/
      supabase-config.js
      supabase-client.js
```

Paket Final hanya berisi file runtime HTML, CSS, dan JavaScript, ditambah README ini. File SQL dan TypeScript tidak diperlukan di komputer pengguna karena schema database dan Edge Function sudah berada di Supabase Cloud.

## Catatan pemeliharaan

- Simpan ZIP **Developer Backup** secara terpisah. ZIP tersebut berisi source SQL dan TypeScript untuk pemeliharaan backend.
- Jangan menghapus atau mengekspos `GEMINI_API_KEY`, Supabase secret key, atau `service_role` key.
- Jangan menonaktifkan RLS pada tabel cloud.
- Katalog makanan berisi nilai referensi dan bukan pengganti database nutrisi klinis yang tervalidasi.
- Pastikan organisasi/project Supabase dan Google API tetap berada pada paket/kuota yang diinginkan; jangan mengaktifkan billing atau upgrade tanpa persetujuan pemilik project.
