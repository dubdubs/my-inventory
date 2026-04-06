const STORAGE_KEY = 'my_inventory';
let items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

const CATEGORIES = {
  '电子产品': ['手机', '电脑', '平板', '耳机', '相机', '充电器', '数据线', '键盘', '鼠标', '显示器', '其他'],
  '衣物': ['外套', '夹克', '羽绒服', '卫衣', '衬衫', '短袖', 'T恤', '裤子', '牛仔裤', '短裤', '裙子', '内衣', '袜子', '鞋子', '帽子', '围巾', '其他'],
  '小家电': ['吹风机', '电热水壶', '微波炉', '电饭锅', '空气炸锅', '咖啡机', '榨汁机', '电风扇', '加湿器', '其他'],
  '家具': ['桌子', '椅子', '床', '柜子', '书架', '沙发', '灯具', '镜子', '其他'],
  '运动': ['跑步鞋', '运动服', '哑铃', '瑜伽垫', '跳绳', '球类', '骑行装备', '其他'],
  '娱乐': ['书籍', '游戏', '乐器', '玩具', '桌游', '影音设备', '其他'],
  '厨房用品': ['锅', '碗', '刀具', '砧板', '餐具', '杯子', '保鲜盒', '其他'],
  '洗护用品': ['护肤品', '洗发水', '沐浴露', '牙刷', '毛巾', '其他'],
  '文具办公': ['笔', '本子', '文件夹', '胶带', '剪刀', '其他'],
  '其他': [],
};

// DOM refs
const $ = id => document.getElementById(id);
const itemList = $('item-list');
const modal = $('modal');
const form = $('item-form');
const fCategory = $('f-category');
const fSubcategory = $('f-subcategory');

// 填充分类 datalist
$('category-list').innerHTML = Object.keys(CATEGORIES)
  .map(c => `<option value="${c}">`)
  .join('');

// 分类变化时联动子分类
fCategory.addEventListener('input', () => {
  const subs = CATEGORIES[fCategory.value.trim()] || [];
  $('subcategory-list').innerHTML = subs.map(s => `<option value="${s}">`).join('');
  fSubcategory.value = '';
});

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function render() {
  const q = $('search').value.trim().toLowerCase();
  const filtered = items.filter(item =>
    !q ||
    item.name.toLowerCase().includes(q) ||
    (item.category || '').toLowerCase().includes(q) ||
    (item.subcategory || '').toLowerCase().includes(q) ||
    (item.location || '').toLowerCase().includes(q) ||
    (item.note || '').toLowerCase().includes(q)
  );

  const total = items.reduce((s, i) => s + (i.qty || 1), 0);
  $('stats').textContent = `${items.length} items · ${total} total`;

  if (items.length === 0) {
    itemList.innerHTML = '<div class="empty">暂无物品，点击右上角添加</div>';
    return;
  }
  if (filtered.length === 0) {
    itemList.innerHTML = '<div class="empty">无匹配结果</div>';
    return;
  }

  // 按分类分组
  const groups = {};
  filtered.forEach(item => {
    const cat = item.category || '其他';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  });

  const catOrder = Object.keys(CATEGORIES);
  const sortedCats = Object.keys(groups).sort((a, b) => {
    const ai = catOrder.indexOf(a), bi = catOrder.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b, 'zh');
  });

  itemList.innerHTML = sortedCats.map(cat => `
    <div class="category-section">
      <div class="category-header">
        <span class="category-name">${esc(cat)}</span>
        <span class="category-count">${groups[cat].length}</span>
      </div>
      ${groups[cat].map(item => `
        <div class="item-row">
          <span class="item-name">${esc(item.name)}</span>
          <div class="item-tags">
            ${item.subcategory ? `<span class="tag">${esc(item.subcategory)}</span>` : ''}
            ${item.location ? `<span class="tag">${esc(item.location)}</span>` : ''}
            ${item.note ? `<span class="tag">${esc(item.note)}</span>` : ''}
          </div>
          <span class="item-qty">× ${item.qty}</span>
          <div class="row-actions">
            <button class="btn btn-ghost" onclick="openEdit('${item.id}')">编辑</button>
            <button class="btn btn-ghost" onclick="deleteItem('${item.id}')">删除</button>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function openAdd() {
  $('modal-title').textContent = '添加物品';
  form.reset();
  $('edit-id').value = '';
  $('f-qty').value = 1;
  $('subcategory-list').innerHTML = '';
  modal.classList.remove('hidden');
  $('f-name').focus();
}

function openEdit(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  $('modal-title').textContent = '编辑物品';
  $('edit-id').value = item.id;
  $('f-name').value = item.name;
  fCategory.value = item.category || '';
  fSubcategory.value = item.subcategory || '';
  $('f-qty').value = item.qty;
  $('f-location').value = item.location || '';
  $('f-note').value = item.note || '';
  const subs = CATEGORIES[fCategory.value.trim()] || [];
  $('subcategory-list').innerHTML = subs.map(s => `<option value="${s}">`).join('');
  modal.classList.remove('hidden');
  $('f-name').focus();
}

function closeModal() { modal.classList.add('hidden'); }

function deleteItem(id) {
  if (!confirm('删除这件物品？')) return;
  items = items.filter(i => i.id !== id);
  save(); render();
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const id = $('edit-id').value;
  const data = {
    name: $('f-name').value.trim(),
    category: fCategory.value.trim(),
    subcategory: fSubcategory.value.trim(),
    qty: parseInt($('f-qty').value) || 1,
    location: $('f-location').value.trim(),
    note: $('f-note').value.trim(),
  };
  if (!data.name) return;
  if (id) {
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) items[idx] = { ...items[idx], ...data };
  } else {
    items.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), ...data });
  }
  save(); closeModal(); render();
});

$('btn-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `inventory_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
});

$('import-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data)) throw new Error();
      if (confirm(`导入 ${data.length} 件物品，覆盖现有数据？`)) {
        items = data; save(); render();
      }
    } catch { alert('文件格式错误'); }
  };
  reader.readAsText(file);
  e.target.value = '';
});

$('btn-add').addEventListener('click', openAdd);
$('btn-cancel').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
$('search').addEventListener('input', render);

render();
