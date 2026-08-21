// ==UserScript==
// @name         网页模拟桌面系统 (Web OS) - 终极优化版(apilio) 2.0
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  新增 AI 对话特殊符号支持、Ctrl+Enter 换行、侧边栏折叠收起功能、色调选择、窗口记忆、刷新后自动恢复桌面模式、Snippets、浅色模式、最小化/全屏、未匹配括号标红。
// @author       cmq
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      ce.judge0.com
// @connect      api.judge0.com
// @connect      api.apilio.ai
// @run-at        document-end
// ==/UserScript==
(function() {
    'use strict';
    if (window.top !== window.self) return;

    // --- 1. 核心持久化数据中心 ---
    let DEFAULT_OS_DATA = {
        files: [
            { id: 'f1', name: 'README.txt', type: 'txt', content: '欢迎来到优化版 Web OS！\n\n【功能列表】\n1. AI 终端支持输入 < > () 等编程符号！\n2. AI 终端输入框支持 Ctrl+Enter 快捷换行。\n3. 左侧边栏小箭头可折叠/展开侧边栏。\n4. 支持选择系统色调，含浅色模式！\n5. 支持窗口记忆，刷新后窗口不消失！\n6. C++ Snippets 快速插入（55+代码片段）！\n7. 括号自动补全 + 闭合跳过 + 配对删除！\n8. 未匹配括号实时标红（浅色模式标蓝）！\n9. 窗口最小化/全屏/还原！\n10. Word/Excel 真实格式下载！' },
            { id: 'f2', name: 'main.cpp', type: 'cpp', content: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cout << "请输入两个整数（在右侧输入框填写，用空格隔开）：" << endl;\n    if (cin >> a >> b) {\n        cout << "👉 远程编译计算结果：" << a << " + " << b << " = " << (a + b) << endl;\n    } else {\n        cout << "⚠️ 未检测到有效的输入数据！" << endl;\n    }\n    return 0;\n}' },
            { id: 'f3', name: '季度财务核算.xlsx', type: 'xlsx', content: [["指标项目","第一季度","第二季度","环比增长"],["业务营收","89000","104000","16.8%"]] },
            { id: 'f4', name: '商业计划书.docx', type: 'docx', content: '<div><font size="5"><b>智能系统深度重构计划</b></font></div>' }
        ],
        settings: {
            blur: 10,
            brightness: 40,
            apiKey: '',
            activeModel: 'gpt-4o',
            modelList: ['gpt-4o', 'gpt-3.5-turbo', 'claude-3-5-sonnet'],
            theme: 'default',
            rememberWindows: false,
            autoRestoreDesktop: false
        },
        openWindows: [],
        desktopActive: false
    };

    let OS_DATA = JSON.parse(localStorage.getItem('MOCK_OS_DATA_V11')) || DEFAULT_OS_DATA;

    if (!OS_DATA.settings.theme) OS_DATA.settings.theme = 'default';
    if (OS_DATA.settings.rememberWindows === undefined) OS_DATA.settings.rememberWindows = false;
    if (OS_DATA.settings.autoRestoreDesktop === undefined) OS_DATA.settings.autoRestoreDesktop = false;
    if (!OS_DATA.openWindows) OS_DATA.openWindows = [];
    if (OS_DATA.desktopActive === undefined) OS_DATA.desktopActive = false;

    if (OS_DATA.settings.model) {
        OS_DATA.settings.activeModel = OS_DATA.settings.model;
        OS_DATA.settings.modelList = ['gpt-4o', 'gpt-3.5-turbo', OS_DATA.settings.model];
        delete OS_DATA.settings.model;
        saveSystemData();
    }

    let saveTimer = null;
    function saveSystemData() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            localStorage.setItem('MOCK_OS_DATA_V11', JSON.stringify(OS_DATA));
        }, 300);
    }
    function saveSystemDataNow() {
        clearTimeout(saveTimer);
        localStorage.setItem('MOCK_OS_DATA_V11', JSON.stringify(OS_DATA));
    }

    let zIndexCounter = 200000;

    // --- 色调主题定义 ---
    const THEMES = {
        default: {
            label: '🌙 默认深色',
            sidebarBg: 'rgba(40, 40, 45, 0.4)', taskbarBg: 'rgba(25, 25, 30, 0.8)',
            winBg: '#1e1e1e', winHeader: '#2d2d2d', winBorder: '#444', winBorderBottom: '#3c3c3c',
            statusBarBg: '#007acc', accentColor: '#0078d4', accentHover: '#106ebe',
            entryBtnBg: '#0078d4', entryBtnHover: '#106ebe',
            sidebarToggleBg: 'rgba(40, 40, 45, 0.9)', sidebarToggleHoverBg: 'rgba(80, 80, 85, 0.9)',
            textPrimary: '#ddd', textSecondary: '#aaa',
            terminalBg: '#141414', codeGutterBorder: '#2d2d2d', codeGutterColor: '#858585', codeGutterBg: '#1e1e1e',
            terminalGreen: '#33ff33', stdinBg: '#1c1c1c', stdinBorder: '#2d2d2d', stdinTitleBg: '#252526', stdinColor: '#ffb3ff',
            inputBg: '#3c3c3c', inputBorder: '#555', settingsBodyBg: '#252526', vsTabBg: '#2d2d2d', vsTabBorder: '#252526',
            bracketUnmatchedColor: '#ff3333', taskbarMinBtnBg: 'rgba(255,255,255,0.08)', taskbarMinBtnHoverBg: 'rgba(255,255,255,0.15)'
        },
        blue: {
            label: '🔵 蓝色海洋',
            sidebarBg: 'rgba(20, 40, 80, 0.45)', taskbarBg: 'rgba(10, 25, 55, 0.85)',
            winBg: '#0d1b2a', winHeader: '#1b2838', winBorder: '#2a4a7f', winBorderBottom: '#1e3a5f',
            statusBarBg: '#1565c0', accentColor: '#42a5f5', accentHover: '#1e88e5',
            entryBtnBg: '#1565c0', entryBtnHover: '#0d47a1',
            sidebarToggleBg: 'rgba(20, 40, 80, 0.9)', sidebarToggleHoverBg: 'rgba(30, 60, 110, 0.9)',
            textPrimary: '#bbdefb', textSecondary: '#90caf9',
            terminalBg: '#0a1628', codeGutterBorder: '#1b2838', codeGutterColor: '#5c8bc4', codeGutterBg: '#0d1b2a',
            terminalGreen: '#64ffda', stdinBg: '#0f1f35', stdinBorder: '#1b2838', stdinTitleBg: '#1b2838', stdinColor: '#80d8ff',
            inputBg: '#1b2838', inputBorder: '#2a4a7f', settingsBodyBg: '#0d1b2a', vsTabBg: '#1b2838', vsTabBorder: '#152238',
            bracketUnmatchedColor: '#ff3333', taskbarMinBtnBg: 'rgba(255,255,255,0.08)', taskbarMinBtnHoverBg: 'rgba(255,255,255,0.15)'
        },
        purple: {
            label: '🟣 紫色梦幻',
            sidebarBg: 'rgba(45, 20, 70, 0.45)', taskbarBg: 'rgba(30, 10, 50, 0.85)',
            winBg: '#1a0a2e', winHeader: '#2d1b4e', winBorder: '#6a3d9a', winBorderBottom: '#3c2060',
            statusBarBg: '#7b1fa2', accentColor: '#ab47bc', accentHover: '#8e24aa',
            entryBtnBg: '#7b1fa2', entryBtnHover: '#6a1b9a',
            sidebarToggleBg: 'rgba(45, 20, 70, 0.9)', sidebarToggleHoverBg: 'rgba(65, 30, 100, 0.9)',
            textPrimary: '#e1bee7', textSecondary: '#ce93d8',
            terminalBg: '#0d0520', codeGutterBorder: '#2d1b4e', codeGutterColor: '#9c7cbf', codeGutterBg: '#1a0a2e',
            terminalGreen: '#ea80fc', stdinBg: '#160830', stdinBorder: '#2d1b4e', stdinTitleBg: '#2d1b4e', stdinColor: '#ea80fc',
            inputBg: '#2d1b4e', inputBorder: '#6a3d9a', settingsBodyBg: '#1a0a2e', vsTabBg: '#2d1b4e', vsTabBorder: '#200e3a',
            bracketUnmatchedColor: '#ff3333', taskbarMinBtnBg: 'rgba(255,255,255,0.08)', taskbarMinBtnHoverBg: 'rgba(255,255,255,0.15)'
        },
        green: {
            label: '🟢 绿色森林',
            sidebarBg: 'rgba(20, 50, 30, 0.45)', taskbarBg: 'rgba(10, 35, 20, 0.85)',
            winBg: '#0a1f0d', winHeader: '#1b3a1e', winBorder: '#2e7d32', winBorderBottom: '#1e5520',
            statusBarBg: '#2e7d32', accentColor: '#4caf50', accentHover: '#388e3c',
            entryBtnBg: '#2e7d32', entryBtnHover: '#1b5e20',
            sidebarToggleBg: 'rgba(20, 50, 30, 0.9)', sidebarToggleHoverBg: 'rgba(30, 70, 40, 0.9)',
            textPrimary: '#c8e6c9', textSecondary: '#a5d6a7',
            terminalBg: '#051508', codeGutterBorder: '#1b3a1e', codeGutterColor: '#6abf6e', codeGutterBg: '#0a1f0d',
            terminalGreen: '#69f0ae', stdinBg: '#0d1f10', stdinBorder: '#1b3a1e', stdinTitleBg: '#1b3a1e', stdinColor: '#b9f6ca',
            inputBg: '#1b3a1e', inputBorder: '#2e7d32', settingsBodyBg: '#0a1f0d', vsTabBg: '#1b3a1e', vsTabBorder: '#12301a',
            bracketUnmatchedColor: '#ff3333', taskbarMinBtnBg: 'rgba(255,255,255,0.08)', taskbarMinBtnHoverBg: 'rgba(255,255,255,0.15)'
        },
        amber: {
            label: '🟠 琥珀暖阳',
            sidebarBg: 'rgba(50, 35, 10, 0.45)', taskbarBg: 'rgba(40, 25, 5, 0.85)',
            winBg: '#1a1200', winHeader: '#33260a', winBorder: '#8d6e24', winBorderBottom: '#5a4210',
            statusBarBg: '#e65100', accentColor: '#ff9800', accentHover: '#f57c00',
            entryBtnBg: '#e65100', entryBtnHover: '#bf360c',
            sidebarToggleBg: 'rgba(50, 35, 10, 0.9)', sidebarToggleHoverBg: 'rgba(70, 50, 15, 0.9)',
            textPrimary: '#ffe0b2', textSecondary: '#ffcc80',
            terminalBg: '#0f0b00', codeGutterBorder: '#33260a', codeGutterColor: '#bf9b4f', codeGutterBg: '#1a1200',
            terminalGreen: '#ffd54f', stdinBg: '#1a1508', stdinBorder: '#33260a', stdinTitleBg: '#33260a', stdinColor: '#ffe082',
            inputBg: '#33260a', inputBorder: '#8d6e24', settingsBodyBg: '#1a1200', vsTabBg: '#33260a', vsTabBorder: '#241a05',
            bracketUnmatchedColor: '#ff3333', taskbarMinBtnBg: 'rgba(255,255,255,0.08)', taskbarMinBtnHoverBg: 'rgba(255,255,255,0.15)'
        },
        red: {
            label: '🔴 赤焰红',
            sidebarBg: 'rgba(50, 15, 15, 0.45)', taskbarBg: 'rgba(40, 10, 10, 0.85)',
            winBg: '#1a0808', winHeader: '#331515', winBorder: '#8b2020', winBorderBottom: '#5a1515',
            statusBarBg: '#c62828', accentColor: '#ef5350', accentHover: '#d32f2f',
            entryBtnBg: '#c62828', entryBtnHover: '#b71c1c',
            sidebarToggleBg: 'rgba(50, 15, 15, 0.9)', sidebarToggleHoverBg: 'rgba(70, 20, 20, 0.9)',
            textPrimary: '#ffcdd2', textSecondary: '#ef9a9a',
            terminalBg: '#0f0505', codeGutterBorder: '#331515', codeGutterColor: '#bf6060', codeGutterBg: '#1a0808',
            terminalGreen: '#ff8a80', stdinBg: '#1a0a0a', stdinBorder: '#331515', stdinTitleBg: '#331515', stdinColor: '#ff8a80',
            inputBg: '#331515', inputBorder: '#8b2020', settingsBodyBg: '#1a0808', vsTabBg: '#331515', vsTabBorder: '#240a0a',
            bracketUnmatchedColor: '#ff3333', taskbarMinBtnBg: 'rgba(255,255,255,0.08)', taskbarMinBtnHoverBg: 'rgba(255,255,255,0.15)'
        },
        light: {
            label: '☀️ 浅色模式',
            sidebarBg: 'rgba(230, 230, 235, 0.75)', taskbarBg: 'rgba(210, 210, 215, 0.88)',
            winBg: '#ffffff', winHeader: '#f3f3f3', winBorder: '#d4d4d4', winBorderBottom: '#e0e0e0',
            statusBarBg: '#007acc', accentColor: '#0078d4', accentHover: '#106ebe',
            entryBtnBg: '#0078d4', entryBtnHover: '#106ebe',
            sidebarToggleBg: 'rgba(210, 210, 215, 0.95)', sidebarToggleHoverBg: 'rgba(190, 190, 195, 0.95)',
            textPrimary: '#333', textSecondary: '#666',
            terminalBg: '#f9f9f9', codeGutterBorder: '#e0e0e0', codeGutterColor: '#999', codeGutterBg: '#f5f5f5',
            terminalGreen: '#008000', stdinBg: '#f0f0f0', stdinBorder: '#d4d4d4', stdinTitleBg: '#e8e8e8', stdinColor: '#8b008b',
            inputBg: '#fff', inputBorder: '#ccc', settingsBodyBg: '#f5f5f5', vsTabBg: '#f0f0f0', vsTabBorder: '#e0e0e0',
            bracketUnmatchedColor: '#0066ff', taskbarMinBtnBg: 'rgba(0,0,0,0.05)', taskbarMinBtnHoverBg: 'rgba(0,0,0,0.1)'
        }
    };

    function getTheme() { return THEMES[OS_DATA.settings.theme] || THEMES['default']; }

    // --- 2. Shadow DOM ---
    const host = document.createElement('div');
    host.id = 'os-shadow-host';
    host.style.cssText = 'position: fixed !important; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647 !important; pointer-events: none;';
    document.documentElement.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.innerHTML = `
        #os-entry-btn {
            position: fixed !important; bottom: 65px !important; right: 20px !important;
            background: var(--accent-color) !important; color: white !important; padding: 12px 24px !important;
            border-radius: 4px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            cursor: pointer !important; font-family: system-ui, sans-serif !important; font-weight: 500 !important;
            pointer-events: auto !important; display: block; user-select: none; border: 1px solid rgba(255,255,255,0.2) !important;
        }
        #os-entry-btn:hover { background: var(--accent-hover) !important; }

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

        #os-sidebar {
            position: absolute; top: 0; left: 0; width: 240px; height: calc(100vh - 45px);
            background: var(--sidebar-bg); backdrop-filter: blur(25px);
            border-right: 1px solid rgba(255,255,255,0.1); color: white; display: flex; flex-direction: column;
            box-shadow: 5px 0 25px rgba(0,0,0,0.3);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 100;
        }

        #sidebar-toggle {
            position: absolute; right: -24px; top: 50%; transform: translateY(-50%);
            width: 24px; height: 50px; background: var(--sidebar-toggle-bg); color: white;
            display: flex; align-items: center; justify-content: center; cursor: pointer;
            border-radius: 0 6px 6px 0; border: 1px solid rgba(255,255,255,0.2); border-left: none;
            font-size: 12px; z-index: 101; transition: background 0.2s;
        }
        #sidebar-toggle:hover { background: var(--sidebar-toggle-hover-bg); }

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

        #os-taskbar {
            position: absolute; bottom: 0; left: 0; width: 100vw; height: 45px;
            background: var(--taskbar-bg); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: space-between;
            padding: 0 15px; box-sizing: border-box; border-top: 1px solid rgba(255,255,255,0.1); color: white; user-select: none;
            z-index: 102;
        }
        .taskbar-left { display: flex; align-items: center; gap: 10px; height: 100%; }
        .taskbar-search-box { background: rgba(255,255,255,0.85); border: none; border-radius: 4px; padding: 6px 12px; width: 180px; font-size: 12px; color: #333; outline: none; transition: width 0.2s; }
        .taskbar-search-box:focus { width: 250px; background: #fff; }
        .taskbar-icon-btn { font-size: 18px; cursor: pointer; padding: 6px 10px; border-radius: 4px; display: flex; align-items: center; }
        .taskbar-icon-btn:hover { background: rgba(255,255,255,0.1); }
        #os-exit-btn { background: rgba(220, 53, 69, 0.8); color: white; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; }
        #os-exit-btn:hover { background: #dc3545; }
        #os-clock { font-size: 12px; color: #ccc; text-align: right; line-height:1.2; }

        .taskbar-minimized-item {
            background: var(--taskbar-min-btn-bg); color: white; padding: 4px 12px; border-radius: 3px;
            cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px; max-width: 160px;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: background 0.15s;
        }
        .taskbar-minimized-item:hover { background: var(--taskbar-min-btn-hover-bg); }

        .os-window {
            position: absolute; top: 100px; left: 300px; width: 780px; height: 580px;
            background: var(--win-bg); border: 1px solid var(--win-border); border-radius: 6px; display: flex; flex-direction: column;
            box-shadow: 0 15px 40px rgba(0,0,0,0.6); overflow: hidden; min-width: 450px; min-height: 300px;
            transition: none;
        }
        .os-window.maximized {
            top: 0 !important; left: 0 !important; width: 100vw !important; height: calc(100vh - 45px) !important;
            border-radius: 0 !important; border: none !important;
        }
        .os-window.minimized { display: none !important; }

        .os-window-header {
            background: var(--win-header); padding: 0 0 0 12px; display: flex; justify-content: space-between; align-items: center;
            cursor: move; user-select: none; color: var(--text-primary); font-size: 13px; border-bottom: 1px solid var(--win-border-bottom); height: 32px;
        }
        .window-controls-group { display: flex; align-items: center; height: 100%; }
        .win-ctrl-btn {
            width: 36px; height: 32px; color: #aaa; font-size: 14px; font-family: 'Segoe UI', sans-serif;
            display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.1s;
        }
        .win-ctrl-btn:hover { background: rgba(255,255,255,0.1); }
        .win-ctrl-btn.win-btn-close:hover { background: #e81123 !important; color: #fff !important; }
        .win-btn-save { color: #57a6ff; font-size: 12px; cursor: pointer; user-select: none; font-weight: bold; padding: 0 8px; }
        .win-btn-save:hover { color: #79b8ff; }
        .os-window-body { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .os-window-resize-handle { position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; cursor: se-resize; z-index: 99999; background: transparent; }

        .code-editor-container { display: flex; flex-grow: 1; background: var(--win-bg); overflow: hidden; position: relative; flex-direction: column; }
        .vscode-tabs-bar { height: 30px; background: var(--vs-tab-bg); display: flex; align-items: center; justify-content: space-between; padding-right: 12px; border-bottom: 1px solid var(--vs-tab-border); user-select: none; }
        .vscode-tab-item { background: var(--win-bg); color: #fff; height: 100%; display: flex; align-items: center; padding: 0 16px; font-size: 12px; border-right: 1px solid var(--vs-tab-border); gap: 6px; font-family: monospace; }
        .vscode-run-btn { color: #4ec9b0; cursor: pointer; font-size: 14px; padding: 4px 12px; border-radius: 4px; display: flex; align-items: center; font-weight: bold; background: rgba(78,201,176,0.1); }
        .vscode-run-btn:hover { background: rgba(78,201,176,0.25); color: #4cee9f; }

        .code-editor-main-split { display: flex; flex-grow: 1; overflow: hidden; position: relative; height: 55%; }
        .code-gutter { width: 48px; background: var(--code-gutter-bg); border-right: 1px solid var(--code-gutter-border); color: var(--code-gutter-color); text-align: right; padding: 12px 10px 12px 0; font-family: 'Consolas', monospace; font-size: 14px; line-height: 1.5; user-select: none; overflow: hidden; box-sizing: border-box; }
        .code-gutter div { height: 21px; }
        .code-textarea-wrap { flex-grow: 1; position: relative; height: 100%; background: var(--win-bg); }
        .os-textarea { width: 100%; height: 100%; background: transparent; color: #d4d4d4; font-family: 'Consolas', monospace; font-size: 14px; padding: 12px; border: none; resize: none; outline: none; box-sizing: border-box; line-height: 1.5; overflow-y: auto; white-space: pre; caret-color: #aeafad; }

        .bracket-highlight-layer {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; overflow: hidden; z-index: 1;
            font-family: 'Consolas', monospace; font-size: 14px; padding: 12px; line-height: 1.5;
            white-space: pre; color: transparent; box-sizing: border-box;
        }
        .bracket-highlight-layer .unmatched { color: var(--bracket-unmatched-color); font-weight: bold; }

        .vscode-terminal-panel { height: 40%; background: var(--terminal-bg); border-top: 1px solid var(--code-gutter-border); display: flex; flex-direction: column; color: #cccccc; font-family: 'Consolas', monospace; }
        .terminal-header { height: 26px; background: var(--win-bg); display: flex; justify-content: space-between; align-items: center; padding: 0 12px; font-size: 11px; color: var(--text-secondary); border-bottom: 1px solid var(--vs-tab-border); user-select: none; }
        .terminal-header span.active { color: #fff; border-bottom: 2px solid var(--accent-color); font-weight: bold; padding: 4px 0; }
        .terminal-main-layout { display: flex; flex-grow: 1; overflow: hidden; }
        .terminal-body { flex: 7; padding: 10px 12px; overflow-y: auto; font-size: 13px; line-height: 1.4; color: var(--terminal-green); white-space: pre-wrap; background: var(--terminal-bg); }
        .terminal-stdin-area { flex: 3; background: var(--stdin-bg); border-left: 1px solid var(--stdin-border); display: flex; flex-direction: column; }
        .stdin-title { font-size: 11px; color: #da70d6; padding: 4px 8px; background: var(--stdin-title-bg); user-select: none; font-weight: bold; }
        .os-stdin-input { flex-grow: 1; background: transparent; color: var(--stdin-color); font-family: 'Consolas', monospace; font-size: 13px; padding: 8px; border: none; resize: none; outline: none; line-height: 1.4; }

        .vscode-status-bar { height: 22px; background: var(--status-bar-bg); color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 10px; font-size: 12px; user-select: none; }

        .word-container { display: flex; flex-direction: column; height: 100%; background: #f3f2f1; color: #333; }
        .word-ribbon { background: #2b579a; color: white; padding: 0 12px; font-size: 12px; display: flex; gap: 18px; align-items: center; height: 28px; user-select: none; }
        .word-page-viewport { flex-grow: 1; overflow-y: auto; padding: 25px; display: flex; justify-content: center; }
        .word-page { background: white; width: 100%; max-width: 650px; min-height: 500px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); padding: 45px; box-sizing: border-box; outline: none; font-family: system-ui; font-size: 15px; line-height: 1.6; }

        .excel-container { display: flex; flex-direction: column; height: 100%; background: #fff; color: #333; font-size: 12px; }
        .excel-ribbon { background: #107c41; color: white; padding: 4px 12px; font-size: 12px; display: flex; gap: 15px; align-items: center; height: 26px; user-select: none; }
        .excel-formula-bar { background: #f3f2f1; border-bottom: 1px solid #d2d0ce; padding: 4px 12px; display: flex; align-items: center; gap: 8px; box-sizing: border-box; }
        .excel-formula-input { flex-grow: 1; border: 1px solid #d2d0ce; padding: 2px 6px; background: white; outline: none; font-family: monospace; }
        .excel-grid-viewport { flex-grow: 1; overflow: auto; background: #f3f2f1; }
        .excel-table { border-collapse: collapse; background: white; table-layout: fixed; width: max-content; }
        .excel-table th { background: #f3f2f1; border: 1px solid #d2d0ce; font-weight: normal; color: #605e5c; text-align: center; height: 22px; user-select: none; }
        .excel-table td { border: 1px solid #d2d0ce; padding: 0 6px; height: 22px; outline: none; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; box-sizing: border-box; }
        .excel-table td.selected-cell { border: 2px solid #107c41 !important; background: #e1f2e9; }

        .settings-body { padding: 20px; font-size: 13px; display: flex; flex-direction: column; gap: 15px; background: var(--settings-body-bg); height:100%; box-sizing: border-box; color: #ddd; overflow-y: auto; }
        .settings-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .settings-slider { flex-grow: 1; cursor: pointer; accent-color: var(--accent-color); }
        .settings-input { flex-grow: 1; background: var(--input-bg); border: 1px solid var(--input-border); color: white; padding: 4px 8px; outline: none; font-family: monospace; }
        .model-btn { cursor: pointer; border: none; padding: 4px 8px; font-weight: bold; border-radius: 3px; font-size: 14px; line-height: 1; }
        .model-btn-add { background: var(--accent-color); color: white; }
        .model-btn-add:hover { background: var(--accent-hover); }
        .model-btn-del { background: #d83b01; color: white; }
        .model-btn-del:hover { background: #ea4a1f; }

        .theme-selector { display: flex; gap: 8px; flex-wrap: wrap; }
        .theme-swatch {
            width: 28px; height: 28px; border-radius: 50%; cursor: pointer; border: 2px solid transparent;
            display: flex; align-items: center; justify-content: center; font-size: 14px; transition: border-color 0.2s, transform 0.15s;
        }
        .theme-swatch:hover { transform: scale(1.15); }
        .theme-swatch.active { border-color: #fff; transform: scale(1.15); }

        .toggle-switch {
            position: relative; width: 44px; height: 24px; background: #555; border-radius: 12px;
            cursor: pointer; transition: background 0.3s; flex-shrink: 0;
        }
        .toggle-switch.active { background: var(--accent-color); }
        .toggle-switch::after {
            content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px;
            background: white; border-radius: 50%; transition: transform 0.3s;
        }
        .toggle-switch.active::after { transform: translateX(20px); }

        .snippet-dropdown {
            position: absolute; top: 30px; right: 0; width: 280px; max-height: 320px;
            background: #252526; border: 1px solid #444; border-radius: 6px; overflow-y: auto;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5); z-index: 9999; display: none;
        }
        .snippet-dropdown.show { display: block; }
        .snippet-item {
            padding: 8px 12px; cursor: pointer; color: #ccc; font-size: 12px; border-bottom: 1px solid #333;
            display: flex; justify-content: space-between; align-items: center;
        }
        .snippet-item:last-child { border-bottom: none; }
        .snippet-item:hover { background: #094771; color: #fff; }
        .snippet-item .snippet-name { font-weight: bold; color: #4ec9b0; }
        .snippet-item .snippet-prefix { color: #888; font-family: monospace; }

        /* ===== 浅色模式覆盖 ===== */
        [data-theme-active="light"] .os-textarea { color: #1e1e1e !important; caret-color: #000 !important; }
        [data-theme-active="light"] .vscode-tab-item { color: #333 !important; }
        [data-theme-active="light"] .terminal-header { color: #555 !important; }
        [data-theme-active="light"] .terminal-header span.active { color: #000 !important; border-bottom-color: #0078d4 !important; }
        [data-theme-active="light"] .terminal-body { color: #006600 !important; }
        [data-theme-active="light"] .os-stdin-input { color: #8b008b !important; }
        [data-theme-active="light"] .stdin-title { color: #8b008b !important; }
        [data-theme-active="light"] .vscode-run-btn { color: #007a6a !important; background: rgba(0,122,106,0.1) !important; }
        [data-theme-active="light"] .vscode-run-btn:hover { color: #009980 !important; background: rgba(0,122,106,0.2) !important; }
        [data-theme-active="light"] .vscode-snippet-btn { color: #7a6a00 !important; background: rgba(122,106,0,0.1) !important; }
        [data-theme-active="light"] .win-btn-save { color: #0066cc !important; }
        [data-theme-active="light"] .win-btn-save:hover { color: #004499 !important; }
        [data-theme-active="light"] .snippet-dropdown { background: #fff !important; border-color: #ccc !important; box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important; }
        [data-theme-active="light"] .snippet-item { color: #333 !important; border-bottom-color: #e0e0e0 !important; }
        [data-theme-active="light"] .snippet-item:hover { background: #e8f0fe !important; color: #000 !important; }
        [data-theme-active="light"] .snippet-item .snippet-name { color: #007a6a !important; }
        [data-theme-active="light"] .snippet-item .snippet-prefix { color: #888 !important; }
        [data-theme-active="light"] .win-ctrl-btn { color: #666 !important; }
        [data-theme-active="light"] .win-ctrl-btn:hover { background: rgba(0,0,0,0.06) !important; }
        [data-theme-active="light"] .win-ctrl-btn.win-btn-close:hover { background: #e81123 !important; color: #fff !important; }
        [data-theme-active="light"] .file-node { color: #333 !important; }
        [data-theme-active="light"] .file-node:hover { background: rgba(0,0,0,0.06) !important; }
        [data-theme-active="light"] .file-raw-delete-btn { color: #d32f2f !important; }
        [data-theme-active="light"] .file-raw-delete-btn:hover { color: #b71c1c !important; }
        [data-theme-active="light"] .folder-tree-title { color: rgba(0,0,0,0.4) !important; }
        [data-theme-active="light"] .sidebar-top-bar { background: rgba(0,0,0,0.05) !important; border-bottom-color: rgba(0,0,0,0.08) !important; }
        [data-theme-active="light"] .sidebar-create-btn { color: #333 !important; background: rgba(0,0,0,0.06) !important; border-color: rgba(0,0,0,0.1) !important; }
        [data-theme-active="light"] .sidebar-create-btn:hover { background: rgba(0,0,0,0.1) !important; }
        [data-theme-active="light"] #os-sidebar { border-right-color: rgba(0,0,0,0.1) !important; box-shadow: 5px 0 15px rgba(0,0,0,0.08) !important; }
        [data-theme-active="light"] #os-taskbar { border-top-color: rgba(0,0,0,0.1) !important; color: #333 !important; }
        [data-theme-active="light"] #os-clock { color: #555 !important; }
        [data-theme-active="light"] .taskbar-icon-btn:hover { background: rgba(0,0,0,0.06) !important; }
        [data-theme-active="light"] #os-exit-btn { background: rgba(220, 53, 69, 0.9) !important; color: white !important; }
        [data-theme-active="light"] .os-window-header { border-bottom-color: #e0e0e0 !important; }
        [data-theme-active="light"] .os-window { box-shadow: 0 15px 40px rgba(0,0,0,0.15) !important; }
        [data-theme-active="light"] .toggle-switch { background: #bbb !important; }
        [data-theme-active="light"] .toggle-switch.active { background: #0078d4 !important; }
        [data-theme-active="light"] .settings-body { color: #333 !important; }
        [data-theme-active="light"] .settings-input { color: #333 !important; }
        [data-theme-active="light"] .vscode-status-bar { color: #fff !important; }
        [data-theme-active="light"] .taskbar-minimized-item { color: #333 !important; }
    `;
    shadow.appendChild(style);

    function applyTheme() {
        const t = getTheme();
        const desktop = shadow.getElementById('os-desktop');
        if (!desktop) return;
        const vars = [
            ['--sidebar-bg', t.sidebarBg], ['--taskbar-bg', t.taskbarBg],
            ['--win-bg', t.winBg], ['--win-header', t.winHeader],
            ['--win-border', t.winBorder], ['--win-border-bottom', t.winBorderBottom],
            ['--status-bar-bg', t.statusBarBg], ['--accent-color', t.accentColor],
            ['--accent-hover', t.accentHover], ['--entry-btn-bg', t.entryBtnBg],
            ['--entry-btn-hover', t.entryBtnHover], ['--sidebar-toggle-bg', t.sidebarToggleBg],
            ['--sidebar-toggle-hover-bg', t.sidebarToggleHoverBg],
            ['--text-primary', t.textPrimary], ['--text-secondary', t.textSecondary],
            ['--terminal-bg', t.terminalBg], ['--code-gutter-border', t.codeGutterBorder],
            ['--code-gutter-color', t.codeGutterColor], ['--code-gutter-bg', t.codeGutterBg],
            ['--terminal-green', t.terminalGreen], ['--stdin-bg', t.stdinBg],
            ['--stdin-border', t.stdinBorder], ['--stdin-title-bg', t.stdinTitleBg],
            ['--stdin-color', t.stdinColor], ['--input-bg', t.inputBg],
            ['--input-border', t.inputBorder], ['--settings-body-bg', t.settingsBodyBg],
            ['--vs-tab-bg', t.vsTabBg], ['--vs-tab-border', t.vsTabBorder],
            ['--bracket-unmatched-color', t.bracketUnmatchedColor],
            ['--taskbar-min-btn-bg', t.taskbarMinBtnBg],
            ['--taskbar-min-btn-hover-bg', t.taskbarMinBtnHoverBg]
        ];
        vars.forEach(([k, v]) => desktop.style.setProperty(k, v));
        const entryBtn = shadow.getElementById('os-entry-btn');
        if (entryBtn) {
            entryBtn.style.setProperty('--accent-color', t.accentColor);
            entryBtn.style.setProperty('--accent-hover', t.accentHover);
        }
        desktop.setAttribute('data-theme-active', OS_DATA.settings.theme);
    }

    // --- 3. 基础桌面设施 ---
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
                <div class="taskbar-icon-btn" id="taskbar-settings-btn" title="系统设置">⚙️</div>
                <input type="text" class="taskbar-search-box" id="global-search" placeholder="在这里输入你想搜索的内容">
                <div id="os-exit-btn">⏻ 退出桌面</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
                <div id="taskbar-minimized-list" style="display:flex;gap:4px;align-items:center;"></div>
                <div id="os-clock">00:00:00</div>
            </div>
        </div>
    `;
    shadow.appendChild(desktop);

    applyTheme();

    const wallpaperBlur = shadow.getElementById('os-wallpaper-blur');
    const sidebar = shadow.getElementById('os-sidebar');
    const sidebarToggle = shadow.getElementById('sidebar-toggle');
    const taskbarMinList = shadow.getElementById('taskbar-minimized-list');
    let isSidebarOpen = true;

    sidebarToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        isSidebarOpen = !isSidebarOpen;
        sidebar.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
        sidebarToggle.innerText = isSidebarOpen ? '◀' : '▶';
    });

    function enterDesktopMode() {
        desktop.style.display = 'block';
        entryBtn.style.display = 'none';
        OS_DATA.desktopActive = true;
        saveSystemDataNow();
        if (OS_DATA.settings.rememberWindows && OS_DATA.openWindows && OS_DATA.openWindows.length > 0) {
            restoreWindows();
        }
    }

    function exitDesktopMode() {
        desktop.style.display = 'none';
        entryBtn.style.display = 'block';
        OS_DATA.desktopActive = false;
        saveSystemDataNow();
    }

    entryBtn.addEventListener('click', (e) => { e.stopPropagation(); enterDesktopMode(); }, true);
    shadow.getElementById('os-exit-btn').addEventListener('click', (e) => { e.stopPropagation(); exitDesktopMode(); }, true);

    if (OS_DATA.desktopActive && OS_DATA.settings.autoRestoreDesktop) {
        requestAnimationFrame(() => { enterDesktopMode(); });
    }

    setInterval(() => {
        const d = new Date();
        shadow.getElementById('os-clock').innerHTML =
            `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}<br><span style="font-size:10px;color:#aaa;">${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}</span>`;
    }, 1000);

    shadow.getElementById('global-search').addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase().trim();
        if (keyword === '对话' || keyword === 'ai') {
            openAIChatWindow(); e.target.value = '';
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
            if (file.type === 'cpp') icon = '⚙️';
            if (file.type === 'xlsx') icon = '📊';
            if (file.type === 'docx') icon = '📘';
            el.innerHTML = `<div class="file-info-part"><span>${icon}</span><span>${file.name}</span></div><div class="file-raw-delete-btn" title="彻底删除文件">×</div>`;
            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('file-raw-delete-btn')) return;
                e.stopPropagation(); openAppWindow(file.id);
            });
            el.querySelector('.file-raw-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation(); e.preventDefault();
                if (confirm(`确定要在系统沙盒中彻底删除文件 [${file.name}] 吗？`)) {
                    OS_DATA.files = OS_DATA.files.filter(f => f.id !== file.id);
                    OS_DATA.openWindows = OS_DATA.openWindows.filter(w => w.id !== file.id);
                    saveSystemData(); renderSidebarFiles();
                    const targetWindow = shadow.getElementById(`win-runtime-${file.id}`);
                    if (targetWindow) targetWindow.remove();
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
        saveSystemData(); renderSidebarFiles(); openAppWindow(newFile.id);
    }

    shadow.getElementById('sbar-new-txt').onclick = () => createNewFile('txt');
    shadow.getElementById('sbar-new-cpp').onclick = () => createNewFile('cpp');
    shadow.getElementById('sbar-new-xlsx').onclick = () => createNewFile('xlsx');
    shadow.getElementById('sbar-new-docx').onclick = () => createNewFile('docx');
    shadow.getElementById('taskbar-settings-btn').onclick = () => openSettingsPanel();

    function escapeHTML(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    // --- 窗口记忆 ---
    function getWindowRect(win) {
        const rect = win.getBoundingClientRect();
        return { top: Math.round(rect.top) + 'px', left: Math.round(rect.left) + 'px', width: Math.round(rect.width) + 'px', height: Math.round(rect.height) + 'px' };
    }
    function saveWindowState(winId, extraData) {
        if (!OS_DATA.settings.rememberWindows) return;
        const win = shadow.getElementById(winId);
        if (!win) return;
        const rect = getWindowRect(win);
        const state = { winId, id: extraData.id, type: extraData.type, top: rect.top, left: rect.left, width: rect.width, height: rect.height };
        const existing = OS_DATA.openWindows.find(w => w.id === extraData.id);
        if (existing) Object.assign(existing, state); else OS_DATA.openWindows.push(state);
        saveSystemData();
    }
    function removeWindowState(extraId) {
        if (!OS_DATA.settings.rememberWindows) return;
        OS_DATA.openWindows = OS_DATA.openWindows.filter(w => w.id !== extraId);
        saveSystemDataNow();
    }
    function restoreWindows() {
        const windowsToRestore = JSON.parse(JSON.stringify(OS_DATA.openWindows));
        windowsToRestore.forEach(wState => {
            if (wState.type === 'ai-chat') openAIChatWindow(wState);
            else openAppWindow(wState.id, wState);
        });
    }

    // --- 窗口拖动/拉伸/最小化/全屏 ---
    function bindWindowDragAndResize(win, header, resizeHandle, extraData) {
        let isDragging = false, shiftX, shiftY;
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.win-ctrl-btn') || e.target.closest('.win-btn-save')) return;
            isDragging = true;
            shiftX = e.clientX - win.getBoundingClientRect().left;
            shiftY = e.clientY - win.getBoundingClientRect().top;
            document.body.style.userSelect = 'none';
        });
        let isResizing = false, startW, startH, startX, startY;
        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation(); e.preventDefault();
            isResizing = true;
            startW = win.offsetWidth; startH = win.offsetHeight;
            startX = e.clientX; startY = e.clientY;
        });
        document.addEventListener('mousemove', (e) => {
            if (isDragging && !win.classList.contains('maximized')) {
                let left = e.clientX - shiftX; let top = e.clientY - shiftY;
                if (top < 0) top = 0;
                win.style.left = left + 'px'; win.style.top = top + 'px';
                if (extraData) saveWindowState(win.id, extraData);
            }
            if (isResizing && !win.classList.contains('maximized')) {
                win.style.width = Math.max(450, startW + (e.clientX - startX)) + 'px';
                win.style.height = Math.max(300, startH + (e.clientY - startY)) + 'px';
                if (extraData) saveWindowState(win.id, extraData);
            }
        });
        document.addEventListener('mouseup', () => {
            if (isDragging || isResizing) {
                if (extraData) { saveWindowState(win.id, extraData); saveSystemDataNow(); }
            }
            isDragging = false; isResizing = false; document.body.style.userSelect = '';
        });
    }

    // --- 最小化/全屏逻辑 ---
    function bindWindowControls(win, title, extraData) {
        const savedState = { top: '', left: '', width: '', height: '' };

        // 最小化
        win.querySelector('.win-btn-min').addEventListener('click', (e) => {
            e.stopPropagation();
            win.classList.add('minimized');
            // 添加到任务栏
            const minItem = document.createElement('div');
            minItem.className = 'taskbar-minimized-item';
            minItem.setAttribute('data-win-id', win.id);
            minItem.innerHTML = `<span>${title}</span>`;
            minItem.addEventListener('click', () => {
                win.classList.remove('minimized');
                win.style.zIndex = ++zIndexCounter;
                const item = taskbarMinList.querySelector(`[data-win-id="${win.id}"]`);
                if (item) item.remove();
            });
            taskbarMinList.appendChild(minItem);
        });

        // 全屏/还原
        win.querySelector('.win-btn-max').addEventListener('click', (e) => {
            e.stopPropagation();
            if (win.classList.contains('maximized')) {
                // 还原
                win.classList.remove('maximized');
                win.style.top = savedState.top;
                win.style.left = savedState.left;
                win.style.width = savedState.width;
                win.style.height = savedState.height;
            } else {
                // 保存当前位置
                savedState.top = win.style.top;
                savedState.left = win.style.left;
                savedState.width = win.style.width;
                savedState.height = win.style.height;
                win.classList.add('maximized');
            }
        });

        // 双击标题栏全屏切换
        win.querySelector('.os-window-header').addEventListener('dblclick', (e) => {
            if (e.target.closest('.win-ctrl-btn') || e.target.closest('.win-btn-save')) return;
            win.querySelector('.win-btn-max').click();
        });
    }

    // --- 5. AI 对话 ---
    function openAIChatWindow(restoreState) {
        const openWinId = `win-ai-chat-terminal`;
        const activeModelName = OS_DATA.settings.activeModel;
        if (shadow.getElementById(openWinId)) {
            const w = shadow.getElementById(openWinId);
            if (w.classList.contains('minimized')) {
                w.classList.remove('minimized');
                const item = taskbarMinList.querySelector(`[data-win-id="${openWinId}"]`);
                if (item) item.remove();
            }
            w.style.zIndex = ++zIndexCounter; return;
        }
        const win = document.createElement('div');
        win.className = 'os-window'; win.id = openWinId;
        win.style.zIndex = ++zIndexCounter;
        if (restoreState) {
            win.style.width = restoreState.width || '450px'; win.style.height = restoreState.height || '550px';
            win.style.top = restoreState.top || '80px'; win.style.left = restoreState.left || '320px';
        } else {
            win.style.width = '450px'; win.style.height = '550px'; win.style.top = '80px'; win.style.left = '320px';
        }
        win.innerHTML = `
            <div class="os-window-header">
                <span>🤖 AI 智能终端 (${activeModelName})</span>
                <div class="window-controls-group">
                    <div class="win-ctrl-btn win-btn-min" title="最小化">—</div>
                    <div class="win-ctrl-btn win-btn-max" title="最大化/还原">□</div>
                    <div class="win-ctrl-btn win-btn-close" title="关闭">×</div>
                </div>
            </div>
            <div class="os-window-body" style="background: var(--win-bg); display: flex; flex-direction: column;">
                <div id="ai-chat-history" style="flex-grow: 1; padding: 15px; overflow-y: auto; color: #d4d4d4; font-family: 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6;">
                    <div style="color: #4ec9b0; margin-bottom: 10px;">[System] AI 终端已初始化。当前计算模型: ${activeModelName}</div>
                    ${!OS_DATA.settings.apiKey ? '<div style="color: #ff5f56; margin-bottom: 10px;">[Warning] 未检测到 API Key，请先在设置中配置！</div>' : ''}
                </div>
                <div style="border-top: 1px solid #333; padding: 10px; background: var(--settings-body-bg); display: flex;">
                    <textarea id="ai-chat-input" style="flex-grow: 1; background: var(--input-bg); border: 1px solid var(--input-border); color: white; padding: 8px 12px; border-radius: 4px; outline: none; font-size: 13px; resize: none; height: 35px; line-height: 1.4; font-family: inherit;" placeholder="输入指令 (Enter 发送，Ctrl+Enter 换行)..."></textarea>
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
                    e.preventDefault();
                    const s = chatInput.selectionStart; const ed = chatInput.selectionEnd;
                    chatInput.value = chatInput.value.substring(0, s) + "\n" + chatInput.value.substring(ed);
                    chatInput.selectionStart = chatInput.selectionEnd = s + 1; return;
                }
                e.preventDefault();
                if (chatInput.value.trim() !== '') {
                    const userMsg = chatInput.value.trim(); chatInput.value = '';
                    const safeUserMsg = escapeHTML(userMsg).replace(/\n/g, '<br>');
                    historyPanel.innerHTML += `<div style="margin-bottom: 10px;"><b><span style="color:#57a6ff">You:</span></b><br>${safeUserMsg}</div>`;
                    historyPanel.scrollTop = historyPanel.scrollHeight;
                    if (!OS_DATA.settings.apiKey) { historyPanel.innerHTML += `<div style="margin-bottom: 10px; color: #ff5f56;">[Error] 缺少 API Key。</div>`; return; }
                    conversation.push({ role: "user", content: userMsg });
                    historyPanel.innerHTML += `<div id="ai-typing" style="margin-bottom: 10px; color: #888;"><i>AI is typing...</i></div>`;
                    historyPanel.scrollTop = historyPanel.scrollHeight;
                    const targetModel = OS_DATA.settings.activeModel;
                    GM_xmlhttpRequest({
                        method: "POST", url: "https://api.apilio.ai/v1/chat/completions",
                        headers: { "Authorization": "Bearer " + OS_DATA.settings.apiKey, "Content-Type": "application/json" },
                        data: JSON.stringify({ model: targetModel, messages: conversation }),
                        onload: function(response) {
                            const ti = win.querySelector('#ai-typing'); if (ti) ti.remove();
                            try {
                                const res = JSON.parse(response.responseText);
                                if (res.choices && res.choices.length > 0) {
                                    const aiReply = res.choices[0].message.content; conversation.push({ role: "assistant", content: aiReply });
                                    historyPanel.innerHTML += `<div style="margin-bottom: 15px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 4px;"><b><span style="color:#4ec9b0">AI:</span></b><br>${escapeHTML(aiReply).replace(/\n/g,'<br>')}</div>`;
                                } else { historyPanel.innerHTML += `<div style="color: #ff5f56;">[Error] ${response.responseText}</div>`; }
                            } catch (err) { historyPanel.innerHTML += `<div style="color: #ff5f56;">[Error] ${err.message}</div>`; }
                            historyPanel.scrollTop = historyPanel.scrollHeight;
                        },
                        onerror: function() { const ti = win.querySelector('#ai-typing'); if (ti) ti.remove(); historyPanel.innerHTML += `<div style="color: #ff5f56;">[Error] 网络连接失败。</div>`; historyPanel.scrollTop = historyPanel.scrollHeight; }
                    });
                }
            }
        });
        win.addEventListener('mousedown', () => { win.style.zIndex = ++zIndexCounter; }, true);
        const extraData = { id: 'ai-chat', type: 'ai-chat' };
        win.querySelector('.win-btn-close').onclick = () => { win.remove(); removeWindowState('ai-chat'); const item = taskbarMinList.querySelector(`[data-win-id="${openWinId}"]`); if (item) item.remove(); };
        bindWindowDragAndResize(win, win.querySelector('.os-window-header'), win.querySelector('.os-window-resize-handle'), extraData);
        bindWindowControls(win, `🤖 AI`, extraData);
        if (!restoreState) saveWindowState(openWinId, extraData);
    }

    // --- C++ Snippets ---
    const CPP_SNIPPETS = [
        { name: 'main', prefix: 'main', description: 'C++ 主函数模板', body: '#include <iostream>\nusing namespace std;\n\nint main() {\n    $0\n    return 0;\n}' },
        { name: 'include', prefix: 'inc', description: '#include 指令', body: '#include <${1:iostream}>$0' },
        { name: 'include_c', prefix: 'incc', description: '#include C头文件', body: '#include <${1:cstdio}>$0' },
        { name: 'define', prefix: 'def', description: '#define 宏定义', body: '#define ${1:NAME} ${2:VALUE}$0' },
        { name: 'typedef', prefix: 'td', description: 'typedef 别名', body: 'typedef ${1:long long} ${2:ll};$0' },
        { name: 'using', prefix: 'us', description: 'using 声明', body: 'using namespace ${1:std};$0' },
        { name: 'pragma', prefix: 'prg', description: '#pragma 优化', body: '#pragma ${1:GCC optimize("O2")}$0' },
        { name: 'if', prefix: 'if', description: 'if 条件语句', body: 'if (${1:condition}) {\n    $0\n}' },
        { name: 'if-else', prefix: 'ife', description: 'if-else 语句', body: 'if (${1:condition}) {\n    $2\n} else {\n    $0\n}' },
        { name: 'else-if', prefix: 'elif', description: 'else if 语句', body: 'else if (${1:condition}) {\n    $0\n}' },
        { name: 'switch', prefix: 'sw', description: 'switch-case', body: 'switch (${1:expression}) {\n    case ${2:value}:\n        $0\n        break;\n    default:\n        break;\n}' },
        { name: 'ternary', prefix: 'ter', description: '三元运算符', body: '(${1:condition}) ? ${2:true_val} : ${3:false_val}$0' },
        { name: 'for', prefix: 'for', description: '标准 for 循环', body: 'for (int i = 0; i < ${1:n}; i++) {\n    $0\n}' },
        { name: 'for_reverse', prefix: 'forr', description: '逆序 for 循环', body: 'for (int i = ${1:n} - 1; i >= 0; i--) {\n    $0\n}' },
        { name: 'for_range', prefix: 'fora', description: '范围 for 循环', body: 'for (auto& ${1:elem} : ${2:container}) {\n    $0\n}' },
        { name: 'while', prefix: 'while', description: 'while 循环', body: 'while (${1:condition}) {\n    $0\n}' },
        { name: 'do-while', prefix: 'dow', description: 'do-while 循环', body: 'do {\n    $0\n} while (${1:condition});' },
        { name: 'cout', prefix: 'cout', description: '输出语句', body: 'cout << ${1:value} << endl;$0' },
        { name: 'cin', prefix: 'cin', description: '输入语句', body: 'cin >> ${1:variable};$0' },
        { name: 'printf', prefix: 'pf', description: 'printf 格式输出', body: 'printf("${1:%d}\\n", ${2:value});$0' },
        { name: 'scanf', prefix: 'sf', description: 'scanf 格式输入', body: 'scanf("${1:%d}", &${2:variable});$0' },
        { name: 'freopen', prefix: 'fr', description: '重定向文件IO', body: 'freopen("${1:input.txt}", "r", stdin);\nfreopen("${2:output.txt}", "w", stdout);$0' },
        { name: 'ios_sync', prefix: 'ios', description: '加速 cin/cout', body: 'ios::sync_with_stdio(false);\ncin.tie(0);$0' },
        { name: 'vector', prefix: 'vec', description: 'vector 声明', body: 'vector<${1:int}> ${2:v};$0' },
        { name: 'vector_init', prefix: 'veci', description: 'vector 初始化', body: 'vector<${1:int}> ${2:v}(${3:n}, ${4:0});$0' },
        { name: 'vector_2d', prefix: 'vec2', description: '二维 vector', body: 'vector<vector<${1:int}>> ${2:mat}(${3:n}, vector<${1:int}>(${4:m}, ${5:0}));$0' },
        { name: 'pair', prefix: 'pair', description: 'pair 声明', body: 'pair<${1:int}, ${2:int}> ${3:p};$0' },
        { name: 'map', prefix: 'map', description: 'map 声明', body: 'map<${1:int}, ${2:int}> ${3:m};$0' },
        { name: 'unordered_map', prefix: 'umap', description: 'unordered_map', body: 'unordered_map<${1:string}, ${2:int}> ${3:m};$0' },
        { name: 'set', prefix: 'set', description: 'set 声明', body: 'set<${1:int}> ${2:s};$0' },
        { name: 'unordered_set', prefix: 'uset', description: 'unordered_set', body: 'unordered_set<${1:int}> ${2:s};$0' },
        { name: 'stack', prefix: 'stk', description: 'stack 声明', body: 'stack<${1:int}> ${2:stk};$0' },
        { name: 'queue', prefix: 'q', description: 'queue 声明', body: 'queue<${1:int}> ${2:q};$0' },
        { name: 'priority_queue', prefix: 'pq', description: '优先队列 (大顶堆)', body: 'priority_queue<${1:int}> ${2:pq};$0' },
        { name: 'priority_queue_min', prefix: 'pqm', description: '优先队列 (小顶堆)', body: 'priority_queue<${1:int}, vector<${1:int}>, greater<${1:int}>> ${2:pq};$0' },
        { name: 'deque', prefix: 'dq', description: 'deque 声明', body: 'deque<${1:int}> ${2:dq};$0' },
        { name: 'bitset', prefix: 'bs', description: 'bitset 声明', body: 'bitset<${1:32}> ${2:b};$0' },
        { name: 'sort', prefix: 'sort', description: '排序', body: 'sort(${1:v}.begin(), ${1:v}.end());$0' },
        { name: 'sort_desc', prefix: 'sortd', description: '降序排序', body: 'sort(${1:v}.begin(), ${1:v}.end(), greater<${2:int}>());$0' },
        { name: 'sort_custom', prefix: 'sortc', description: '自定义排序', body: 'sort(${1:v}.begin(), ${1:v}.end(), [](const auto& a, const auto& b) {\n    return ${2:a < b};\n});$0' },
        { name: 'lower_bound', prefix: 'lb', description: 'lower_bound', body: 'lower_bound(${1:v}.begin(), ${1:v}.end(), ${2:target})$0' },
        { name: 'upper_bound', prefix: 'ub', description: 'upper_bound', body: 'upper_bound(${1:v}.begin(), ${1:v}.end(), ${2:target})$0' },
        { name: 'binary_search', prefix: 'bsearch', description: '二分查找', body: 'bool found = binary_search(${1:v}.begin(), ${1:v}.end(), ${2:target});$0' },
        { name: 'find', prefix: 'find', description: 'find 查找', body: 'auto it = find(${1:v}.begin(), ${1:v}.end(), ${2:target});$0' },
        { name: 'reverse', prefix: 'rev', description: '反转', body: 'reverse(${1:v}.begin(), ${1:v}.end());$0' },
        { name: 'unique', prefix: 'uniq', description: '去重', body: 'sort(${1:v}.begin(), ${1:v}.end());\n${1:v}.erase(unique(${1:v}.begin(), ${1:v}.end()), ${1:v}.end());$0' },
        { name: 'next_permutation', prefix: 'nperm', description: '下一个排列', body: 'next_permutation(${1:v}.begin(), ${1:v}.end());$0' },
        { name: 'min_max', prefix: 'mm', description: 'min/max', body: 'int ans = min(${1:a}, ${2:b});$0' },
        { name: 'swap', prefix: 'swp', description: 'swap', body: 'swap(${1:a}, ${2:b});$0' },
        { name: 'count', prefix: 'cnt', description: 'count 计数', body: 'int c = count(${1:v}.begin(), ${1:v}.end(), ${2:target});$0' },
        { name: 'accumulate', prefix: 'acc', description: '累加求和', body: 'int sum = accumulate(${1:v}.begin(), ${1:v}.end(), ${2:0});$0' },
        { name: 'func', prefix: 'func', description: '函数定义', body: '${1:void} ${2:funcName}(${3:params}) {\n    $0\n}' },
        { name: 'struct', prefix: 'struct', description: '结构体', body: 'struct ${1:Name} {\n    $0\n};' },
        { name: 'struct_cmp', prefix: 'structcmp', description: '比较结构体', body: 'struct ${1:Node} {\n    ${2:int} val;\n    bool operator<(const ${1:Node}& other) const {\n        return ${3:val < other.val};\n    }\n};$0' },
        { name: 'class', prefix: 'class', description: '类模板', body: 'class ${1:ClassName} {\npublic:\n    $0\n};' },
        { name: 'template', prefix: 'tpl', description: '泛型模板', body: 'template<typename ${1:T}>\n${2:void} ${3:funcName}(${1:T} ${4:arg}) {\n    $0\n}' },
        { name: 'lambda', prefix: 'lam', description: 'Lambda', body: 'auto ${1:fn} = [](${2:int x}) {\n    $0\n};' },
        { name: 'constructor', prefix: 'ctor', description: '构造函数', body: '${1:ClassName}(${2:params}) : ${3:init_list} {\n    $0\n}' },
        { name: 'dfs', prefix: 'dfs', description: 'DFS', body: 'void dfs(int u) {\n    visited[u] = true;\n    for (int v : adj[u]) {\n        if (!visited[v]) dfs(v);\n    }\n}$0' },
        { name: 'bfs', prefix: 'bfs', description: 'BFS', body: 'void bfs(int start) {\n    queue<int> q;\n    q.push(start);\n    visited[start] = true;\n    while (!q.empty()) {\n        int u = q.front(); q.pop();\n        for (int v : adj[u]) {\n            if (!visited[v]) { visited[v] = true; q.push(v); }\n        }\n    }\n}$0' },
        { name: 'binary_search_manual', prefix: 'bsm', description: '手动二分', body: 'int lo = 0, hi = ${1:n} - 1, ans = -1;\nwhile (lo <= hi) {\n    int mid = (lo + hi) / 2;\n    if (${2:check(mid)}) { ans = mid; hi = mid - 1; }\n    else { lo = mid + 1; }\n}$0' },
        { name: 'dp', prefix: 'dp', description: 'DP 框架', body: 'vector<int> dp(${1:n} + 1, 0);\ndp[0] = ${2:0};\nfor (int i = 1; i <= ${1:n}; i++) {\n    dp[i] = ${3:/* transition */};\n}$0' },
        { name: 'dijkstra', prefix: 'dij', description: 'Dijkstra', body: 'vector<int> dist(n, INT_MAX);\ndist[${1:start}] = 0;\npriority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> pq;\npq.push({0, ${1:start}});\nwhile (!pq.empty()) {\n    auto [d, u] = pq.top(); pq.pop();\n    if (d > dist[u]) continue;\n    for (auto [v, w] : adj[u]) {\n        if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; pq.push({dist[v], v}); }\n    }\n}$0' },
        { name: 'union_find', prefix: 'uf', description: '并查集', body: 'vector<int> parent(${1:n}), rank_(${1:n}, 0);\niota(parent.begin(), parent.end(), 0);\nfunction<int(int)> find = [&](int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); };\nauto unite = [&](int x, int y) {\n    int rx = find(x), ry = find(y); if (rx == ry) return false;\n    if (rank_[rx] < rank_[ry]) swap(rx, ry); parent[ry] = rx;\n    if (rank_[rx] == rank_[ry]) rank_[rx]++; return true;\n};$0' },
        { name: 'topo_sort', prefix: 'topo', description: '拓扑排序', body: 'vector<int> order;\nqueue<int> q;\nfor (int i = 0; i < ${1:n}; i++) { if (indegree[i] == 0) q.push(i); }\nwhile (!q.empty()) {\n    int u = q.front(); q.pop(); order.push_back(u);\n    for (int v : adj[u]) { if (--indegree[v] == 0) q.push(v); }\n}\n$0' },
        { name: 'gcd', prefix: 'gcd', description: 'GCD', body: 'int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }$0' },
        { name: 'lcm', prefix: 'lcm', description: 'LCM', body: 'int lcm(int a, int b) { return a / gcd(a, b) * b; }$0' },
        { name: 'quick_pow', prefix: 'qpow', description: '快速幂', body: 'long long qpow(long long a, long long b, long long mod) {\n    long long res = 1;\n    while (b) { if (b & 1) res = res * a % mod; a = a * a % mod; b >>= 1; }\n    return res;\n}$0' },
        { name: 'head_all', prefix: 'head', description: '万能头文件', body: '#include <bits/stdc++.h>\nusing namespace std;\n$0' },
        { name: 'head_comp', prefix: 'headc', description: '竞赛头文件', body: '#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <map>\n#include <set>\n#include <queue>\n#include <stack>\n#include <cmath>\n#include <cstring>\n#include <functional>\nusing namespace std;\n$0' },
        { name: 'macro_all', prefix: 'mac', description: '竞赛常用宏', body: 'typedef long long ll;\ntypedef pair<int, int> pii;\n#define pb push_back\n#define mp make_pair\n#define fi first\n#define se second\n#define rep(i, a, n) for (int i = a; i < n; i++)\n#define per(i, a, n) for (int i = n - 1; i >= a; i--)\n$0' },
        { name: 'debug', prefix: 'dbg', description: '调试输出', body: '#ifdef LOCAL\n#define debug(x) cerr << #x << " = " << (x) << endl\n#else\n#define debug(x)\n#endif$0' },
        { name: 'string_split', prefix: 'ssplit', description: '字符串分割', body: 'vector<string> split(const string& s, char delim) {\n    vector<string> tokens; stringstream ss(s); string token;\n    while (getline(ss, token, delim)) tokens.push_back(token);\n    return tokens;\n}$0' },
        { name: 'to_string', prefix: 'tstr', description: '数字转字符串', body: 'string s = to_string(${1:123});$0' },
        { name: 'stoi', prefix: 'stoi', description: '字符串转数字', body: 'int x = stoi(${1:"123"});$0' },
        { name: 'bit_count', prefix: 'bcount', description: '统计1的个数', body: 'int cnt = __builtin_popcount(${1:x});$0' },
        { name: 'bit_low', prefix: 'blow', description: '取最低位1', body: 'int lowbit = ${1:x} & -${1:x};$0' },
        { name: 'is_prime', prefix: 'isprime', description: '判断素数', body: 'bool isPrime(int n) {\n    if (n < 2) return false;\n    for (int i = 2; i * i <= n; i++) { if (n % i == 0) return false; }\n    return true;\n}$0' },
        { name: 'sieve', prefix: 'sieve', description: '筛法', body: 'vector<bool> isPrime(${1:n} + 1, true);\nisPrime[0] = isPrime[1] = false;\nfor (int i = 2; i * i <= ${1:n}; i++) {\n    if (isPrime[i]) { for (int j = i * i; j <= ${1:n}; j += i) isPrime[j] = false; }\n}$0' },
        { name: 'abs', prefix: 'abs', description: '绝对值', body: 'int val = abs(${1:x});$0' },
        { name: 'mod', prefix: 'mod', description: '取模运算', body: 'const int MOD = ${1:1e9 + 7};$0' },
        { name: 'memset', prefix: 'ms', description: 'memset 初始化', body: 'memset(${1:arr}, ${2:0}, sizeof(${1:arr}));$0' },
        { name: 'fill', prefix: 'fill', description: 'fill 初始化', body: 'fill(${1:v}.begin(), ${1:v}.end(), ${2:0});$0' },
        { name: 'max_element', prefix: 'maxe', description: '最大元素', body: 'int mx = *max_element(${1:v}.begin(), ${1:v}.end());$0' },
        { name: 'min_element', prefix: 'mine', description: '最小元素', body: 'int mn = *min_element(${1:v}.begin(), ${1:v}.end());$0' },
        { name: 'emplace_back', prefix: 'epb', description: 'emplace_back', body: '${1:v}.emplace_back(${2:args});$0' },
        { name: 'tie', prefix: 'tie', description: 'tie 解包', body: 'auto [${1:a}, ${2:b}] = ${3:p};$0' }
    ];

    // --- 未匹配括号检测 ---
    function findUnmatchedBrackets(text) {
        const result = new Uint8Array(text.length);
        const openChars = new Set();
        const closeChars = new Set();
        const matchMap = {};
        const stack = [];

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (ch === '"' || ch === "'") {
                // 跳过字符串内容
                const quote = ch;
                i++;
                while (i < text.length && text[i] !== quote) {
                    if (text[i] === '\\') i++; // 跳过转义
                    i++;
                }
                continue;
            }
            if (ch === '/' && i + 1 < text.length && text[i + 1] === '/') {
                while (i < text.length && text[i] !== '\n') i++;
                continue;
            }
            if (openChars.has(ch)) {
                stack.push({ char: ch, index: i });
            } else if (closeChars.has(ch)) {
                const expected = matchMap[ch];
                let found = false;
                for (let j = stack.length - 1; j >= 0; j--) {
                    if (stack[j].char === expected) {
                        for (let k = j; k < stack.length; k++) {
                            result[stack[k].index] = 1;
                        }
                        stack.splice(j);
                        found = true;
                        break;
                    }
                }
                if (!found) result[i] = 1;
            }
        }
        // 栈中剩余的都是未匹配的
        for (const item of stack) {
            result[item.index] = 1;
        }
        return result;
    }

    function buildBracketHighlightHTML(text, unmatched) {
        let html = '';
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (ch === '<') html += '&lt;';
            else if (ch === '>') html += '&gt;';
            else if (ch === '&') html += '&amp;';
            else if (unmatched[i]) html += `<span class="unmatched">${ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '&' ? '&amp;' : ch}</span>`;
            else html += ch;
        }
        return html;
    }

    // --- 6. 文件窗口工厂 ---
    function openAppWindow(fileId, restoreState) {
        const file = OS_DATA.files.find(f => f.id === fileId);
        if (!file) return;
        const openWinId = `win-runtime-${file.id}`;
        if (shadow.getElementById(openWinId)) {
            const w = shadow.getElementById(openWinId);
            if (w.classList.contains('minimized')) {
                w.classList.remove('minimized');
                const item = taskbarMinList.querySelector(`[data-win-id="${openWinId}"]`);
                if (item) item.remove();
            }
            w.style.zIndex = ++zIndexCounter; return;
        }
        const win = document.createElement('div');
        win.className = 'os-window'; win.id = openWinId;
        win.style.zIndex = ++zIndexCounter;
        if (restoreState) {
            win.style.top = restoreState.top || '100px'; win.style.left = restoreState.left || '300px';
            win.style.width = restoreState.width || '780px'; win.style.height = restoreState.height || '580px';
        } else {
            const offset = (zIndexCounter % 8) * 20;
            win.style.top = `${80 + offset}px`; win.style.left = `${280 + offset}px`;
        }
        win.innerHTML = `
            <div class="os-window-header">
                <span>${file.name}</span>
                <div class="window-controls-group">
                    <div class="win-btn-save" title="安全下载">💾</div>
                    <div class="win-ctrl-btn win-btn-min" title="最小化">—</div>
                    <div class="win-ctrl-btn win-btn-max" title="最大化/还原">□</div>
                    <div class="win-ctrl-btn win-btn-close" title="关闭">×</div>
                </div>
            </div>
            <div class="os-window-body"></div>
            <div class="os-window-resize-handle"></div>
        `;
        desktop.appendChild(win);
        const bodyContainer = win.querySelector('.os-window-body');

        if (file.type === 'txt' || file.type === 'cpp') {
            const isCpp = file.type === 'cpp';
            const editorContainer = document.createElement('div');
            editorContainer.className = 'code-editor-container';
            editorContainer.innerHTML = `
                <div class="vscode-tabs-bar">
                    <div class="vscode-tab-item">⚙️ ${file.name}</div>
                    <div style="position: relative; display: flex; align-items: center; gap: 8px;">
                        ${isCpp ? '<div class="vscode-run-btn" title="编译并运行代码">▶ 运行代码</div><div class="vscode-snippet-btn" title="Snippets 代码片段" style="color: #dcdcaa; cursor: pointer; font-size: 13px; padding: 4px 12px; border-radius: 4px; display: flex; align-items: center; font-weight: bold; background: rgba(220,220,170,0.1);">📋 Snippets</div>' : ''}
                    </div>
                </div>
                <div class="code-editor-main-split">
                    <div class="code-gutter"><div>1</div></div>
                    <div class="code-textarea-wrap">
                        <div class="bracket-highlight-layer"></div>
                        <textarea class="os-textarea" spellcheck="false"></textarea>
                    </div>
                </div>
                ${isCpp ?
                    `<div class="vscode-terminal-panel">
                        <div class="terminal-header">
                            <div><span class="active">控制台输出 (Stdout / Stderr)</span></div>
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
            const bracketLayer = editorContainer.querySelector('.bracket-highlight-layer');
            textarea.value = file.content;

            const updateGutter = () => {
                const totalLines = textarea.value.split('\n').length;
                const fontSize = parseFloat(window.getComputedStyle(textarea).fontSize) || 14;
                const lineHeight = fontSize * 1.5;
                const rowHeight = lineHeight + 'px';
                gutter.style.fontSize = fontSize + 'px';
                gutter.style.lineHeight = '1.5';
                let gutterHTML = '';
                for (let i = 1; i <= totalLines; i++) { gutterHTML += `<div style="height:${rowHeight}">${i}</div>`; }
                gutter.innerHTML = gutterHTML;
            };

            const updateBracketHighlight = () => {
                if (!isCpp) { bracketLayer.innerHTML = ''; return; }
                const text = textarea.value;
                const unmatched = findUnmatchedBrackets(text);
                let hasUnmatched = false;
                for (let i = 0; i < unmatched.length; i++) { if (unmatched[i]) { hasUnmatched = true; break; } }
                if (hasUnmatched) {
                    bracketLayer.innerHTML = buildBracketHighlightHTML(text, unmatched);
                    bracketLayer.style.fontSize = window.getComputedStyle(textarea).fontSize;
                    bracketLayer.style.paddingTop = window.getComputedStyle(textarea).paddingTop;
                    bracketLayer.scrollTop = textarea.scrollTop;
                    bracketLayer.scrollLeft = textarea.scrollLeft;
                } else {
                    bracketLayer.innerHTML = '';
                }
            };

            textarea.addEventListener('input', () => { file.content = textarea.value; saveSystemData(); updateGutter(); updateBracketHighlight(); });
            textarea.addEventListener('scroll', () => {
                gutter.scrollTop = textarea.scrollTop;
                bracketLayer.scrollTop = textarea.scrollTop;
                bracketLayer.scrollLeft = textarea.scrollLeft;
            });

            // ============================================================
            // 键盘处理
            // ============================================================
            textarea.addEventListener('keydown', function(e) {
                const start = this.selectionStart;
                const end = this.selectionEnd;
                const val = this.value;
                const charBefore = val.charAt(start - 1);
                const charAfter = val.charAt(start);

                if (e.key === 'Tab') {
                    e.preventDefault();
                    this.value = val.substring(0, start) + "    " + val.substring(end);
                    this.selectionStart = this.selectionEnd = start + 4;
                    file.content = this.value; saveSystemData(); updateGutter(); updateBracketHighlight();
                    return;
                }

                if (e.key === 'Backspace' && isCpp) {
                    const openCloseMap = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
                    if (openCloseMap[charBefore] === charAfter) {
                        e.preventDefault();
                        this.value = val.substring(0, start - 1) + val.substring(start + 1);
                        this.selectionStart = this.selectionEnd = start - 1;
                        file.content = this.value; saveSystemData(); updateGutter(); updateBracketHighlight();
                        return;
                    }
                }

                if (e.key === 'Enter') {
                    e.preventDefault();
                    const linesBefore = val.substring(0, start).split('\n');
                    const currentLine = linesBefore[linesBefore.length - 1];
                    const baseIndentMatch = currentLine.match(/^(\s*)/);
                    const baseIndent = baseIndentMatch ? baseIndentMatch[0] : '';

                    if (charBefore === '{' && charAfter === '}') {
                        const innerIndent = baseIndent + "    ";
                        this.value = val.substring(0, start) + "\n" + innerIndent + "\n" + baseIndent + val.substring(end);
                        this.selectionStart = this.selectionEnd = start + 1 + innerIndent.length;
                    } else if (charBefore === '{') {
                        const innerIndent = baseIndent + "    ";
                        this.value = val.substring(0, start) + "\n" + innerIndent + val.substring(end);
                        this.selectionStart = this.selectionEnd = start + 1 + innerIndent.length;
                    } else if (charAfter === '}') {
                        const dedented = baseIndent.length >= 4 ? baseIndent.substring(0, baseIndent.length - 4) : '';
                        this.value = val.substring(0, start) + "\n" + dedented + val.substring(end);
                        this.selectionStart = this.selectionEnd = start + 1 + dedented.length;
                    } else {
                        this.value = val.substring(0, start) + "\n" + baseIndent + val.substring(end);
                        this.selectionStart = this.selectionEnd = start + 1 + baseIndent.length;
                    }
                    file.content = this.value; saveSystemData(); updateGutter(); updateBracketHighlight();
                    return;
                }

                if (isCpp) {
                    const openCloseMap = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
                    const closeChars = new Set([')', ']', '}']);

                    // 闭合跳过
                    if (closeChars.has(e.key) && charAfter === e.key) {
                        e.preventDefault();
                        this.selectionStart = this.selectionEnd = start + 1;
                        return;
                    }

                    // 引号交替逻辑
                    if (e.key === '"' || e.key === "'") {
                        const quote = e.key;
                        e.preventDefault();
                        // 如果光标后面就是同一个引号 → 跳过
                        if (charAfter === quote) {
                            this.selectionStart = this.selectionEnd = start + 1;
                            return;
                        }
                        // 统计前方未配对的同类引号数量
                        let count = 0;
                        for (let i = 0; i < start; i++) {
                            if (val[i] === quote && (i === 0 || val[i-1] !== '\\')) count++;
                        }
                        // 如果是奇数（前面有未闭合的引号），说明这是一个闭合引号，只插入引号本身
                        if (count % 2 === 1) {
                            this.value = val.substring(0, start) + quote + val.substring(end);
                            this.selectionStart = this.selectionEnd = start + 1;
                        } else {
                            // 偶数（前面都闭合了），开启新引号对
                            this.value = val.substring(0, start) + quote + quote + val.substring(end);
                            this.selectionStart = this.selectionEnd = start + 1;
                        }
                        file.content = this.value; saveSystemData(); updateGutter(); updateBracketHighlight();
                        return;
                    }

                    // 开启括号补全
                    if (openCloseMap[e.key] && e.key !== '"' && e.key !== "'") {
                        e.preventDefault();
                        const closeChar = openCloseMap[e.key];
                        if (charAfter === closeChar) {
                            this.value = val.substring(0, start) + e.key + val.substring(end);
                            this.selectionStart = this.selectionEnd = start + 1;
                        } else {
                            this.value = val.substring(0, start) + e.key + closeChar + val.substring(end);
                            this.selectionStart = this.selectionEnd = start + 1;
                        }
                        file.content = this.value; saveSystemData(); updateGutter(); updateBracketHighlight();
                        return;
                    }
                }
            });

            if (isCpp) {
                const termBody = editorContainer.querySelector('.terminal-body');
                const stdinInput = editorContainer.querySelector('.os-stdin-input');
                editorContainer.querySelector('.vscode-run-btn').onclick = () => {
                    termBody.innerHTML = `[编译任务] 正在连接高可用备用节点...\n`;
                    if (typeof GM_xmlhttpRequest === 'undefined') {
                        termBody.innerHTML = `<span style="color:#ff5f56;">[致命错误] 未检测到跨域通信组件！</span>`; return;
                    }
                    GM_xmlhttpRequest({
                        method: "POST", url: "https://ce.judge0.com/submissions?wait=true",
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
                            } catch(e) { termBody.innerHTML = `<span style="color:#ff5f56;">[解析失败] ${e.message}</span>\n${response.responseText}`; }
                        },
                        onerror: function() { termBody.innerHTML = `<span style="color:#ff5f56;">[连接失败] 无法握手编译节点。</span>`; }
                    });
                };

                const snippetBtn = editorContainer.querySelector('.vscode-snippet-btn');
                const snippetDropdown = document.createElement('div');
                snippetDropdown.className = 'snippet-dropdown';
                let snippetHTML = '';
                CPP_SNIPPETS.forEach((s, idx) => {
                    snippetHTML += `<div class="snippet-item" data-snippet-idx="${idx}"><span class="snippet-name">${s.name}</span><span class="snippet-prefix">${s.prefix}</span></div>`;
                });
                snippetDropdown.innerHTML = snippetHTML;
                snippetBtn.parentElement.appendChild(snippetDropdown);

                snippetBtn.addEventListener('click', (e) => { e.stopPropagation(); snippetDropdown.classList.toggle('show'); });

                snippetDropdown.querySelectorAll('.snippet-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const idx = parseInt(item.getAttribute('data-snippet-idx'));
                        const snippet = CPP_SNIPPETS[idx];
                        if (!snippet) return;
                        let body = snippet.body, rawCursorPos = -1, processed = '', i = 0;
                        while (i < body.length) {
                            if (body[i] === '$') {
                                if (body[i+1] === '0') { rawCursorPos = processed.length; i += 2; continue; }
                                else if (body[i+1] === '{') {
                                    const closeIdx = body.indexOf('}', i);
                                    if (closeIdx >= 0) { const colonIdx = body.indexOf(':', i); if (colonIdx >= 0 && colonIdx < closeIdx) processed += body.substring(colonIdx+1, closeIdx); i = closeIdx+1; continue; }
                                } else if (/\d/.test(body[i+1])) { i += 2; continue; }
                            }
                            processed += body[i]; i++;
                        }
                        const insertText = processed;
                        const cursorOffset = rawCursorPos >= 0 ? rawCursorPos : insertText.length;
                        const start = textarea.selectionStart; const val = textarea.value;
                        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
                        const needsNewline = val.substring(lineStart, start).trim().length > 0;
                        const finalText = needsNewline ? '\n' + insertText : insertText;
                        const finalCursorOffset = (needsNewline ? 1 : 0) + cursorOffset;
                        textarea.value = val.substring(0, start) + finalText + val.substring(textarea.selectionEnd);
                        textarea.selectionStart = textarea.selectionEnd = start + finalCursorOffset;
                        textarea.focus(); file.content = textarea.value; saveSystemData(); updateGutter(); updateBracketHighlight();
                        snippetDropdown.classList.remove('show');
                    });
                });

                document.addEventListener('click', (e) => {
                    if (!snippetBtn.contains(e.target) && !snippetDropdown.contains(e.target)) snippetDropdown.classList.remove('show');
                });
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
            updateBracketHighlight();
            bindCtrlWheelZoom(textarea, gutter, updateGutter);
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
                if (e.target.tagName === 'TD') {
                    if (activeCell) activeCell.classList.remove('selected-cell');
                    activeCell = e.target; activeCell.classList.add('selected-cell'); fInput.value = activeCell.innerText;
                }
            });
            gridViewport.addEventListener('input', (e) => {
                if (e.target.tagName === 'TD') {
                    const r = parseInt(e.target.getAttribute('data-row')); const c = parseInt(e.target.getAttribute('data-col'));
                    fInput.value = e.target.innerText; if (!matrix[r]) matrix[r] = [];
                    matrix[r][c] = e.target.innerText; file.content = matrix; saveSystemData();
                }
            });
            fInput.addEventListener('input', () => {
                if (activeCell) {
                    activeCell.innerText = fInput.value; const r = parseInt(activeCell.getAttribute('data-row')); const c = parseInt(activeCell.getAttribute('data-col'));
                    if (!matrix[r]) matrix[r] = []; matrix[r][c] = fInput.value; file.content = matrix; saveSystemData();
                }
            });
            bindCtrlWheelZoom(gridViewport);
        }

        // 下载逻辑
        win.querySelector('.win-btn-save').onclick = (e) => {
            e.stopPropagation();
            let blob, downloadName = file.name;
            if (file.type === 'txt' || file.type === 'cpp') {
                blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
            }
            else if (file.type === 'docx') {
                // 用 HTML 格式保存为 .doc，Word 可以正确打开
                const htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>body{font-family:'宋体',SimSun,serif;font-size:14px;line-height:1.8;}</style></head><body>${file.content}</body></html>`;
                blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" });
                downloadName = file.name.replace('.docx', '.doc');
            }
            else if (file.type === 'xlsx') {
                // 用 HTML 表格保存为 .xls，Excel 可以正确打开
                let matrix = Array.isArray(file.content) ? file.content : [];
                let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table border="1">`;
                matrix.forEach(row => {
                    html += '<tr>';
                    (row || []).forEach(cell => { html += `<td style="mso-number-format:\\@;">${cell || ''}</td>`; });
                    html += '</tr>';
                });
                html += '</table></body></html>';
                blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
                downloadName = file.name.replace('.xlsx', '.xls');
            }
            const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = downloadName; link.click();
        };
        win.addEventListener('mousedown', () => { win.style.zIndex = ++zIndexCounter; }, true);
        const extraData = { id: file.id, type: 'file' };
        win.querySelector('.win-btn-close').onclick = () => { win.remove(); removeWindowState(file.id); const item = taskbarMinList.querySelector(`[data-win-id="${openWinId}"]`); if (item) item.remove(); };
        bindWindowDragAndResize(win, win.querySelector('.os-window-header'), win.querySelector('.os-window-resize-handle'), extraData);
        bindWindowControls(win, file.name, extraData);
        if (!restoreState) saveWindowState(openWinId, extraData);
    }

    // --- 7. 控制面板 ---
    function openSettingsPanel() {
        if (shadow.getElementById('win-runtime-sys-settings')) {
            shadow.getElementById('win-runtime-sys-settings').style.zIndex = ++zIndexCounter; return;
        }
        const win = document.createElement('div');
        win.className = 'os-window'; win.id = 'win-runtime-sys-settings'; win.style.zIndex = ++zIndexCounter;
        win.style.top = '140px'; win.style.left = '380px'; win.style.width = '520px'; win.style.height = '520px';
        let themeSwatchesHTML = '';
        const themeColors = { default: '#0078d4', blue: '#1565c0', purple: '#7b1fa2', green: '#2e7d32', amber: '#e65100', red: '#c62828', light: '#f0f0f0' };
        Object.keys(THEMES).forEach(key => {
            const isActive = OS_DATA.settings.theme === key ? 'active' : '';
            themeSwatchesHTML += `<div class="theme-swatch ${isActive}" data-theme="${key}" style="background: ${themeColors[key]};" title="${THEMES[key].label}"></div>`;
        });
        win.innerHTML = `
            <div class="os-window-header"><span>⚙️ 系统控制中心</span><div class="window-controls-group">
                <div class="win-ctrl-btn win-btn-min" title="最小化">—</div>
                <div class="win-ctrl-btn win-btn-max" title="最大化/还原">□</div>
                <div class="win-ctrl-btn win-btn-close" title="关闭">×</div>
            </div></div>
            <div class="os-window-body">
                <div class="settings-body">
                    <div style="color:#4ec9b0; font-weight:bold; border-bottom: 1px solid #444; padding-bottom: 5px;">🎨 外观设置</div>
                    <div class="settings-row"><span>系统色调:</span><div class="theme-selector">${themeSwatchesHTML}</div></div>
                    <div class="settings-row"><span>网页壁纸模糊度:</span><input type="range" class="settings-slider" id="set-blur" min="0" max="25" value="${OS_DATA.settings.blur}"><span id="txt-blur" style="width:40px;">${OS_DATA.settings.blur}px</span></div>
                    <div class="settings-row"><span>原网页背景亮度:</span><input type="range" class="settings-slider" id="set-bright" min="0" max="95" value="${OS_DATA.settings.brightness}"><span id="txt-bright" style="width:40px;">${100 - OS_DATA.settings.brightness}%</span></div>
                    <div style="color:#ffab40; font-weight:bold; border-bottom: 1px solid #444; padding-bottom: 5px; margin-top:10px;">🪟 窗口管理</div>
                    <div class="settings-row"><span>记忆窗口 (刷新后恢复):</span><div class="toggle-switch ${OS_DATA.settings.rememberWindows ? 'active' : ''}" id="toggle-remember-windows"></div></div>
                    <div style="font-size:11px; color:#888; margin-top:-8px;">开启后，关闭窗口/刷新页面将恢复之前打开的窗口及其位置和大小</div>
                    <div class="settings-row" style="margin-top: 8px;"><span>刷新自动恢复桌面:</span><div class="toggle-switch ${OS_DATA.settings.autoRestoreDesktop ? 'active' : ''}" id="toggle-auto-restore-desktop"></div></div>
                    <div style="font-size:11px; color:#888; margin-top:-8px;">开启后，刷新页面时自动恢复桌面模式；关闭后，刷新页面将回到普通网页</div>
                    <div style="color:#da70d6; font-weight:bold; border-bottom: 1px solid #444; padding-bottom: 5px; margin-top:10px;">🤖 AI 终端配置 (apilio.ai)</div>
                    <div class="settings-row"><span style="width:70px;">API Key:</span><input type="password" class="settings-input" id="set-apikey" placeholder="sk-..." value="${OS_DATA.settings.apiKey}"></div>
                    <div class="settings-row" style="margin-top: 5px;"><span style="width:70px;">默认模型:</span><select class="settings-input" id="set-model-select" style="padding: 2px 8px;"></select><button class="model-btn model-btn-add" id="btn-add-model">＋</button><button class="model-btn model-btn-del" id="btn-del-model">－</button></div>
                </div>
            </div>
            <div class="os-window-resize-handle"></div>
        `;
        desktop.appendChild(win);
        const sBlur = win.querySelector('#set-blur');
        const sBright = win.querySelector('#set-bright');
        const sApi = win.querySelector('#set-apikey');
        const sModelSelect = win.querySelector('#set-model-select');
        const renderModelOptions = () => {
            sModelSelect.innerHTML = '';
            OS_DATA.settings.modelList.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m; opt.innerText = m;
                if (m === OS_DATA.settings.activeModel) opt.selected = true;
                sModelSelect.appendChild(opt);
            });
        };
        renderModelOptions();
        win.querySelectorAll('.theme-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                OS_DATA.settings.theme = swatch.getAttribute('data-theme');
                saveSystemData(); applyTheme();
                win.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
            });
        });
        const toggleRemember = win.querySelector('#toggle-remember-windows');
        toggleRemember.addEventListener('click', () => {
            OS_DATA.settings.rememberWindows = !OS_DATA.settings.rememberWindows;
            toggleRemember.classList.toggle('active', OS_DATA.settings.rememberWindows);
            saveSystemDataNow();
            if (!OS_DATA.settings.rememberWindows) { OS_DATA.openWindows = []; saveSystemDataNow(); }
        });
        const toggleAutoRestore = win.querySelector('#toggle-auto-restore-desktop');
        toggleAutoRestore.addEventListener('click', () => {
            OS_DATA.settings.autoRestoreDesktop = !OS_DATA.settings.autoRestoreDesktop;
            toggleAutoRestore.classList.toggle('active', OS_DATA.settings.autoRestoreDesktop);
            saveSystemDataNow();
        });
        sBlur.oninput = (e) => { OS_DATA.settings.blur = e.target.value; win.querySelector('#txt-blur').innerText = `${e.target.value}px`; wallpaperBlur.style.backdropFilter = `blur(${OS_DATA.settings.blur}px)`; saveSystemData(); };
        sBright.oninput = (e) => { OS_DATA.settings.brightness = e.target.value; win.querySelector('#txt-bright').innerText = `${100 - e.target.value}%`; wallpaperBlur.style.background = `rgba(0, 0, 0, ${OS_DATA.settings.brightness / 100})`; saveSystemData(); };
        sApi.oninput = (e) => { OS_DATA.settings.apiKey = e.target.value; saveSystemData(); };
        sModelSelect.onchange = (e) => { OS_DATA.settings.activeModel = e.target.value; saveSystemData(); const chatHeader = shadow.querySelector('#win-ai-chat-terminal .os-window-header span'); if (chatHeader) chatHeader.innerText = `🤖 AI 智能终端 (${OS_DATA.settings.activeModel})`; };
        win.querySelector('#btn-add-model').onclick = () => { const newModel = prompt('请输入新模型名称:'); if (newModel && newModel.trim() !== '') { const cleanModel = newModel.trim(); if (!OS_DATA.settings.modelList.includes(cleanModel)) OS_DATA.settings.modelList.push(cleanModel); OS_DATA.settings.activeModel = cleanModel; saveSystemData(); renderModelOptions(); } };
        win.querySelector('#btn-del-model').onclick = () => { if (OS_DATA.settings.modelList.length <= 1) { alert('⚠️ 至少需要保留一个模型！'); return; } if (confirm(`确定要移除模型 [${OS_DATA.settings.activeModel}] 吗？`)) { OS_DATA.settings.modelList = OS_DATA.settings.modelList.filter(m => m !== OS_DATA.settings.activeModel); OS_DATA.settings.activeModel = OS_DATA.settings.modelList[0]; saveSystemData(); renderModelOptions(); } };
        win.querySelector('.win-btn-close').onclick = () => win.remove();
        bindWindowDragAndResize(win, win.querySelector('.os-window-header'), win.querySelector('.os-window-resize-handle'), null);
        bindWindowControls(win, '⚙️ 设置', null);
    }

    // --- 字号缩放 ---
    function bindCtrlWheelZoom(element, gutter, updateGutter) {
        element.addEventListener('wheel', function(e) {
            if (e.ctrlKey) {
                e.preventDefault();
                let size = parseFloat(window.getComputedStyle(this).fontSize) || 14;
                size = e.deltaY < 0 ? Math.min(45, size + 1) : Math.max(10, size - 1);
                this.style.fontSize = size + 'px';
                if (gutter && updateGutter) updateGutter();
            }
        }, { passive: false });
    }

    renderSidebarFiles();
})();