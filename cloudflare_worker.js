/**
 * Umachimi-ID Cloudflare Worker (Online 24/7 Auto-Translator)
 * Kompatibel penuh dengan spesifikasi Hachimi Edge (Sugoi v4 API)
 * 
 * Fitur:
 * - 100% Gratis di Cloudflare Workers (100.000 requests/hari)
 * - Zero cold-start (berjalan di edge network global)
 * - Kamus nama karakter resmi (Air Groove, Eishin Flash, dll.)
 * - Pembersihan kurung pilihan pemain ('『...』' / '「...」')
 * - Mendukung input single string maupun batch list/array
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

function cleanBracketsAndQuotes(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/^[“"”'「」『』\s]+|[“"”'「」『』\s]+$/g, '').trim();
}

async function translateSingle(text) {
  if (typeof text !== 'string' || !text || !JP_REGEX.test(text)) {
    return text;
  }

  const cleanText = text.trim();
  if (NAME_MAP[cleanText]) {
    return NAME_MAP[cleanText];
  }

  const coreText = cleanBracketsAndQuotes(cleanText) || text;
  const normalizedText = coreText.replace(/\n/g, ' __NEWLINE__ ');

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(normalizedText)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
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
  } catch (err) {
    return text;
  }
}

async function translateData(data) {
  if (typeof data === 'string') {
    return await translateSingle(data);
  } else if (Array.isArray(data)) {
    return await Promise.all(data.map(item => translateData(item)));
  } else if (data !== null && typeof data === 'object') {
    const result = {};
    for (const key of Object.keys(data)) {
      result[key] = await translateData(data[key]);
    }
    return result;
  }
  return data;
}

export default {
  async fetch(request) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check endpoint (GET)
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'online',
        service: 'Umachimi-ID Cloud Auto-Translator',
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
        const translated = await translateData(content);

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
