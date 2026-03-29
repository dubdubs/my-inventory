const STORAGE_KEY = 'my_inventory';

let items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

const itemList = document.getElementById('item-list');
const modal = document.getElementById('modal');
const form = document.getElementById('item-form');
const searchInput = document.getElementById('search');
const filterCategory = document.getElementById('filter-category');
const statsEl = document.getElementById('stats');
const categoryDatalist = document.getElementById('category-list');

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function getCategories() {
  return [...new Set(items.map(i => i.category).filter(Boolean))].sort();
}

function updateCategoryOptions() {
  const cats = getCategories();

  // filter dropdown
  const current = filterCategory.value;
  filterCategory.innerHTML = '<option value="">全部分类</option>';
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    filterCategory.appendChild(opt);
  });
  filterCategory.value = current;

  // datalist for form
  categoryDatalist.innerHTML = '';
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    categoryDatalist.appendChild(opt);
  });
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  const cat = filterCategory.value;

  const filtered = items.filter(item => {
    const matchQ = !q || item.name.toLowerCase().includes(q) ||
      (item.note || '').toLowerCase().includes(q) ||
      (item.location || '').toLowerCase().includes(q);
    const matchCat = !cat || item.category === cat;
    return matchQ && matchCat;
  });

  statsEl.textContent = `共 ${items.length} 件物品，当前显示 ${filtered.length} 件`;

  updateCategoryOptions();

  if (filtered.length === 0) {
    itemList.innerHTML = '<div class="empty">暂无物品，点击右上角添加吧 🎉</div>';
    return;
  }

  itemList.innerHTML = filtered.map(item => `
    <div class="item-card">
      <div class="item-name">${esc(item.name)}</div>
      <div class="item-meta">
        ${item.category ? `<span>📁 ${esc(item.category)}</span>` : ''}
        <span>🔢 x${item.qty}</span>
        ${item.location ? `<span>📍 ${esc(item.location)}</span>` : ''}
      </div>
      ${item.note ? `<div class="item-note">${esc(item.note)}</div>` : ''}
      <div class="card-actions">
        <button class="btn btn-secondary" onclick="openEdit('${item.id}')">编辑</button>
        <button class="btn btn-danger" onclick="deleteItem('${item.id}')">删除</button>
      </div>
    </div>
  `).join('');
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
    items.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), ...data });
  }

  save();
  closeModal();
  render();
});

// Export
document.getElementById('btn-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `inventory_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
});

// Import
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
filterCategory.addEventListener('change', render);

render();
