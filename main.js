/* ============================================================
   GrimFolio Docs — main.js
   Dark/light toggle, mobile sidebar, active nav, TOC spy, lightbox
   ============================================================ */

(function () {
  'use strict';

  // ── Theme ────────────────────────────────────────────────────

  const THEME_KEY = 'grimfolio-docs-theme';
  const themeToggle = document.getElementById('theme-toggle');
  const htmlEl = document.documentElement;

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    if (themeToggle) {
      themeToggle.textContent = theme === 'light' ? '🌙' : '☀';
      themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    }
  }

  // Read preference before first paint (script is deferred, but we also
  // inline a tiny snippet in <head> — this handles the deferred case too)
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const current = htmlEl.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }

  // ── Mobile Sidebar ───────────────────────────────────────────

  const hamburger = document.getElementById('hamburger');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (hamburger) {
    hamburger.addEventListener('click', function () {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  // Close sidebar on nav link click (mobile)
  if (sidebar) {
    sidebar.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 768) closeSidebar();
      });
    });
  }

  // ── Active Nav Highlight ─────────────────────────────────────

  var currentPath = window.location.pathname.replace(/\/$/, '') || '/index';
  // Normalize: strip leading slash for comparison
  var currentFile = currentPath.split('/').pop() || 'index';

  document.querySelectorAll('.nav-link').forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href) return;
    var linkFile = href.split('/').pop().replace('.html', '');
    var currentFileNorm = currentFile.replace('.html', '');

    // Match exact file or index
    if (
      href === currentPath ||
      linkFile === currentFileNorm ||
      (currentFileNorm === '' && linkFile === 'index')
    ) {
      link.classList.add('active');
    }
  });

  // ── TOC Generation & Scroll Spy ──────────────────────────────

  var tocList = document.getElementById('toc-list');
  var contentBody = document.querySelector('.content-body');

  if (tocList && contentBody) {
    var headings = contentBody.querySelectorAll('h2, h3');

    headings.forEach(function (heading, i) {
      // Ensure heading has an id
      if (!heading.id) {
        heading.id = 'section-' + i;
      }

      var li = document.createElement('li');
      li.className = 'toc-item' + (heading.tagName === 'H3' ? ' toc-h3' : '');

      var a = document.createElement('a');
      a.href = '#' + heading.id;
      a.textContent = heading.textContent;
      li.appendChild(a);
      tocList.appendChild(li);
    });

    // Scroll spy via IntersectionObserver
    var tocItems = tocList.querySelectorAll('.toc-item');
    var headingIds = Array.from(headings).map(function (h) { return h.id; });
    var activeIndex = -1;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var idx = headingIds.indexOf(entry.target.id);
        if (idx === -1) return;

        if (entry.isIntersecting) {
          if (activeIndex !== -1 && tocItems[activeIndex]) {
            tocItems[activeIndex].classList.remove('active');
          }
          activeIndex = idx;
          if (tocItems[activeIndex]) {
            tocItems[activeIndex].classList.add('active');
          }
        }
      });
    }, {
      rootMargin: '-60px 0px -70% 0px',
      threshold: 0
    });

    headings.forEach(function (heading) {
      observer.observe(heading);
    });
  }

  // ── Lightbox ─────────────────────────────────────────────────

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightboxImg.src = '';
    document.body.style.overflow = '';
  }

  // Wire up lightbox-fig figures
  document.querySelectorAll('figure.lightbox-fig').forEach(function (fig) {
    var img = fig.querySelector('img');
    if (!img) return;
    fig.addEventListener('click', function () {
      openLightbox(img.src, img.alt);
    });
  });

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeLightbox();
      closeSearch();
    }
  });

  // ── Search close helper (called by search.js too) ────────────

  window.closeSearch = function () {};

})();
