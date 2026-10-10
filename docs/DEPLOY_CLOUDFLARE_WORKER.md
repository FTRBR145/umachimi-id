# ☁️ Panduan Deploy Cloud Auto-Translator (Cloudflare Workers)

Dengan menggunakan Cloudflare Workers, fitur *Auto-Translate* Umamusume akan aktif **24/7 di Cloud secara GRATIS**. Anda tidak perlu lagi menjalankan script Python atau file `.bat` di komputer Anda, dan ini bisa langsung dipakai di **PC maupun HP Android**.

---

## 🚀 Langkah 1: Buat Worker di Cloudflare (Gratis)

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com/) dan login (atau daftar gratis jika belum punya akun).
2. Di menu sebelah kiri, klik **Compute (Workers & Pages)** ➔ **Workers & Pages**.
3. Klik tombol biru **Create application** (atau **Create Worker**).
4. Beri nama Worker Anda, misalnya: `umachimi-translator`.
5. Klik **Deploy**.

---

## 📝 Langkah 2: Masukkan Kode Script

1. Setelah ter-deploy, klik tombol **Edit code** (atau **Quick Edit**).
2. Hapus semua kode bawaan yang ada di editor sebelah kiri.
3. Buka file [`cloudflare_worker.js`](../cloudflare_worker.js) yang ada di repositori ini, salin (*copy*) seluruh isinya, lalu tempel (*paste*) ke editor Cloudflare.
4. Klik tombol **Deploy** / **Save and Deploy** di pojok kanan atas.

---

## 🔗 Langkah 3: Dapatkan URL dan Pasang di Game

Setelah di-deploy, Anda akan mendapatkan URL publik, contohnya:
```text
https://umachimi-translator.<nama-subdomain-anda>.workers.dev/translate
```

### Untuk PC (`config.json`):
Buka file `config.json` di game Anda (atau di Hachimi Edge ➔ Buka Editor Konfigurasi):
```json
{
  "sugoi_url": "https://umachimi-translator.<nama-subdomain-anda>.workers.dev/translate",
  "auto_translate_stories": true,
  "auto_translate_localize": true
}
```

### Untuk Android (`config_android.json`):
Buka file `config.json` di Android (di dalam folder Hachimi) atau atur via menu Hachimi Edge:
```json
{
  "sugoi_url": "https://umachimi-translator.<nama-subdomain-anda>.workers.dev/translate",
  "auto_translate_stories": true,
  "auto_translate_localize": true
}
```

---

## ✅ Selesai!
Sekarang setiap kali Anda bermain Umamusume di PC atau Android:
* Semua cerita baru dan pilihan dialog akan diterjemahkan secara otomatis oleh cloud.
* Anda tidak perlu lagi menyalakan terminal, Python, atau file `.bat` di PC!
