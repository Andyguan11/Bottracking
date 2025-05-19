import { createNoise3D } from 'https://cdn.jsdelivr.net/npm/simplex-noise@4.0.1/dist/esm/simplex-noise.js';

// Helper functions that were not defined in the original script
function rand(max) {
  return Math.random() * max;
}

function round(value) {
  return Math.round(value);
}

function fadeInOut(life, ttl) {
  const progress = life / ttl;
  return Math.sin(progress * Math.PI); // Fades in and out smoothly
}

('use strict');

const rayCount = 500;
const rayPropCount = 8;
const rayPropsLength = rayCount * rayPropCount;
const baseLength = 200;
const rangeLength = 200;
const baseSpeed = 0.05;
const rangeSpeed = 0.1;
const baseWidth = 10;
const rangeWidth = 20;
const baseHue = 320; // Changed from 120 (green) to 320 (pinkish/magenta)
const rangeHue = 40; // Adjusted range for pink variation
const baseTTL = 50;
const rangeTTL = 100;
const noiseStrength = 100;
const xOff = 0.0015;
const yOff = 0.0015;
const zOff = 0.0015;
const backgroundColor = 'hsla(220,60%,3%,1)'; // Reverted to fully opaque

let container;
let canvas;
let ctx;
let center;
let tick;
let simplex; // This will be an instance of the noise function
let rayProps;

function setup() {
	createCanvas();
  resize();
  initRays();
	draw();
}

function initRays() {
  tick = 0;
  simplex = createNoise3D(); // Initialize simplex noise
  rayProps = new Float32Array(rayPropsLength);

  let i;

  for (i = 0; i < rayPropsLength; i += rayPropCount) {
    initRay(i);
  }
}

function initRay(i) {
  let length, x, y1, y2, n, life, ttl, width, speed, hue;

  length = baseLength + rand(rangeLength);
  x = rand(canvas.a.width);
  y1 = center[1] + noiseStrength;
  y2 = center[1] + noiseStrength - length;
  // Use the simplex noise function correctly
  n = simplex(x * xOff, y1 * yOff, tick * zOff) * noiseStrength;
  y1 += n;
  y2 += n;
  life = 0;
  ttl = baseTTL + rand(rangeTTL);
  width = baseWidth + rand(rangeWidth);
  speed = baseSpeed + rand(rangeSpeed) * (round(rand(1)) ? 1 : -1);
  hue = baseHue + rand(rangeHue);

  rayProps.set([x, y1, y2, life, ttl, width, speed, hue], i);
}

function drawRays() {
  let i;

  for (i = 0; i < rayPropsLength; i += rayPropCount) {
    updateRay(i);
  }
}

function updateRay(i) {
  let i2=1+i, i3=2+i, i4=3+i, i5=4+i, i6=5+i, i7=6+i, i8=7+i;
  let x, y1, y2, life, ttl, width, speed, hue;

  x = rayProps[i];
  y1 = rayProps[i2];
  y2 = rayProps[i3];
  life = rayProps[i4];
  ttl = rayProps[i5];
  width = rayProps[i6];
  speed = rayProps[i7];
  hue = rayProps[i8];

  drawRay(x, y1, y2, life, ttl, width, hue);

  x += speed;
  life++;

  rayProps[i] = x;
  rayProps[i4] = life;

  (checkBounds(x) || life > ttl) && initRay(i);
}

function drawRay(x, y1, y2, life, ttl, width, hue) {
  let gradient;

  gradient = ctx.a.createLinearGradient(x, y1, x, y2);
  gradient.addColorStop(0, `hsla(${hue},100%,10%,0)`);
  gradient.addColorStop(0.5, `hsla(${hue},100%,10%,${fadeInOut(life, ttl)})`);
  gradient.addColorStop(1, `hsla(${hue},100%,10%,0)`);

  ctx.a.save();
  ctx.a.beginPath();
  ctx.a.strokeStyle = gradient;
  ctx.a.lineWidth = width;
  ctx.a.moveTo(x, y1);
  ctx.a.lineTo(x, y2);
  ctx.a.stroke();
  ctx.a.closePath();
  ctx.a.restore();
}

function checkBounds(x) {
  return x < 0 || x > canvas.a.width;
}

function createCanvas() {
  // container = document.querySelector('.content--canvas'); // Container div already exists for styling if needed
                                                          // but the canvas is appended to body directly with fixed position
	canvas = {
		a: document.createElement('canvas'),
		b: document.createElement('canvas')
	};
    // Apply styles from CSS to canvas.b, or do it here.
    // For simplicity, direct styling is kept, but can be moved to CSS.
	canvas.b.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
        z-index: -1; /* Ensure it's behind .dashboard-content */
	`;
	document.body.appendChild(canvas.b); // Append to body to ensure it's there
	ctx = {
		a: canvas.a.getContext('2d'),
		b: canvas.b.getContext('2d')
  };
  center = [];
}

function resize() {
	const { innerWidth, innerHeight } = window;
	
	canvas.a.width = innerWidth;
  canvas.a.height = innerHeight;

  // If canvas.b is visible and styled, we might not need to drawImage from a to b then b to a.
  // This complex swapping is often for effects or double buffering that might be simplified.
  // However, retaining original logic for now.
  if (canvas.b.width > 0 && canvas.b.height > 0) { // Check if canvas.b has dimensions
    ctx.a.drawImage(canvas.b, 0, 0);
  }


	canvas.b.width = innerWidth;
  canvas.b.height = innerHeight;
  
  if (canvas.a.width > 0 && canvas.a.height > 0) { // Check if canvas.a has dimensions
    ctx.b.drawImage(canvas.a, 0, 0);
  }


  center[0] = 0.5 * canvas.a.width;
  center[1] = 0.5 * canvas.a.height;
}

function render() {
  ctx.b.save();
  // The blur filter can be performance-intensive.
  // Consider if it's essential or if there are alternatives.
  ctx.b.filter = 'blur(12px)'; 
  // 'lighter' is an alias for 'lighter'. Using 'lighter' for clarity.
  ctx.a.globalCompositeOperation = 'lighter'; 
  ctx.b.drawImage(canvas.a, 0, 0);
  ctx.b.restore();
}

function draw() {
  if (!canvas || canvas.b.width === 0 || canvas.b.height === 0) {
    console.error('Aurora canvas not ready or dimensions are zero in draw().');
    // No point in drawing if canvas is not set up
    // window.requestAnimationFrame(draw); // Optionally retry, or handle error
    return; 
  }
  tick++;
  ctx.a.clearRect(0, 0, canvas.a.width, canvas.a.height);
  ctx.b.fillStyle = backgroundColor;
  // console.log('Setting background for Aurora:', backgroundColor); // For debugging
  ctx.b.fillRect(0, 0, canvas.b.width, canvas.b.height); 
  drawRays();
  render();

	window.requestAnimationFrame(draw);
}

// --- Google Sheet Data Integration ---
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeUWaegESHmsay2graosbwcJmNng7pNOsQtkPoVru3UgIdrWGUTkC2wizf0mqc6cFPl2D0gw-x0siX/pub?gid=11066945&single=true&output=csv';
const DATA_REFRESH_INTERVAL = 30000; // 30 seconds

let originalData = []; // Store the full dataset

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim());
        if (values.length === headers.length) {
            const entry = {};
            headers.forEach((header, index) => {
                let key = header.replace(/\s*\(.*?\)|\$|\%|\//g, '').replace(/\s+/g, '_');
                if (key.toLowerCase().startsWith('avg_max_drawdown')) key = 'Avg_Max_Drawdown';
                else if (key.toLowerCase().startsWith('total_trades')) key = 'Total_Trades';
                else if (key.toLowerCase().startsWith('total_net_p&l')) key = 'Total_Net_PL';
                else if (key.toLowerCase().startsWith('bot_name')) key = 'Bot_Name';
                else if (key.toLowerCase().startsWith('avg_profit_factor')) key = 'Avg_Profit_Factor';
                else if (key.toLowerCase().startsWith('avg_win_rate')) key = 'Avg_Win_Rate';
                else if (key.toLowerCase().startsWith('avg_sharpe_reported')) key = 'Avg_Sharpe';
                else if (key.toLowerCase().startsWith('ratio_avg_win_loss')) key = 'Ratio_Avg_Win_Loss';
                entry[key] = values[index];
            });
            data.push(entry);
        }
    }
    return data;
}

// Order of columns for display in each row
const columnOrder = ['Bot_Name', 'Avg_Profit_Factor', 'Avg_Win_Rate', 'Total_Net_PL', 'Avg_Max_Drawdown', 'Total_Trades', 'Avg_Sharpe', 'Ratio_Avg_Win_Loss'];

function createDataRow(botData) {
    const row = document.createElement('div');
    row.className = 'data-row';

    columnOrder.forEach(key => {
        const cell = document.createElement('div');
        cell.className = 'data-cell';
        if (key === 'Bot_Name') {
            cell.classList.add('bot-name-cell');
        }
        cell.textContent = botData[key] || 'N/A';
        cell.title = botData[key] || 'N/A'; // Tooltip for truncated text
        row.appendChild(cell);
    });
    return row;
}

function applyFiltersAndDisplay() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

    const maxDrawdownFilter = parseFloat(document.getElementById('filter-max-drawdown').value) || null;
    const totalTradesFilter = parseInt(document.getElementById('filter-total-trades').value) || null;
    const avgSharpeFilter = parseFloat(document.getElementById('filter-avg-sharpe').value) || null;
    const avgProfitFactorFilter = parseFloat(document.getElementById('filter-avg-profit-factor').value) || null;
    const ratioAvgWinLossFilter = parseFloat(document.getElementById('filter-ratio-avg-win-loss').value) || null;

    let filteredData = originalData.filter(bot => {
        let passesMaxDrawdown = true;
        if (maxDrawdownFilter !== null) {
            passesMaxDrawdown = parseFloat(bot.Avg_Max_Drawdown) >= maxDrawdownFilter;
        }
        const passesTotalTrades = totalTradesFilter === null || parseInt(bot.Total_Trades) >= totalTradesFilter;
        const passesAvgSharpe = avgSharpeFilter === null || parseFloat(bot.Avg_Sharpe) >= avgSharpeFilter;
        const passesAvgProfitFactor = avgProfitFactorFilter === null || parseFloat(bot.Avg_Profit_Factor) >= avgProfitFactorFilter;
        const passesRatioAvgWinLoss = ratioAvgWinLossFilter === null || parseFloat(bot.Ratio_Avg_Win_Loss) >= ratioAvgWinLossFilter;
        
        return passesMaxDrawdown && passesTotalTrades && passesAvgSharpe && passesAvgProfitFactor && passesRatioAvgWinLoss;
    });

    // Clear only previous data rows and messages, not the static header
    const dataRows = dashboardContent.querySelectorAll('.data-row');
    dataRows.forEach(row => row.remove());
    const messageElements = dashboardContent.querySelectorAll('.no-data-message, .error-message');
    messageElements.forEach(msg => msg.remove());

    if (filteredData.length > 0) {
        filteredData.forEach(botData => {
            const rowElement = createDataRow(botData);
            dashboardContent.appendChild(rowElement);
        });
    } else {
        // Check if a message div already exists, if not, create one
        let noDataMsg = dashboardContent.querySelector('.no-data-message');
        if (!noDataMsg) {
            noDataMsg = document.createElement('p');
            noDataMsg.className = 'no-data-message';
            dashboardContent.appendChild(noDataMsg);
        }
        noDataMsg.textContent = 'No data matches your filters.';
    }
}

const expBotSelectEl = document.getElementById('exp-bot-select');

function populateBotSelector() {
    if (!expBotSelectEl || !originalData || originalData.length === 0) {
        if (expBotSelectEl) expBotSelectEl.closest('.bot-selector-group').style.display = 'none'; // Hide if no data
        return;
    }

    expBotSelectEl.closest('.bot-selector-group').style.display = 'flex'; // Show if data exists
    expBotSelectEl.innerHTML = '<option value="">-- Manual --</option>'; // Clear previous options but keep manual

    originalData.forEach((bot, index) => {
        if (bot.Bot_Name) {
            const option = document.createElement('option');
            option.value = index; // Use index to easily retrieve bot data later
            option.textContent = bot.Bot_Name;
            expBotSelectEl.appendChild(option);
        }
    });
}

async function loadAndDisplaySheetData() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) {
        console.error('Dashboard content area (.dashboard-content) not found!');
        return;
    }

    // Clear previous error/no data messages before fetching new data
    // This prevents messages from previous loads from sticking if data-header-row is the only child
    const messageElements = dashboardContent.querySelectorAll('.no-data-message, .error-message');
    messageElements.forEach(msg => msg.remove());

    try {
        console.log('Fetching Google Sheet data...');
        const response = await fetch(GOOGLE_SHEET_CSV_URL + '&cacheBust=' + new Date().getTime());
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
        }
        const csvText = await response.text();
        console.log('CSV data fetched, parsing...');
        originalData = parseCSV(csvText); 
        console.log(`Parsed data successfully. Original records: ${originalData.length}`);
        
        applyFiltersAndDisplay(); 
        populateBotSelector();

    } catch (error) {
        console.error('Failed to load or display sheet data:', error);
        // Check if a message div already exists, if not, create one
        let errorMsg = dashboardContent.querySelector('.error-message');
        if (!errorMsg) {
            errorMsg = document.createElement('p');
            errorMsg.className = 'error-message';
            // Ensure it's appended after the header if header exists
            const headerRow = dashboardContent.querySelector('.data-header-row');
            if (headerRow && headerRow.nextSibling) {
                dashboardContent.insertBefore(errorMsg, headerRow.nextSibling);
            } else {
                dashboardContent.appendChild(errorMsg);
            }
        }
        errorMsg.textContent = `Failed to load data: ${error.message}. Check console.`;
        if (expBotSelectEl) expBotSelectEl.closest('.bot-selector-group').style.display = 'none'; // Hide selector on error
    }
}

function setupFilterEventListeners() {
    document.getElementById('filter-max-drawdown').addEventListener('input', applyFiltersAndDisplay);
    document.getElementById('filter-total-trades').addEventListener('input', applyFiltersAndDisplay);
    document.getElementById('filter-avg-sharpe').addEventListener('input', applyFiltersAndDisplay);
    document.getElementById('filter-avg-profit-factor').addEventListener('input', applyFiltersAndDisplay);
    document.getElementById('filter-ratio-avg-win-loss').addEventListener('input', applyFiltersAndDisplay);
    document.getElementById('clear-filters-btn').addEventListener('click', () => {
        document.getElementById('filter-max-drawdown').value = '';
        document.getElementById('filter-total-trades').value = '';
        document.getElementById('filter-avg-sharpe').value = '';
        document.getElementById('filter-avg-profit-factor').value = '';
        document.getElementById('filter-ratio-avg-win-loss').value = '';
        applyFiltersAndDisplay();
    });
}

function displayHeaderDateRange() {
    const dateRangeElement = document.querySelector('.header-date-range');
    if (!dateRangeElement) {
        console.error('Header date range element not found!');
        return;
    }

    const startDate = "May 6th, 2024"; // Assuming 2024, update if different
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedToday = today.toLocaleDateString('en-US', options);

    dateRangeElement.textContent = `Data from ${startDate} to ${formattedToday}`;
}

// --- View Switching Logic ---
const mainDashboardView = document.getElementById('main-dashboard-view');
const expectancyView = document.getElementById('expectancy-view');
const logoBtn = document.querySelector('.site-header .logo'); // Assuming logo acts as dashboard home
const expectancyBtn = document.getElementById('btn-expectancy');

function showView(viewToShow) {
    mainDashboardView.style.display = 'none';
    expectancyView.style.display = 'none';
    viewToShow.style.display = 'block';
}

if (logoBtn) {
    logoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showView(mainDashboardView);
    });
}
if (expectancyBtn) {
    expectancyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showView(expectancyView);
    });
}

// --- Trade Expectancy Calculator Logic ---
const expStartBalanceEl = document.getElementById('exp-start-balance');
const expNumTradesEl = document.getElementById('exp-num-trades');
const expTypicalRiskEl = document.getElementById('exp-typical-risk');
const expRiskRewardEl = document.getElementById('exp-risk-reward');
const expWinLossEl = document.getElementById('exp-win-loss');
const expCalculateBtn = document.getElementById('exp-calculate-btn');
const expClearBtn = document.getElementById('exp-clear-btn');

// Result elements
const resAccountStartEl = document.getElementById('res-account-start');
const resAvgGainTradePctEl = document.getElementById('res-avg-gain-trade-pct');
const resEndBalanceEl = document.getElementById('res-end-balance');
const resRoiPctEl = document.getElementById('res-roi-pct');
const resNumTradesEl = document.getElementById('res-num-trades');
const resProfitableTradesEl = document.getElementById('res-profitable-trades');
const resLosingTradesEl = document.getElementById('res-losing-trades');
const resMaxDrawdownAbsEl = document.getElementById('res-max-drawdown-abs');
const resMaxDrawdownPctEl = document.getElementById('res-max-drawdown-pct');

let expectancyChartInstance = null;

function calculateTradeExpectancy() {
    const startBalance = parseFloat(expStartBalanceEl.value) || 0;
    const numTrades = parseInt(expNumTradesEl.value) || 0;
    const typicalRiskPct = parseFloat(expTypicalRiskEl.value) || 0;
    const riskRewardRatio = parseFloat(expRiskRewardEl.value) || 0;
    const winRatePct = parseFloat(expWinLossEl.value) || 0;

    if (startBalance <= 0 || numTrades <= 0 || typicalRiskPct <= 0 || winRatePct <= 0 || winRatePct > 100 || riskRewardRatio <=0) {
        alert("Please enter valid positive values for all settings, and win rate between 0-100.");
        return;
    }

    const riskPerTradeAbs = startBalance * (typicalRiskPct / 100);
    const rewardPerTradeAbs = riskPerTradeAbs * riskRewardRatio;
    const probWin = winRatePct / 100;
    const probLoss = 1 - probWin;

    let currentBalance = startBalance;
    let peakBalance = startBalance;
    let maxDrawdownAbs = 0;
    let profitableTrades = 0;
    let losingTrades = 0;
    const equityCurve = [startBalance];

    for (let i = 0; i < numTrades; i++) {
        if (Math.random() < probWin) {
            currentBalance += rewardPerTradeAbs;
            profitableTrades++;
        } else {
            currentBalance -= riskPerTradeAbs;
            losingTrades++;
        }
        equityCurve.push(currentBalance);
        if (currentBalance > peakBalance) {
            peakBalance = currentBalance;
        }
        const drawdown = peakBalance - currentBalance;
        if (drawdown > maxDrawdownAbs) {
            maxDrawdownAbs = drawdown;
        }
    }

    const endBalance = currentBalance;
    const totalGain = endBalance - startBalance;
    const roiPct = (totalGain / startBalance) * 100;
    const avgGainPerTrade = totalGain / numTrades;
    const avgGainPerTradePct = (avgGainPerTrade / startBalance) * 100;
    const maxDrawdownPct = (maxDrawdownAbs / peakBalance) * 100; // Drawdown based on peak

    // Display results
    resAccountStartEl.textContent = startBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    resAvgGainTradePctEl.textContent = avgGainPerTradePct.toFixed(2) + '%';
    resEndBalanceEl.textContent = endBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    resRoiPctEl.textContent = roiPct.toFixed(2) + '%';
    resNumTradesEl.textContent = numTrades;
    resProfitableTradesEl.textContent = profitableTrades;
    resLosingTradesEl.textContent = losingTrades;
    resMaxDrawdownAbsEl.textContent = maxDrawdownAbs.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    resMaxDrawdownPctEl.textContent = maxDrawdownPct.toFixed(2) + '%';

    // Update chart
    console.log("Attempting to update chart...");
    const chartLabels = Array.from({ length: numTrades + 1 }, (_, i) => i);
    const canvasElement = document.getElementById('expectancy-chart');

    if (!canvasElement) {
        console.error("ERROR: Canvas element #expectancy-chart NOT FOUND!");
        return;
    }
    console.log("Canvas element found:", canvasElement);
    console.log("Canvas display style:", window.getComputedStyle(canvasElement).display);
    console.log("Canvas width:", canvasElement.width, "Canvas clientWidth:", canvasElement.clientWidth);
    console.log("Canvas height:", canvasElement.height, "Canvas clientHeight:", canvasElement.clientHeight);

    if (expectancyChartInstance) {
        console.log("Destroying previous chart instance.");
        expectancyChartInstance.destroy();
    }
    
    console.log("Chart labels data:", chartLabels.slice(0,5)); // Log first 5 labels
    console.log("Equity curve data:", equityCurve.slice(0,5)); // Log first 5 data points

    try {
        const ctx = canvasElement.getContext('2d');
        if (!ctx) {
            console.error("ERROR: Failed to get 2D context from canvas!");
            return;
        }
        console.log("2D context obtained successfully.");

        expectancyChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Account Balance',
                    data: equityCurve,
                    borderColor: '#ff7eb9', 
                    backgroundColor: 'rgba(255, 126, 185, 0.1)',
                    borderWidth: 2,
                    tension: 0.2, 
                    pointRadius: 0, 
                    pointHoverRadius: 5, 
                    pointBackgroundColor: '#ff7eb9',
                    fill: true 
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { 
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: { 
                            color: '#9ca3af', 
                            font: { family: 'Poppins', size: 10 },
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: { 
                            color: 'rgba(255, 255, 255, 0.05)', 
                            drawBorder: false 
                        }
                    },
                    x: {
                        ticks: { 
                            color: '#9ca3af', 
                            font: { family: 'Poppins', size: 10 },
                            maxRotation: 0, 
                            minRotation: 0
                        },
                        grid: { 
                            display: false, 
                            drawBorder: false 
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: { 
                            color: '#e5e7eb', 
                            font: { family: 'Poppins', size: 12 },
                            boxWidth: 12,
                            padding: 20
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(17, 24, 39, 0.8)', 
                        titleColor: '#f3f4f6', 
                        titleFont: { family: 'Poppins', weight: '600', size: 13 },
                        bodyColor: '#d1d5db', 
                        bodyFont: { family: 'Poppins', size: 12 },
                        padding: 10,
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        caretPadding: 10,
                        caretSize: 6,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed.y !== null) {
                                    label += '$' + context.parsed.y.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
                                }
                                return label;
                            },
                            title: function(tooltipItems) {
                                return 'Trade #' + tooltipItems[0].label;
                            }
                        }
                    }
                }
            }
        });
        console.log("New chart instance created:", expectancyChartInstance);
    } catch (error) {
        console.error("ERROR creating chart:", error);
    }
}

function handleBotSelectionChange() {
    const selectedBotIndex = expBotSelectEl.value;
    if (selectedBotIndex && originalData && originalData[selectedBotIndex]) {
        const selectedBotData = originalData[selectedBotIndex];

        // Auto-fill Win/Loss %
        if (selectedBotData.Avg_Win_Rate) {
            // Assuming Avg_Win_Rate is already in % format, e.g., "55.75%"
            // We need to strip the "%" and convert to number if it includes it.
            const winRateStr = String(selectedBotData.Avg_Win_Rate).replace('%','');
            const winRateNum = parseFloat(winRateStr);
            if (!isNaN(winRateNum)) {
                expWinLossEl.value = winRateNum.toFixed(2); // Keep it as a percentage number
            }
        } else {
            expWinLossEl.value = '50'; // Default if not found
        }

        // Auto-fill Risk:Reward (1:X)
        // ASSUMPTION: Ratio_Avg_Win_Loss from sheet IS the 'X' value for Risk:Reward
        if (selectedBotData.Ratio_Avg_Win_Loss) {
            const rrNum = parseFloat(selectedBotData.Ratio_Avg_Win_Loss);
            if (!isNaN(rrNum)) {
                expRiskRewardEl.value = rrNum.toFixed(2);
            }
        } else {
            expRiskRewardEl.value = '2'; // Default if not found
        }

    } else {
        // Manual selection or no data, reset to defaults or leave as is for manual input
        expWinLossEl.value = '50'; 
        expRiskRewardEl.value = '2';
    }
}

if (expBotSelectEl) {
    expBotSelectEl.addEventListener('change', handleBotSelectionChange);
}

if(expClearBtn) {
    expClearBtn.addEventListener('click', () => {
        expStartBalanceEl.value = '50000';
        expNumTradesEl.value = '100';
        expTypicalRiskEl.value = '1';
        // expRiskRewardEl.value = '2'; // Will be set by handleBotSelectionChange
        // expWinLossEl.value = '50'; // Will be set by handleBotSelectionChange
        document.querySelectorAll('.results-grid span').forEach(span => span.textContent = 'N/A');
        if (expectancyChartInstance) expectancyChartInstance.destroy();
        expectancyChartInstance = null; 
        expBotSelectEl.value = ''; // Reset bot selector to "-- Manual --"
        handleBotSelectionChange(); // Call to reset WinRate/RR to defaults for "-- Manual --"
    });
}

if (expCalculateBtn) {
    expCalculateBtn.addEventListener('click', calculateTradeExpectancy);
}

// Main setup logic
function initializeApp() {
    try {
        setup(); // Aurora setup
        displayHeaderDateRange();
    } catch (e) {
        console.error("Error during Aurora or Date Range setup:", e);
        const dashboardContent = document.querySelector('.dashboard-content');
        if(dashboardContent) dashboardContent.innerHTML = '<p class="error-message">Error initializing background or header.</p>';
    }

    try {
        setupFilterEventListeners();
        loadAndDisplaySheetData(); 
        setInterval(loadAndDisplaySheetData, DATA_REFRESH_INTERVAL); 
    } catch (e) {
        console.error("Error setting up data loading/filtering:", e);
        const dashboardContent = document.querySelector('.dashboard-content');
        if(dashboardContent) {
            if(dashboardContent.innerHTML === '' || dashboardContent.querySelector(".data-header-row")?.nextElementSibling === null) { 
                 dashboardContent.appendChild(document.createElement('p')).className = 'error-message';
                 dashboardContent.querySelector('.error-message').textContent = 'Error initializing data display.';
            }
        }
    }

    showView(mainDashboardView); // Show main dashboard by default
}

// Make sure the DOM is fully loaded before setting up
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp(); // DOMContentLoaded has already fired
}

window.addEventListener('resize', resize); 