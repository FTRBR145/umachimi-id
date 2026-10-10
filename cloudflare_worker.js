/**
 * Umachimi-ID Cloudflare Worker (AI-Powered 24/7 Auto-Translator)
 * Mendukung Google Gemini 2.5 Flash dengan Hybrid Fallback ke Google Translate
 * Kompatibel penuh dengan spesifikasi Hachimi Edge (Sugoi v4 API)
 * 
 * Fitur:
 * - Menggunakan Google Gemini 2.5 Flash untuk terjemahan dialog bergaya anime/visual novel alami
 * - Hybrid Fallback otomatis ke Google Translate jika kuota AI habis atau API key belum disetel
 * - Kamus nama karakter resmi (Air Groove, Eishin Flash, Silence Suzuka, dll.)
 * - Pembersihan kurung pilihan pemain ('『...』' / '「...」')
 * - Bekerja 24/7 di Cloudflare Workers (100.000 requests/hari gratis)
 */

const JP_REGEX = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;

const NAME_MAP = {
  'エアグルーヴ': 'Air Groove',
  'エイシンフラッシュ': 'Eishin Flash',
  'ナリタトップロード': 'Narita Top Road',
  'シンボリルドルフ': 'Symboli Rudolf',
  'スペシャルウィーク': 'Special Week',
  'サイレンススズカ': 'Silence Suzuka',
  'トウカイテイオー': 'Tokai Teio',
  'ゴールドシップ': 'Gold Ship',
  'ダイワスカーレット': 'Daiwa Scarlet',
  'ウオッカ': 'Vodka',
  'グラスワンダー': 'Grass Wonder',
  'メジロマックイーン': 'Mejiro McQueen',
  'ルーラー': 'Ruler',
  'トレーナー': 'Trainer',
  'ウマ娘': 'Uma Musume',
  'たわけ': 'bodoh/idiot'
};

const SYSTEM_PROMPT = `Kamu adalah penerjemah resmi game visual novel Umamusume: Pretty Derby.
Tugasmu: Terjemahkan teks/dialog bahasa Jepang ke Bahasa Indonesia bernuansa dialog anime/visual novel yang ekspresif, santai, dan alami.
Aturan penting:
1. Sesuaikan nada bicara dengan karakter (misal: Air Groove tegas/ketus, Gold Ship santai/usil, Rice Shower sopan/pemalu).
2. Pertahankan nama karakter resmi dalam ejaan alfabet (Air Groove, Special Week, Silence Suzuka, Tokai Teio, dll.) dan istilah balap (G1, debut, trainer, fans, senpai).
3. Jangan tambahkan tanda petik pembuka/penutup dan jangan beri catatan penjelasan apa pun.
4. Pertahankan format baris baru jika ada.
5. Kembalikan HANYA teks terjemahan akhir murni.`;

function cleanBracketsAndQuotes(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/^[“"”'「」『』\s]+|[“"”'「」『』\s]+$/g, '').trim();
}

/**
 * Terjemahan menggunakan Google Gemini 2.5 Flash API
 */
async function translateWithGemini(text, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: [
      {
        parts: [{ text }]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 500
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Gemini API Error: ${res.status}`);
  }

  const data = await res.json();
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) {
    throw new Error('Gemini API returned empty text');
  }

  return cleanBracketsAndQuotes(candidateText);
}

/**
 * Fallback terjemahan menggunakan Google Translate gratis
 */
async function translateWithGoogle(text) {
  const normalizedText = text.replace(/\n/g, ' __NEWLINE__ ');
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(normalizedText)}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });

  if (!res.ok) {
    return text;
  }

  const data = await res.json();
  let resText = (data[0] || []).map(item => item[0] || '').join('');

  resText = resText.replace(/ __NEWLINE__ /g, '\n').replace(/__NEWLINE__/g, '\n');
  resText = resText
    .replace(/alur udara/gi, 'Air Groove')
    .replace(/penggaris/gi, 'Ruler');

  return cleanBracketsAndQuotes(resText);
}

async function translateSingle(text, apiKey) {
  if (typeof text !== 'string' || !text || !JP_REGEX.test(text)) {
    return text;
  }

  const cleanText = text.trim();
  if (NAME_MAP[cleanText]) {
    return NAME_MAP[cleanText];
  }

  const coreText = cleanBracketsAndQuotes(cleanText) || text;

  // 1. Coba menggunakan Gemini AI jika API key tersedia
  if (apiKey) {
    try {
      return await translateWithGemini(coreText, apiKey);
    } catch (err) {
      console.warn('Gemini translation failed, falling back to Google Translate:', err.message);
    }
  }

  // 2. Fallback otomatis ke Google Translate jika AI gagal / belum disetel
  return await translateWithGoogle(coreText);
}

async function translateData(data, apiKey) {
  if (typeof data === 'string') {
    return await translateSingle(data, apiKey);
  } else if (Array.isArray(data)) {
    return await Promise.all(data.map(item => translateData(item, apiKey)));
  } else if (data !== null && typeof data === 'object') {
    const result = {};
    for (const key of Object.keys(data)) {
      result[key] = await translateData(data[key], apiKey);
    }
    return result;
  }
  return data;
}

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Ambil API key dari Cloudflare Environment Variables (Secret)
    const apiKey = env?.GEMINI_API_KEY || env?.AI_API_KEY || '';

    // Health check endpoint (GET)
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'online',
        service: 'Umachimi-ID Cloud Auto-Translator',
        ai_engine: apiKey ? 'Google Gemini 2.5 Flash' : 'Google Translate (Standard)',
        ai_enabled: Boolean(apiKey),
        hybrid_fallback: true,
        target_language: 'id',
        compatible_with: 'Hachimi Edge (Sugoi v4 API)'
      }, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (request.method === 'POST') {
      try {
        const bodyText = await request.text();
        let payload = {};
        try {
          payload = JSON.parse(bodyText);
        } catch {
          payload = { content: bodyText };
        }

        const content = payload.content !== undefined ? payload.content : (payload.text !== undefined ? payload.text : payload);
        const translated = await translateData(content, apiKey);

        return new Response(JSON.stringify(translated), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...corsHeaders
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }
};
