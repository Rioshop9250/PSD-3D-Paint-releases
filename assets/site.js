// Shared behaviour for every page: mobile nav, GitHub links, latest-release
// download buttons and the guide's table-of-contents highlight.
(function () {
  const cfg = window.SITE_CONFIG || {};
  const configured = cfg.owner && cfg.repo && !/^(OWNER|REPO)$/i.test(cfg.owner);
  const repoUrl = configured ? `https://github.com/${cfg.owner}/${cfg.repo}` : '';
  const releasesUrl = repoUrl && `${repoUrl}/releases`;
  const latestUrl = repoUrl && `${repoUrl}/releases/latest`;

  // ---- mobile navigation
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // ---- links into the repository: data-gh="repo|releases|latest|issues|path:<file>"
  document.querySelectorAll('[data-gh]').forEach((a) => {
    const kind = a.dataset.gh;
    if (!configured) {
      a.setAttribute('data-missing', '');
      a.setAttribute('title', 'リポジトリ公開後にリンクされます');
      a.removeAttribute('href');
      return;
    }
    let url = repoUrl;
    if (kind === 'releases') url = releasesUrl;
    else if (kind === 'latest') url = latestUrl;
    else if (kind === 'issues') url = `${repoUrl}/issues`;
    else if (kind.startsWith('path:')) url = `${repoUrl}/blob/HEAD/${kind.slice(5)}`;
    else if (kind.startsWith('tree:')) url = `${repoUrl}/tree/HEAD/${kind.slice(5)}`;
    a.href = url;
  });
  document.querySelectorAll('[data-if-unconfigured]').forEach((el) => { el.hidden = configured; });

  // ---- download buttons: data-asset="setup|portable"
  const assetButtons = document.querySelectorAll('[data-asset]');
  const fmtSize = (n) => (n >= 1048576 ? (n / 1048576).toFixed(0) + ' MB' : Math.round(n / 1024) + ' KB');
  const fmtDate = (s) => { try { return new Date(s).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return s; } };
  const setText = (sel, text) => document.querySelectorAll(sel).forEach((el) => { el.textContent = text; });

  assetButtons.forEach((b) => {
    if (configured) b.href = latestUrl;
    else { b.setAttribute('data-missing', ''); b.removeAttribute('href'); }
  });
  if (!configured || !assetButtons.length && !document.querySelector('[data-release]')) return;

  fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((rel) => {
      const ver = String(rel.tag_name || rel.name || '').replace(/^v/, '');
      setText('[data-release="version"]', ver ? 'v' + ver : '');
      setText('[data-release="date"]', rel.published_at ? fmtDate(rel.published_at) : '');
      document.querySelectorAll('[data-release="notes"]').forEach((a) => { a.href = rel.html_url; });
      const find = (re) => (rel.assets || []).find((x) => re.test(x.name));
      const assets = { setup: find(/setup.*\.exe$/i), portable: find(/portable\.exe$/i) };
      assetButtons.forEach((b) => {
        const a = assets[b.dataset.asset];
        if (!a) return;
        b.href = a.browser_download_url;
        const size = b.querySelector('[data-size]');
        if (size) size.textContent = fmtSize(a.size);
      });
      document.querySelectorAll('[data-file]').forEach((el) => {
        const a = assets[el.dataset.file];
        if (a) el.textContent = a.name;
      });
    })
    .catch(() => { /* no release yet / rate-limited: buttons keep pointing at the releases page */ });
})();

// ---- guide: highlight the section being read
(function () {
  const links = [...document.querySelectorAll('.toc a[href^="#"]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((a) => a.classList.remove('current'));
      byId.get(e.target.id)?.classList.add('current');
    }
  }, { rootMargin: '-80px 0px -70% 0px' });
  byId.forEach((_a, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
})();
