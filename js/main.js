/* ===== YOUTUBE THUMBNAIL DOWNLOADER JS ===== */

// ===== NAV HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
}

// ===== FAQ ACCORDION =====
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// ===== THUMBNAIL DOWNLOADER TOOL =====
const YT_THUMBNAILS = {
  'maxresdefault': { label: 'MAX HD', width: 1280, height: 720, desc: '1280×720 (Full HD)' },
  'sddefault':     { label: 'SD',     width: 640,  height: 480, desc: '640×480 (Standard)' },
  'hqdefault':     { label: 'HQ',     width: 480,  height: 360, desc: '480×360 (High Quality)' },
  'mqdefault':     { label: 'MQ',     width: 320,  height: 180, desc: '320×180 (Medium Quality)' },
  'default':       { label: 'SQ',     width: 120,  height: 90,  desc: '120×90 (Small)' },
};

function extractVideoId(url) {
  if (!url) return null;
  url = url.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getThumbnailUrl(videoId, quality) {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

async function checkImageExists(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 120 ? true : false);
    img.onerror = () => resolve(false);
    img.src = url + '?t=' + Date.now();
    setTimeout(() => resolve(false), 5000);
  });
}

function downloadImage(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const form = document.getElementById('thumb-form');
const urlInput = document.getElementById('url-input');
const resultArea = document.getElementById('result-area');
const errorMsg = document.getElementById('error-msg');
const loader = document.getElementById('loader');
const previewGrid = document.getElementById('preview-grid');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (!url) return;

    const videoId = extractVideoId(url);
    errorMsg.style.display = 'none';
    resultArea.style.display = 'none';

    if (!videoId) {
      errorMsg.textContent = '❌ Invalid YouTube URL. Please enter a valid YouTube video link.';
      errorMsg.style.display = 'block';
      return;
    }

    loader.style.display = 'block';
    previewGrid.innerHTML = '';

    const qualities = Object.entries(YT_THUMBNAILS);
    const found = [];

    for (const [key, info] of qualities) {
      const thumbUrl = getThumbnailUrl(videoId, key);
      const exists = await checkImageExists(thumbUrl);
      if (exists) {
        found.push({ key, info, url: thumbUrl });
      }
    }

    loader.style.display = 'none';

    if (found.length === 0) {
      errorMsg.textContent = '❌ Could not load thumbnails. The video may be private or unavailable.';
      errorMsg.style.display = 'block';
      return;
    }

    for (const item of found) {
      const card = document.createElement('div');
      card.className = 'thumb-item animate-in';
      card.innerHTML = `
        <img src="${item.url}" alt="YouTube thumbnail ${item.info.label}" loading="lazy">
        <div class="thumb-info">
          <div class="thumb-quality">${item.info.label}</div>
          <div class="thumb-size">${item.info.desc}</div>
          <div class="thumb-actions">
            <button class="btn btn-primary btn-sm dl-btn" data-url="${item.url}" data-name="thumbnail-${videoId}-${item.key}.jpg">⬇ Download</button>
            <a href="${item.url}" target="_blank" class="btn btn-secondary btn-sm">🔍 View</a>
          </div>
        </div>`;
      previewGrid.appendChild(card);
    }

    // Wire up download buttons — fetch as blob so browser saves instead of navigating
    previewGrid.querySelectorAll('.dl-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const url = btn.getAttribute('data-url');
        const name = btn.getAttribute('data-name');
        const original = btn.textContent;
        btn.textContent = '⏳ Saving...';
        btn.disabled = true;
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
          btn.textContent = '✅ Saved!';
          setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2500);
        } catch {
          // CORS fallback — open directly, browser will prompt save
          const a = document.createElement('a');
          a.href = url; a.download = name; a.target = '_blank';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          btn.textContent = original; btn.disabled = false;
        }
      });
    });

    resultArea.style.display = 'block';
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

// Download All button
const dlAll = document.getElementById('download-all');
if (dlAll) {
  dlAll.addEventListener('click', () => {
    previewGrid.querySelectorAll('.dl-btn').forEach((btn, i) => {
      setTimeout(() => btn.click(), i * 600);
    });
  });
}

// ===== SMOOTH SCROLL CTA =====
document.querySelectorAll('[data-scroll]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(el.getAttribute('data-scroll'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ===== PASTE DETECTION =====
if (urlInput) {
  urlInput.addEventListener('paste', () => {
    setTimeout(() => {
      const id = extractVideoId(urlInput.value);
      if (id) {
        urlInput.style.borderColor = 'var(--red)';
        setTimeout(() => urlInput.style.borderColor = '', 1000);
      }
    }, 50);
  });
}

// ===== COPY URL =====
document.querySelectorAll('[data-copy]').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.getAttribute('data-copy');
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => btn.textContent = original, 2000);
    });
  });
});

// ===== ANIMATE ON SCROLL =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animationPlayState = 'running';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .blog-card, .step').forEach(el => {
  el.style.animationPlayState = 'paused';
  observer.observe(el);
});

// ===== ACTIVE NAV =====
const currentPath = window.location.pathname.replace(/\/$/, '') || '/index.html';
document.querySelectorAll('nav a, .mobile-menu a').forEach(a => {
  const href = a.getAttribute('href');
  if (href && (currentPath.endsWith(href.replace(/\/$/, '')) || (href === 'index.html' && currentPath === ''))) {
    a.style.color = 'var(--red)';
  }
});
