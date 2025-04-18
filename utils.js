/**
 * 格式化价格显示
 * @param {number} price - 价格
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的价格
 */
function formatPrice(price, decimals = 2) {
    return '$' + Number(price).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * 格式化百分比变化
 * @param {number} change - 变化百分比
 * @returns {string} 格式化后的百分比
 */
function formatPercentChange(change) {
    const sign = change >= 0 ? '+' : '';
    return sign + change.toFixed(2) + '%';
}

/**
 * 格式化大数字（如市值、交易量）
 * @param {number} value - 数值
 * @returns {string} 格式化后的数值
 */
function formatLargeNumber(value) {
    if (value >= 1e12) {
        return '$' + (value / 1e12).toFixed(2) + 'T';
    } else if (value >= 1e9) {
        return '$' + (value / 1e9).toFixed(2) + 'B';
    } else if (value >= 1e6) {
        return '$' + (value / 1e6).toFixed(2) + 'M';
    } else {
        return '$' + value.toLocaleString();
    }
}

/**
 * 格式化日期时间
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期时间
 */
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 生成江恩四方图数据
 * @param {number} centerPrice - 中心价格
 * @param {number} stepValue - 步长值
 * @param {number} rings - 环数
 * @returns {Array} 江恩四方图数据
 */
function generateGannSquareData(centerPrice, stepValue, rings) {
    // 计算图表维度
    const size = rings * 2 + 1;
    const center = rings;
    
    // 初始化图表数据
    const data = Array(size).fill().map(() => Array(size).fill(null));
    
    // 设置中心价格
    data[center][center] = centerPrice;
    
    // 螺旋方向: 右、下、左、上
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    
    let x = center;
    let y = center;
    let dir = 0; // 初始方向：向右
    
    // 当前价格 = 中心价格
    let currentPrice = centerPrice;
    
    // 每个方向的步数
    let steps = 1;
    
    // 环数计数
    let ringCount = 0;
    
    while (ringCount < rings) {
        // 每完成两个方向，步数增加
        for (let i = 0; i < 2; i++) {
            // 按当前方向移动
            for (let step = 0; step < steps; step++) {
                // 更新坐标
                x += directions[dir][0];
                y += directions[dir][1];
                
                // 检查是否在图表范围内
                if (x >= 0 && x < size && y >= 0 && y < size) {
                    // 更新价格
                    currentPrice += stepValue;
                    
                    // 设置单元格价格
                    data[x][y] = currentPrice;
                }
            }
            
            // 更改方向 (0->1->2->3->0)
            dir = (dir + 1) % 4;
        }
        
        // 增加步数
        steps++;
        
        // 计数环数
        ringCount++;
    }
    
    return data;
}

/**
 * 获取支撑和阻力位
 * @param {Array} gannData - 江恩四方图数据
 * @param {number} currentPrice - 当前价格
 * @returns {Object} 支撑和阻力位
 */
function getSupportAndResistanceLevels(gannData, currentPrice) {
    const size = gannData.length;
    const center = Math.floor(size / 2);
    
    // 获取水平线、垂直线和对角线价格
    const horizontalLine = gannData[center];
    const verticalLine = gannData.map(row => row[center]);
    
    // 获取对角线1 (左上到右下)
    const diagonal1 = [];
    for (let i = 0; i < size; i++) {
        if (i < size && i < size) {
            diagonal1.push(gannData[i][i]);
        }
    }
    
    // 获取对角线2 (右上到左下)
    const diagonal2 = [];
    for (let i = 0; i < size; i++) {
        if (i < size && size - 1 - i < size) {
            diagonal2.push(gannData[i][size - 1 - i]);
        }
    }
    
    // 将所有价格合并
    const allPrices = [
        ...horizontalLine, 
        ...verticalLine, 
        ...diagonal1, 
        ...diagonal2
    ].filter(price => price !== null);
    
    // 按价格排序
    allPrices.sort((a, b) => a - b);
    
    // 去除重复价格
    const uniquePrices = [...new Set(allPrices)];
    
    // 找出支撑位 (低于当前价格的3个最高价)
    const supportLevels = uniquePrices
        .filter(price => price < currentPrice)
        .slice(-3)
        .reverse();
    
    // 找出阻力位 (高于当前价格的3个最低价)
    const resistanceLevels = uniquePrices
        .filter(price => price > currentPrice)
        .slice(0, 3);
    
    return {
        support: supportLevels,
        resistance: resistanceLevels
    };
}

/**
 * 判断点是否在对角线上
 * @param {number} row - 行索引
 * @param {number} col - 列索引
 * @param {number} size - 图表大小
 * @returns {Object} 对角线信息
 */
function isOnDiagonal(row, col, size) {
    const center = Math.floor(size / 2);
    
    // 判断是否在对角线1上 (左上到右下)
    const onDiagonal1 = row === col;
    
    // 判断是否在对角线2上 (右上到左下)
    const onDiagonal2 = row + col === size - 1;
    
    return { onDiagonal1, onDiagonal2 };
}

/**
 * 模拟从API获取比特币数据
 * @returns {Promise} 比特币数据
 */
function fetchBitcoinData() {
    // 实际应用中，这里应该是真实的API调用
    return new Promise((resolve) => {
        setTimeout(() => {
            // 模拟数据，实际应用需要替换为真实API调用
            const mockData = {
                price: 84523.40 + (Math.random() * 2000 - 1000),
                percentChange: 0.59 + (Math.random() * 2 - 1),
                marketCap: 1.67e12 + (Math.random() * 1e11),
                volume: 18.71e9 + (Math.random() * 1e9),
                lastUpdated: new Date()
            };
            resolve(mockData);
        }, 1000);
    });
}
