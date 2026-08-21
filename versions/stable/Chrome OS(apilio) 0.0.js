// ==UserScript==
// @name         网页模拟桌面系统 (Web OS) - 终极优化版(apilio)
// @namespace    http://tampermonkey.net/
// @version      10.5
// @description  新增 AI 对话特殊符号支持、Ctrl+Enter 换行、侧边栏折叠收起功能。
// @author       cmq
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      ce.judge0.com
// @connect      api.judge0.com
// @connect      api.apilio.ai
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    if (window.top !== window.self) return;

    // --- 1. 核心持久化数据中心 ---
    let DEFAULT_OS_DATA = {
        files: [
            { id: 'f1', name: 'README.txt', type: 'txt', content: '欢迎来到优化版 Web OS！\n\n【本次新增功能】\n1. AI 终端支持输入 < > () 等编程符号啦！\n2. AI 终端输入框支持 Ctrl+Enter 快捷换行。\n3. 左侧边栏多了一个小箭头，点击可以折叠/展开侧边栏！' },
            { id: 'f2', name: 'main.cpp', type: 'cpp', content: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cout << "请输入两个整数（在右侧输入框填写，用空格隔开）：" << endl;\n    if (cin >> a >> b) {\n        cout << "👉 远程编译计算结果：" << a << " + " << b << " = " << (a + b) << endl;\n    } else {\n        cout << "⚠️ 未检测到有效的输入数据！" << endl;\n    }\n    return 0;\n}' },
            { id: 'f3', name: '季度财务核算.xlsx', type: 'xlsx', content: [["指标项目","第一季度","第二季度","环比增长"],["业务营收","89000","104000","16.8%"]] },
            { id: 'f4', name: '商业计划书.docx', type: 'docx', content: '<div><font size="5"><b>智能系统深度重构计划</b></font></div>' }
        ],
        settings: {
            blur: 10,
            brightness: 40,
            apiKey: '',
            activeModel: 'gpt-4o',
            modelList: ['gpt-4o', 'gpt-3.5-turbo', 'claude-3-5-sonnet']
        }
    };

    let OS_DATA = JSON.parse(localStorage.getItem('MOCK_OS_DATA_V10')) || DEFAULT_OS_DATA;
    if(OS_DATA.settings.model) {
        OS_DATA.settings.activeModel = OS_DATA.settings.model;
        OS_DATA.settings.modelList = ['gpt-4o', 'gpt-3.5-turbo', OS_DATA.settings.model];
        delete OS_DATA.settings.model;
        saveSystemData();
    }

    function saveSystemData() { localStorage.setItem('MOCK_OS_DATA_V10', JSON.stringify(OS_DATA)); }

    let zIndexCounter = 200000;

    // --- 2. Shadow DOM 样式装潢 ---
    const host = document.createElement('div');
    host.id = 'os-shadow-host';
    host.style.cssText = 'position: fixed !important; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647 !important; pointer-events: none;';
    document.documentElement.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.innerHTML = `
        #os-entry-btn {
            position: fixed !important; bottom: 65px !important; right: 20px !important;
            background: #0078d4 !important; color: white !important; padding: 12px 24px !important;
            border-radius: 4px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            cursor: pointer !important; font-family: system-ui, sans-serif !important; font-weight: 500 !important;
            pointer-events: auto !important; display: block; user-select: none; border: 1px solid rgba(255,255,255,0.2) !important;
        }
        #os-entry-btn:hover { background: #106ebe !important; }

        #os-desktop {
            position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important;
            pointer-events: none !important; font-family: 'Segoe UI', system-ui, sans-serif !important; display: none; box-sizing: border-box;
        }

        #os-wallpaper-blur {
            position: absolute; top:0; left:0; width:100%; height:100%;
            backdrop-filter: blur(${OS_DATA.settings.blur}px);
            background: rgba(0, 0, 0, ${OS_DATA.settings.brightness / 100});
            z-index: -1; pointer-events: none !important;
        }

        #os-sidebar, #os-taskbar, .os-window { pointer-events: auto !important; }

        /* 左侧侧边栏 */
        #os-sidebar {
            position: absolute; top: 0; left: 0; width: 240px; height: calc(100vh - 45px);
            background: rgba(40, 40, 45, 0.4); backdrop-filter: blur(25px);
            border-right: 1px solid rgba(255,255,255,0.1); color: white; display: flex; flex-direction: column;
            box-shadow: 5px 0 25px rgba(0,0,0,0.3);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 折叠动画 */
            z-index: 100;
        }
        /* 侧边栏折叠按钮 */
        #sidebar-toggle {
            position: absolute; right: -24px; top: 50%; transform: translateY(-50%);
            width: 24px; height: 50px; background: rgba(40, 40, 45, 0.9); color: white;
            display: flex; align-items: center; justify-content: center; cursor: pointer;
            border-radius: 0 6px 6px 0; border: 1px solid rgba(255,255,255,0.2); border-left: none;
            font-size: 12px; z-index: 101; transition: background 0.2s;
        }
        #sidebar-toggle:hover { background: rgba(80, 80, 85, 0.9); }

        .sidebar-top-bar { display: flex; padding: 8px; gap: 4px; background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sidebar-create-btn {
            flex: 1; padding: 6px 4px; font-size: 11px; color: #fff; background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; cursor: pointer; text-align: center; white-space: nowrap;
        }
        .sidebar-create-btn:hover { background: rgba(255,255,255,0.2); }
        .sidebar-folder-view { padding: 12px; flex-grow: 1; overflow-y: auto; }
        .folder-tree-title { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 8px; user-select:none; }

        .file-node {
            padding: 6px 8px 6px 16px; font-size: 13px; color: #fff; cursor: pointer;
            display: flex; align-items: center; justify-content: space-between; border-radius: 4px;
        }
        .file-node:hover { background: rgba(255,255,255,0.15); }
        .file-info-part { display: flex; align-items: center; gap: 8px; pointer-events: none; }

        .file-raw-delete-btn {
            color: #ff5f56; font-weight: bold; font-size: 16px; padding: 0 6px;
            cursor: pointer; opacity: 0; transition: opacity 0.1s, transform 0.1s;
        }
        .file-node:hover .file-raw-delete-btn { opacity: 1; }
        .file-raw-delete-btn:hover { transform: scale(1.3); color: #ff3b30; }

        /* 底部任务栏 */
        #os-taskbar {
            position: absolute; bottom: 0; left: 0; width: 100vw; height: 45px;
            background: rgba(25, 25, 30, 0.8); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: space-between;
            padding: 0 15px; box-sizing: border-box; border-top: 1px solid rgba(255,255,255,0.1); color: white; user-select: none;
            z-index: 102;
        }
        .taskbar-left { display: flex; align-items: center; gap: 10px; height: 100%; }
        .taskbar-search-box { background: rgba(255,255,255,0.85); border: none; border-radius: 4px; padding: 6px 12px; width: 180px; font-size: 12px; color: #333; outline: none; transition: width 0.2s;}
        .taskbar-search-box:focus { width: 250px; background: #fff; }
        .taskbar-icon-btn { font-size: 18px; cursor: pointer; padding: 6px 10px; border-radius: 4px; display: flex; align-items: center; }
        .taskbar-icon-btn:hover { background: rgba(255,255,255,0.1); }
        #os-exit-btn { background: rgba(220, 53, 69, 0.8); color: white; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; }
        #os-exit-btn:hover { background: #dc3545; }
        #os-clock { font-size: 12px; color: #ccc; text-align: right; line-height:1.2; }

        /* 标准桌面窗体结构 */
        .os-window {
            position: absolute; top: 100px; left: 300px; width: 780px; height: 580px;
            background: #1e1e1e; border: 1px solid #444; border-radius: 6px; display: flex; flex-direction: column;
            box-shadow: 0 15px 40px rgba(0,0,0,0.6); overflow: hidden; min-width: 450px; min-height: 300px;
        }
        .os-window-header {
            background: #2d2d2d; padding: 0 0 0 12px; display: flex; justify-content: space-between; align-items: center;
            cursor: move; user-select: none; color: #ddd; font-size: 13px; border-bottom: 1px solid #3c3c3c; height: 32px;
        }
        .window-controls-group { display: flex; align-items: center; height: 100%; gap: 4px; }
        .win-btn-save { color: #57a6ff; font-size: 12px; cursor: pointer; user-select: none; font-weight: bold; padding: 0 8px; }
        .win-btn-save:hover { color: #79b8ff; }
        .os-window-close {
            width: 42px; height: 32px; color: #aaa; font-size: 16px; font-family: 'Segoe UI', sans-serif;
            display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.1s;
        }
        .os-window-close:hover { background: #e81123 !important; color: #fff !important; }
        .os-window-body { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .os-window-resize-handle { position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; cursor: se-resize; z-index: 99999; background: transparent; }

        /* --- VS Code 仿真视觉区 --- */
        .code-editor-container { display: flex; flex-grow: 1; background: #1e1e1e; overflow: hidden; position: relative; flex-direction: column; }
        .vscode-tabs-bar { height: 30px; background: #2d2d2d; display: flex; align-items: center; justify-content: space-between; padding-right: 12px; border-bottom: 1px solid #252526; user-select: none; }
        .vscode-tab-item { background: #1e1e1e; color: #fff; height: 100%; display: flex; align-items: center; padding: 0 16px; font-size: 12px; border-right: 1px solid #252526; gap: 6px; font-family: monospace; }
        .vscode-run-btn { color: #4ec9b0; cursor: pointer; font-size: 14px; padding: 4px 12px; border-radius: 4px; display: flex; align-items: center; font-weight: bold; background: rgba(78,201,176,0.1); }
        .vscode-run-btn:hover { background: rgba(78,201,176,0.25); color: #4cee9f; }

        .code-editor-main-split { display: flex; flex-grow: 1; overflow: hidden; position: relative; height: 55%; }
        .code-gutter { width: 48px; background: #1e1e1e; border-right: 1px solid #2d2d2d; color: #858585; text-align: right; padding: 12px 10px 12px 0; font-family: 'Consolas', monospace; font-size: 14px; line-height: 1.5; user-select: none; overflow: hidden; box-sizing: border-box; }
        .code-gutter div { height: 21px; }
        .code-textarea-wrap { flex-grow: 1; position: relative; height: 100%; background: #1e1e1e; }
        .os-textarea { width: 100%; height: 100%; background: transparent; color: #d4d4d4; font-family: 'Consolas', monospace; font-size: 14px; padding: 12px; border: none; resize: none; outline: none; box-sizing: border-box; line-height: 1.5; overflow-y: auto; white-space: pre; caret-color: #aeafad; }

        .vscode-terminal-panel { height: 40%; background: #141414; border-top: 1px solid #2d2d2d; display: flex; flex-direction: column; color: #cccccc; font-family: 'Consolas', monospace; }
        .terminal-header { height: 26px; background: #1e1e1e; display: flex; justify-content: space-between; align-items: center; padding: 0 12px; font-size: 11px; color: #aaa; border-bottom: 1px solid #252526; user-select: none; }
        .terminal-header span.active { color: #fff; border-bottom: 2px solid #007acc; font-weight: bold; padding: 4px 0; }
        .terminal-main-layout { display: flex; flex-grow: 1; overflow: hidden; }
        .terminal-body { flex: 7; padding: 10px 12px; overflow-y: auto; font-size: 13px; line-height: 1.4; color: #33ff33; white-space: pre-wrap; background: #141414; }
        .terminal-stdin-area { flex: 3; background: #1c1c1c; border-left: 1px solid #2d2d2d; display: flex; flex-direction: column; }
        .stdin-title { font-size: 11px; color: #da70d6; padding: 4px 8px; background: #252526; user-select: none; font-weight: bold;}
        .os-stdin-input { flex-grow: 1; background: transparent; color: #ffb3ff; font-family: 'Consolas', monospace; font-size: 13px; padding: 8px; border: none; resize: none; outline: none; line-height: 1.4; }
        .vscode-status-bar { height: 22px; background: #007acc; color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 10px; font-size: 12px; user-select: none; }

        /* Word 套件 */
        .word-container { display: flex; flex-direction: column; height: 100%; background: #f3f2f1; color: #333; }
        .word-ribbon { background: #2b579a; color: white; padding: 0 12px; font-size: 12px; display: flex; gap: 18px; align-items: center; height: 28px; user-select: none;}
        .word-page-viewport { flex-grow: 1; overflow-y: auto; padding: 25px; display: flex; justify-content: center; }
        .word-page { background: white; width: 100%; max-width: 650px; min-height: 500px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); padding: 45px; box-sizing: border-box; outline: none; font-family: system-ui; font-size: 15px; line-height: 1.6; }

        /* Excel 套件 */
        .excel-container { display: flex; flex-direction: column; height: 100%; background: #fff; color: #333; font-size: 12px; }
        .excel-ribbon { background: #107c41; color: white; padding: 4px 12px; font-size: 12px; display: flex; gap: 15px; align-items: center; height: 26px; user-select: none; }
        .excel-formula-bar { background: #f3f2f1; border-bottom: 1px solid #d2d0ce; padding: 4px 12px; display: flex; align-items: center; gap: 8px; box-sizing: border-box;}
        .excel-formula-input { flex-grow: 1; border: 1px solid #d2d0ce; padding: 2px 6px; background: white; outline: none; font-family: monospace; }
        .excel-grid-viewport { flex-grow: 1; overflow: auto; background: #f3f2f1; }
        .excel-table { border-collapse: collapse; background: white; table-layout: fixed; width: max-content; }
        .excel-table th { background: #f3f2f1; border: 1px solid #d2d0ce; font-weight: normal; color: #605e5c; text-align: center; height: 22px; user-select: none; }
        .excel-table td { border: 1px solid #d2d0ce; padding: 0 6px; height: 22px; outline: none; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; box-sizing: border-box; }
        .excel-table td.selected-cell { border: 2px solid #107c41 !important; background: #e1f2e9; }

        /* 控制中心 */
        .settings-body { padding: 20px; font-size: 13px; display: flex; flex-direction: column; gap: 15px; background: #252526; height:100%; box-sizing: border-box; color: #ddd; }
        .settings-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .settings-slider { flex-grow: 1; cursor: pointer; accent-color: #0078d4; }
        .settings-input { flex-grow: 1; background: #3c3c3c; border: 1px solid #555; color: white; padding: 4px 8px; outline: none; font-family: monospace; }
        .model-btn { cursor: pointer; border: none; padding: 4px 8px; font-weight: bold; border-radius: 3px; font-size: 14px; line-height: 1; }
        .model-btn-add { background: #0078d4; color: white; }
        .model-btn-add:hover { background: #106ebe; }
        .model-btn-del { background: #d83b01; color: white; }
        .model-btn-del:hover { background: #ea4a1f; }
    `;
    shadow.appendChild(style);

    // --- 3. 基础桌面设施渲染 ---
    const entryBtn = document.createElement('div');
    entryBtn.id = 'os-entry-btn';
    entryBtn.innerHTML = '💻 进入桌面模式';
    shadow.appendChild(entryBtn);

    const desktop = document.createElement('div');
    desktop.id = 'os-desktop';
    desktop.innerHTML = `
        <div id="os-wallpaper-blur"></div>
        <div id="os-sidebar">
            <div id="sidebar-toggle">◀</div>
            <div class="sidebar-top-bar">
                <div class="sidebar-create-btn" id="sbar-new-txt">+ 新建.txt</div>
                <div class="sidebar-create-btn" id="sbar-new-cpp">+ 新建.cpp</div>
                <div class="sidebar-create-btn" id="sbar-new-xlsx" style="color:#107c41;font-weight:bold;">X 新建Excel</div>
                <div class="sidebar-create-btn" id="sbar-new-docx" style="color:#2b579a;font-weight:bold;">W 新建Word</div>
            </div>
            <div class="sidebar-folder-view">
                <div class="folder-tree-title">WORKSPACE EXPLORER <span>∨</span></div>
                <div class="folder-node">📂 SRC_CORE</div>
                <div id="os-sidebar-file-list" style="margin-top: 8px;"></div>
            </div>
        </div>
        <div id="os-taskbar">
            <div class="taskbar-left">
                <input type="text" class="taskbar-search-box" id="global-search" placeholder="在这里输入你想搜索的应用/内容">
                <div class="taskbar-icon-btn" id="taskbar-settings-btn" title="系统设置">⚙️</div>
                <div id="os-exit-btn">⏻ 退出桌面</div>
            </div>
            <div id="os-clock">00:00:00</div>
        </div>
    `;
    shadow.appendChild(desktop);

    const wallpaperBlur = shadow.getElementById('os-wallpaper-blur');
    const sidebar = shadow.getElementById('os-sidebar');
    const sidebarToggle = shadow.getElementById('sidebar-toggle');
    let isSidebarOpen = true;

    // 侧边栏折叠逻辑
    sidebarToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        isSidebarOpen = !isSidebarOpen;
        sidebar.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
        sidebarToggle.innerText = isSidebarOpen ? '◀' : '▶';
    });

    entryBtn.addEventListener('click', (e) => {
        e.stopPropagation(); desktop.style.display = 'block'; entryBtn.style.display = 'none';
    }, true);

    shadow.getElementById('os-exit-btn').addEventListener('click', (e) => {
        e.stopPropagation(); desktop.style.display = 'none'; entryBtn.style.display = 'block';
    }, true);

    setInterval(() => {
        const d = new Date();
        shadow.getElementById('os-clock').innerHTML =
            `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}<br><span style="font-size:10px;color:#aaa;">2026-07-02</span>`;
    }, 1000);

    // --- 全局搜索与 AI 唤起 ---
    shadow.getElementById('global-search').addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase().trim();
        if (keyword === '对话' || keyword === 'ai') {
            openAIChatWindow();
            e.target.value = '';
            shadow.querySelectorAll('.file-node').forEach(node => node.style.display = 'flex');
            return;
        }
        shadow.querySelectorAll('.file-node').forEach(node => {
            const fileName = node.querySelector('.file-info-part span:last-child').innerText.toLowerCase();
            node.style.display = fileName.includes(keyword) ? 'flex' : 'none';
        });
    });

    // --- 4. 侧边栏文件管理 ---
    function renderSidebarFiles() {
        const listContainer = shadow.getElementById('os-sidebar-file-list');
        listContainer.innerHTML = '';
        OS_DATA.files.forEach(file => {
            const el = document.createElement('div');
            el.className = 'file-node';

            let icon = '📄';
            if(file.type === 'cpp') icon = '⚙️';
            if(file.type === 'xlsx') icon = '📊';
            if(file.type === 'docx') icon = '📘';

            el.innerHTML = `
                <div class="file-info-part"><span>${icon}</span><span>${file.name}</span></div>
                <div class="file-raw-delete-btn" title="彻底删除文件">×</div>
            `;

            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('file-raw-delete-btn')) return;
                e.stopPropagation();
                openAppWindow(file.id);
            });

            el.querySelector('.file-raw-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation(); e.preventDefault();
                if(confirm(`确定要在系统沙盒中彻底删除文件 [${file.name}] 吗？`)) {
                    OS_DATA.files = OS_DATA.files.filter(f => f.id !== file.id);
                    saveSystemData();
                    renderSidebarFiles();
                    const targetWindow = shadow.getElementById(`win-runtime-${file.id}`);
                    if(targetWindow) targetWindow.remove();
                }
            });

            listContainer.appendChild(el);
        });
    }

    function createNewFile(type) {
        const name = prompt(`请输入自定文件名(.${type}):`, `demo_${Date.now().toString().slice(-4)}.${type}`);
        if (!name) return;
        let content = "";
        if (type === 'xlsx') content = [["","","",""]];
        if (type === 'cpp') content = '#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}';
        if (type === 'docx') content = '<div>请输入文档内容...</div>';

        const newFile = { id: 'f_' + Date.now(), name, type, content };
        OS_DATA.files.push(newFile);
        saveSystemData();
        renderSidebarFiles();
        openAppWindow(newFile.id);
    }

    shadow.getElementById('sbar-new-txt').onclick = () => createNewFile('txt');
    shadow.getElementById('sbar-new-cpp').onclick = () => createNewFile('cpp');
    shadow.getElementById('sbar-new-xlsx').onclick = () => createNewFile('xlsx');
    shadow.getElementById('sbar-new-docx').onclick = () => createNewFile('docx');
    shadow.getElementById('taskbar-settings-btn').onclick = () => openSettingsPanel();

    // --- HTML 转义工具 (防止特殊符号被吞) ---
    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // --- 5. AI 对话系统工厂 ---
    function openAIChatWindow() {
        const openWinId = `win-ai-chat-terminal`;
        const activeModelName = OS_DATA.settings.activeModel;

        if (shadow.getElementById(openWinId)) {
            shadow.getElementById(openWinId).style.zIndex = ++zIndexCounter;
            return;
        }

        const win = document.createElement('div');
        win.className = 'os-window'; win.id = openWinId;
        win.style.zIndex = ++zIndexCounter;
        win.style.width = '450px'; win.style.height = '550px';
        win.style.top = '80px'; win.style.left = '320px';

        win.innerHTML = `
            <div class="os-window-header">
                <span>🤖 AI 智能终端 (${activeModelName})</span>
                <div class="window-controls-group">
                    <div class="os-window-close" title="关闭">×</div>
                </div>
            </div>
            <div class="os-window-body" style="background: #1e1e1e; display: flex; flex-direction: column;">
                <div id="ai-chat-history" style="flex-grow: 1; padding: 15px; overflow-y: auto; color: #d4d4d4; font-family: 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6;">
                    <div style="color: #4ec9b0; margin-bottom: 10px;">[System] AI 终端已初始化。当前计算模型: ${activeModelName}</div>
                    ${!OS_DATA.settings.apiKey ? '<div style="color: #ff5f56; margin-bottom: 10px;">[Warning] 未检测到 API Key，请先在左下角设置中配置！</div>' : ''}
                </div>
                <div style="border-top: 1px solid #333; padding: 10px; background: #252526; display: flex;">
                    <textarea id="ai-chat-input" style="flex-grow: 1; background: #3c3c3c; border: 1px solid #555; color: white; padding: 8px 12px; border-radius: 4px; outline: none; font-size: 13px; resize: none; height: 35px; line-height: 1.4; font-family: inherit;" placeholder="输入指令 (Enter 发送，Ctrl+Enter 换行)..."></textarea>
                </div>
            </div>
            <div class="os-window-resize-handle"></div>
        `;
        desktop.appendChild(win);

        const historyPanel = win.querySelector('#ai-chat-history');
        const chatInput = win.querySelector('#ai-chat-input');
        let conversation = [];

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.ctrlKey) {
                    // Ctrl + Enter: 快捷换行
                    e.preventDefault();
                    const start = chatInput.selectionStart;
                    const end = chatInput.selectionEnd;
                    chatInput.value = chatInput.value.substring(0, start) + "\n" + chatInput.value.substring(end);
                    chatInput.selectionStart = chatInput.selectionEnd = start + 1;
                    return;
                }

                // 单独按 Enter: 拦截换行并发送
                e.preventDefault();
                if (chatInput.value.trim() !== '') {
                    const userMsg = chatInput.value.trim();
                    chatInput.value = '';

                    // 文本转义，防止 < > 被吞
                    const safeUserMsg = escapeHTML(userMsg).replace(/\n/g, '<br>');

                    historyPanel.innerHTML += `<div style="margin-bottom: 10px;"><b><span style="color:#57a6ff">You:</span></b><br>${safeUserMsg}</div>`;
                    historyPanel.scrollTop = historyPanel.scrollHeight;

                    if (!OS_DATA.settings.apiKey) {
                        historyPanel.innerHTML += `<div style="margin-bottom: 10px; color: #ff5f56;">[Error] 缺少 API Key，请求被拦截。</div>`;
                        return;
                    }

                    conversation.push({ role: "user", content: userMsg });
                    historyPanel.innerHTML += `<div id="ai-typing" style="margin-bottom: 10px; color: #888;"><i>AI is typing...</i></div>`;
                    historyPanel.scrollTop = historyPanel.scrollHeight;

                    const targetModel = OS_DATA.settings.activeModel;

                    GM_xmlhttpRequest({
                        method: "POST",
                        url: "https://api.apilio.ai/v1/chat/completions",
                        headers: {
                            "Authorization": "Bearer " + OS_DATA.settings.apiKey,
                            "Content-Type": "application/json"
                        },
                        data: JSON.stringify({
                            model: targetModel,
                            messages: conversation
                        }),
                        onload: function(response) {
                            const typingIndicator = win.querySelector('#ai-typing');
                            if(typingIndicator) typingIndicator.remove();

                            try {
                                const res = JSON.parse(response.responseText);
                                if (res.choices && res.choices.length > 0) {
                                    const aiReply = res.choices[0].message.content;
                                    conversation.push({ role: "assistant", content: aiReply });

                                    // 同样的，对 AI 返回内容进行转义处理
                                    const formattedReply = escapeHTML(aiReply).replace(/\n/g, '<br>');
                                    historyPanel.innerHTML += `<div style="margin-bottom: 15px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 4px;"><b><span style="color:#4ec9b0">AI:</span></b><br>${formattedReply}</div>`;
                                } else {
                                    historyPanel.innerHTML += `<div style="margin-bottom: 15px; color: #ff5f56;">[Error] 接口返回格式异常: ${response.responseText}</div>`;
                                }
                            } catch (err) {
                                historyPanel.innerHTML += `<div style="margin-bottom: 15px; color: #ff5f56;">[Error] 解析失败: ${err.message}</div>`;
                            }
                            historyPanel.scrollTop = historyPanel.scrollHeight;
                        },
                        onerror: function(err) {
                            const typingIndicator = win.querySelector('#ai-typing');
                            if(typingIndicator) typingIndicator.remove();
                            historyPanel.innerHTML += `<div style="margin-bottom: 15px; color: #ff5f56;">[Error] 网络连接失败，请检查跨域权限或 API 状态。</div>`;
                            historyPanel.scrollTop = historyPanel.scrollHeight;
                        }
                    });
                }
            }
        });

        win.addEventListener('mousedown', () => { win.style.zIndex = ++zIndexCounter; }, true);
        win.querySelector('.os-window-close').onclick = () => win.remove();
        bindWindowDragAndResize(win, win.querySelector('.os-window-header'), win.querySelector('.os-window-resize-handle'));
    }

    // --- 6. 跨组件视窗工厂 ---
    function openAppWindow(fileId) {
        const file = OS_DATA.files.find(f => f.id === fileId);
        if (!file) return;

        const openWinId = `win-runtime-${file.id}`;
        if (shadow.getElementById(openWinId)) {
            shadow.getElementById(openWinId).style.zIndex = ++zIndexCounter;
            return;
        }

        const win = document.createElement('div');
        win.className = 'os-window'; win.id = openWinId;
        win.style.zIndex = ++zIndexCounter;
        const offset = (zIndexCounter % 8) * 20;
        win.style.top = `${80 + offset}px`;
        win.style.left = `${280 + offset}px`;

        win.innerHTML = `
            <div class="os-window-header">
                <span>${file.name}</span>
                <div class="window-controls-group">
                    <div class="win-btn-save" title="一键安全打包下载到本地">💾 安全下载</div>
                    <div class="os-window-close" title="关闭窗口">×</div>
                </div>
            </div>
            <div class="os-window-body"></div>
            <div class="os-window-resize-handle"></div>
        `;
        desktop.appendChild(win);

        const bodyContainer = win.querySelector('.os-window-body');

        // --- 视图分流 ---
        if (file.type === 'txt' || file.type === 'cpp') {
            const isCpp = file.type === 'cpp';
            const editorContainer = document.createElement('div');
            editorContainer.className = 'code-editor-container';

            editorContainer.innerHTML = `
                <div class="vscode-tabs-bar">
                    <div class="vscode-tab-item">⚙️ ${file.name}</div>
                    ${isCpp ? '<div class="vscode-run-btn" title="编译并运行代码">▶ 运行代码</div>' : ''}
                </div>
                <div class="code-editor-main-split">
                    <div class="code-gutter"><div>1</div></div>
                    <div class="code-textarea-wrap"><textarea class="os-textarea" spellcheck="false"></textarea></div>
                </div>
                ${isCpp ?
                `<div class="vscode-terminal-panel">
                    <div class="terminal-header">
                        <div><span class="active">控制台真实输出 (Stdout / Stderr)</span></div>
                        <div style="color:#6a9955; font-size:10px;">由高可用加速专用编译沙盒驱动</div>
                    </div>
                    <div class="terminal-main-layout">
                        <div class="terminal-body">GNU C++ Compiler 就绪。\n期待您的代码运行指令...\n\n💡 提示：如果程序包含 cin/scanf 输入，请先在右侧注入测试数据！</div>
                        <div class="terminal-stdin-area">
                            <div class="stdin-title">标准输入 (Stdin Data)</div>
                            <textarea class="os-stdin-input" spellcheck="false" placeholder="👉 在此填写多行测试输入数据..."></textarea>
                        </div>
                    </div>
                </div>` : ''}
                <div class="vscode-status-bar">
                    <div>🔀 main* • LF</div>
                    <div style="display:flex;gap:12px;"><span class="ln-col-pointer">Ln 1, Col 1</span><span>UTF-8</span><span>${file.type.toUpperCase()}</span></div>
                </div>
            `;
            bodyContainer.appendChild(editorContainer);

            const textarea = editorContainer.querySelector('.os-textarea');
            const gutter = editorContainer.querySelector('.code-gutter');
            textarea.value = file.content;

            const updateGutter = () => {
                const totalLines = textarea.value.split('\n').length;
                let gutterHTML = '';
                for(let i=1; i<=totalLines; i++) { gutterHTML += `<div>${i}</div>`; }
                gutter.innerHTML = gutterHTML;
            };
            textarea.addEventListener('input', () => { file.content = textarea.value; saveSystemData(); updateGutter(); });
            textarea.addEventListener('scroll', () => { gutter.scrollTop = textarea.scrollTop; });

            textarea.addEventListener('keydown', function(e) {
                const start = this.selectionStart; const end = this.selectionEnd;
                const val = this.value;
                if (e.key === 'Enter') {
                    const charBefore = val.charAt(start - 1); const charAfter = val.charAt(start);
                    const linesBefore = val.substring(0, start).split('\n');
                    const currentLine = linesBefore[linesBefore.length - 1];
                    const baseIndentMatch = currentLine.match(/^(\s*)/);
                    const baseIndent = baseIndentMatch ? baseIndentMatch[0] : '';
                    if (charBefore === '{' && charAfter === '}') {
                        e.preventDefault(); const innerIndent = baseIndent + "    ";
                        this.value = val.substring(0, start) + "\n" + innerIndent + "\n" + baseIndent + val.substring(end);
                        this.selectionStart = this.selectionEnd = start + 1 + innerIndent.length;
                        file.content = this.value; saveSystemData(); updateGutter(); return;
                    } else {
                        e.preventDefault();
                        this.value = val.substring(0, start) + "\n" + baseIndent + val.substring(end);
                        this.selectionStart = this.selectionEnd = start + 1 + baseIndent.length;
                        file.content = this.value; saveSystemData(); updateGutter(); return;
                    }
                }
                const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
                if (pairs[e.key] && isCpp) {
                    e.preventDefault();
                    this.value = val.substring(0, start) + e.key + pairs[e.key] + val.substring(end);
                    this.selectionStart = this.selectionEnd = start + 1;
                    file.content = this.value;
                    saveSystemData(); updateGutter(); return;
                }
                if (e.key === 'Tab') { e.preventDefault();
                    this.value = val.substring(0, start) + "    " + val.substring(end); this.selectionStart = this.selectionEnd = start + 4;
                }
            });

            if(isCpp) {
                const termBody = editorContainer.querySelector('.terminal-body');
                const stdinInput = editorContainer.querySelector('.os-stdin-input');

                editorContainer.querySelector('.vscode-run-btn').onclick = () => {
                    termBody.innerHTML = `[编译任务] 正在连接高可用备用节点，请求编译分配...\n`;
                    if (typeof GM_xmlhttpRequest === 'undefined') {
                        termBody.innerHTML = `<span style="color:#ff5f56;">[致命错误] 未检测到跨域通信组件，请点击脚本管理器开启高级权限！</span>`;
                        return;
                    }
                    GM_xmlhttpRequest({
                        method: "POST",
                        url: "https://ce.judge0.com/submissions?wait=true",
                        headers: { "Content-Type": "application/json", "Accept": "application/json" },
                        data: JSON.stringify({ source_code: textarea.value, language_id: 54, stdin: stdinInput.value }),
                        onload: function(response) {
                            try {
                                const res = JSON.parse(response.responseText);
                                termBody.innerHTML = `[计算集群] 代码安全沙盒执行完毕：\n------------------------------------\n`;
                                if (res.compile_output) termBody.innerHTML += `<span style="color: #ff5f56; font-weight:bold;">[GCC 语法错误]\n${res.compile_output}</span>\n`;
                                if (res.stdout) termBody.innerHTML += res.stdout;
                                if (res.stderr) termBody.innerHTML += `<span style="color: #ffaa00;">[运行时断言/异常]\n${res.stderr}</span>\n`;
                                if (!res.stdout && !res.stderr && !res.compile_output) termBody.innerHTML += `(程序安全退出，回执状态: ${res.status ? res.status.description : 'Success'})`;
                            } catch(e) { termBody.innerHTML = `<span style="color:#ff5f56;">[解析失败] 数据流返回异常，解析错误: ${e.message}</span>\n[原始返回]：${response.responseText}`; }
                        },
                        onerror: function() { termBody.innerHTML = `<span style="color:#ff5f56;">[连接失败] 无法握手专用编译计算节点。建议尝试切换网络重试。</span>`; }
                    });
                };
            }

            const lnColPointer = editorContainer.querySelector('.ln-col-pointer');
            const trackLnCol = () => {
                const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
                const lines = textBeforeCursor.split('\n');
                lnColPointer.innerText = `Ln ${lines.length}, Col ${lines[lines.length - 1].length + 1}`;
            };
            textarea.addEventListener('keyup', trackLnCol);
            textarea.addEventListener('click', trackLnCol);

            updateGutter();
            bindCtrlWheelZoom(textarea);
        }
        else if (file.type === 'docx') {
            const wordUI = document.createElement('div');
            wordUI.className = 'word-container';
            wordUI.innerHTML = `
                <div class="word-ribbon">
                    <span style="font-weight:bold; cursor:pointer;" onclick="document.execCommand('bold')">B 加粗</span>
                    <span style="font-style:italic; cursor:pointer;" onclick="document.execCommand('italic')">I 斜体</span>
                    <span style="text-decoration:underline; cursor:pointer;" onclick="document.execCommand('underline')">U 下划线</span>
                </div>
                <div class="word-page-viewport"><div class="word-page" contenteditable="true">${file.content}</div></div>
            `;
            bodyContainer.appendChild(wordUI);
            const pageEl = wordUI.querySelector('.word-page');
            pageEl.addEventListener('input', () => { file.content = pageEl.innerHTML; saveSystemData(); });
            bindCtrlWheelZoom(pageEl);
        }
        else if (file.type === 'xlsx') {
            const excelUI = document.createElement('div');
            excelUI.className = 'excel-container';
            let matrix = Array.isArray(file.content) ? file.content : [["","",""]];

            let tableHTML = `<table class="excel-table"><tr><th style="width:40px;"></th><th>A</th><th>B</th><th>C</th><th>D</th></tr>`;
            for (let r = 0; r < 20; r++) {
                tableHTML += `<tr><th style="font-weight:bold;">${r+1}</th>`;
                for (let c = 0; c < 4; c++) {
                    let val = (matrix[r] && matrix[r][c]) ? matrix[r][c] : "";
                    tableHTML += `<td contenteditable="true" data-row="${r}" data-col="${c}">${val}</td>`;
                }
                tableHTML += `</tr>`;
            }
            tableHTML += `</table>`;
            excelUI.innerHTML = `
                <div class="excel-ribbon"><span>开始</span></div>
                <div class="excel-formula-bar"><span style="font-weight:bold;color:#107c41;">fx</span><input type="text" class="excel-formula-input" id="f-bar-input" placeholder="单元格编辑..."></div>
                <div class="excel-grid-viewport">${tableHTML}</div>
            `;
            bodyContainer.appendChild(excelUI);

            const gridViewport = excelUI.querySelector('.excel-grid-viewport');
            const fInput = excelUI.querySelector('#f-bar-input');
            let activeCell = null;
            gridViewport.addEventListener('focusin', (e) => {
                if(e.target.tagName === 'TD') {
                    if(activeCell) activeCell.classList.remove('selected-cell');
                    activeCell = e.target; activeCell.classList.add('selected-cell'); fInput.value = activeCell.innerText;
                }
            });
            gridViewport.addEventListener('input', (e) => {
                if(e.target.tagName === 'TD') {
                    const r = parseInt(e.target.getAttribute('data-row')); const c = parseInt(e.target.getAttribute('data-col'));
                    fInput.value = e.target.innerText; if(!matrix[r]) matrix[r] = []; matrix[r][c] = e.target.innerText; file.content = matrix; saveSystemData();
                }
            });
            fInput.addEventListener('input', () => {
                if(activeCell) {
                    activeCell.innerText = fInput.value; const r = parseInt(activeCell.getAttribute('data-row')); const c = parseInt(activeCell.getAttribute('data-col'));
                    if(!matrix[r]) matrix[r] = []; matrix[r][c] = fInput.value; file.content = matrix; saveSystemData();
                }
            });
            bindCtrlWheelZoom(gridViewport);
        }

        // --- 离线文件下载流 ---
        win.querySelector('.win-btn-save').onclick = (e) => {
            e.stopPropagation();
            let blob, downloadName = file.name;
            if (file.type === 'txt' || file.type === 'cpp') { blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
            }
            else if (file.type === 'docx') { blob = new Blob([`<!DOCTYPE html><html><body>${file.content}</body></html>`], { type: "application/msword;charset=utf-8" });
            downloadName = file.name.replace('.docx', '.doc'); }
            else if (file.type === 'xlsx') {
                let csvRawStr = "\ufeff";
                let matrix = Array.isArray(file.content) ? file.content : [];
                matrix.forEach(row => { csvRawStr += row.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(",") + "\r\n"; });
                blob = new Blob([csvRawStr], { type: "text/csv;charset=utf-8;" }); downloadName = file.name.replace('.xlsx', '.csv');
            }
            const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = downloadName; link.click();
        };

        win.addEventListener('mousedown', () => { win.style.zIndex = ++zIndexCounter; }, true);
        win.querySelector('.os-window-close').onclick = () => win.remove();
        bindWindowDragAndResize(win, win.querySelector('.os-window-header'), win.querySelector('.os-window-resize-handle'));
    }

    // --- 7. 控制面板 (支持模型下拉选择及增删) ---
    function openSettingsPanel() {
        if (shadow.getElementById('win-runtime-sys-settings')) {
            shadow.getElementById('win-runtime-sys-settings').style.zIndex = ++zIndexCounter; return;
        }
        const win = document.createElement('div');
        win.className = 'os-window'; win.id = 'win-runtime-sys-settings'; win.style.zIndex = ++zIndexCounter;
        win.style.top = '140px'; win.style.left = '380px'; win.style.width = '480px';
        win.style.height = '330px';
        win.innerHTML = `
            <div class="os-window-header"><span>⚙️ 系统控制中心</span><div class="window-controls-group"><div class="os-window-close">×</div></div></div>
            <div class="os-window-body">
                <div class="settings-body">
                    <div style="color:#4ec9b0; font-weight:bold; border-bottom: 1px solid #444; padding-bottom: 5px;">外观设置</div>
                    <div class="settings-row"><span>网页壁纸模糊度:</span><input type="range" class="settings-slider" id="set-blur" min="0" max="25" value="${OS_DATA.settings.blur}"><span id="txt-blur" style="width:40px;">${OS_DATA.settings.blur}px</span></div>
                    <div class="settings-row"><span>原网页背景亮度:</span><input type="range" class="settings-slider" id="set-bright" min="0" max="95" value="${OS_DATA.settings.brightness}"><span id="txt-bright" style="width:40px;">${100 - OS_DATA.settings.brightness}%</span></div>

                    <div style="color:#da70d6; font-weight:bold; border-bottom: 1px solid #444; padding-bottom: 5px; margin-top:10px;">AI 终端配置 (apilio.ai)</div>
                    <div class="settings-row">
                        <span style="width:70px;">API Key:</span>
                        <input type="password" class="settings-input" id="set-apikey" placeholder="sk-..." value="${OS_DATA.settings.apiKey}">
                    </div>
                    <div class="settings-row" style="margin-top: 5px;">
                        <span style="width:70px;">默认模型:</span>
                        <select class="settings-input" id="set-model-select" style="padding: 2px 8px;"></select>
                        <button class="model-btn model-btn-add" id="btn-add-model" title="添加新模型">＋</button>
                        <button class="model-btn model-btn-del" id="btn-del-model" title="删除当前选中的模型">－</button>
                    </div>
                </div>
            </div>
            <div class="os-window-resize-handle"></div>
        `;
        desktop.appendChild(win);

        const sBlur = win.querySelector('#set-blur');
        const sBright = win.querySelector('#set-bright');
        const sApi = win.querySelector('#set-apikey');
        const sModelSelect = win.querySelector('#set-model-select');

        // 模型下拉列表渲染逻辑
        const renderModelOptions = () => {
            sModelSelect.innerHTML = '';
            OS_DATA.settings.modelList.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m; opt.innerText = m;
                if(m === OS_DATA.settings.activeModel) opt.selected = true;
                sModelSelect.appendChild(opt);
            });
        };
        renderModelOptions();

        sBlur.oninput = (e) => {
            OS_DATA.settings.blur = e.target.value;
            win.querySelector('#txt-blur').innerText = `${e.target.value}px`;
            wallpaperBlur.style.backdropFilter = `blur(${OS_DATA.settings.blur}px)`; saveSystemData();
        };
        sBright.oninput = (e) => {
            OS_DATA.settings.brightness = e.target.value;
            win.querySelector('#txt-bright').innerText = `${100 - e.target.value}%`;
            wallpaperBlur.style.background = `rgba(0, 0, 0, ${OS_DATA.settings.brightness / 100})`; saveSystemData();
        };
        sApi.oninput = (e) => { OS_DATA.settings.apiKey = e.target.value; saveSystemData(); };

        // 切换模型
        sModelSelect.onchange = (e) => {
            OS_DATA.settings.activeModel = e.target.value;
            saveSystemData();

            // 联动更新已经打开的 AI 聊天窗口的标题
            const chatHeader = shadow.querySelector('#win-ai-chat-terminal .os-window-header span');
            if(chatHeader) chatHeader.innerText = `🤖 AI 智能终端 (${OS_DATA.settings.activeModel})`;
        };

        // 添加模型
        win.querySelector('#btn-add-model').onclick = () => {
            const newModel = prompt('请输入你要添加的新模型名称 (例如: gpt-4-turbo 或 claude-3-opus):');
            if(newModel && newModel.trim() !== '') {
                const cleanModel = newModel.trim();
                if(!OS_DATA.settings.modelList.includes(cleanModel)) {
                    OS_DATA.settings.modelList.push(cleanModel);
                }
                OS_DATA.settings.activeModel = cleanModel;
                saveSystemData();
                renderModelOptions();
            }
        };

        // 删除模型
        win.querySelector('#btn-del-model').onclick = () => {
            if(OS_DATA.settings.modelList.length <= 1) {
                alert('⚠️ 至少需要保留一个模型！');
                return;
            }
            if(confirm(`确定要从列表中移除模型 [${OS_DATA.settings.activeModel}] 吗？`)) {
                OS_DATA.settings.modelList = OS_DATA.settings.modelList.filter(m => m !== OS_DATA.settings.activeModel);
                OS_DATA.settings.activeModel = OS_DATA.settings.modelList[0]; // 默认回退到第一个
                saveSystemData();
                renderModelOptions();
            }
        };

        win.querySelector('.os-window-close').onclick = () => win.remove();
        bindWindowDragAndResize(win, win.querySelector('.os-window-header'), win.querySelector('.os-window-resize-handle'));
    }

    // --- 8. 窗口拖动和拉伸 ---
    function bindWindowDragAndResize(win, header, resizeHandle) {
        let isDragging = false;
        let shiftX, shiftY;
        header.addEventListener('mousedown', (e) => {
            if(e.target.closest('.os-window-close') || e.target.closest('.win-btn-save')) return;
            isDragging = true; shiftX = e.clientX - win.getBoundingClientRect().left; shiftY = e.clientY - win.getBoundingClientRect().top;
            document.body.style.userSelect = 'none';
        });
        let isResizing = false; let startW, startH, startX, startY;
        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation(); e.preventDefault(); isResizing = true;
            startW = win.offsetWidth; startH = win.offsetHeight; startX = e.clientX; startY = e.clientY;
        });
        document.addEventListener('mousemove', (e) => {
            if (isDragging) { let left = e.clientX - shiftX; let top = e.clientY - shiftY; if(top < 0) top = 0; win.style.left = left + 'px'; win.style.top = top + 'px'; }
            if (isResizing) { win.style.width = Math.max(450, startW + (e.clientX - startX)) + 'px'; win.style.height = Math.max(300, startH + (e.clientY - startY)) + 'px'; }
        });
        document.addEventListener('mouseup', () => { isDragging = false; isResizing = false; document.body.style.userSelect = ''; });
    }

    // --- 9. 字号无级缩放 ---
    function bindCtrlWheelZoom(element) {
        element.addEventListener('wheel', function(e) {
            if (e.ctrlKey) {
                e.preventDefault(); let computed = window.getComputedStyle(this); let size = parseFloat(computed.fontSize) || 14;
                size = e.deltaY < 0 ? Math.min(45, size + 1) : Math.max(10, size - 1); this.style.fontSize = size + 'px';
            }
        }, { passive: false });
    }

    renderSidebarFiles();
})();