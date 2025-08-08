// worker.js

// 1. HTML 模板 (使用反引号 ` ` 包裹多行字符串)
// 注意：移除了 <style> 和 <script> 标签，它们将在 Worker 中动态注入
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的IP地址 - 仿html.zone/ip</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z' fill='%234CAF50'/%3E%3C/svg%3E" type="image/svg+xml">
</head>
<body>
    <header>
        <h1>我的IP地址</h1>
        <p>快速查询您的公网IP地址及地理位置信息。</p>
    </header>

    <div class="container">
        <section class="ip-card" id="ipCard">
            <div class="loading-spinner" id="loadingSpinner"></div>
            <div id="errorMessage" class="error-message hidden"></div>

            <div id="contentWrapper" class="hidden">
                <div class="ip-display">
                    <span id="yourIp"></span>
                    <button id="copyIpBtn" class="copy-button">复制IP</button>
                </div>

                <div class="info-section">
                    <h3>地理位置</h3>
                    <dl>
                        <dt>国家:</dt><dd id="resCountry"></dd>
                        <dt>省份:</dt><dd id="resRegion"></dd>
                        <dt>城市:</dt><dd id="resCity"></dd>
                        <dt>经纬度:</dt><dd id="resLatLon"></dd>
                    </dl>
                </div>

                <div class="info-section">
                    <h3>网络信息</h3>
                    <dl>
                        <dt>ISP:</dt><dd id="resIsp"></dd>
                        <dt>ASN:</dt><dd id="resAsn"></dd>
                        <dt>组织:</dt><dd id="resOrg"></dd>
                        <dt>主机名:</dt><dd id="resHostname"></dd>
                    </dl>
                </div>

                <div class="raw-data-section">
                    <h3>原始数据</h3>
                    <pre><code id="rawDataDisplay"></code></pre>
                    <button id="copyRawDataBtn" class="copy-button">复制原始数据</button>
                </div>
            </div>
        </section>
    </div>

    <footer>
        <p>&copy; 2024 我的IP地址 | 数据来源: <a href="https://ipapi.co/" target="_blank">ipapi.co</a></p>
    </footer>
</body>
</html>`;

// 2. CSS 样式 (使用反引号 ` ` 包裹多行字符串)
const CSS_STYLE = `
/* 基础样式 */
body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    margin: 0;
    padding: 0;
    background: linear-gradient(to bottom right, #e0f2f7, #c8e6c9); /* 浅色渐变背景 */
    color: #333;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    align-items: center; /* 水平居中内容 */
    justify-content: center; /* 垂直居中内容 */
}

.container {
    max-width: 700px; /* 限制主内容宽度 */
    width: 90%; /* 响应式宽度 */
    margin: 20px auto;
    padding: 0; /* 容器本身不加内边距 */
    flex-grow: 0; /* 不让容器占据所有可用空间 */
}

/* 头部 */
header {
    text-align: center;
    margin-bottom: 30px;
    color: #2c3e50;
}

header h1 {
    margin: 0;
    font-size: 2.8em;
    font-weight: 300; /* 更细的字体 */
}

header p {
    margin: 10px 0 0;
    font-size: 1.1em;
    color: #555;
}

/* IP信息卡片 */
.ip-card {
    background-color: #ffffff;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0; /* 细边框 */
    min-height: 350px; /* 确保有足够高度，防止内容加载前闪烁 */
    display: flex;
    flex-direction: column;
    justify-content: center; /* 垂直居中内容 */
    align-items: center; /* 水平居中内容 */
    text-align: center;
}

.ip-card.loaded {
    justify-content: flex-start; /* 加载后顶部对齐 */
    align-items: flex-start; /* 加载后左对齐 */
    text-align: left;
}

.loading-spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.error-message {
    color: #e74c3c;
    font-weight: bold;
    font-size: 1.2em;
}

/* IP显示区 */
.ip-display {
    display: flex;
    align-items: center;
    justify-content: space-between; /* IP和按钮左右对齐 */
    width: 100%;
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
}

#yourIp {
    font-size: 2.8em;
    font-weight: bold;
    color: #3498db;
    word-break: break-all; /* 防止长IP溢出 */
}

.copy-button {
    padding: 10px 18px;
    background-color: #2ecc71;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.3s ease, transform 0.2s ease;
    margin-left: 15px; /* 与IP地址的间距 */
    flex-shrink: 0; /* 防止按钮被压缩 */
}

.copy-button:hover {
    background-color: #27ae60;
    transform: translateY(-1px);
}

.copy-button:active {
    transform: translateY(0);
}

.copy-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    opacity: 0.7;
}

/* 信息详情区 */
.info-section {
    width: 100%;
    margin-bottom: 20px;
}

.info-section h3 {
    color: #2c3e50;
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 1.4em;
    font-weight: 400;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 8px;
}

.info-section dl {
    display: grid;
    grid-template-columns: auto 1fr; /* 键和值两列 */
    gap: 10px 20px;
    margin: 0;
    padding: 0;
}

.info-section dt {
    font-weight: bold;
    color: #555;
    text-align: right;
}

.info-section dd {
    margin: 0;
    color: #333;
}

/* 原始数据区 */
.raw-data-section {
    width: 100%;
    margin-top: 20px;
    border-top: 1px solid #eee;
    padding-top: 20px;
}

.raw-data-section h3 {
    margin-top: 0;
}

#rawDataDisplay {
    background-color: #f8f8f8;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 15px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
    white-space: pre-wrap; /* 保留空白符和换行，自动换行 */
    word-wrap: break-word; /* 单词内断行 */
    max-height: 250px; /* 限制高度，允许滚动 */
    overflow-y: auto;
    margin-bottom: 15px;
    color: #444;
}

/* 隐藏元素 */
.hidden {
    display: none !important;
}

/* 底部 */
footer {
    text-align: center;
    padding: 20px;
    margin-top: 30px;
    color: #777;
    font-size: 0.9em;
}

footer a {
    color: #3498db;
    text-decoration: none;
}

footer a:hover {
    text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
    header h1 {
        font-size: 2.2em;
    }
    header p {
        font-size: 1em;
    }
    .ip-card {
        padding: 20px;
    }
    .ip-display {
        flex-direction: column; /* IP和按钮垂直堆叠 */
        align-items: flex-start;
    }
    #yourIp {
        font-size: 2.2em;
        margin-bottom: 10px;
    }
    .copy-button {
        width: 100%; /* 按钮占满宽度 */
        margin-left: 0;
    }
    .info-section dl {
        grid-template-columns: 1fr; /* 键值对垂直堆叠 */
    }
    .info-section dt {
        text-align: left;
    }
}
`;

// 3. 客户端 JavaScript (使用反引号 ` ` 包裹多行字符串)
// 注意：移除了 DOMContentLoaded 事件监听器中的 fetch 调用，
// 数据将通过 Worker 注入的 initialIpData 和 initialErrorMessage 变量获取。
const CLIENT_JS = `
// 获取DOM元素
const ipCard = document.getElementById('ipCard');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const contentWrapper = document.getElementById('contentWrapper');

const yourIp = document.getElementById('yourIp');
const copyIpBtn = document.getElementById('copyIpBtn');

const resCountry = document.getElementById('resCountry');
const resRegion = document.getElementById('resRegion');
const resCity = document.getElementById('resCity');
const resLatLon = document.getElementById('resLatLon');

const resIsp = document.getElementById('resIsp');
const resAsn = document.getElementById('resAsn');
const resOrg = document.getElementById('resOrg');
const resHostname = document.getElementById('resHostname');

const rawDataDisplay = document.getElementById('rawDataDisplay');
const copyRawDataBtn = document.getElementById('copyRawDataBtn');

// 显示加载状态 (在 Worker 注入数据后，这个函数可能只在初始渲染时短暂显示)
function showLoading() {
    ipCard.classList.remove('loaded');
    loadingSpinner.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    contentWrapper.classList.add('hidden');
    copyIpBtn.disabled = true;
    copyRawDataBtn.disabled = true;
}

// 显示错误信息
function showError(message) {
    loadingSpinner.classList.add('hidden');
    errorMessage.classList.remove('hidden');
    errorMessage.textContent = \`加载失败: \${message}\`;
    contentWrapper.classList.add('hidden');
    copyIpBtn.disabled = true;
    copyRawDataBtn.disabled = true;
}

// 显示IP数据
function displayIpData(data) {
    loadingSpinner.classList.add('hidden');
    errorMessage.classList.add('hidden');
    contentWrapper.classList.remove('hidden');
    ipCard.classList.add('loaded'); // 添加类以调整布局

    yourIp.textContent = data.ip || 'N/A';

    resCountry.innerHTML = \`\${data.country_flag || ''} \${data.country_name || 'N/A'} (\${data.country_code || 'N/A'})\`;
    resRegion.textContent = data.region || 'N/A';
    resCity.textContent = data.city || 'N/A';
    resLatLon.textContent = \`\${data.latitude || 'N/A'}, \${data.longitude || 'N/A'}\`;

    resIsp.textContent = data.org || 'N/A'; // ipapi.co 的 org 字段通常是 ISP
    resAsn.textContent = data.asn || 'N/A';
    resOrg.textContent = data.org || 'N/A'; // 再次使用 org 字段作为组织
    resHostname.textContent = data.hostname || 'N/A';

    const rawJson = JSON.stringify(data, null, 2);
    rawDataDisplay.textContent = rawJson;
    rawDataDisplay.dataset.rawData = rawJson; // 存储原始数据以便复制

    copyIpBtn.disabled = false;
    copyRawDataBtn.disabled = false;
}

// 复制文本到剪贴板
async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        const originalText = button.textContent;
        button.textContent = '已复制!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 1500);
    } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制。');
    }
}

// 事件监听器
copyIpBtn.addEventListener('click', () => {
    copyToClipboard(yourIp.textContent, copyIpBtn);
});

copyRawDataBtn.addEventListener('click', () => {
    copyToClipboard(rawDataDisplay.dataset.rawData, copyRawDataBtn);
});

// 页面加载时，使用 Worker 注入的 initialIpData 和 initialErrorMessage
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initialIpData !== 'undefined' && initialIpData.ip) {
        displayIpData(initialIpData);
    } else if (typeof initialErrorMessage !== 'undefined' && initialErrorMessage) {
        showError(initialErrorMessage);
    } else {
        // Fallback for unexpected scenarios, though should be covered by Worker
        showError('未能获取IP信息。');
    }
});
`;

// 4. Cloudflare Worker 主逻辑
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    // 获取访问者的IP地址 (Cloudflare Workers 特有)
    const clientIp = request.headers.get('cf-connecting-ip') || 'N/A';
    let ipData = {};
    let errorMessage = '';

    // 尝试从 ipapi.co 获取更详细的IP信息
    try {
        const ipApiUrl = `https://ipapi.co/${clientIp}/json/`;
        const response = await fetch(ipApiUrl);
        if (!response.ok) {
            throw new Error(`ipapi.co returned status ${response.status}`);
        }
        ipData = await response.json();
    } catch (e) {
        console.error("Failed to fetch IP data from ipapi.co:", e);
        errorMessage = `无法获取IP详情: ${e.message}`;
        // 即使 ipapi.co 失败，也至少提供 IP 地址
        ipData = { ip: clientIp, error: errorMessage };
    }

    // 将获取到的数据和错误信息注入到客户端 JavaScript 中
    const injectedScript = `
        <script>
            const initialIpData = ${JSON.stringify(ipData, null, 2)};
            const initialErrorMessage = ${JSON.stringify(errorMessage)};
        </script>
    `;

    // 将 CSS 和注入的 JS 插入到 HTML 模板中
    let finalHtml = HTML_TEMPLATE
        .replace('</head>', `<style>${CSS_STYLE}</style>${injectedScript}</head>`)
        .replace('</body>', `<script>${CLIENT_JS}</script></body>`);

    // 返回 HTML 响应
    return new Response(finalHtml, {
        headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            // 建议添加一些缓存控制，但对于“我的IP”页面，不宜缓存太久
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });
}
