let allTerms = [];
let selectedTags = new Set();
let searchQuery = '';

async function init() {
  const res = await fetch('terms.json');
  allTerms = await res.json();
  renderTagCloud();
  renderTerms();

  document.getElementById('search').addEventListener('input', e => {
    searchQuery = e.target.value;
    renderTerms();
  });

  document.getElementById('clear-tags').addEventListener('click', () => {
    selectedTags.clear();
    renderTagCloud();
    renderTerms();
    document.getElementById('clear-tags').style.display = 'none';
  });
}

function getAllTags() {
  const tags = new Set();
  allTerms.forEach(t => t.tags.forEach(tag => tags.add(tag)));
  return [...tags].sort();
}

function renderTagCloud() {
  const tagList = document.getElementById('tag-list');
  tagList.innerHTML = getAllTags().map(tag =>
    `<button class="tag-chip ${selectedTags.has(tag) ? 'active' : ''}" data-tag="${escapeAttr(tag)}">${escapeHtml(tag)}</button>`
  ).join('');

  tagList.querySelectorAll('.tag-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
      } else {
        selectedTags.add(tag);
      }
      renderTagCloud();
      renderTerms();
      document.getElementById('clear-tags').style.display = selectedTags.size > 0 ? 'inline' : 'none';
    });
  });
}

function filterTerms() {
  const q = searchQuery.toLowerCase();
  return allTerms.filter(term => {
    const matchesSearch = q === '' ||
      term.word.toLowerCase().includes(q) ||
      (term.meaning && term.meaning.toLowerCase().includes(q));

    const matchesTags = selectedTags.size === 0 ||
      [...selectedTags].every(tag => term.tags.includes(tag));

    return matchesSearch && matchesTags;
  });
}

function renderTerms() {
  const filtered = filterTerms();
  const grid = document.getElementById('terms-grid');
  const noResults = document.getElementById('no-results');
  const count = document.getElementById('count');

  count.textContent = `${filtered.length} 件`;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';
  grid.innerHTML = filtered.map(term => `
    <div class="card">
      <div class="card-header">
        <span class="word">${escapeHtml(term.word)}</span>
        <div class="tag-badges">
          ${term.tags.map(tag =>
            `<span class="tag-badge ${selectedTags.has(tag) ? 'active' : ''}">${escapeHtml(tag)}</span>`
          ).join('')}
        </div>
      </div>
      <p class="meaning">${escapeHtml(term.meaning || '')}</p>
    </div>
  `).join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

init();
