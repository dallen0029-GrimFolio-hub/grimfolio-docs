/* ============================================================
   GrimFolio Docs — search.js
   Fuse.js search. Loads search-index.json on first keystroke.
   ============================================================ */

(function () {
  'use strict';

  var FUSE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/fuse.js/7.0.0/fuse.min.js';
  var SUPPORT_URL = 'https://grimfolio.com/support';

  var searchInput = document.getElementById('search-input');
  var dropdown = document.getElementById('search-dropdown');

  if (!searchInput || !dropdown) return;

  var fuseInstance = null;
  var indexLoaded = false;
  var indexLoading = false;
  var focusedIndex = -1;
  var currentResults = [];

  // ── Load Fuse.js from CDN then fetch index ───────────────────

  function loadFuse(callback) {
    if (window.Fuse) { callback(); return; }
    var script = document.createElement('script');
    script.src = FUSE_CDN;
    script.onload = callback;
    script.onerror = function () {
      console.warn('GrimFolio Docs: Could not load Fuse.js from CDN');
    };
    document.head.appendChild(script);
  }

  function loadIndex() {
    if (indexLoaded || indexLoading) return;
    indexLoading = true;

    loadFuse(function () {
      fetch('/search-index.json')
        .then(function (res) {
          if (!res.ok) throw new Error('Index not found');
          return res.json();
        })
        .then(function (data) {
          indexLoaded = true;
          indexLoading = false;
          fuseInstance = new window.Fuse(data, {
            keys: [
              { name: 'title',   weight: 3 },
              { name: 'section', weight: 2 },
              { name: 'body',    weight: 1 }
            ],
            threshold: 0.3,
            includeScore: true,
            includeMatches: true,
            ignoreLocation: true,
            minMatchCharLength: 2
          });
          // If user already typed something while index was loading
          if (searchInput.value.trim().length >= 2) {
            runSearch(searchInput.value.trim());
          }
        })
        .catch(function (err) {
          indexLoading = false;
          console.warn('GrimFolio Docs: search index not available', err);
        });
    });
  }

  // ── Search ───────────────────────────────────────────────────

  function runSearch(query) {
    if (!fuseInstance) return;

    var results = fuseInstance.search(query, { limit: 8 });
    currentResults = results;
    renderDropdown(query, results);
  }

  // ── Render ───────────────────────────────────────────────────

  function highlight(text, query) {
    if (!text || !query) return text || '';
    var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp('(' + escaped + ')', 'gi'), '<mark>$1</mark>');
  }

  function excerpt(body, query, maxLen) {
    maxLen = maxLen || 100;
    if (!body) return '';
    var lower = body.toLowerCase();
    var qLower = query.toLowerCase();
    var idx = lower.indexOf(qLower);
    var start = Math.max(0, idx - 30);
    var end = Math.min(body.length, start + maxLen);
    var snippet = (start > 0 ? '...' : '') + body.slice(start, end) + (end < body.length ? '...' : '');
    return highlight(snippet, query);
  }

  function renderDropdown(query, results) {
    dropdown.innerHTML = '';
    focusedIndex = -1;

    if (results.length === 0) {
      dropdown.innerHTML =
        '<div class="search-empty">No results for <strong>' +
        escapeHtml(query) +
        '</strong>. <a href="' + SUPPORT_URL + '" target="_blank">Get help</a></div>';
      openDropdown();
      return;
    }

    results.forEach(function (result, i) {
      var item = result.item;
      var a = document.createElement('a');
      a.className = 'search-result';
      a.href = item.url;

      a.innerHTML =
        '<div class="search-result-title">' + escapeHtml(item.title) + '</div>' +
        (item.section ? '<div class="search-result-section">' + escapeHtml(item.section) + '</div>' : '') +
        '<div class="search-result-excerpt">' + excerpt(item.body, query) + '</div>';

      a.addEventListener('mouseenter', function () {
        setFocused(i);
      });

      a.addEventListener('click', function () {
        closeDropdown();
        searchInput.value = '';
      });

      dropdown.appendChild(a);
    });

    openDropdown();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Dropdown state ───────────────────────────────────────────

  function openDropdown() {
    dropdown.classList.add('open');
  }

  function closeDropdown() {
    dropdown.classList.remove('open');
    focusedIndex = -1;
  }

  // Expose globally so main.js Escape handler can close
  window.closeSearch = closeDropdown;

  function setFocused(index) {
    var items = dropdown.querySelectorAll('.search-result');
    items.forEach(function (el) { el.classList.remove('focused'); });
    focusedIndex = index;
    if (items[focusedIndex]) {
      items[focusedIndex].classList.add('focused');
    }
  }

  // ── Event listeners ──────────────────────────────────────────

  searchInput.addEventListener('focus', function () {
    loadIndex();
  });

  searchInput.addEventListener('input', function () {
    var query = searchInput.value.trim();
    if (query.length < 2) {
      closeDropdown();
      return;
    }
    loadIndex();
    if (fuseInstance) {
      runSearch(query);
    }
  });

  searchInput.addEventListener('keydown', function (e) {
    var items = dropdown.querySelectorAll('.search-result');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocused(Math.min(focusedIndex + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocused(Math.max(focusedIndex - 1, 0));
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0 && items[focusedIndex]) {
        var href = items[focusedIndex].getAttribute('href');
        if (href) window.location.href = href;
        closeDropdown();
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
      searchInput.blur();
    }
  });

  document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target) && e.target !== searchInput) {
      closeDropdown();
    }
  });

})();
