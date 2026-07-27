import http.server
import json
import urllib.request
import urllib.parse
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

jp_regex = re.compile(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]')

NAME_MAP = {
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
    'ルーラー': 'Ruler',
    'トレーナー': 'Trainer',
    'ウマ娘': 'Uma Musume',
    'たわけ': 'bodoh/idiot'
}

def clean_brackets_and_quotes(s):
    if not isinstance(s, str) or not s:
        return s
    return re.sub(r'^[“"”\'「」『』\s]+|[“"”\'「」『』\s]+$', '', s).strip()

def translate_single(text):
    if not isinstance(text, str) or not text or not jp_regex.search(text):
        return text
    
    clean_text = text.strip()
    if clean_text in NAME_MAP:
        return NAME_MAP[clean_text]
        
    core_text = clean_brackets_and_quotes(clean_text)
    if not core_text:
        core_text = text
        
    s = core_text.replace('\n', ' __NEWLINE__ ')
    url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=' + urllib.parse.quote(s)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode('utf-8'))
            res_text = ''.join([item[0] for item in data[0] if item[0]])
            res_text = res_text.replace(' __NEWLINE__ ', '\n').replace('__NEWLINE__', '\n')
            res_text = res_text.replace('alur udara', 'Air Groove').replace('Alur Udara', 'Air Groove').replace('penggaris', 'Ruler').replace('Penggaris', 'Ruler')
            res_text = clean_brackets_and_quotes(res_text)
            return res_text
    except Exception as e:
        print('Translation Error:', e)
        return text

def translate_data(data):
    if isinstance(data, str):
        return translate_single(data)
    elif isinstance(data, list):
        return [translate_data(item) for item in data]
    elif isinstance(data, dict):
        return {k: translate_data(v) for k, v in data.items()}
    return data

class SugoiHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8')
        print(f"\n[REQUEST] Path: {self.path} | Body: {body[:100]}")
        try:
            req_data = json.loads(body)
            if isinstance(req_data, dict) and ('content' in req_data or 'text' in req_data):
                content = req_data.get('content', req_data.get('text'))
                translated = translate_data(content)
            else:
                translated = translate_data(req_data)
            
            res_bytes = json.dumps(translated, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(res_bytes)
            print(f"[RESPONSE] {res_bytes.decode('utf-8')[:100]}")
        except Exception as e:
            print(f"[ERROR] {e}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))

    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    server = http.server.HTTPServer(('127.0.0.1', 5000), SugoiHandler)
    print("Auto Translator Server v8 running on http://127.0.0.1:5000/translate...")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Server stopped.")
