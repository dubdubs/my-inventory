const STORAGE_KEY = 'my_inventory';

let items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

const itemList = document.getElementById('item-list');
const modal = document.getElementById('modal');
const form = document.getElementById('item-form');
const searchInput = document.getElementById('search');
const statsEl = document.getElementById('stats');
const categoryDatalist = document.getElementById('category-list');

// 分类对应的颜色和图标
const CATEGORY_STYLES = [
  { color: '#4f46e5', icon: '📦' },
  { color: '#0891b2', icon: '🔧' },
  { color: '#059669', icon: '🌿' },
  { color: '#d97706', icon: '⭐' },
  { color: '#dc2626', icon: '❤️' },
  { color: '#7c3aed', icon: '💜' },
  { color: '#db2777', icon: '🎀' },
  { color: '#65a30d', icon: '🍃' },
];

const catStyleMap = {};

function getCatStyle(cat) {
  if (!catStyleMap[cat]) {
    const idx = Object.keys(catStyleMap).length % CATEGORY_STYLES.length;
    catStyleMap[cat] = CATEGORY_STYLES[idx];
  }
  return catStyleMap[cat];
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function getCategories() {
  return [...new Set(items.map(i => i.category || '未分类'))].sort();
}

function updateDatalist() {
  categoryDatalist.innerHTML = '';
  getCategories().filter(c => c !== '未分类').forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    categoryDatalist.appendChild(opt);
  });
}

function render() {
  const q = searchInput.value.trim().toLowerCase();

  const filtered = items.filter(item => {
    if (!q) return true;
    return item.name.toLowerCase().includes(q) ||
      (item.note || '').toLowerCase().includes(q) ||
      (item.location || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q);
  });

  statsEl.textContent = `共 ${items.length} 件物品${q ? `，搜索到 ${filtered.length} 件` : ''}`;

  updateDatalist();

  if (items.length === 0) {
    itemList.innerHTML = '<div class="empty">暂无物品，点击右上角「+ 添加物品」开始记录 🎉</div>';
    return;
  }

  if (filtered.length === 0) {
    itemList.innerHTML = '<div class="empty">没有找到匹配的物品</div>';
    return;
  }

  // 按分类分组
  const groups = {};
  filtered.forEach(item => {
    const cat = item.category || '未分类';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  });

  const sortedCats = Object.keys(groups).sort((a, b) => {
    if (a === '未分类') return 1;
    if (b === '未分类') return -1;
    return a.localeCompare(b, 'zh');
  });

  itemList.innerHTML = sortedCats.map(cat => {
    const style = getCatStyle(cat);
    const catItems = groups[cat];
    return `
      <div class="category-section">
        <div class="category-header">
          <span class="category-icon">${style.icon}</span>
          <span class="category-name">${esc(cat)}</span>
          <span class="category-count">${catItems.length} 件</span>
        </div>
        <div class="item-grid">
          ${catItems.map(item => `
            <div class="item-card" style="--accent: ${style.color}">
              <div class="item-name">${esc(item.name)}</div>
              <div class="item-meta">
                <span>🔢 x${item.qty}</span>
                ${item.location ? `<span>📍 ${esc(item.location)}</span>` : ''}
              </div>
              ${item.note ? `<div class="item-note">${esc(item.note)}</div>` : ''}
              <div class="card-actions">
                <button class="btn btn-secondary btn-sm" onclick="openEdit('${item.id}')">编辑</button>
                <button class="btn btn-danger btn-sm" onclick="deleteItem('${item.id}')">删除</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function openAdd() {
  document.getElementById('modal-title').textContent = '添加物品';
  form.reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('f-qty').value = 1;
  modal.classList.remove('hidden');
  document.getElementById('f-name').focus();
}

function openEdit(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  document.getElementById('modal-title').textContent = '编辑物品';
  document.getElementById('edit-id').value = item.id;
  document.getElementById('f-name').value = item.name;
  document.getElementById('f-category').value = item.category || '';
  document.getElementById('f-qty').value = item.qty;
  document.getElementById('f-location').value = item.location || '';
  document.getElementById('f-note').value = item.note || '';
  modal.classList.remove('hidden');
  document.getElementById('f-name').focus();
}

function closeModal() {
  modal.classList.add('hidden');
}

function deleteItem(id) {
  if (!confirm('确定删除这件物品吗？')) return;
  items = items.filter(i => i.id !== id);
  save();
  render();
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('edit-id').value;
  const data = {
    name: document.getElementById('f-name').value.trim(),
    category: document.getElementById('f-category').value.trim(),
    qty: parseInt(document.getElementById('f-qty').value) || 1,
    location: document.getElementById('f-location').value.trim(),
    note: document.getElementById('f-note').value.trim(),
  };
  if (!data.name) return;

  if (id) {
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) items[idx] = { ...items[idx], ...data };
  } else {
    items.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      ...data
    });
  }

  save();
  closeModal();
  render();
});

// 导出
document.getElementById('btn-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `inventory_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
});

// 导入
document.getElementById('import-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data)) throw new Error();
      if (confirm(`导入 ${data.length} 件物品，是否覆盖现有数据？`)) {
        items = data;
        save();
        render();
      }
    } catch {
      alert('文件格式不正确，请导入有效的 JSON 文件。');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('btn-add').addEventListener('click', openAdd);
document.getElementById('btn-cancel').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
searchInput.addEventListener('input', render);

render();
