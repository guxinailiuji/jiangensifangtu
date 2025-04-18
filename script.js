// 全局变量
let currentPrice = 84523.40;
let centerPrice = 84000;
let stepValue = 500;
let rings = 5;
let gannData = [];

// DOM元素
const themeToggle = document.getElementById('theme-toggle');
const refreshBtn = document.getElementById('refresh-btn');
const centerPriceInput = document.getElementById('center-price');
const stepValueInput = document.getElementById('step-value');
const ringsSelect = document.getElementById('rings');
const applySettingsBtn = document.getElementById('apply-settings');
const gannSquareContainer = document.getElementById('gann-square');
const currentPriceElement = document.getElementById('current-price');
const priceChangeElement = document.getElementById('price-change');
const marketCapElement = document.getElementById('market-cap');
const volumeElement = document.getElementById('volume');
const updateTimeElement = document.getElementById('update-time');
const resistanceLevelsElement = document.getElementById('resistance-levels');
const supportLevelsElement = document.getElementById('support-levels');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检测系统主题
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
    }
    
    // 事件监听
    themeToggle.addEventListener('click', toggleTheme);
    refreshBtn.addEventListener('click', refreshData);
    applySettingsBtn.addEventListener('click', applySettings);
    
    // 初始化江恩四方图
    initializeGannSquare();
    
    // 加载初始数据
    refreshData();
});

// 切换主题
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
}

// 刷新数据
function refreshData() {
    // 显示加载状态
    refreshBtn.innerHTML = '<span class="loading"></span> 加载中...';
    refreshBtn.disabled = true;
    
    // 获取比特币数据
    fetchBitcoinData()
        .then(data => {
            // 更新全局当前价格
            currentPrice = data.price;
            
            // 更新UI显示
            currentPriceElement.textContent = formatPrice(data.price);
            priceChangeElement.textContent = formatPercentChange(data.percentChange);
            marketCapElement.textContent = formatLargeNumber(data.marketCap);
            volumeElement.textContent = formatLargeNumber(data.volume);
            updateTimeElement.textContent = formatDateTime(data.lastUpdated);
            
            // 设置价格变化的颜色
            if (data.percentChange >= 0) {
                priceChangeElement.classList.remove('text-red-500');
                priceChangeElement.classList.add('text-green-500');
            } else {
                priceChangeElement.classList.remove('text-green-500');
                priceChangeElement.classList.add('text-red-500');
            }
            
            // 更新江恩四方图
            updateGannSquare();
            
            // 更新支撑和阻力位
            updateSupportAndResistance();
        })
        .catch(error => {
            console.error('获取数据失败:', error);
            alert('获取数据失败，请稍后再试');
        })
        .finally(() => {
            // 恢复按钮状态
            refreshBtn.innerHTML = '<i class="icon-refresh-cw"></i><span>刷新数据</span>';
            refreshBtn.disabled = false;
        });
}

// 应用设置
function applySettings() {
    // 获取设置值
    centerPrice = parseFloat(centerPriceInput.value);
    stepValue = parseFloat(stepValueInput.value);
    rings = parseInt(ringsSelect.value);
    
    // 验证输入
    if (isNaN(centerPrice) || isNaN(stepValue) || isNaN(rings)) {
        alert('请输入有效的数值');
        return;
    }
    
    // 更新江恩四方图
    updateGannSquare();
    
    // 更新支撑和阻力位
    updateSupportAndResistance();
}

// 初始化江恩四方图
function initializeGannSquare() {
    // 设置初始值
    centerPriceInput.value = centerPrice;
    stepValueInput.value = stepValue;
    ringsSelect.value = rings;
    
    // 生成初始数据
    gannData = generateGannSquareData(centerPrice, stepValue, rings);
    
    // 渲染图表
    renderGannSquare();
}

// 更新江恩四方图
function updateGannSquare() {
    // 生成新数据
    gannData = generateGannSquareData(centerPrice, stepValue, rings);
    
    // 渲染图表
    renderGannSquare();
}

// 渲染江恩四方图
function renderGannSquare() {
    // 清空容器
    gannSquareContainer.innerHTML = '';
    
    // 获取图表大小
    const size = gannData.length;
    const center = Math.floor(size / 2);
    
    // 计算单元格大小 (根据容器大小动态计算)
    const cellSize = 80;
    
    // 设置容器大小
    gannSquareContainer.style.width = `${size * cellSize}px`;
    gannSquareContainer.style.height = `${size * cellSize}px`;
    
    // 渲染单元格
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const cellValue = gannData[row][col];
            
            // 跳过空单元格
            if (cellValue === null) continue;
            
            // 创建单元格元素
            const cell = document.createElement('div');
            cell.className = 'gann-cell';
            cell.textContent = formatPrice(cellValue, 0);
            
            // 设置单元格位置和大小
            cell.style.top = `${row * cellSize}px`;
            cell.style.left = `${col * cellSize}px`;
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            
            // 添加特殊样式
            if (row === center && col === center) {
                // 中心点
                cell.classList.add('gann-cell-center');
            } else if (Math.abs(cellValue - currentPrice) < stepValue / 2) {
                // 接近当前价格
                cell.classList.add('gann-cell-current');
            } else if (row === center) {
                // 水平线
                cell.classList.add('gann-cell-horizontal');
            } else if (col === center) {
                // 垂直线
                cell.classList.add('gann-cell-vertical');
            }
            
            // 检查是否在对角线上
            const { onDiagonal1, onDiagonal2 } = isOnDiagonal(row, col, size);
            if (onDiagonal1) {
                cell.classList.add('gann-cell-diagonal-1');
            }
            if (onDiagonal2) {
                cell.classList.add('gann-cell-diagonal-2');
            }
            
            // 添加到容器
            gannSquareContainer.appendChild(cell);
        }
    }
}

// 更新支撑和阻力位
function updateSupportAndResistance() {
    // 获取支撑和阻力位
    const levels = getSupportAndResistanceLevels(gannData, currentPrice);
    
    // 更新阻力位
    resistanceLevelsElement.innerHTML = '';
    levels.resistance.forEach((price, index) => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded';
        li.innerHTML = `
            <span class="font-medium">R${index + 1}</span>
            <span class="font-geist-mono">${formatPrice(price, 0)}</span>
        `;
        resistanceLevelsElement.appendChild(li);
    });
    
    // 更新支撑位
    supportLevelsElement.innerHTML = '';
    levels.support.forEach((price, index) => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded';
        li.innerHTML = `
            <span class="font-medium">S${index + 1}</span>
            <span class="font-geist-mono">${formatPrice(price, 0)}</span>
        `;
        supportLevelsElement.appendChild(li);
    });
}
