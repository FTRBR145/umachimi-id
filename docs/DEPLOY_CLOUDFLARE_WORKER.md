# ☁️ Panduan Deploy Cloud Auto-Translator (Cloudflare Workers + Gemini AI)

Dengan menggunakan Cloudflare Workers, fitur *Auto-Translate* Umamusume akan aktif **24/7 di Cloud secara GRATIS**. Anda tidak perlu lagi menjalankan script Python atau file `.bat` di komputer Anda, dan ini bisa langsung dipakai di **PC maupun HP Android**.

Mendukung **Google Gemini 2.5 Flash** untuk dialog bernuansa anime yang alami, dengan **Hybrid Fallback** otomatis ke Google Translate jika kuota AI habis atau API key belum disetel.

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

## 🤖 Langkah 3 (Opsional tapi Sangat Direkomendasikan): Pasang Gemini AI API Key

Untuk mendapatkan kualitas terjemahan dialog anime yang luwes, ekspresif, dan tidak kaku:

1. Dapatkan API Key gratis di [Google AI Studio](https://aistudio.google.com/) (klik **Get API key** ➔ **Create API key**). Gratis permanen tanpa kartu kredit.
2. Di halaman Worker Anda di Cloudflare Dashboard, buka tab **Settings** ➔ **Variables and Secrets**.
3. Klik **Add variable** / **Add secret**:
   - **Variable name**: `GEMINI_API_KEY`
   - **Value**: Tempelkan API Key dari Google AI Studio.
4. Klik **Save and deploy**.

> [!NOTE]
> Jika Anda melewati langkah ini (tanpa API key), Worker akan tetap bekerja 100% menggunakan Google Translate biasa.

---

## 🔗 Langkah 4: Dapatkan URL dan Pasang di Game

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
* Cerita baru dan pilihan dialog akan diterjemahkan secara otomatis oleh AI (Gemini 2.5 Flash) dengan gaya bahasa visual novel yang natural.
* Jika kuota AI sedang penuh atau ada gangguan jaringan, sistem akan secara instan beralih ke Google Translate biasa tanpa membuat game macet.
* Anda tidak perlu lagi menyalakan terminal, Python, atau file `.bat` di PC!
