// functions/api/deploy.js
// ─────────────────────────────────────────────────────────────
// メンバーがアップロードしたファイルを GitHub リポジトリへ1コミットで反映し、
//   http://codexxxx.jp/<ドラマ名>/
// に自動公開する Cloudflare Pages Function。
//
// 合言葉(passcode)はこのサーバー側で検証する（＝本物のセキュリティ）。
// 画面側のJSだけで判定する方式（FUJISAN2026のような定数）は
// 「書き込み権限を持つツール」では危険なので採用しない。
// ─────────────────────────────────────────────────────────────

// 公開を許可する拡張子（Web表示に必要なものだけ）
const ALLOWED_EXT = new Set([
  'html','htm','css','js','mjs','json','svg','png','jpg','jpeg','gif','webp',
  'avif','ico','txt','md','woff','woff2','ttf','otf','mp4','webm','mp3','xml'
]);

// パストラバーサル(../)・不正文字を除去
function sanitizePath(p) {
  return String(p || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(s => s && s !== '.' && s !== '..')
    .join('/');
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });

  try {
    const body = await request.json();
    const { passcode, folder, files } = body || {};

    // 1) 認証（サーバー側で検証）
    if (!env.UPLOAD_PASSCODE || passcode !== env.UPLOAD_PASSCODE) {
      return json({ ok: false, error: '合言葉が違います。' }, 401);
    }

    // 2) 入力チェック
    const safeFolder = sanitizePath(folder).trim();
    if (!safeFolder)
      return json({ ok: false, error: '公開フォルダ名（ドラマ名）が空です。' }, 400);
    if (!Array.isArray(files) || files.length === 0)
      return json({ ok: false, error: 'アップロードするファイルがありません。' }, 400);
    if (files.length > 200)
      return json({ ok: false, error: 'ファイル数が多すぎます（最大200）。' }, 400);

    const items = [];
    for (const f of files) {
      const rel = sanitizePath(f.path);
      if (!rel) continue;
      const ext = rel.split('.').pop().toLowerCase();
      if (!ALLOWED_EXT.has(ext))
        return json({ ok: false, error: `許可されていない種類のファイルです: ${rel}` }, 400);
      items.push({ path: `${safeFolder}/${rel}`, content: f.content }); // content = base64
    }
    if (items.length === 0)
      return json({ ok: false, error: '有効なファイルがありません。' }, 400);

    // 3) GitHub 設定（Cloudflare の環境変数）
    const owner  = env.GITHUB_OWNER;
    const repo   = env.GITHUB_REPO;
    const branch = env.GITHUB_BRANCH || 'main';
    const token  = env.GITHUB_TOKEN;
    if (!owner || !repo || !token)
      return json({ ok: false, error: 'サーバー設定が未完了です（GITHUB_OWNER / GITHUB_REPO / GITHUB_TOKEN）。' }, 500);

    const gh = (path, init = {}) =>
      fetch(`https://api.github.com${path}`, {
        ...init,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'mimei-deploy-bot',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        },
      });

    // 3-1) 最新コミット & ベースツリーを取得
    let r = await gh(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
    if (!r.ok) return json({ ok: false, error: `ブランチ取得失敗(${branch}): ${await r.text()}` }, 502);
    const baseSha = (await r.json()).object.sha;

    r = await gh(`/repos/${owner}/${repo}/git/commits/${baseSha}`);
    if (!r.ok) return json({ ok: false, error: `コミット取得失敗: ${await r.text()}` }, 502);
    const baseTreeSha = (await r.json()).tree.sha;

    // 3-2) 各ファイルを blob 化（base64）
    const treeItems = [];
    for (const it of items) {
      const br = await gh(`/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({ content: it.content, encoding: 'base64' }),
      });
      if (!br.ok) return json({ ok: false, error: `ファイル登録失敗(${it.path}): ${await br.text()}` }, 502);
      treeItems.push({ path: it.path, mode: '100644', type: 'blob', sha: (await br.json()).sha });
    }

    // 3-3) 新しい tree
    r = await gh(`/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });
    if (!r.ok) return json({ ok: false, error: `tree作成失敗: ${await r.text()}` }, 502);
    const newTreeSha = (await r.json()).sha;

    // 3-4) 新しい commit
    r = await gh(`/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message: `公開: ${safeFolder}（${items.length}ファイル）`,
        tree: newTreeSha,
        parents: [baseSha],
      }),
    });
    if (!r.ok) return json({ ok: false, error: `commit作成失敗: ${await r.text()}` }, 502);
    const newCommitSha = (await r.json()).sha;

    // 3-5) ブランチを更新（= 公開）
    r = await gh(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: newCommitSha, force: false }),
    });
    if (!r.ok) return json({ ok: false, error: `公開失敗: ${await r.text()}` }, 502);

    const base = env.PUBLIC_BASE_URL || 'http://codexxxx.jp';
    return json({
      ok: true,
      folder: safeFolder,
      count: items.length,
      url: `${base}/${encodeURIComponent(safeFolder)}/`,
      commit: newCommitSha.slice(0, 7),
    });
  } catch (e) {
    return json({ ok: false, error: `サーバーエラー: ${e.message}` }, 500);
  }
}
