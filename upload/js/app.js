/* ============================================
   未明シアター LP ジェネレーター — メインJS
   ============================================ */

'use strict';

// ============================================
// STATE
// ============================================
const state = {
  kvImage: null,        // base64
  casts: [],            // { id, photo(base64), name, role }
  stills: [],           // { id, image(base64), caption }
};

let castCounter = 0;
let stillCounter = 0;

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initKVUpload();
  initCastSection();
  initStillsSection();
  initGenerateBtn();
  initModal();

  // 最初から1人目のキャストを追加
  addCast();
  // 最初から4枚のスチール枠を表示
  for (let i = 0; i < 4; i++) addStill();
});

// ============================================
// KV (キービジュアル) アップロード
// ============================================
function initKVUpload() {
  const input   = document.getElementById('kv-upload');
  const area    = document.getElementById('kv-upload-area');
  const preview = document.getElementById('kv-preview');
  const remove  = document.getElementById('kv-remove');
  const holder  = area.querySelector('.upload-placeholder');

  input.addEventListener('change', (e) => handleKVFile(e.target.files[0]));

  // Drag & Drop
  area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('dragover'); });
  area.addEventListener('dragleave', () => area.classList.remove('dragover'));
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleKVFile(e.dataTransfer.files[0]);
  });

  remove.addEventListener('click', () => {
    state.kvImage = null;
    preview.classList.add('hidden');
    remove.classList.add('hidden');
    holder.classList.remove('hidden');
    input.value = '';
  });

  function handleKVFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    toBase64(file, (b64) => {
      state.kvImage = b64;
      preview.src = b64;
      preview.classList.remove('hidden');
      remove.classList.remove('hidden');
      holder.classList.add('hidden');
    });
  }
}

// ============================================
// CAST セクション
// ============================================
function initCastSection() {
  document.getElementById('add-cast-btn').addEventListener('click', addCast);
}

function addCast() {
  const id = ++castCounter;
  const cast = { id, photo: null, name: '', role: '', desc: '', instagram: '', youtube: '', twitter: '', tiktok: '' };
  state.casts.push(cast);
  renderCastCard(cast);
}

function renderCastCard(cast) {
  const list = document.getElementById('cast-list');
  const card = document.createElement('div');
  card.className = 'cast-card';
  card.id = `cast-card-${cast.id}`;
  card.innerHTML = `
    <div class="cast-card-header">
      <span class="cast-card-title">出演者 ${cast.id}</span>
      <button class="cast-remove-btn" onclick="removeCast(${cast.id})">
        <i class="fas fa-trash-alt"></i> 削除
      </button>
    </div>
    <div class="cast-grid">
      <div class="cast-photo-upload">
        <input type="file" accept="image/*" id="cast-photo-input-${cast.id}" hidden>
        <div class="cast-photo-area" id="cast-photo-area-${cast.id}"
             onclick="document.getElementById('cast-photo-input-${cast.id}').click()">
          <i class="fas fa-user upload-icon"></i>
          <span class="upload-text">写真をアップロード</span>
        </div>
        <img class="cast-photo-preview hidden" id="cast-photo-preview-${cast.id}" alt="">
      </div>
      <div class="cast-fields">
        <div class="form-group">
          <label class="form-label">出演者名 <span class="required">*</span></label>
          <input type="text" class="form-input cast-name" id="cast-name-${cast.id}"
                 placeholder="例：田中 花子" data-cast-id="${cast.id}">
        </div>
        <div class="form-group">
          <label class="form-label">役名 <span class="required">*</span></label>
          <input type="text" class="form-input cast-role" id="cast-role-${cast.id}"
                 placeholder="例：山田 純子（主人公）" data-cast-id="${cast.id}">
        </div>
        <div class="form-group">
          <label class="form-label">キャラクター説明（任意）</label>
          <input type="text" class="form-input cast-desc" id="cast-desc-${cast.id}"
                 placeholder="例：事件の謎を追う刑事" data-cast-id="${cast.id}">
        </div>
        <div class="cast-sns-fields">
          <div class="cast-sns-label">SNS リンク（任意）</div>
          <div class="cast-sns-grid">
            <div class="url-input-wrap">
              <span class="url-prefix insta"><i class="fab fa-instagram"></i></span>
              <input type="url" class="form-input url-input" id="cast-instagram-${cast.id}"
                     placeholder="Instagram URL">
            </div>
            <div class="url-input-wrap">
              <span class="url-prefix yt"><i class="fab fa-youtube"></i></span>
              <input type="url" class="form-input url-input" id="cast-youtube-${cast.id}"
                     placeholder="YouTube URL">
            </div>
            <div class="url-input-wrap">
              <span class="url-prefix tw"><i class="fab fa-x-twitter"></i></span>
              <input type="url" class="form-input url-input" id="cast-twitter-${cast.id}"
                     placeholder="X (Twitter) URL">
            </div>
            <div class="url-input-wrap">
              <span class="url-prefix tt"><i class="fab fa-tiktok"></i></span>
              <input type="url" class="form-input url-input" id="cast-tiktok-${cast.id}"
                     placeholder="TikTok URL">
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  list.appendChild(card);

  // photo upload listener
  const input = document.getElementById(`cast-photo-input-${cast.id}`);
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    toBase64(file, (b64) => {
      cast.photo = b64;
      const area = document.getElementById(`cast-photo-area-${cast.id}`);
      const prev = document.getElementById(`cast-photo-preview-${cast.id}`);
      area.classList.add('hidden');
      prev.src = b64;
      prev.classList.remove('hidden');
    });
  });

  // name / role / desc / sns listeners
  document.getElementById(`cast-name-${cast.id}`)     .addEventListener('input', (e) => { cast.name      = e.target.value; });
  document.getElementById(`cast-role-${cast.id}`)     .addEventListener('input', (e) => { cast.role      = e.target.value; });
  document.getElementById(`cast-desc-${cast.id}`)     .addEventListener('input', (e) => { cast.desc      = e.target.value; });
  document.getElementById(`cast-instagram-${cast.id}`).addEventListener('input', (e) => { cast.instagram = e.target.value; });
  document.getElementById(`cast-youtube-${cast.id}`)  .addEventListener('input', (e) => { cast.youtube   = e.target.value; });
  document.getElementById(`cast-twitter-${cast.id}`)  .addEventListener('input', (e) => { cast.twitter   = e.target.value; });
  document.getElementById(`cast-tiktok-${cast.id}`)   .addEventListener('input', (e) => { cast.tiktok    = e.target.value; });
}

window.removeCast = function(id) {
  state.casts = state.casts.filter(c => c.id !== id);
  const el = document.getElementById(`cast-card-${id}`);
  if (el) el.remove();
};

// ============================================
// STILLS セクション
// ============================================
function initStillsSection() {
  document.getElementById('add-still-btn').addEventListener('click', () => {
    if (state.stills.length >= 8) {
      showToast('スチール写真は最大8枚までです');
      return;
    }
    addStill();
  });
}

function addStill() {
  if (state.stills.length >= 8) return;
  const id = ++stillCounter;
  const still = { id, image: null, caption: '' };
  state.stills.push(still);
  renderStillItem(still);
}

function renderStillItem(still) {
  const grid = document.getElementById('stills-grid');
  const item = document.createElement('div');
  item.className = 'still-item';
  item.id = `still-item-${still.id}`;
  item.innerHTML = `
    <input type="file" accept="image/*" id="still-input-${still.id}" hidden>
    <div class="upload-placeholder" onclick="document.getElementById('still-input-${still.id}').click()">
      <i class="fas fa-camera upload-icon"></i>
      <span class="upload-text">写真を追加</span>
    </div>
    <img class="still-preview hidden" id="still-preview-${still.id}" alt="">
    <button class="still-remove" onclick="removeStill(${still.id})">
      <i class="fas fa-times"></i>
    </button>
    <input type="text" class="still-caption-input" id="still-caption-${still.id}"
           placeholder="キャプション（任意）" data-still-id="${still.id}">
  `;
  grid.appendChild(item);

  document.getElementById(`still-input-${still.id}`).addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    toBase64(file, (b64) => {
      still.image = b64;
      const placeholder = item.querySelector('.upload-placeholder');
      const prev = document.getElementById(`still-preview-${still.id}`);
      placeholder.classList.add('hidden');
      prev.src = b64;
      prev.classList.remove('hidden');
    });
  });

  document.getElementById(`still-caption-${still.id}`).addEventListener('input', (e) => {
    still.caption = e.target.value;
  });
}

window.removeStill = function(id) {
  state.stills = state.stills.filter(s => s.id !== id);
  const el = document.getElementById(`still-item-${id}`);
  if (el) el.remove();
};

// ============================================
// GENERATE BUTTON
// ============================================
function initGenerateBtn() {
  document.getElementById('generate-btn').addEventListener('click', generateLP);
}

function generateLP() {
  const title    = document.getElementById('drama-title').value.trim();
  const synopsis = document.getElementById('drama-synopsis').value.trim();

  if (!title) { showToast('ドラマタイトルを入力してください'); return; }
  if (!synopsis) { showToast('あらすじを入力してください'); return; }
  if (!state.kvImage) { showToast('キービジュアル画像をアップロードしてください'); return; }

  const data = {
    title,
    catchcopy: document.getElementById('drama-catchcopy').value.trim(),
    youtube:   document.getElementById('drama-youtube').value.trim(),
    instagram: document.getElementById('drama-instagram').value.trim(),
    synopsis,
    kvImage:   state.kvImage,
    casts:     state.casts.filter(c => c.name),
    stills:    state.stills.filter(s => s.image),
  };

  const html = buildLPHTML(data);
  showPreview(html);
}

// ============================================
// LP HTML ビルダー
// ============================================
function buildLPHTML(data) {
  const synopsisParas = data.synopsis
    .split(/\n+/)
    .filter(p => p.trim())
    .map(p => `<p>${escHtml(p)}</p>`)
    .join('\n');

  const castHTML = data.casts.length > 0 ? `
  <!-- CAST -->
  <section class="lp-cast" id="cast">
    <div class="lp-container">
      <div class="lp-section-label">CAST</div>
      <h2 class="lp-section-title">出演者</h2>
      <div class="cast-grid">
        ${data.casts.map(c => `
        <div class="cast-item">
          ${c.photo
            ? `<div class="cast-photo"><img src="${c.photo}" alt="${escHtml(c.name)}"></div>`
            : `<div class="cast-photo cast-photo-placeholder"><i>👤</i></div>`
          }
          <div class="cast-info">
            <div class="cast-role">${escHtml(c.role)}</div>
            <div class="cast-name">${escHtml(c.name)}</div>
            ${c.desc ? `<div class="cast-desc">${escHtml(c.desc)}</div>` : ''}
            ${(c.instagram || c.youtube || c.twitter || c.tiktok) ? `
            <div class="cast-sns">
              ${c.instagram ? `<a class="cast-sns-icon ig"  href="${c.instagram}" target="_blank" rel="noopener" title="Instagram"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>` : ''}
              ${c.youtube  ? `<a class="cast-sns-icon yt"  href="${c.youtube}"   target="_blank" rel="noopener" title="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>` : ''}
              ${c.twitter  ? `<a class="cast-sns-icon tw"  href="${c.twitter}"   target="_blank" rel="noopener" title="X (Twitter)"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>` : ''}
              ${c.tiktok   ? `<a class="cast-sns-icon tt"  href="${c.tiktok}"    target="_blank" rel="noopener" title="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg></a>` : ''}
            </div>` : ''}
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>` : '';

  const stillsHTML = data.stills.length > 0 ? `
  <!-- STILLS -->
  <section class="lp-stills" id="stills">
    <div class="lp-container">
      <div class="lp-section-label">GALLERY</div>
      <h2 class="lp-section-title">フォトギャラリー</h2>
      <div class="stills-grid">
        ${data.stills.map(s => `
        <div class="still-item">
          <img src="${s.image}" alt="${escHtml(s.caption || 'スチール写真')}">
          ${s.caption ? `<div class="still-caption">${escHtml(s.caption)}</div>` : ''}
        </div>`).join('')}
      </div>
    </div>
  </section>` : '';

  const snsBtns = [
    data.youtube   ? `<a class="sns-btn yt-btn" href="${data.youtube}" target="_blank" rel="noopener"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>YouTubeで見る</a>` : '',
    data.instagram ? `<a class="sns-btn ig-btn" href="${data.instagram}" target="_blank" rel="noopener"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>Instagramをフォロー</a>` : '',
  ].filter(Boolean).join('');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(data.title)} | 未明シアター</title>
  <meta name="description" content="${escHtml(data.synopsis.slice(0,120))}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&family=Noto+Serif+JP:wght@300;400;700;900&display=swap" rel="stylesheet">
  <style>
    /* ===== RESET & BASE ===== */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Noto Sans JP', sans-serif;
      background: #080810;
      color: #f0ede8;
      line-height: 1.8;
      overflow-x: hidden;
    }

    /* ===== VARIABLES ===== */
    :root {
      --gold: #c8a96e;
      --gold-light: #e8c97e;
      --purple: #7c5cbf;
      --deep: #080810;
      --surface: #12121e;
      --surface2: #1c1c2e;
      --border: #2a2a40;
      --text: #f0ede8;
      --muted: #888899;
    }

    /* ===== SCROLLBAR ===== */
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: var(--deep); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

    /* ===== HERO ===== */
    .lp-hero {
      position: relative;
      width: 100%;
      min-height: 100svh;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }

    .hero-bg {
      position: absolute;
      inset: 0;
      z-index: 0;
    }
    .hero-bg img {
      width: 100%; height: 100%;
      object-fit: cover;
      object-position: center top;
      filter: brightness(0.55) saturate(0.8);
    }
    .hero-bg::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        rgba(8,8,16,0.1) 0%,
        rgba(8,8,16,0.3) 40%,
        rgba(8,8,16,0.85) 75%,
        rgba(8,8,16,1) 100%
      );
    }

    .hero-content {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
      padding: 60px 40px 80px;
    }

    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
      font-family: 'Noto Serif JP', serif;
      font-size: 0.78rem;
      font-weight: 300;
      color: var(--gold);
      letter-spacing: 0.3em;
      text-transform: uppercase;
    }

    .hero-eyebrow::before,
    .hero-eyebrow::after {
      content: '';
      display: inline-block;
      width: 28px;
      height: 1px;
      background: var(--gold);
    }

    .hero-title {
      font-family: 'Noto Serif JP', serif;
      font-size: clamp(2.8rem, 8vw, 5.5rem);
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: 0.04em;
      margin-bottom: 20px;
      text-shadow: 0 4px 32px rgba(0,0,0,0.6);
    }

    .hero-catchcopy {
      font-family: 'Noto Serif JP', serif;
      font-size: clamp(1rem, 2.5vw, 1.35rem);
      font-weight: 300;
      color: #ddd8e8;
      letter-spacing: 0.1em;
      margin-bottom: 36px;
      line-height: 1.9;
    }

    /* ===== SNS BUTTONS ===== */
    .hero-sns {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 8px;
    }

    .sns-btn {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      border-radius: 50px;
      padding: 12px 26px;
      font-family: 'Noto Sans JP', sans-serif;
      font-size: 0.88rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    }

    .sns-btn:hover {
      transform: translateY(-2px);
      opacity: 0.9;
    }

    .yt-btn {
      background: #ff0000;
      color: #fff;
      box-shadow: 0 6px 24px rgba(255,0,0,0.35);
    }

    .ig-btn {
      background: linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
      color: #fff;
      box-shadow: 0 6px 24px rgba(188,24,136,0.35);
    }

    /* ===== SECTION COMMON ===== */
    .lp-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 40px;
    }

    .lp-section-label {
      font-size: 0.7rem;
      letter-spacing: 0.35em;
      color: var(--gold);
      margin-bottom: 12px;
      font-weight: 500;
    }

    .lp-section-title {
      font-family: 'Noto Serif JP', serif;
      font-size: clamp(1.6rem, 3.5vw, 2.2rem);
      font-weight: 700;
      letter-spacing: 0.06em;
      margin-bottom: 40px;
      position: relative;
    }

    .lp-section-title::after {
      content: '';
      display: block;
      width: 40px;
      height: 2px;
      background: linear-gradient(90deg, var(--gold), var(--purple));
      margin-top: 14px;
    }

    /* ===== DIVIDER ===== */
    .lp-divider {
      width: 100%;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border), transparent);
    }

    /* ===== SYNOPSIS ===== */
    .lp-synopsis {
      padding: 100px 0;
      background: var(--surface);
    }

    .synopsis-body {
      max-width: 760px;
    }

    .synopsis-body p {
      font-size: clamp(0.95rem, 1.5vw, 1.1rem);
      line-height: 2.1;
      color: #d8d4e4;
      margin-bottom: 1.4em;
      letter-spacing: 0.04em;
    }
    .synopsis-body p:last-child { margin-bottom: 0; }

    /* ===== CAST ===== */
    .lp-cast {
      padding: 100px 0;
      background: var(--deep);
    }

    .cast-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 32px;
    }

    .cast-item {
      text-align: center;
    }

    .cast-photo {
      width: 100%;
      aspect-ratio: 3/4;
      overflow: hidden;
      border-radius: 8px;
      margin-bottom: 16px;
      position: relative;
    }

    .cast-photo img {
      width: 100%; height: 100%;
      object-fit: cover;
      object-position: top center;
      transition: transform 0.5s ease;
      filter: grayscale(20%);
    }

    .cast-item:hover .cast-photo img {
      transform: scale(1.04);
      filter: grayscale(0%);
    }

    .cast-photo::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(8,8,16,0.5) 0%, transparent 50%);
    }

    .cast-photo-placeholder {
      background: var(--surface2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
    }

    .cast-role {
      font-size: 0.78rem;
      color: var(--gold);
      letter-spacing: 0.08em;
      margin-bottom: 4px;
      font-weight: 500;
    }

    .cast-name {
      font-family: 'Noto Serif JP', serif;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      margin-bottom: 6px;
    }

    .cast-desc {
      font-size: 0.78rem;
      color: var(--muted);
      line-height: 1.6;
      margin-bottom: 10px;
    }

    .cast-sns {
      display: flex;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 10px;
    }

    .cast-sns-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      text-decoration: none;
      transition: transform 0.2s ease, opacity 0.2s ease;
      color: #fff;
    }

    .cast-sns-icon svg { width: 16px; height: 16px; }

    .cast-sns-icon:hover { transform: scale(1.18); opacity: 0.9; }

    .cast-sns-icon.ig { background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }
    .cast-sns-icon.yt { background: #ff0000; }
    .cast-sns-icon.tw { background: #000000; }
    .cast-sns-icon.tt { background: #010101; border: 1px solid #333; }

    /* ===== STILLS ===== */
    .lp-stills {
      padding: 100px 0;
      background: var(--surface);
    }

    .stills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .still-item {
      position: relative;
      aspect-ratio: 16/9;
      overflow: hidden;
      border-radius: 8px;
      cursor: pointer;
    }

    .still-item img {
      width: 100%; height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease, filter 0.5s ease;
      filter: brightness(0.9);
    }

    .still-item:hover img {
      transform: scale(1.05);
      filter: brightness(1);
    }

    .still-caption {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%);
      padding: 20px 12px 10px;
      font-size: 0.78rem;
      color: rgba(255,255,255,0.85);
      letter-spacing: 0.04em;
    }

    /* ===== FOOTER ===== */
    .lp-footer {
      background: var(--deep);
      border-top: 1px solid var(--border);
      padding: 48px 40px;
      text-align: center;
    }

    .footer-brand {
      font-family: 'Noto Serif JP', serif;
      font-size: 1.1rem;
      color: var(--gold);
      letter-spacing: 0.2em;
      margin-bottom: 10px;
    }

    .footer-sns {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 12px;
      margin: 20px 0 24px;
    }

    .footer-sns .sns-btn {
      padding: 10px 22px;
      font-size: 0.82rem;
    }

    .footer-copy {
      font-size: 0.78rem;
      color: var(--muted);
      letter-spacing: 0.05em;
    }

    /* ===== NAV ===== */
    .lp-nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 500;
      padding: 18px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: background 0.3s ease;
    }

    .lp-nav.scrolled {
      background: rgba(8,8,16,0.9);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }

    .nav-logo {
      font-family: 'Noto Serif JP', serif;
      font-size: 0.85rem;
      color: var(--gold);
      letter-spacing: 0.2em;
      text-decoration: none;
    }

    .nav-links {
      display: flex;
      gap: 28px;
      list-style: none;
    }

    .nav-links a {
      font-size: 0.78rem;
      color: rgba(240,237,232,0.65);
      text-decoration: none;
      letter-spacing: 0.1em;
      transition: color 0.2s;
    }

    .nav-links a:hover { color: var(--gold); }

    /* ===== SCROLL ANIMATIONS ===== */
    .fade-up {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.7s ease, transform 0.7s ease;
    }
    .fade-up.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 680px) {
      .hero-content { padding: 40px 20px 60px; }
      .lp-container { padding: 0 20px; }
      .lp-synopsis, .lp-cast, .lp-stills { padding: 60px 0; }
      .lp-nav { padding: 14px 20px; }
      .nav-links { display: none; }
      .cast-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
      .stills-grid { grid-template-columns: 1fr; }
      .lp-footer { padding: 36px 20px; }
    }
  </style>
</head>
<body>

  <!-- NAV -->
  <nav class="lp-nav" id="lp-nav">
    <a class="nav-logo" href="#">未明シアター</a>
    <ul class="nav-links">
      <li><a href="#synopsis">あらすじ</a></li>
      ${data.casts.length  > 0 ? '<li><a href="#cast">出演者</a></li>' : ''}
      ${data.stills.length > 0 ? '<li><a href="#stills">ギャラリー</a></li>' : ''}
    </ul>
  </nav>

  <!-- HERO -->
  <section class="lp-hero">
    <div class="hero-bg">
      <img src="${data.kvImage}" alt="${escHtml(data.title)}">
    </div>
    <div class="hero-content">
      <div class="hero-eyebrow">未明シアター</div>
      <h1 class="hero-title">${escHtml(data.title)}</h1>
      ${data.catchcopy ? `<p class="hero-catchcopy">${escHtml(data.catchcopy)}</p>` : ''}
      ${snsBtns ? `<div class="hero-sns">${snsBtns}</div>` : ''}
    </div>
  </section>

  <!-- SYNOPSIS -->
  <section class="lp-synopsis" id="synopsis">
    <div class="lp-container">
      <div class="lp-section-label">STORY</div>
      <h2 class="lp-section-title">あらすじ</h2>
      <div class="synopsis-body fade-up">
        ${synopsisParas}
      </div>
    </div>
  </section>

  ${castHTML}

  ${stillsHTML}

  <!-- FOOTER -->
  <footer class="lp-footer">
    <div class="footer-brand">未明シアター</div>
    ${snsBtns ? `<div class="footer-sns">${snsBtns}</div>` : ''}
    <p class="footer-copy">© ${new Date().getFullYear()} 未明シアター All Rights Reserved.</p>
  </footer>

  <script>
    // スクロール時ナビ
    const nav = document.getElementById('lp-nav');
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    });

    // フェードアップアニメーション
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

    // スチール写真 クリックで拡大
    document.querySelectorAll('.still-item img').forEach(img => {
      img.addEventListener('click', () => {
        const ov = document.createElement('div');
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;backdrop-filter:blur(6px);';
        const i = document.createElement('img');
        i.src = img.src;
        i.style.cssText = 'max-width:92vw;max-height:92vh;border-radius:8px;box-shadow:0 0 80px rgba(0,0,0,0.8);';
        ov.appendChild(i);
        ov.addEventListener('click', () => ov.remove());
        document.body.appendChild(ov);
      });
    });
  <\/script>
</body>
</html>`;
}

// ============================================
// PREVIEW MODAL
// ============================================
function showPreview(html) {
  const modal  = document.getElementById('preview-modal');
  const iframe = document.getElementById('preview-iframe');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // iframe にコンテンツをセット
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // ダウンロードボタン
  document.getElementById('download-btn').onclick = () => downloadHTML(html);
}

function initModal() {
  document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('preview-modal').classList.add('hidden');
    document.body.style.overflow = '';
  });
}

// ============================================
// HTML ダウンロード
// ============================================
function downloadHTML(html) {
  const title   = document.getElementById('drama-title').value.trim() || 'drama';
  const blob    = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = `${sanitizeFilename(title)}_LP.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// UTILITIES
// ============================================
function toBase64(file, cb) {
  const reader = new FileReader();
  reader.onload = (e) => cb(e.target.result);
  reader.readAsDataURL(file);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeFilename(str) {
  return str.replace(/[^\w\u3040-\u9FFF\u30A0-\u30FF]/g, '_').slice(0, 40);
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
    background: #1a1a28; border: 1px solid #c8a96e; color: #f0ede8;
    padding: 12px 24px; border-radius: 8px; font-size: 0.88rem;
    font-family: 'Noto Sans JP', sans-serif; z-index: 9999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: toastIn 0.3s ease;
  `;

  const style = document.createElement('style');
  style.textContent = `@keyframes toastIn { from { opacity:0; transform: translateX(-50%) translateY(10px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`;
  document.head.appendChild(style);

  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}
