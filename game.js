// ============== 数字乡村游戏核心逻辑 ==============

const BUILDINGS = {
  farm: { name: '农田', icon: '🌾', cost: 2000, materialCost: 20, maxLevel: 3,
    baseIncome: 50, baseLabor: 1, upgradeCost: [0, 3000, 6000], ecoEffect: -2,
    influence: '周边2格内农田产出叠加', upgradeBenefit: ['基础产出翻倍', '基础产出×3', ''] },
  homestay: { name: '民宿', icon: '🏡', cost: 8000, materialCost: 50, maxLevel: 3,
    baseIncome: 200, baseLabor: 2, upgradeCost: [0, 10000, 20000], ecoEffect: -1,
    influence: '冬季收入+50%', upgradeBenefit: ['基础产出翻倍', '基础产出×3', ''] },
  warehouse: { name: '仓储', icon: '🏭', cost: 5000, materialCost: 40, maxLevel: 3,
    baseIncome: 80, baseLabor: 1, upgradeCost: [0, 7000, 14000], ecoEffect: -1,
    extraEffect: '农田、民宿产出+50%',
    influence: '全图农田、民宿生效', upgradeBenefit: ['加成提升至+65%', '加成提升至+80%', ''] },
  clinic: { name: '卫生站', icon: '🏥', cost: 10000, materialCost: 60, maxLevel: 2,
    baseIncome: 0, baseLabor: 1, upgradeCost: [0, 15000, 0], ecoEffect: 0,
    extraEffect: '村民满意度+0.2/天',
    influence: '全村生效', upgradeBenefit: ['满意度增幅翻倍', ''] },
  plaza: { name: '文化广场', icon: '🎭', cost: 12000, materialCost: 80, maxLevel: 2,
    baseIncome: 30, baseLabor: 1, upgradeCost: [0, 18000, 0], ecoEffect: 1,
    extraEffect: '村民满意度+0.3/天',
    influence: '全村生效', upgradeBenefit: ['满意度增幅翻倍', ''] }
};

const SEASONS = [
  { name: '春季', icon: '🌸', cropPhase: '春播期', desc: '适宜播种，农田产出基础值' },
  { name: '夏季', icon: '☀️', cropPhase: '生长旺期', desc: '农作物快速生长，农田产出+30%' },
  { name: '秋季', icon: '🍂', cropPhase: '收获期', desc: '丰收季节，农田产出+80%' },
  { name: '冬季', icon: '❄️', cropPhase: '休耕期', desc: '农田休耕，产出-50%，民宿旺季+50%' }
];

const VILLAGER_NAMES = [
  '张大爷','李奶奶','王大叔','刘大婶','陈小明','杨小红',
  '赵大哥','孙二姐','周老伯','吴阿姨','郑小龙','冯春花',
  '许大壮','何美玲','吕老根','施桂花','张铁柱','李淑芬'
];
const VILLAGER_SKILLS = ['种植','养殖','经营','医疗','文化','手艺','物流','管理'];
const DEMAND_TYPES = [
  '希望改善医疗条件','希望有休闲活动场所','希望增加收入来源',
  '希望改善居住环境','希望获得技能培训','希望子女有好教育'
];

const TASK_TEMPLATES = [
  { id: 'env_clean', type: '环境整治', title: '清理村庄河道', desc: '组织村民清理河道垃圾，改善生态环境。',
    goal: { type: 'eco', value: 5 }, reward: { money: 3000, eco: 8, happy: 3 }, days: 5, labor: 2,
    requires: { buildings: {}, resources: {} }, unlockAfter: null },
  { id: 'env_maintain', type: '环境整治', title: '河道长效维护', desc: '建立河道日常维护机制，确保水质持续达标。',
    goal: { type: 'eco', value: 8 }, reward: { money: 5000, eco: 12, happy: 5 }, days: 8, labor: 3,
    requires: { buildings: {}, resources: { money: 2000 } }, unlockAfter: 'env_clean' },
  { id: 'env_clean2', type: '环境整治', title: '垃圾分类推广', desc: '在全村推广垃圾分类制度，提升环境整洁度。',
    goal: { type: 'build', building: 'plaza', value: 1 }, reward: { money: 2500, eco: 5, happy: 5 }, days: 4, labor: 2,
    requires: { buildings: {}, resources: {} }, unlockAfter: null },
  { id: 'sale_help', type: '助农销售', title: '帮助农户销售蔬菜', desc: '打通销售渠道，帮助农户销售积压的农产品。',
    goal: { type: 'build', building: 'warehouse', value: 1 }, reward: { money: 5000, happy: 5 }, days: 6, labor: 3,
    requires: { buildings: {}, resources: {} }, unlockAfter: null },
  { id: 'sale_brand', type: '助农销售', title: '品牌推广计划', desc: '打造本村农产品品牌，扩大市场影响力。',
    goal: { type: 'money_earn', value: 15000 }, reward: { money: 12000, happy: 10 }, days: 12, labor: 3,
    requires: { buildings: { warehouse: 1 }, resources: { money: 5000 } }, unlockAfter: 'sale_help' },
  { id: 'sale_help2', type: '助农销售', title: '建立电商平台', desc: '搭建农产品电商销售平台，拓宽收入渠道。',
    goal: { type: 'money_earn', value: 10000 }, reward: { money: 8000, happy: 8 }, days: 10, labor: 3,
    requires: { buildings: {}, resources: {} }, unlockAfter: null },
  { id: 'elder_care', type: '老人关怀', title: '慰问独居老人', desc: '定期探访独居老人，提供生活帮助和精神慰藉。',
    goal: { type: 'build', building: 'clinic', value: 1 }, reward: { money: 2000, happy: 10 }, days: 4, labor: 1,
    requires: { buildings: {}, resources: {} }, unlockAfter: null },
  { id: 'elder_center', type: '老人关怀', title: '老年康养中心', desc: '建设专业化老年康养中心，提供全面照护服务。',
    goal: { type: 'build', building: 'clinic', value: 1 }, reward: { money: 6000, happy: 15 }, days: 10, labor: 4,
    requires: { buildings: { clinic: 1, plaza: 1 }, resources: { money: 8000 } }, unlockAfter: 'elder_care' },
  { id: 'elder_care2', type: '老人关怀', title: '建立老年活动中心', desc: '为老年人提供文化娱乐和健康检查服务。',
    goal: { type: 'build', building: 'plaza', value: 1 }, reward: { money: 4000, happy: 12 }, days: 7, labor: 2,
    requires: { buildings: {}, resources: {} }, unlockAfter: null },
  { id: 'flood_patrol', type: '防汛巡查', title: '河道堤防巡查', desc: '雨季来临，组织人员巡查堤防，排查安全隐患。',
    goal: { type: 'days_pass', value: 8 }, reward: { money: 3500, eco: 3 }, days: 8, labor: 3, urgent: true,
    requires: { buildings: {}, resources: {} }, unlockAfter: null },
  { id: 'flood_repair', type: '防汛巡查', title: '灾后重建工程', desc: '对受灾区域进行修复重建，恢复生产生活秩序。',
    goal: { type: 'material_spend', value: 120 }, reward: { money: 8000, eco: 8, happy: 8 }, days: 12, labor: 5,
    requires: { buildings: { warehouse: 1 }, resources: { materials: 80 } }, unlockAfter: 'flood_patrol', urgent: true },
  { id: 'flood_patrol2', type: '防汛巡查', title: '加固堤坝工程', desc: '对年久失修的堤坝进行加固，防止洪水灾害。',
    goal: { type: 'material_spend', value: 100 }, reward: { money: 6000, eco: 6 }, days: 10, labor: 4, urgent: true,
    requires: { buildings: {}, resources: { materials: 50 } }, unlockAfter: null },
  { id: 'road_build', type: '基础设施', title: '修建乡村道路', desc: '改善村庄交通条件，方便村民出行和农产品运输。',
    goal: { type: 'material_spend', value: 80 }, reward: { money: 7000, happy: 8 }, days: 12, labor: 4,
    requires: { buildings: {}, resources: { materials: 40 } }, unlockAfter: null },
  { id: 'skill_train', type: '技能培训', title: '农业技术培训', desc: '邀请专家为村民进行现代农业技术培训。',
    goal: { type: 'build', building: 'plaza', value: 1 }, reward: { money: 3000, happy: 6 }, days: 5, labor: 1,
    requires: { buildings: {}, resources: {} }, unlockAfter: null },
  { id: 'skill_advance', type: '技能培训', title: '电商运营培训', desc: '培训村民掌握电商运营技能，拓展线上销售渠道。',
    goal: { type: 'money_earn', value: 8000 }, reward: { money: 6000, happy: 8 }, days: 8, labor: 2,
    requires: { buildings: { plaza: 1 }, resources: { money: 3000 } }, unlockAfter: 'skill_train' }
];

const COMPLETED_TASK_IDS = new Set();

// ============== 游戏状态 ==============
let game = null;

function createNewGame() {
  COMPLETED_TASK_IDS.clear();
  return {
    time: { year: 1, season: 0, day: 1, totalDays: 1 },
    resources: { money: 10000, materials: 100, labor: 5, laborMax: 10, ecoScore: 80 },
    map: generateMap(),
    buildings: [],
    villagers: generateVillagers(12),
    tasks: [],
    taskDone: 0,
    taskRewardTotal: 0,
    stats: {
      totalIncome: 0, dailyIncomeHistory: [], maxDailyIncome: 0,
      ecoIncidents: 0, riskEvents: [],
      yearEvaluations: [],
      yearIncomeStart: 0
    },
    history: [],
    selectedBuilding: 'none',
    availableTasks: [],
    nextTaskId: 1
  };
}

function generateMap() {
  const map = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 12; x++) {
      let type = 'empty';
      if ((y === 4 && (x === 3 || x === 4 || x === 5 || x === 6)) || (y === 3 && x === 4)) {
        type = 'river';
      } else if ((y === 0 && x === 0) || (y === 0 && x === 11) || (y === 7 && x === 5) ||
                 (y === 6 && x === 11) || (y === 1 && x === 10)) {
        type = 'mountain';
      }
      map.push({ x, y, type, building: null, level: 0, workers: 0 });
    }
  }
  return map;
}

function generateVillagers(count) {
  const villagers = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let idx;
    do { idx = Math.floor(Math.random() * VILLAGER_NAMES.length); } while (used.has(idx));
    used.add(idx);
    const skillCount = 1 + Math.floor(Math.random() * 2);
    const skills = [];
    while (skills.length < skillCount) {
      const s = VILLAGER_SKILLS[Math.floor(Math.random() * VILLAGER_SKILLS.length)];
      if (!skills.includes(s)) skills.push(s);
    }
    const age = 20 + Math.floor(Math.random() * 55);
    villagers.push({
      id: i + 1,
      name: VILLAGER_NAMES[idx],
      age,
      gender: Math.random() > 0.5 ? '男' : '女',
      avatar: age > 60 ? (Math.random() > 0.5 ? '👴' : '👵') :
              age < 30 ? (Math.random() > 0.5 ? '👨' : '👩') :
              (Math.random() > 0.5 ? '🧔' : '👩‍🦰'),
      skills,
      happiness: 60 + Math.floor(Math.random() * 30),
      demand: DEMAND_TYPES[Math.floor(Math.random() * DEMAND_TYPES.length)],
      participating: Math.random() > 0.4,
      assignedBuilding: null
    });
  }
  return villagers;
}

// ============== 工具函数 ==============
function $(id) { return document.getElementById(id); }

function showToast(msg, type = 'info', duration = 2500) {
  const container = $('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

function showModal(title, body, onConfirm, onCancel) {
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = body;
  $('modal').classList.remove('hidden');
  $('modalConfirm').style.display = '';
  $('modalConfirm').onclick = () => {
    $('modal').classList.add('hidden');
    if (onConfirm) onConfirm();
  };
  $('modalCancel').onclick = () => {
    $('modal').classList.add('hidden');
    if (onCancel) onCancel();
  };
}

function addLog(msg) {
  game.history.unshift({
    day: `第${game.time.totalDays}天`,
    date: `第${game.time.year}年${SEASONS[game.time.season].name}第${game.time.day}天`,
    msg
  });
  if (game.history.length > 100) game.history.pop();
}

// ============== 存档系统 ==============
function saveGame() {
  try {
    const saveData = JSON.parse(JSON.stringify(game));
    saveData._completedTaskIds = [...COMPLETED_TASK_IDS];
    localStorage.setItem('digitalVillage_save', JSON.stringify(saveData));
    showToast('游戏已保存！', 'success');
  } catch (e) {
    showToast('保存失败: ' + e.message, 'error');
  }
}

function loadGame() {
  try {
    const data = localStorage.getItem('digitalVillage_save');
    if (!data) { showToast('没有找到存档', 'warning'); return false; }
    game = JSON.parse(data);
    if (game._completedTaskIds) {
      COMPLETED_TASK_IDS.clear();
      game._completedTaskIds.forEach(id => COMPLETED_TASK_IDS.add(id));
    }
    showToast('存档读取成功！', 'success');
    return true;
  } catch (e) {
    showToast('读取失败: ' + e.message, 'error');
    return false;
  }
}

function hasSave() {
  return !!localStorage.getItem('digitalVillage_save');
}

// ============== 标签页切换 ==============
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tab));
  closeSidebar();
}

// ============== 仓储加成计算 ==============
function getWarehouseBonus() {
  const warehouses = game.buildings.filter(b => game.map[b.idx].building === 'warehouse');
  if (warehouses.length === 0) return 0;
  const maxLevel = Math.max(...warehouses.map(w => game.map[w.idx].level));
  if (maxLevel >= 3) return 0.8;
  if (maxLevel >= 2) return 0.65;
  return 0.5;
}

function hasWarehouse() {
  return game.buildings.some(b => game.map[b.idx].building === 'warehouse');
}

// ============== 地图渲染 ==============
function renderMap() {
  const grid = $('mapGrid');
  grid.innerHTML = '';
  const wBonus = getWarehouseBonus();
  game.map.forEach((cell, idx) => {
    const div = document.createElement('div');
    div.className = 'map-cell ' + (cell.building ? cell.building : cell.type);
    if (cell.building) {
      div.textContent = BUILDINGS[cell.building].icon;
      if (cell.level > 1) {
        const lv = document.createElement('span');
        lv.className = 'cell-level';
        lv.textContent = 'Lv.' + cell.level;
        div.appendChild(lv);
      }
      if ((cell.building === 'farm' || cell.building === 'homestay') && wBonus > 0) {
        const badge = document.createElement('span');
        badge.className = 'warehouse-badge';
        badge.textContent = '+' + Math.round(wBonus * 100) + '%';
        div.appendChild(badge);
      }
    } else if (cell.type === 'mountain') {
      div.textContent = '⛰️';
    } else if (cell.type === 'river') {
      div.textContent = '🌊';
    }
    div.title = cell.building ? `${BUILDINGS[cell.building].name} Lv.${cell.level} (${cell.workers}人)` :
                cell.type === 'empty' ? '空地 - 点击建造' :
                cell.type === 'mountain' ? '山地 - 不可建造' : '河流 - 不可建造';
    div.onclick = () => handleCellClick(idx);
    grid.appendChild(div);
  });
}

function handleCellClick(idx) {
  const cell = game.map[idx];
  if (cell.building) {
    openSidebar(idx);
    return;
  }
  closeSidebar();
  if (cell.type !== 'empty') {
    showToast('此处无法建造', 'warning');
    return;
  }
  if (game.selectedBuilding === 'none') {
    showToast('请先选择要建造的建筑', 'info');
    return;
  }
  buildStructure(idx, game.selectedBuilding);
}

function openSidebar(idx) {
  const cell = game.map[idx];
  const b = BUILDINGS[cell.building];
  const sidebar = $('buildingSidebar');
  const income = getBuildingIncome(cell);
  const nextCost = cell.level < b.maxLevel ? b.upgradeCost[cell.level] : null;
  const nextLevel = cell.level + 1;
  const wBonus = getWarehouseBonus();
  const hasW = (cell.building === 'farm' || cell.building === 'homestay') && wBonus > 0;
  const incomeNoWorker = Math.floor(b.baseIncome * cell.level * 0.3 * getSeasonMultiplier(cell.building) * (hasW ? (1 + wBonus) : 1));
  const incomeFullWorker = Math.floor(b.baseIncome * cell.level * 1.0 * getSeasonMultiplier(cell.building) * (hasW ? (1 + wBonus) : 1));
  let upgradePreview = '';
  if (nextCost) {
    const upgIncome = Math.floor(b.baseIncome * nextLevel * 1.0 * getSeasonMultiplier(cell.building) * (hasW ? (1 + wBonus) : 1));
    upgradePreview = `<div class="sb-section">
      <div class="sb-label">⬆️ 升级到 Lv.${nextLevel}</div>
      <div class="sb-upgrade-cost">需要 ${nextCost} 💰 + ${b.materialCost} 🧰</div>
      <div class="sb-upgrade-preview">满员日收入: ${incomeFullWorker} → ${upgIncome} 💰/天</div>
      <button class="sb-btn-upgrade" onclick="upgradeBuilding(${idx})">确认升级</button>
    </div>`;
  } else {
    upgradePreview = `<div class="sb-section"><div class="sb-max-level">✅ 已达最高等级</div></div>`;
  }
  const warehouseInfo = hasW ? `<div class="sb-bonus-row"><span>🏭 仓储加成</span><span class="sb-bonus-val">+${Math.round(wBonus * 100)}%</span></div>` : '';
  const extraInfo = b.extraEffect ? `<div class="sb-extra-effect">💡 ${b.extraEffect}</div>` : '';
  sidebar.innerHTML = `
    <div class="sb-header">
      <span class="sb-icon">${b.icon}</span>
      <span class="sb-title">${b.name} Lv.${cell.level}</span>
      <button class="sb-close" onclick="closeSidebar()">✕</button>
    </div>
    <div class="sb-section">
      <div class="sb-label">📊 运营数据</div>
      <div class="sb-row"><span>日收入</span><span class="sb-val">${income} 💰</span></div>
      <div class="sb-row"><span>无人值守</span><span>${incomeNoWorker} 💰/天</span></div>
      <div class="sb-row"><span>满员产出</span><span>${incomeFullWorker} 💰/天</span></div>
      <div class="sb-row"><span>投入人力</span><span>${cell.workers} / ${cell.level} 人</span></div>
      ${warehouseInfo}
    </div>
    <div class="sb-section">
      <div class="sb-label">👷 人力分配</div>
      <div class="sb-worker-ctrl">
        <button class="sb-btn-sm" onclick="adjustWorkers(${idx},-1)">➖</button>
        <span class="sb-worker-num">${cell.workers}</span>
        <button class="sb-btn-sm" onclick="adjustWorkers(${idx},1)">➕</button>
        <span class="sb-worker-hint">（上限 ${cell.level} 人）</span>
      </div>
    </div>
    ${upgradePreview}
    <div class="sb-section">
      <div class="sb-label">📍 影响范围</div>
      <div class="sb-influence">${b.influence}</div>
    </div>
    ${extraInfo}
  `;
  sidebar.classList.add('open');
}

function closeSidebar() {
  $('buildingSidebar').classList.remove('open');
}

function getSeasonMultiplier(buildingType) {
  const season = game.time.season;
  if (buildingType === 'farm') {
    if (season === 1) return 1.3;
    if (season === 2) return 1.8;
    if (season === 3) return 0.5;
  } else if (buildingType === 'homestay' && season === 3) {
    return 1.5;
  }
  return 1;
}

function adjustWorkers(idx, delta) {
  const cell = game.map[idx];
  const max = cell.level;
  if (delta > 0) {
    if (cell.workers >= max) { showToast('该建筑人力已满', 'warning'); return; }
    if (getIdleLabor() <= 0) { showToast('没有闲置人力', 'warning'); return; }
    cell.workers++;
  } else {
    if (cell.workers <= 0) return;
    cell.workers--;
  }
  renderAll();
  openSidebar(idx);
}

function buildStructure(idx, buildingType) {
  const b = BUILDINGS[buildingType];
  if (game.resources.money < b.cost) { showToast('资金不足！', 'error'); return; }
  if (game.resources.materials < b.materialCost) { showToast('物资不足！', 'error'); return; }
  game.resources.money -= b.cost;
  game.resources.materials -= b.materialCost;
  game.map[idx].building = buildingType;
  game.map[idx].level = 1;
  game.map[idx].workers = 0;
  game.resources.ecoScore = Math.max(0, Math.min(100, game.resources.ecoScore + b.ecoEffect));
  game.buildings.push({ idx, type: buildingType });
  addLog(`建造了 ${b.name}`);
  showToast(`${b.name} 建造成功！`, 'success');
  renderAll();
}

function upgradeBuilding(idx) {
  const cell = game.map[idx];
  const b = BUILDINGS[cell.building];
  const cost = b.upgradeCost[cell.level];
  if (game.resources.money < cost) { showToast('资金不足！', 'error'); return; }
  if (game.resources.materials < b.materialCost) { showToast('物资不足！', 'error'); return; }
  game.resources.money -= cost;
  game.resources.materials -= b.materialCost;
  cell.level++;
  addLog(`${b.name} 升级到 Lv.${cell.level}`);
  showToast(`${b.name} 升级成功！`, 'success');
  renderAll();
  openSidebar(idx);
}

function getIdleLabor() {
  let used = 0;
  game.map.forEach(c => { if (c.building) used += c.workers; });
  game.tasks.forEach(t => { if (t.active) used += t.labor; });
  return Math.max(0, game.resources.labor - used);
}

function getBuildingIncome(cell) {
  if (!cell.building) return 0;
  const b = BUILDINGS[cell.building];
  let income = b.baseIncome * cell.level;
  if (cell.workers > 0) income *= (0.5 + 0.5 * (cell.workers / cell.level));
  else income *= 0.3;
  income *= getSeasonMultiplier(cell.building);
  const wBonus = getWarehouseBonus();
  if (wBonus > 0 && (cell.building === 'farm' || cell.building === 'homestay')) {
    income *= (1 + wBonus);
  }
  return Math.floor(income);
}

// ============== 任务系统 ==============
function isTaskUnlocked(template) {
  if (!template.unlockAfter) return true;
  return COMPLETED_TASK_IDS.has(template.unlockAfter);
}

function getTaskRequirementsText(template) {
  const parts = [];
  if (template.unlockAfter) {
    const prev = TASK_TEMPLATES.find(t => t.id === template.unlockAfter);
    parts.push(`前置任务: ${prev ? prev.title : template.unlockAfter}`);
  }
  if (template.requires.buildings) {
    Object.entries(template.requires.buildings).forEach(([k, v]) => {
      parts.push(`需要建筑: ${BUILDINGS[k].name}×${v}`);
    });
  }
  if (template.requires.resources) {
    if (template.requires.resources.money) parts.push(`需要资金: ${template.requires.resources.money} 💰`);
    if (template.requires.resources.materials) parts.push(`需要物资: ${template.requires.resources.materials} 🧰`);
  }
  return parts;
}

function checkTaskRequirements(template) {
  const missing = [];
  if (template.requires.buildings) {
    Object.entries(template.requires.buildings).forEach(([k, v]) => {
      const count = game.buildings.filter(b => game.map[b.idx].building === k).length;
      if (count < v) missing.push(`${BUILDINGS[k].name}×${v}（当前${count}）`);
    });
  }
  if (template.requires.resources) {
    if (template.requires.resources.money && game.resources.money < template.requires.resources.money) {
      missing.push(`资金 ${template.requires.resources.money}（当前${game.resources.money}）`);
    }
    if (template.requires.resources.materials && game.resources.materials < template.requires.resources.materials) {
      missing.push(`物资 ${template.requires.resources.materials}（当前${game.resources.materials}）`);
    }
  }
  return missing;
}

function generateRandomTask() {
  if (game.availableTasks.length >= 4) return;
  const pool = TASK_TEMPLATES.filter(t => isTaskUnlocked(t));
  const template = pool[Math.floor(Math.random() * pool.length)];
  if (game.availableTasks.some(t => t.templateId === template.id)) return;
  if (game.tasks.some(t => t.templateId === template.id && !t.done)) return;
  const task = {
    id: game.nextTaskId++,
    templateId: template.id,
    type: template.type,
    title: template.title,
    desc: template.desc,
    goal: { ...template.goal },
    reward: { ...template.reward },
    days: template.days,
    labor: template.labor,
    urgent: !!template.urgent,
    active: false,
    progress: 0,
    daysSpent: 0,
    done: false,
    startMoney: 0,
    isChain: !!template.unlockAfter,
    requiresText: getTaskRequirementsText(template)
  };
  game.availableTasks.push(task);
}

function acceptTask(taskId) {
  const idx = game.availableTasks.findIndex(t => t.id === taskId);
  if (idx === -1) return;
  const task = game.availableTasks[idx];
  if (getIdleLabor() < task.labor) {
    showToast(`需要 ${task.labor} 个闲置人力`, 'error');
    return;
  }
  const template = TASK_TEMPLATES.find(t => t.id === task.templateId);
  const missing = checkTaskRequirements(template);
  if (missing.length > 0) {
    showToast('不满足前置条件: ' + missing.join(', '), 'error');
    return;
  }
  task.active = true;
  task.startMoney = game.stats.totalIncome;
  game.availableTasks.splice(idx, 1);
  game.tasks.push(task);
  addLog(`接取任务: ${task.title}`);
  showToast(`任务开始: ${task.title}`, 'info');
  renderAll();
}

function checkTaskProgress(task) {
  if (task.done) return;
  let completed = false;
  switch (task.goal.type) {
    case 'days_pass':
      completed = task.daysSpent >= task.goal.value;
      task.progress = Math.min(100, (task.daysSpent / task.goal.value) * 100);
      break;
    case 'eco':
      completed = game.resources.ecoScore >= 80 + task.goal.value;
      task.progress = Math.min(100, ((game.resources.ecoScore - 80) / task.goal.value) * 100);
      break;
    case 'build':
      const bc = game.buildings.filter(b => game.map[b.idx].building === task.goal.building).length;
      completed = bc >= task.goal.value;
      task.progress = Math.min(100, (bc / task.goal.value) * 100);
      break;
    case 'money_earn':
      const earned = game.stats.totalIncome - task.startMoney;
      completed = earned >= task.goal.value;
      task.progress = Math.min(100, (earned / task.goal.value) * 100);
      break;
    case 'material_spend':
      task.progress = Math.min(100, (task.daysSpent / task.days) * 100);
      completed = task.daysSpent >= task.days;
      break;
  }
  if (completed) completeTask(task);
}

function completeTask(task) {
  task.done = true;
  task.active = false;
  task.progress = 100;
  game.taskDone++;
  COMPLETED_TASK_IDS.add(task.templateId);
  if (task.reward.money) {
    game.resources.money += task.reward.money;
    game.taskRewardTotal += task.reward.money;
  }
  if (task.reward.eco) game.resources.ecoScore = Math.min(100, game.resources.ecoScore + task.reward.eco);
  if (task.reward.happy) {
    game.villagers.forEach(v => v.happiness = Math.min(100, v.happiness + task.reward.happy));
  }
  addLog(`完成任务「${task.title}」，获得奖励！`);
  showToast(`任务完成！${task.title}`, 'success');
  const unlocked = TASK_TEMPLATES.filter(t => t.unlockAfter === task.templateId);
  unlocked.forEach(u => {
    addLog(`🔓 解锁新任务: ${u.title}`);
    showToast(`解锁新任务: ${u.title}`, 'info');
  });
}

function renderTasks() {
  const allTasks = [...game.availableTasks, ...game.tasks];
  $('activeTaskCount').textContent = game.tasks.filter(t => !t.done).length;
  $('doneTaskCount').textContent = game.taskDone;
  $('totalReward').textContent = game.taskRewardTotal;

  const list = $('taskList');
  if (allTasks.length === 0) {
    list.innerHTML = '<div style="color:#888;padding:20px;text-align:center">暂无任务，过几天再来看看吧~</div>';
    return;
  }
  list.innerHTML = allTasks.map(t => {
    const statusText = t.done ? '✅ 已完成' : t.active ? `⏳ 进行中 (${t.daysSpent}/${t.days}天)` : '📋 可接取';
    const rewardText = Object.entries(t.reward).map(([k, v]) => {
      if (k === 'money') return `${v}💰`;
      if (k === 'eco') return `生态+${v}🌿`;
      if (k === 'happy') return `满意度+${v}😊`;
      return '';
    }).filter(Boolean).join(' ');
    const chainTag = t.isChain ? '<span class="task-chain-tag">🔗 进阶</span>' : '';
    const reqHtml = (!t.done && !t.active && t.requiresText && t.requiresText.length > 0)
      ? `<div class="task-requires">${t.requiresText.map(r => `<span class="req-tag">${r}</span>`).join('')}</div>`
      : '';
    const template = TASK_TEMPLATES.find(tp => tp.id === t.templateId);
    const missing = (template && !t.active && !t.done) ? checkTaskRequirements(template) : [];
    const canAccept = t.active === false && t.done === false && missing.length === 0;
    return `
      <div class="task-card ${t.done ? 'done' : ''} ${t.urgent ? 'urgent' : ''} ${t.isChain ? 'chain' : ''}">
        <div class="task-title">${t.urgent ? '⚠️ ' : ''}${t.title} <span style="font-size:11px;color:#888;font-weight:normal">[${t.type}]</span> ${chainTag}</div>
        <div class="task-desc">${t.desc}</div>
        ${reqHtml}
        <div class="task-progress"><div class="task-progress-fill" style="width:${t.progress || 0}%"></div></div>
        <div class="task-meta">
          <span>${statusText} · 需${t.labor}人</span>
          <span class="task-reward">${rewardText}</span>
        </div>
        <div style="margin-top:10px;text-align:right">
          ${t.done ? '' : t.active ? '<span style="color:#666;font-size:12px">进行中...</span>' :
            `<button class="task-btn" onclick="acceptTask(${t.id})" ${canAccept ? '' : 'disabled'}>${canAccept ? '接取任务' : '条件不足'}</button>`}
        </div>
      </div>
    `;
  }).join('');
}

// ============== 资源界面 ==============
function renderResources() {
  const season = SEASONS[game.time.season];
  $('resMoneyValue').textContent = game.resources.money;
  $('resLaborValue').textContent = game.resources.labor;
  $('resLaborMax').textContent = game.resources.laborMax;
  $('resLaborIdle').textContent = getIdleLabor();
  $('resMatValue').textContent = game.resources.materials;
  $('resSeasonValue').textContent = season.cropPhase;
  $('resSeasonDesc').textContent = season.desc;
  const dailyInc = calcDailyIncome();
  $('resMoneyChange').textContent = `+${dailyInc}/天`;
  const matChange = Math.floor(game.buildings.length * 0.5 + 1);
  $('resMatChange').textContent = `+${matChange}/天`;

  const wBonus = getWarehouseBonus();
  const wInfo = $('warehouseInfo');
  if (wBonus > 0) {
    wInfo.style.display = '';
    wInfo.innerHTML = `<div class="warehouse-bonus-banner">🏭 仓储加成生效中：农田、民宿产出 <b>+${Math.round(wBonus * 100)}%</b></div>`;
  } else {
    wInfo.style.display = 'none';
  }

  const details = $('buildingDetails');
  const bldList = game.buildings.map(b => {
    const cell = game.map[b.idx];
    const bdata = BUILDINGS[b.type];
    const income = getBuildingIncome(cell);
    const bonusTag = (b.type === 'farm' || b.type === 'homestay') && wBonus > 0
      ? ` <span class="bd-warehouse-tag">+${Math.round(wBonus * 100)}%🏭</span>` : '';
    return `
      <div class="building-detail-item">
        <div class="bd-info">
          <div class="bd-name">${bdata.icon} ${bdata.name} Lv.${cell.level} (${cell.x},${cell.y})${bonusTag}</div>
          <div class="bd-stats">人力: ${cell.workers}/${cell.level} · 物资消耗: ${bdata.materialCost}</div>
        </div>
        <div class="bd-output">+${income} 💰/天</div>
      </div>
    `;
  }).join('');
  details.innerHTML = bldList || '<div style="color:#888;padding:20px;text-align:center">还没有建筑，快去地图上建造吧！</div>';
}

function calcDailyIncome() {
  return game.map.reduce((sum, cell) => sum + getBuildingIncome(cell), 0);
}

// ============== 村民界面 ==============
function renderVillagers() {
  const avgHappy = Math.round(game.villagers.reduce((s, v) => s + v.happiness, 0) / game.villagers.length);
  const partRate = Math.round(game.villagers.filter(v => v.participating).length / game.villagers.length * 100);
  $('totalPop').textContent = game.villagers.length;
  $('avgHappy').textContent = avgHappy;
  $('participationRate').textContent = partRate + '%';

  const list = $('villagerList');
  list.innerHTML = game.villagers.map(v => {
    const happyColor = v.happiness >= 70 ? '#43a047' : v.happiness >= 40 ? '#fbc02d' : '#ef5350';
    return `
      <div class="villager-card">
        <div class="villager-avatar">${v.avatar}</div>
        <div class="villager-info">
          <div class="villager-name">${v.name} (${v.gender} · ${v.age}岁)</div>
          <div class="villager-skills">${v.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
          <div class="villager-row">
            <span>满意度</span>
            <span style="color:${happyColor};font-weight:bold">${Math.round(v.happiness)}/100</span>
          </div>
          <div class="villager-happy-bar"><div class="villager-happy-fill" style="width:${v.happiness}%"></div></div>
          <div class="villager-demand">需求: ${v.demand}</div>
          ${v.participating ? '<div class="villager-participate">✓ 积极参与村庄事务</div>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ============== 成果界面 ==============
function renderResults() {
  const dailyInc = game.time.totalDays > 1 ? Math.round(game.stats.totalIncome / (game.time.totalDays - 1)) : 0;
  $('totalIncome').textContent = game.stats.totalIncome;
  $('dailyIncome').textContent = dailyInc;
  $('maxDailyIncome').textContent = game.stats.maxDailyIncome;

  const clinicCount = game.buildings.filter(b => game.map[b.idx].building === 'clinic').length;
  const plazaCount = game.buildings.filter(b => game.map[b.idx].building === 'plaza').length;
  const serviceScore = Math.min(100, clinicCount * 25 + plazaCount * 20 + game.villagers.filter(v => v.happiness >= 70).length * 2);
  $('clinicCount').textContent = clinicCount;
  $('plazaCount').textContent = plazaCount;
  $('serviceScore').textContent = serviceScore;

  $('ecoScore').textContent = Math.round(game.resources.ecoScore);
  $('ecoBar').style.width = game.resources.ecoScore + '%';
  $('ecoIncidents').textContent = game.stats.ecoIncidents;

  const riskDiv = $('riskEvents');
  if (game.stats.riskEvents.length === 0) {
    riskDiv.innerHTML = '暂无风险事件';
  } else {
    riskDiv.innerHTML = game.stats.riskEvents.slice(-5).reverse().map(e =>
      `<div class="risk-item">[${e.date}] ${e.msg}</div>`
    ).join('');
  }

  const evalDiv = $('yearEval');
  if (game.stats.yearEvaluations.length === 0) {
    evalDiv.innerHTML = '暂无年度评价，请先经营至少一年。';
  } else {
    evalDiv.innerHTML = game.stats.yearEvaluations.slice(-3).reverse().map(ev => {
      const subScores = ev.subScores || {};
      const scoreBar = (label, val, max, icon) => {
        const pct = Math.min(100, Math.round(val / max * 100));
        const color = pct >= 70 ? '#43a047' : pct >= 40 ? '#fbc02d' : '#ef5350';
        return `<div class="eval-sub-row">
          <span class="eval-sub-label">${icon} ${label}</span>
          <div class="eval-sub-bar"><div class="eval-sub-fill" style="width:${pct}%;background:${color}"></div></div>
          <span class="eval-sub-val">${val}/${max}</span>
        </div>`;
      };
      return `
        <div class="eval-card">
          <div class="eval-header">
            <span class="eval-year">第 ${ev.year} 年村庄年报</span>
            <span class="eval-total">${ev.score} 分 ${ev.rank}</span>
          </div>
          ${scoreBar('收入', subScores.income || 0, 30, '📈')}
          ${scoreBar('生态', subScores.ecology || 0, 25, '🌿')}
          ${scoreBar('公共服务', subScores.service || 0, 20, '🏥')}
          ${scoreBar('村民满意度', subScores.satisfaction || 0, 15, '😊')}
          ${scoreBar('任务完成', subScores.task || 0, 10, '📋')}
          <div class="eval-comment">${ev.comment}</div>
        </div>
      `;
    }).join('');
  }

  const logDiv = $('historyLog');
  if (game.history.length === 0) {
    logDiv.innerHTML = '<div style="color:#888">暂无历史记录</div>';
  } else {
    logDiv.innerHTML = game.history.map(h =>
      `<div class="log-item"><span class="log-date">[${h.date}]</span>${h.msg}</div>`
    ).join('');
  }
}

// ============== 时间系统 ==============
function nextDay() {
  const dailyInc = calcDailyIncome();
  game.resources.money += dailyInc;
  game.stats.totalIncome += dailyInc;
  if (dailyInc > game.stats.maxDailyIncome) game.stats.maxDailyIncome = dailyInc;
  game.stats.dailyIncomeHistory.push(dailyInc);

  game.resources.materials += Math.floor(game.buildings.length * 0.5 + 1);

  game.tasks.forEach(t => {
    if (t.active && !t.done) {
      t.daysSpent++;
      checkTaskProgress(t);
    }
  });

  const clinics = game.buildings.filter(b => game.map[b.idx].building === 'clinic').length;
  const plazas = game.buildings.filter(b => game.map[b.idx].building === 'plaza').length;
  const clinicBoost = 0.2 * clinics * (clinics >= 2 ? 2 : 1);
  const plazaBoost = 0.3 * plazas * (plazas >= 2 ? 2 : 1);
  game.villagers.forEach(v => {
    let happyDelta = 0;
    if (clinics > 0) happyDelta += clinicBoost;
    if (plazas > 0) happyDelta += plazaBoost;
    if (Math.random() < 0.05) {
      happyDelta += (Math.random() - 0.4) * 3;
    }
    v.happiness = Math.max(0, Math.min(100, v.happiness + happyDelta));
  });

  game.time.day++;
  game.time.totalDays++;
  if (game.time.day > 30) {
    game.time.day = 1;
    game.time.season++;
    if (game.time.season > 3) {
      game.time.season = 0;
      yearEnd();
    }
    addLog(`进入${SEASONS[game.time.season].name}，当前为${SEASONS[game.time.season].cropPhase}`);
  }

  randomEvent();

  if (Math.random() < 0.35) generateRandomTask();

  if (game.resources.ecoScore < 80) game.resources.ecoScore += 0.2;

  renderAll();
}

function randomEvent() {
  const r = Math.random();
  if (r < 0.05) {
    const events = [
      { msg: '遭遇暴雨天气，部分农田受损', eco: -3, money: -500, risk: '暴雨灾害' },
      { msg: '发生山林小火，生态评分下降', eco: -5, money: -300, risk: '山林火情' },
      { msg: '虫害爆发，农作物减产', eco: -2, money: -800, risk: '虫害灾害' },
      { msg: '旅游旺季来临！民宿收入翻倍三天', eco: 0, money: 1000, risk: null, good: true }
    ];
    const ev = events[Math.floor(Math.random() * events.length)];
    game.resources.money = Math.max(0, game.resources.money + ev.money);
    game.resources.ecoScore = Math.max(0, Math.min(100, game.resources.ecoScore + ev.eco));
    if (!ev.good) {
      game.stats.ecoIncidents++;
      game.stats.riskEvents.push({
        date: `第${game.time.year}年${SEASONS[game.time.season].name}`,
        msg: ev.risk || ev.msg
      });
    }
    addLog(ev.msg + (ev.money > 0 ? ` (+${ev.money}💰)` : ev.money < 0 ? ` (${ev.money}💰)` : ''));
    showToast(ev.msg, ev.good ? 'success' : 'warning');
  }
}

function yearEnd() {
  game.time.year++;
  const yearIncome = game.stats.totalIncome - game.stats.yearIncomeStart;
  const eco = Math.round(game.resources.ecoScore);
  const avgHappy = Math.round(game.villagers.reduce((s, v) => s + v.happiness, 0) / game.villagers.length);
  const clinicCount = game.buildings.filter(b => game.map[b.idx].building === 'clinic').length;
  const plazaCount = game.buildings.filter(b => game.map[b.idx].building === 'plaza').length;
  const buildingCount = game.buildings.length;
  const taskDone = game.taskDone;

  const incomeScore = Math.min(30, Math.round(yearIncome / 2000));
  const ecologyScore = Math.min(25, Math.round(eco / 4));
  const serviceScore = Math.min(20, clinicCount * 6 + plazaCount * 5 + Math.min(4, Math.floor(game.villagers.filter(v => v.happiness >= 70).length / 3)));
  const satisfactionScore = Math.min(15, Math.round(avgHappy / 7));
  const taskScore = Math.min(10, taskDone);

  const score = incomeScore + ecologyScore + serviceScore + satisfactionScore + taskScore;

  let rank, comment;
  const weakPoints = [];
  if (incomeScore < 15) weakPoints.push('收入偏低');
  if (ecologyScore < 12) weakPoints.push('生态欠佳');
  if (serviceScore < 10) weakPoints.push('公共服务不足');
  if (satisfactionScore < 8) weakPoints.push('村民满意度偏低');
  if (taskScore < 5) weakPoints.push('任务完成较少');

  if (score >= 85) { rank = '🌟 示范村'; comment = '优秀！村庄在经济、生态、民生各方面都取得卓越成就，成为周边学习的榜样。'; }
  else if (score >= 70) { rank = '👍 先进村'; comment = '表现出色，继续保持良好发展势头，村民满意度和生态环境都很不错。'; }
  else if (score >= 50) { rank = '✅ 达标村'; comment = '稳步发展，在产业发展和环境治理方面还有提升空间。'; }
  else if (score >= 30) { rank = '⚠️ 待改善'; comment = '发展较为缓慢，建议重点关注产业建设和村民需求，提升整体发展水平。'; }
  else { rank = '❌ 落后村'; comment = '发展遇到较大困难，需要重新规划发展路径，关注民生和生态保护。'; }

  if (weakPoints.length > 0) {
    comment += ` 主要短板: ${weakPoints.join('、')}。`;
  }

  game.stats.yearEvaluations.push({
    year: game.time.year - 1, score, rank, comment,
    subScores: {
      income: incomeScore,
      ecology: ecologyScore,
      service: serviceScore,
      satisfaction: satisfactionScore,
      task: taskScore
    }
  });
  addLog(`===== 第${game.time.year - 1}年结束，综合评分: ${score}分 ${rank} =====`);
  showToast(`第${game.time.year - 1}年评价: ${score}分 ${rank}`, 'info', 4000);

  game.stats.yearIncomeStart = game.stats.totalIncome;

  if (avgHappy >= 70 && game.villagers.length < game.resources.laborMax) {
    if (Math.random() < 0.6) {
      const newVillagers = generateVillagers(1);
      newVillagers[0].id = game.villagers.length + 1;
      game.villagers.push(newVillagers[0]);
      game.resources.labor++;
      addLog(`新村民 ${newVillagers[0].name} 迁入村庄！`);
    }
  }
}

// ============== 顶栏数据 ==============
function renderTopbar() {
  $('yearLabel').textContent = `第 ${game.time.year} 年`;
  $('seasonLabel').textContent = SEASONS[game.time.season].icon + ' ' + SEASONS[game.time.season].name;
  $('dayLabel').textContent = `第 ${game.time.day} 天`;
  $('qMoney').textContent = game.resources.money;
  $('qLabor').textContent = game.resources.labor;
  const avgHappy = Math.round(game.villagers.reduce((s, v) => s + v.happiness, 0) / game.villagers.length);
  $('qHappy').textContent = avgHappy;
  $('qEco').textContent = Math.round(game.resources.ecoScore);
}

// ============== 总渲染 ==============
function renderAll() {
  renderTopbar();
  renderMap();
  renderTasks();
  renderResources();
  renderVillagers();
  renderResults();
}

// ============== 初始化 ==============
function initEvents() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });
  document.querySelectorAll('.build-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      game.selectedBuilding = btn.dataset.building;
      closeSidebar();
    };
  });
  $('nextDayBtn').onclick = nextDay;
  $('saveBtn').onclick = saveGame;
  $('loadBtn').onclick = () => { if (loadGame()) renderAll(); };
  $('newGameBtn').onclick = () => {
    showModal('新游戏', '确定要开始新游戏吗？当前进度将丢失。', () => {
      game = createNewGame();
      generateRandomTask();
      generateRandomTask();
      renderAll();
      showToast('新游戏开始！祝你建设成功！', 'success');
    });
  };
  $('mapGrid').addEventListener('click', (e) => {
    if (!e.target.closest('.map-cell')) closeSidebar();
  });
}

function startGame() {
  initEvents();
  if (hasSave()) {
    showModal('发现存档', '检测到之前的游戏存档，是否继续游戏？',
      () => { if (loadGame()) renderAll(); },
      () => { game = createNewGame(); generateRandomTask(); generateRandomTask(); renderAll(); }
    );
  } else {
    game = createNewGame();
    generateRandomTask();
    generateRandomTask();
    renderAll();
  }
}

window.adjustWorkers = adjustWorkers;
window.acceptTask = acceptTask;
window.upgradeBuilding = upgradeBuilding;
window.closeSidebar = closeSidebar;

document.addEventListener('DOMContentLoaded', startGame);
