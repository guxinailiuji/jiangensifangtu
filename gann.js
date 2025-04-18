class GannSquare {
    constructor(options) {
        this.options = {
            symbol: options.symbol || 'BTCUSDT',
            timeframe: options.timeframe || '1d',
            centerPrice: options.centerPrice || 84000,
            stepValue: options.stepValue || 500,
            rings: options.rings || 5,
            predictionDate: options.predictionDate || new Date()
        };
        
        this.container = document.getElementById('gann-square');
        this.gridLayer = document.getElementById('gann-grid');
        this.datesLayer = document.getElementById('gann-dates');
        this.pricesLayer = document.getElementById('gann-prices');
        this.trendsLayer = document.getElementById('gann-trends');
        
        this.currentDate = document.getElementById('current-date');
        this.trendDirection = document.getElementById('trend-direction');
        
        // 预测结果显示元素
        this.keyDates = document.getElementById('key-dates');
        this.priceTargets = document.getElementById('price-targets');
        this.trendChanges = document.getElementById('trend-changes');
    }

    async initialize() {
        await this.fetchData();
        this.drawGrid();
        this.drawDates();
        this.drawPrices();
        this.drawTrends();
        this.updateInfo();
        this.calculatePredictions();
    }

    async fetchData() {
        const now = new Date();
        const timeframeInMinutes = {
            '15m': 15,
            '1h': 60,
            '4h': 240,
            '1d': 1440
        }[this.options.timeframe];

        // 生成日期和价格数据
        const totalPoints = this.options.rings * 2 + 1;
        const centerIndex = this.options.rings;
        
        this.data = {
            prices: Array.from({ length: totalPoints }, (_, i) => {
                return this.options.centerPrice + (centerIndex - i) * this.options.stepValue;
            }),
            dates: Array.from({ length: totalPoints }, (_, i) => {
                const date = new Date(now);
                const offset = (i - centerIndex) * timeframeInMinutes;
                date.setMinutes(date.getMinutes() + offset);
                return date;
            }),
            trends: this.generateTrends(totalPoints)
        };
    }

    generateTrends(totalPoints) {
        // 生成示例趋势数据
        return Array.from({ length: totalPoints }, (_, i) => {
            const random = Math.random();
            if (random < 0.4) return 'up';
            if (random < 0.8) return 'down';
            return 'neutral';
        });
    }

    drawGrid() {
        const size = this.container.clientWidth;
        const cellSize = size / (this.options.rings * 2 + 1);
        
        let html = '';
        const center = this.options.rings;
        
        // 绘制基础网格
        for (let i = 0; i <= this.options.rings * 2 + 1; i++) {
            for (let j = 0; j <= this.options.rings * 2 + 1; j++) {
                const isCenter = i === center && j === center;
                const isMainAxis = i === center || j === center;
                const isDiagonal = i === j || i + j === this.options.rings * 2;
                
                const cellClass = isCenter ? 'bg-yellow-100 dark:bg-yellow-900' :
                                isMainAxis ? 'bg-gray-50 dark:bg-gray-800' :
                                isDiagonal ? 'bg-blue-50 dark:bg-blue-900/20' : '';

                // 计算该格子的价格
                const priceIndex = i;
                const price = this.data.prices[priceIndex];
                const trend = this.data.trends[priceIndex];
                const trendColor = trend === 'up' ? 'text-green-500' : 
                                 trend === 'down' ? 'text-red-500' : 
                                 'text-gray-500';
                
                html += `
                    <div class="absolute border border-gray-200 dark:border-gray-700 ${cellClass} flex flex-col justify-center items-center"
                         style="left: ${j * cellSize}px; top: ${i * cellSize}px; width: ${cellSize}px; height: ${cellSize}px;">
                        <span class="text-[10px] ${trendColor}">$${price ? price.toLocaleString() : ''}</span>
                    </div>`;
            }
        }

        // 添加主轴线
        html += `
            <div class="absolute border-b-2 border-blue-500" style="left: 0; right: 0; top: ${center * cellSize}px;"></div>
            <div class="absolute border-r-2 border-blue-500" style="top: 0; bottom: 0; left: ${center * cellSize}px;"></div>
        `;

        // 添加对角线
        const diagonalLength = size * Math.sqrt(2);
        html += `
            <div class="absolute border-t-2 border-blue-500 origin-top-left rotate-45" 
                 style="left: 0; top: 0; width: ${diagonalLength}px;"></div>
            <div class="absolute border-t-2 border-blue-500 origin-top-right -rotate-45" 
                 style="right: 0; top: 0; width: ${diagonalLength}px;"></div>
        `;

        this.gridLayer.innerHTML = html;
    }

    drawDates() {
        const size = this.container.clientWidth;
        const cellSize = size / (this.options.rings * 2 + 1);
        let html = '';

        this.data.dates.forEach((date, i) => {
            const formatDate = (date) => {
                return {
                    dateStr: date.toLocaleDateString('zh-CN', {
                        month: 'numeric',
                        day: 'numeric'
                    }),
                    timeStr: date.toLocaleTimeString('zh-CN', {
                        hour: 'numeric',
                        minute: 'numeric'
                    })
                };
            };

            const {dateStr, timeStr} = formatDate(date);
            const trend = this.data.trends[i];
            const trendColor = trend === 'up' ? 'text-green-500' : 
                             trend === 'down' ? 'text-red-500' : 
                             'text-gray-500';

            // 对角线日期
            if (i === i) {
                html += `
                    <div class="absolute text-xs ${trendColor} transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" 
                         style="left: ${i * cellSize}px; top: ${i * cellSize}px;">
                        <span class="font-medium">${dateStr}</span>
                        <span class="text-[10px]">${timeStr}</span>
                    </div>`;
            }

            // 顶部日期
            html += `
                <div class="absolute text-xs ${trendColor} transform -translate-y-full pl-1" 
                     style="left: ${i * cellSize}px; top: 0;">
                    <span class="text-[10px]">${dateStr} ${timeStr}</span>
                </div>`;

            // 左侧日期
            html += `
                <div class="absolute text-xs ${trendColor} transform -translate-x-full pr-2" 
                     style="left: 0; top: ${i * cellSize}px;">
                    <span class="text-[10px]">${dateStr} ${timeStr}</span>
                </div>`;
        });

        this.datesLayer.innerHTML = html;
    }

    drawPrices() {
        const size = this.container.clientWidth;
        const cellSize = size / (this.options.rings * 2 + 1);
        let html = '';

        // 左侧价格标尺
        this.data.prices.forEach((price, i) => {
            const trend = this.data.trends[i];
            const trendColor = trend === 'up' ? 'text-green-500' : 
                             trend === 'down' ? 'text-red-500' : 
                             'text-gray-500';

            html += `
                <div class="absolute text-xs font-medium ${trendColor} transform -translate-x-full pr-2 flex items-center" 
                     style="left: 0; top: ${i * cellSize}px; height: ${cellSize}px;">
                    $${price.toLocaleString()}
                </div>`;
        });

        // 顶部价格标尺
        this.data.prices.forEach((price, i) => {
            const trend = this.data.trends[i];
            const trendColor = trend === 'up' ? 'text-green-500' : 
                             trend === 'down' ? 'text-red-500' : 
                             'text-gray-500';

            html += `
                <div class="absolute text-xs font-medium ${trendColor} transform -translate-y-full pb-1 flex justify-center" 
                     style="left: ${i * cellSize}px; top: 0; width: ${cellSize}px;">
                    $${price.toLocaleString()}
                </div>`;
        });

        this.pricesLayer.innerHTML = html;
    }

    drawTrends() {
        const size = this.container.clientWidth;
        const cellSize = size / (this.options.rings * 2 + 1);
        let html = '';

        for (let i = 0; i < this.data.trends.length; i++) {
            for (let j = 0; j < this.data.trends.length; j++) {
                const trend = this.data.trends[Math.floor((i + j) / 2)];
                const color = trend === 'up' ? 'bg-green-500' : 
                             trend === 'down' ? 'bg-red-500' : 
                             'bg-gray-300';

                html += `
                    <div class="absolute ${color} opacity-5" 
                         style="left: ${j * cellSize}px; top: ${i * cellSize}px; width: ${cellSize}px; height: ${cellSize}px;">
                    </div>`;
            }
        }

        this.trendsLayer.innerHTML = html;
    }

    updateInfo() {
        const now = new Date();
        this.currentDate.textContent = now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        });
        this.trendDirection.textContent = '上升';
        this.trendDirection.className = 'font-medium text-green-500';
    }

    calculatePredictions() {
        const predictionDate = new Date(this.options.predictionDate);
        const now = new Date();
        const diffDays = Math.floor((predictionDate - now) / (1000 * 60 * 60 * 24));
        
        // 根据江恩理论计算关键时间点
        const keyDates = this.calculateKeyDates(predictionDate);
        const priceTargets = this.calculatePriceTargets();
        const trendChanges = this.calculateTrendChanges(keyDates);

        // 更新显示
        this.updatePredictionDisplay(keyDates, priceTargets, trendChanges);
    }

    calculateKeyDates(baseDate) {
        const dates = [];
        const gannNumbers = [144, 90, 52, 28, 21, 14, 9, 7]; // 江恩关键数字

        gannNumbers.forEach(days => {
            const futureDate = new Date(baseDate);
            futureDate.setDate(futureDate.getDate() + days);
            dates.push({
                date: futureDate,
                days: days
            });
        });

        return dates;
    }

    calculatePriceTargets() {
        const basePrice = this.options.centerPrice;
        const targets = [];
        const gannAngles = [1, 2, 3, 4, 6, 8]; // 江恩角度

        gannAngles.forEach(angle => {
            const upTarget = basePrice * (1 + angle / 8);
            const downTarget = basePrice * (1 - angle / 8);
            targets.push({
                angle: angle,
                up: upTarget,
                down: downTarget
            });
        });

        return targets;
    }

    calculateTrendChanges(keyDates) {
        const changes = [];
        keyDates.forEach(({date, days}) => {
            const trend = days % 2 === 0 ? '上升' : '下降';
            changes.push({
                date: date,
                trend: trend,
                strength: Math.min(5, Math.ceil(days / 28)) // 1-5的强度等级
            });
        });
        return changes;
    }

    updatePredictionDisplay(keyDates, priceTargets, trendChanges) {
        // 显示关键时间点
        this.keyDates.innerHTML = keyDates.map(({date, days}) => `
            <div class="flex justify-between items-center text-sm">
                <span>${date.toLocaleDateString('zh-CN')}:</span>
                <span class="text-blue-500">${days}天</span>
            </div>
        `).join('');

        // 显示价格目标
        this.priceTargets.innerHTML = priceTargets.map(({angle, up, down}) => `
            <div class="flex justify-between items-center text-sm">
                <span>${angle}×1/8:</span>
                <span class="text-green-500">$${up.toLocaleString()}</span>
                <span class="text-red-500">$${down.toLocaleString()}</span>
            </div>
        `).join('');

        // 显示趋势变化
        this.trendChanges.innerHTML = trendChanges.map(({date, trend, strength}) => `
            <div class="flex justify-between items-center text-sm">
                <span>${date.toLocaleDateString('zh-CN')}:</span>
                <span class="${trend === '上升' ? 'text-green-500' : 'text-red-500'}">
                    ${trend} ${'★'.repeat(strength)}
                </span>
            </div>
        `).join('');
    }
}

// 初始化和事件处理
document.addEventListener('DOMContentLoaded', () => {
    // 设置预测日期输入框的默认值为当前时间
    const now = new Date();
    const predictionDateInput = document.getElementById('prediction-date');
    predictionDateInput.value = now.toISOString().slice(0, 16);

    const gannSquare = new GannSquare({
        symbol: document.getElementById('symbol').value,
        timeframe: document.getElementById('timeframe').value,
        centerPrice: parseFloat(document.getElementById('center-price').value),
        stepValue: parseFloat(document.getElementById('step-value').value),
        rings: parseInt(document.getElementById('rings').value),
        predictionDate: new Date(predictionDateInput.value)
    });
    
    gannSquare.initialize();

    // 监听配置变化
    document.getElementById('apply-settings').addEventListener('click', () => {
        const predictionDate = new Date(document.getElementById('prediction-date').value);
        
        const newOptions = {
            symbol: document.getElementById('symbol').value,
            timeframe: document.getElementById('timeframe').value,
            centerPrice: parseFloat(document.getElementById('center-price').value),
            stepValue: parseFloat(document.getElementById('step-value').value),
            rings: parseInt(document.getElementById('rings').value),
            predictionDate: predictionDate
        };
        
        const newGannSquare = new GannSquare(newOptions);
        newGannSquare.initialize();
    });
}); 