
// ==UserScript==
// @name         网页模拟桌面系统 (Web OS) - 终极优化版(apilio) 4.3 Insider
// @namespace    http://tampermonkey.net/
// @version      4.3
// @description  新增 AI 对话特殊符号支持、Ctrl+Enter 换行、侧边栏折叠收起功能、色调选择、窗口记忆、刷新后自动恢复桌面模式、Snippets、浅色模式、最小化/全屏、未匹配括号标红、AI Markdown渲染、对话保留/删除。
// @author       cmq
// @match        *://*/*
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @connect      ce.judge0.com
// @connect      api.judge0.com
// @connect      api.apilio.ai
// @run-at        document-end
// @require https://cdn.jsdelivr.net/npm/marked/marked.min.js
// @require https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
// ==/UserScript==
(function() {
    // 提示！本版本为Insider，不确定功能完善！
    'use strict';
    // ===== 密码系统 =====
    // ===== 密码系统 =====
    let _pwd = localStorage.getItem('OS_PWD');
    if (_pwd === null) _pwd = '123456';
    let _fail = +(localStorage.getItem('OS_FAIL') || 0);
    let _lockUntil = +(localStorage.getItem('OS_LOCK_UNTIL') || 0);
    // 如果还在锁定期间，不需要做什么特殊处理，requestDesktop 里会检查
    if (_fail >= 5 && Date.now() >= _lockUntil) {
        // 锁定时间已过，重置错误计数
        _fail = 0;
        localStorage.setItem('OS_FAIL', '0');
        localStorage.removeItem('OS_LOCK_UNTIL');
    }
// 密码验证函数，点击"进入桌面模式"时调用
function requestDesktop(callback) {
    // 密码为空，免密进入
    if (_pwd === '') {
        callback();
        return;
    }
	// 检查是否在锁定期间
	if (_fail >= 5) {
		let _lockUntil = +(localStorage.getItem('OS_LOCK_UNTIL') || 0);
		if (Date.now() < _lockUntil) {
			// 锁定中，不弹密码框，但弹出一个只有"忘记密码"的提示框
			let lockOverlay = document.createElement('div');
			lockOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:2147483647;display:flex;align-items:center;justify-content:center;';
			let lockBox = document.createElement('div');
			lockBox.style.cssText = 'background:#fff;border-radius:12px;padding:30px 40px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,0.3);font-family:system-ui;min-width:300px;';
			let lockTitle = document.createElement('div');
			lockTitle.textContent = '🔒 密码错误次数过多';
			lockTitle.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:16px;color:#333;';
			let lockHint = document.createElement('div');
			let remainSec = Math.ceil((_lockUntil - Date.now()) / 1000);
			let rm = Math.floor(remainSec / 60);
			let rs = remainSec % 60;
			lockHint.textContent = '请等待 ' + rm + ' 分 ' + rs + ' 秒后再试';
			lockHint.style.cssText = 'font-size:14px;color:#e74c3c;margin-bottom:20px;';
			let lockBtnRow = document.createElement('div');
			lockBtnRow.style.cssText = 'display:flex;gap:10px;justify-content:center;';
			let lockCloseBtn = document.createElement('button');
			lockCloseBtn.textContent = '关闭';
			lockCloseBtn.style.cssText = 'padding:10px 24px;background:#eee;color:#666;border:none;border-radius:8px;font-size:15px;cursor:pointer;';
			lockCloseBtn.onclick = function() { lockOverlay.remove(); };
			let lockForgotBtn = document.createElement('button');
			lockForgotBtn.textContent = '忘记密码？';
			lockForgotBtn.style.cssText = 'padding:10px 24px;background:#4285f4;color:#fff;border:none;border-radius:8px;font-size:15px;cursor:pointer;';
			lockForgotBtn.onclick = function() { lockOverlay.remove(); showForgotPasswordDialog(); };
			lockBtnRow.appendChild(lockCloseBtn);
			lockBtnRow.appendChild(lockForgotBtn);
			lockBox.appendChild(lockTitle);
			lockBox.appendChild(lockHint);
			lockBox.appendChild(lockBtnRow);
			lockOverlay.appendChild(lockBox);
			document.documentElement.appendChild(lockOverlay);
			// 倒计时更新
			let lockTimer = setInterval(function() {
				let _lockUntil2 = +(localStorage.getItem('OS_LOCK_UNTIL') || 0);
				let remaining = Math.ceil((_lockUntil2 - Date.now()) / 1000);
				if (remaining <= 0) {
					clearInterval(lockTimer);
					lockOverlay.remove();
					_fail = 0;
					localStorage.setItem('OS_FAIL', '0');
					localStorage.removeItem('OS_LOCK_UNTIL');
					requestDesktop(callback);
					return;
				}
				let m2 = Math.floor(remaining / 60);
				let s2 = remaining % 60;
				lockHint.textContent = '请等待 ' + m2 + ' 分 ' + s2 + ' 秒后再试';
			}, 1000);
			return;
		} else {
			// 锁定时间已过，重置
			_fail = 0;
			localStorage.setItem('OS_FAIL', '0');
			localStorage.removeItem('OS_LOCK_UNTIL');
		}
	}
	// 检查是否在免密时间内
	let _freeUntil = +(localStorage.getItem('OS_FREE_UNTIL') || 0);
	if (Date.now() < _freeUntil) {
		callback();
		return;
	}
	localStorage.removeItem('OS_FREE_UNTIL');
	// 创建遮罩层
	let overlay = document.createElement('div');
	overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:2147483647;display:flex;align-items:center;justify-content:center;';
	// 创建弹窗
	let box = document.createElement('div');
	box.style.cssText = 'background:#fff;border-radius:12px;padding:30px 40px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,0.3);font-family:system-ui;min-width:300px;';
	// 标题
	let title = document.createElement('div');
	title.textContent = '🔒 请输入密码';
	title.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:20px;color:#333;';
	// 提示信息
	let hint = document.createElement('div');
	hint.style.cssText = 'font-size:13px;color:#e74c3c;margin-bottom:12px;min-height:18px;';
	// 密码输入框
	let input = document.createElement('input');
	input.type = 'password';
    input.placeholder = _pwd === '123456' ? '请输入密码（默认：123456）' : '请输入密码';
	input.style.cssText = 'width:100%;padding:10px 14px;border:2px solid #ddd;border-radius:8px;font-size:16px;outline:none;box-sizing:border-box;letter-spacing:4px;transition:border-color 0.2s;';
	input.onfocus = function() { this.style.borderColor = '#4285f4'; };
	input.onblur = function() { this.style.borderColor = '#ddd'; };
	input.focus();
    	// 免密选项
	let freeRow = document.createElement('div');
	freeRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:12px;font-size:13px;color:#666;';
	let freeCheck = document.createElement('input');
	freeCheck.type = 'checkbox';
	freeCheck.id = 'os-free-check';
	let freeLabel = document.createElement('label');
	freeLabel.htmlFor = 'os-free-check';
	freeLabel.textContent = '免密进入';
	freeLabel.style.cssText = 'cursor:pointer;';
	let freeTime = document.createElement('select');
	freeTime.style.cssText = 'padding:2px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px;';
	[1,5,10,30,60].forEach(function(m) {
		let opt = document.createElement('option');
		opt.value = m;
		opt.textContent = m + '分钟';
		freeTime.appendChild(opt);
	});
	freeRow.appendChild(freeCheck);
	freeRow.appendChild(freeLabel);
	freeRow.appendChild(freeTime);
	// 按钮行
	let btnRow = document.createElement('div');
	btnRow.style.cssText = 'display:flex;gap:10px;margin-top:16px;';
	let btn = document.createElement('button');
	btn.textContent = '解锁';
	btn.style.cssText = 'flex:1;padding:10px 0;background:#4285f4;color:#fff;border:none;border-radius:8px;font-size:15px;cursor:pointer;transition:background 0.2s;';
	btn.onmouseover = function() { this.style.background = '#3367d6'; };
	btn.onmouseout = function() { this.style.background = '#4285f4'; };
	let forgotBtn = document.createElement('button');
	forgotBtn.textContent = '忘记？';
	forgotBtn.style.cssText = 'flex:1;padding:10px 0;background:#eee;color:#666;border:none;border-radius:8px;font-size:15px;cursor:pointer;transition:background 0.2s;';
	forgotBtn.onmouseover = function() { this.style.background = '#ddd'; };
	forgotBtn.onmouseout = function() { this.style.background = '#eee'; };
	forgotBtn.onclick = function() { overlay.remove(); showForgotPasswordDialog(); };
	btnRow.appendChild(btn);
	btnRow.appendChild(forgotBtn);
	// 组装
	box.appendChild(title);
	box.appendChild(hint);
	box.appendChild(input);
	box.appendChild(freeRow);
	box.appendChild(btnRow);
	overlay.appendChild(box);
	document.documentElement.appendChild(overlay);
    // 验证函数
    function checkPwd() {
    // —— 先检查是否在锁定期间 ——
    let _lockUntil = +(localStorage.getItem('OS_LOCK_UNTIL') || 0);
    if (_fail >= 5 && Date.now() < _lockUntil) {
        let remainSec = Math.ceil((_lockUntil - Date.now()) / 1000);
        hint.textContent = '🔒 请等待 ' + Math.ceil(remainSec / 60) + ' 分 ' + (remainSec % 60) + ' 秒后再试';
        return;
    }
    // 锁定已过，重置计数
    if (_fail >= 5 && Date.now() >= _lockUntil) {
        _fail = 0;
        localStorage.setItem('OS_FAIL', '0');
        localStorage.removeItem('OS_LOCK_UNTIL');
    }

    let a = input.value;
    if (a === _pwd) {
        _fail = 0;
        localStorage.setItem('OS_FAIL', '0');
        localStorage.removeItem('OS_LOCK_COUNT');
        localStorage.removeItem('OS_LOCK_UNTIL');
        localStorage.removeItem('OS_FORGOT_BAN');
        if (freeCheck.checked) {
            let mins = +freeTime.value;
            let until = Date.now() + mins * 60 * 1000;
            localStorage.setItem('OS_FREE_UNTIL', until);
        }
        overlay.remove();
        callback();
    } else {
        _fail++;
        localStorage.setItem('OS_FAIL', _fail);
        if (_fail >= 5) {
            // 计算锁定时间：第1次锁定1分钟，之后每次×2
            let lockCount = +(localStorage.getItem('OS_LOCK_COUNT') || 0) + 1;
            localStorage.setItem('OS_LOCK_COUNT', lockCount);
            let lockMinutes = 1;
            for (let i = 1; i < lockCount; i++) lockMinutes *= 2;
            let lockMs = lockMinutes * 60 * 1000;
            _lockUntil = Date.now() + lockMs;
            localStorage.setItem('OS_LOCK_UNTIL', _lockUntil);
            hint.textContent = '🔒 密码错误5次！已锁定 ' + lockMinutes + ' 分钟';
            input.value = '';
            input.style.borderColor = '#e74c3c';
            input.disabled = true;
            btn.disabled = true;
            // 倒计时解锁
            let lockTimer = setInterval(function() {
                let remaining = Math.ceil((_lockUntil - Date.now()) / 1000);
                if (remaining <= 0) {
                    clearInterval(lockTimer);
                    _fail = 0;
                    localStorage.setItem('OS_FAIL', '0');
                    localStorage.removeItem('OS_LOCK_UNTIL');
                    input.disabled = false;
                    btn.disabled = false;
                    input.value = '';
                    input.style.borderColor = '#ddd';
                    hint.textContent = '🔓 锁定已解除，请重新输入密码';
                    input.focus();
                } else {
                    let m = Math.floor(remaining / 60);
                    let s = remaining % 60;
                    hint.textContent = '🔒 已锁定 ' + lockMinutes + ' 分钟（剩余 ' + m + ' 分 ' + s + ' 秒）';
                }
            }, 1000);
        } else {
            hint.textContent = '❌ 密码错误！还剩 ' + (5 - _fail) + ' 次机会';
            input.value = '';
            input.style.borderColor = '#e74c3c';
            setTimeout(function() { input.style.borderColor = '#ddd'; }, 1000);
        }
    }
}

	// 取消按钮
	let cancelBtn = document.createElement('button');
	cancelBtn.textContent = '取消';
	cancelBtn.style.cssText = 'flex:1;padding:10px 0;background:#eee;color:#666;border:none;border-radius:8px;font-size:15px;cursor:pointer;transition:background 0.2s;';
	cancelBtn.onmouseover = function() { this.style.background = '#ddd'; };
	cancelBtn.onmouseout = function() { this.style.background = '#eee'; };
	cancelBtn.onclick = function() { overlay.remove(); };
	btnRow.appendChild(cancelBtn);

	btn.onclick = checkPwd;
	input.onkeydown = function(e) { if (e.key === 'Enter') checkPwd(); };
}
// ====== 忘记密码 — 安全验证系统 ======
// ====== 忘记密码 — 安全验证系统 ======
function showForgotPasswordDialog() {
    // 检查是否被封禁（必须最先检查，避免被封禁时还触发全屏）
    let banUntil = +(localStorage.getItem('OS_FORGOT_BAN') || 0);
    let now = Date.now();
    if (banUntil > now) {
        let remainMs = banUntil - now;
        let remainH = Math.floor(remainMs / 3600000);
        let remainM = Math.floor((remainMs % 3600000) / 60000);
        let timeStr = remainH > 0 ? (remainH + '小时' + remainM + '分钟') : (remainM + '分钟');
        alert('❌ 由于之前安全验证答错，你已被封禁答题。\n\n还需等待 ' + timeStr + ' 才能再次尝试。');
        return;
    }

    // ====== 强制全屏答题机制 ======
    let fullscreenActive = false;

    function requestFullscreenForQuiz() {
        let elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    }

    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    function isFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    }

    function cleanupFullscreenListeners() {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
        document.removeEventListener('mozfullscreenchange', onFullscreenChange);
        document.removeEventListener('MSFullscreenChange', onFullscreenChange);
    }

    function onFullscreenChange() {
        if (fullscreenActive && !isFullscreen()) {
            fullscreenActive = false;
            let banTime = Date.now() + 24 * 60 * 60 * 1000;
            localStorage.setItem('OS_FORGOT_BAN', banTime);
            cleanupFullscreenListeners();
            alert('🚫 检测到退出全屏！安全验证已终止，你已被封禁 24 小时。');
            let overlayEl = document.getElementById('os_forgot_overlay');
            if (overlayEl) overlayEl.remove();
        }
    }

    // 注册全屏变化监听
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    // ====== 关闭对话框的通用函数 ======
    function closeDialog() {
        fullscreenActive = false;
        cleanupFullscreenListeners();
        exitFullscreen();
        let overlayEl = document.getElementById('os_forgot_overlay');
        if (overlayEl) overlayEl.remove();
    }

    // ====== 创建 UI ======
    let overlay = document.createElement('div');
    overlay.id = 'os_forgot_overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:2147483647;display:flex;align-items:center;justify-content:center;';

    let dialog = document.createElement('div');
    dialog.style.cssText = 'background:#fff;border-radius:12px;padding:28px 32px;width:420px;max-width:90vw;color:#333;font-family:system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,0.3);';

    // 标题
    let title = document.createElement('div');
    title.innerHTML = '🔐 安全验证 · 找回密码';
    title.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:6px;color:#333;';
    dialog.appendChild(title);

    // 说明
    let desc = document.createElement('div');
    desc.innerHTML = '请回答以下 3 个安全问题。任何一题答错，将封禁 24 小时无法再次答题。<br><span style="color:#ff6600;">⚠️ 答题期间必须保持全屏，退出全屏将立即封禁 24 小时！</span>';
    desc.style.cssText = 'font-size:12px;color:#e74c3c;margin-bottom:18px;line-height:1.5;';
    dialog.appendChild(desc);

    // 题目容器
    let questionsContainer = document.createElement('div');
    questionsContainer.style.cssText = 'margin-bottom:18px;';

    // ===== 第 1 题 =====
    let q1Title = document.createElement('div');
    q1Title.innerHTML = '1. 你出生在哪里？';
    q1Title.style.cssText = 'font-size:14px;font-weight:bold;margin-bottom:8px;color:#333;';
    questionsContainer.appendChild(q1Title);

    let q1Options = ['A. 天津', 'B. 山东', 'C. 上海', 'D. 江苏'];
    let q1Answer = 'C';
    let q1Value = null;
    let q1Group = document.createElement('div');
    q1Group.style.cssText = 'margin-bottom:16px;display:flex;flex-direction:column;gap:6px;';
    q1Options.forEach(function(opt) {
        let label = document.createElement('label');
        label.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;padding:6px 10px;border-radius:6px;border:1px solid #ddd;transition:all 0.15s;';
        let radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'forgot_q1';
        radio.value = opt.charAt(0);
        radio.style.cssText = 'cursor:pointer;';
        let text = document.createElement('span');
        text.textContent = opt;
        label.appendChild(radio);
        label.appendChild(text);
        label.addEventListener('mouseenter', function() { if (!radio.checked) this.style.background = '#f0f0f0'; });
        label.addEventListener('mouseleave', function() { if (!radio.checked) this.style.background = 'transparent'; });
        radio.addEventListener('change', function() {
            q1Value = this.value;
            q1Group.querySelectorAll('label').forEach(function(l) {
                let r = l.querySelector('input');
                l.style.background = r.checked ? '#e8f0fe' : 'transparent';
                l.style.borderColor = r.checked ? '#4285f4' : '#ddd';
            });
        });
        q1Group.appendChild(label);
    });
    questionsContainer.appendChild(q1Group);

    // ===== 第 2 题 =====
    let q2Title = document.createElement('div');
    q2Title.innerHTML = '2. 你的生日是？（格式：YYYYMMDD，例如20000101）';
    q2Title.style.cssText = 'font-size:14px;font-weight:bold;margin-bottom:8px;color:#333;';
    questionsContainer.appendChild(q2Title);

    let q2Answer = '20140327';
    let q2Input = document.createElement('input');
    q2Input.type = 'text';
    q2Input.placeholder = '请输入生日（8位数字）';
    q2Input.style.cssText = 'width:100%;padding:10px 14px;border:2px solid #ddd;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;transition:border-color 0.2s;';
    q2Input.onfocus = function() { this.style.borderColor = '#4285f4'; };
    q2Input.onblur = function() { this.style.borderColor = '#ddd'; };
    questionsContainer.appendChild(q2Input);

    // 间距
    let spacer2 = document.createElement('div');
    spacer2.style.cssText = 'height:16px;';
    questionsContainer.appendChild(spacer2);

    // ===== 第 3 题 =====
    let q3Title = document.createElement('div');
    q3Title.innerHTML = '3. 你编过的脚本是？';
    q3Title.style.cssText = 'font-size:14px;font-weight:bold;margin-bottom:8px;color:#333;';
    questionsContainer.appendChild(q3Title);

    let q3Options = ['A. XMOJ-SCRIPT', 'B. Acwing 自动登录', 'C. Atcoder 题目跳转', 'D. XMOJ 登录历史'];
    let q3Answer = 'C';
    let q3Value = null;
    let q3Group = document.createElement('div');
    q3Group.style.cssText = 'margin-bottom:16px;display:flex;flex-direction:column;gap:6px;';
    q3Options.forEach(function(opt) {
        let label = document.createElement('label');
        label.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;padding:6px 10px;border-radius:6px;border:1px solid #ddd;transition:all 0.15s;';
        let radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'forgot_q3';
        radio.value = opt.charAt(0);
        radio.style.cssText = 'cursor:pointer;';
        let text = document.createElement('span');
        text.textContent = opt;
        label.appendChild(radio);
        label.appendChild(text);
        label.addEventListener('mouseenter', function() { if (!radio.checked) this.style.background = '#f0f0f0'; });
        label.addEventListener('mouseleave', function() { if (!radio.checked) this.style.background = 'transparent'; });
        radio.addEventListener('change', function() {
            q3Value = this.value;
            q3Group.querySelectorAll('label').forEach(function(l) {
                let r = l.querySelector('input');
                l.style.background = r.checked ? '#e8f0fe' : 'transparent';
                l.style.borderColor = r.checked ? '#4285f4' : '#ddd';
            });
        });
        q3Group.appendChild(label);
    });
    questionsContainer.appendChild(q3Group);

    dialog.appendChild(questionsContainer);

    // 提示信息
    let hint = document.createElement('div');
    hint.style.cssText = 'font-size:13px;color:#e74c3c;margin-bottom:12px;min-height:18px;';
    dialog.appendChild(hint);

    // 按钮行
    let btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:10px;';

    let cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.style.cssText = 'flex:1;padding:10px 0;background:#eee;color:#666;border:none;border-radius:8px;font-size:15px;cursor:pointer;transition:background 0.2s;';
    cancelBtn.onmouseover = function() { this.style.background = '#ddd'; };
    cancelBtn.onmouseout = function() { this.style.background = '#eee'; };
    cancelBtn.onclick = function() {
        closeDialog();
    };

    let submitBtn = document.createElement('button');
    submitBtn.textContent = '提交验证';
    submitBtn.style.cssText = 'flex:1;padding:10px 0;background:#4285f4;color:#fff;border:none;border-radius:8px;font-size:15px;cursor:pointer;transition:background 0.2s;';
    submitBtn.onmouseover = function() { this.style.background = '#3367d6'; };
    submitBtn.onmouseout = function() { this.style.background = '#4285f4'; };

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(submitBtn);
    dialog.appendChild(btnRow);

    overlay.appendChild(dialog);
    document.documentElement.appendChild(overlay);

    // ====== 挂载 UI 后请求全屏 ======
    requestFullscreenForQuiz();
    fullscreenActive = true;

    // ====== 验证逻辑 ======
    submitBtn.onclick = function() {
        if (!q1Value) {
            hint.textContent = '⚠️ 请回答第 1 题';
            return;
        }
        if (!q2Input.value.trim()) {
            hint.textContent = '⚠️ 请回答第 2 题';
            q2Input.focus();
            return;
        }
        if (!q3Value) {
            hint.textContent = '⚠️ 请回答第 3 题';
            return;
        }

        // 第 1 题答错
        if (q1Value !== q1Answer) {
            let banTime = Date.now() + 24 * 60 * 60 * 1000;
            localStorage.setItem('OS_FORGOT_BAN', banTime);
            hint.textContent = '❌回答错误！你已被封禁 24 小时，无法再次答题。';
            fullscreenActive = false;
            cleanupFullscreenListeners();
            submitBtn.disabled = true;
            submitBtn.style.background = '#ccc';
            submitBtn.style.cursor = 'not-allowed';
            cancelBtn.textContent = '关闭';
            return;
        }

        // 第 2 题答错
        if (q2Input.value.trim() !== q2Answer) {
            let banTime = Date.now() + 24 * 60 * 60 * 1000;
            localStorage.setItem('OS_FORGOT_BAN', banTime);
            hint.textContent = '❌回答错误！你已被封禁 24 小时，无法再次答题。';
            fullscreenActive = false;
            cleanupFullscreenListeners();
            submitBtn.disabled = true;
            submitBtn.style.background = '#ccc';
            submitBtn.style.cursor = 'not-allowed';
            cancelBtn.textContent = '关闭';
            return;
        }

        // 第 3 题答错
        if (q3Value !== q3Answer) {
            let banTime = Date.now() + 24 * 60 * 60 * 1000;
            localStorage.setItem('OS_FORGOT_BAN', banTime);
            hint.textContent = '❌回答错误！你已被封禁 24 小时，无法再次答题。';
            fullscreenActive = false;
            cleanupFullscreenListeners();
            submitBtn.disabled = true;
            submitBtn.style.background = '#ccc';
            submitBtn.style.cursor = 'not-allowed';
            cancelBtn.textContent = '关闭';
            return;
        }

        // 全部正确 → 重置密码
        hint.style.color = '#4caf50';
        hint.textContent = '✅ 验证通过！密码已重置。';

        setTimeout(function() {
            _pwd = '';
            localStorage.setItem('OS_PWD', '');
            _fail = 0;
            localStorage.setItem('OS_FAIL', '0');
            localStorage.removeItem('OS_LOCK_UNTIL');
            localStorage.removeItem('OS_LOCK_COUNT');
            localStorage.removeItem('OS_FORGOT_BAN');
            closeDialog();
            alert('✅ 密码已重置为空！\n\n请重新进入桌面模式，然后在设置中设置新密码。');
        }, 800);
    };
}
// ===== 首次使用强制阅读条款 =====
const TERMS_TEXT = `网页版Chrome OS脚本使用责任声明

一、使用要求
1. 本网页版Chrome OS Tampermonkey 脚本（以下简称"本工具"）由崔秣齐开发，开发过程参考AI辅助创作，所有功能均经本人完整实测验证，全部功能可正常运行；本工具仅面向具备合法网络使用资质、拥有完全民事行为能力的用户提供学习、个人测试用途。
2. 用户下载、安装、运行本工具前，需完整阅读并同意本责任声明全部条款，一旦启动脚本即代表自愿认可本声明所有内容。

二、使用规范
1. 用户仅可将本工具用于个人技术学习、本地文件管理、代码调试等合法合规场景。
2. 严禁利用本工具实施以下行为：
（1）入侵、窃取、篡改他人网站、服务器、设备数据；
（2）批量爬取、盗用他人版权文件、程序、图文音视频资源；
（3）传播违法、色情、暴力、造谣、涉政等违规内容；
（4）绕过平台限制、破解付费服务、开展商业牟利、网络诈骗；
（5）违反国家网络安全法、著作权法、个人信息保护法等法律法规的一切行为。
3. 工具内置AI对话、文件编译、文件下载功能，用户需自行保证上传、编辑、下载、对话输入内容合法，不得上传涉密、侵权、他人隐私信息。
4. 用户自行准备、更换、保管个人API接口地址、AI密钥，妥善保管密钥信息，因密钥泄露、转借产生的一切后果由用户自行承担。

三、开发者免责条款
1. 本工具仅提供基础网页模拟桌面、代码编译、文件管理、AI对话技术功能，虽经完整功能测试，但不对工具长期稳定性、第三方接口可用性、极端环境兼容性做任何保证，因网络波动、API失效、浏览器兼容问题造成的数据丢失、功能故障，开发者不承担修复及赔偿责任。
2. 因用户不当配置API、错误输入密钥、私自修改脚本代码导致设备故障、账号封禁、财产损失，全部责任由用户自行承担。
3. 若用户违反法律法规、平台规则不正当使用本工具，产生的行政处罚、民事赔偿、刑事追责等全部法律责任，均由使用人独立承担，开发者不承担任何连带、补充责任。
4. 开发者未强制、诱导任何用户使用本工具，用户自主选择安装、运行，对自身操作行为具备完全控制权，不能以工具存在为由推卸自身违法违规责任。

四、数据与风险告知
1. 工具本地文件操作仅在用户浏览器内执行，开发者不会主动收集、存储用户本地文件、对话记录、API密钥，但用户仍需自行做好重要文件备份。
2. 调用第三方AI接口、自定义API产生的数据传输、扣费、限流风险，由对应第三方平台规则约束，相关费用与纠纷均由用户自行和第三方平台协商处理。

五、其他约定
1. 本声明效力不受地域、使用设备、使用时间限制，长期有效。
2. 若国家法律法规更新，本声明中与法律冲突条款自动失效，其余条款继续生效。
3. 如用户不认可本声明任意条款，请立即卸载油猴脚本、停止使用本工具。

开发者：崔秣齐
2026年7月7日`;

const INTRO_TEXT = `网页版Chrome OS 实现指南

第一步：安装油猴（不多说了……）
第二步，请点击"新建脚本"，并粘贴
第三步，改API（如有）
请将脚本中所有api.apilio.ai替换成你自己的API
第四步，开始运行吧！

功能简介：
1、正常情况下，脚本将放一个按钮
2、点击后相当于进入了一个电脑，可以点击文件打开，新建删除文件。
3、打开后窗口可以调节缩放，Ctrl+/Ctrl- 可缩放
4、可以在左下角的设置更改原网页亮度、模糊度
5、初始使用时，请将API密钥粘贴进设置栏里面
6、左侧栏可以点击进行关闭操作
7、cpp文件支持编译，更加方便，同时支持括号等自动缩进补全
8、全部类型文件支持安全下载到本地
9、左下角可以搜索文件
10、当你在搜索栏中输入'ai'或'对话'时，将弹出一个智能对话框，可以与AI对话（设置里面添加模型或输入API密钥）
11、可以支持密码，错误5次数据清空！
12、可以切换7种不同的色调
13、不小心刷新？没关系，每700ms记录窗口，帮你复原所有的窗口，继续c++创作！
14、文件目前支持txt, cpp, markdown, docx, xlsx，文件夹，上传文件等等
15、右下角显示实时时间，大约延迟了500-1000ms
16、AI对话支持保留聊天记录和上下文，可以删除
17、窗口最小化/全屏/关闭
18、右下角实时显示日历
19、支持主流快捷键，请善用
20、一键打包下载所有文件
21、支持Insider版本，分开发人员、Canary、Beta
22、右键菜单可以复制/粘贴等等
23、支持展示explorer面板
24、任何情况下都可以使用本软件，但是由于非正当使用，包括但不限于篡改，盗版的情况，编辑人不承担任何责任!!!

崔秣齐
2026.7.7
2026 c ui m o q i 脚本开发 cooperation`;

// 下载文本文件工具函数
function downloadTxtFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;opacity:0;pointer-events:auto;';
    document.documentElement.appendChild(link);
    link.click();
    setTimeout(function() {
        document.documentElement.removeChild(link);
        URL.revokeObjectURL(link.href);
    }, 3000);
}

// 显示条款弹窗（强制阅读10秒）
function showTermsOverlay(callback) {
    let overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';

    let box = document.createElement('div');
    box.style.cssText = 'background:#1e1e1e;border:1px solid #444;border-radius:12px;padding:24px 30px;width:560px;max-width:92vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.7);color:#ddd;';

    let title = document.createElement('div');
    title.innerHTML = '📋 使用条款 <span style="color:#ff6600;font-size:12px;">（首次使用，请仔细阅读）</span>';
    title.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:12px;color:#4ec9b0;border-bottom:1px solid #333;padding-bottom:8px;';

    let contentArea = document.createElement('div');
    contentArea.style.cssText = 'flex:1;overflow-y:auto;background:#141414;border-radius:8px;padding:16px;font-size:13px;line-height:1.8;color:#ccc;white-space:pre-wrap;max-height:50vh;margin-bottom:16px;border:1px solid #333;';
    contentArea.textContent = TERMS_TEXT;

    let countdownRow = document.createElement('div');
    countdownRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';

    let countdownText = document.createElement('div');
    countdownText.style.cssText = 'font-size:13px;color:#888;';
    countdownText.textContent = '请阅读条款，倒计时 10 秒后可同意...';

    let agreeBtn = document.createElement('button');
    agreeBtn.textContent = '我已阅读并同意 (10s)';
    agreeBtn.disabled = true;
    agreeBtn.style.cssText = 'padding:10px 28px;border-radius:8px;border:none;font-size:14px;cursor:not-allowed;background:#555;color:#999;font-weight:600;transition:all 0.3s;';

    let dlRow = document.createElement('div');
    dlRow.style.cssText = 'display:flex;gap:10px;margin-top:10px;';
    let dlTermsBtn = document.createElement('button');
    dlTermsBtn.textContent = '📥 下载条款.txt';
    dlTermsBtn.style.cssText = 'padding:6px 16px;border-radius:6px;border:1px solid #555;background:transparent;color:#aaa;font-size:12px;cursor:pointer;transition:all 0.2s;';
    dlTermsBtn.onmouseover = function() { this.style.borderColor = '#4ec9b0'; this.style.color = '#4ec9b0'; };
    dlTermsBtn.onmouseout = function() { this.style.borderColor = '#555'; this.style.color = '#aaa'; };
    dlTermsBtn.onclick = function() { downloadTxtFile('条款.txt', TERMS_TEXT); };

    let dlIntroBtn = document.createElement('button');
    dlIntroBtn.textContent = '📥 下载介绍.txt';
    dlIntroBtn.style.cssText = 'padding:6px 16px;border-radius:6px;border:1px solid #555;background:transparent;color:#aaa;font-size:12px;cursor:pointer;transition:all 0.2s;';
    dlIntroBtn.onmouseover = function() { this.style.borderColor = '#da70d6'; this.style.color = '#da70d6'; };
    dlIntroBtn.onmouseout = function() { this.style.borderColor = '#555'; this.style.color = '#aaa'; };
    dlIntroBtn.onclick = function() { downloadTxtFile('介绍.txt', INTRO_TEXT); };

    dlRow.appendChild(dlTermsBtn);
    dlRow.appendChild(dlIntroBtn);

    countdownRow.appendChild(countdownText);
    countdownRow.appendChild(agreeBtn);

    box.appendChild(title);
    box.appendChild(contentArea);
    box.appendChild(dlRow);
    box.appendChild(countdownRow);
    overlay.appendChild(box);
    document.documentElement.appendChild(overlay);

    // 倒计时10秒
    let remaining = 10;
    let timer = setInterval(function() {
        remaining--;
        if (remaining <= 0) {
            clearInterval(timer);
            agreeBtn.disabled = false;
            agreeBtn.textContent = '✅ 我已阅读并同意';
            agreeBtn.style.cssText = 'padding:10px 28px;border-radius:8px;border:none;font-size:14px;cursor:pointer;background:#4caf50;color:#fff;font-weight:600;transition:all 0.3s;';
            agreeBtn.onmouseover = function() { this.style.background = '#43a047'; };
            agreeBtn.onmouseout = function() { this.style.background = '#4caf50'; };
            countdownText.textContent = '✅ 已阅读完毕，请点击同意继续';
            countdownText.style.color = '#4caf50';
        } else {
            agreeBtn.textContent = '我已阅读并同意 (' + remaining + 's)';
            countdownText.textContent = '请阅读条款，倒计时 ' + remaining + ' 秒后可同意...';
        }
    }, 1000);

    agreeBtn.onclick = function() {
        if (agreeBtn.disabled) return;
        localStorage.setItem('OS_TERMS_ACCEPTED', '1');
        overlay.remove();
        if (callback) callback();
    };
}

// 查看条款弹窗（非强制，用于设置面板）
function showTermsViewOverlay() {
    let overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';

    let box = document.createElement('div');
    box.style.cssText = 'background:#1e1e1e;border:1px solid #444;border-radius:12px;padding:24px 30px;width:560px;max-width:92vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.7);color:#ddd;';

    let title = document.createElement('div');
    title.innerHTML = '📋 使用条款';
    title.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:12px;color:#4ec9b0;border-bottom:1px solid #333;padding-bottom:8px;';

    let contentArea = document.createElement('div');
    contentArea.style.cssText = 'flex:1;overflow-y:auto;background:#141414;border-radius:8px;padding:16px;font-size:13px;line-height:1.8;color:#ccc;white-space:pre-wrap;max-height:50vh;margin-bottom:16px;border:1px solid #333;';
    contentArea.textContent = TERMS_TEXT;

    let btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;';

    let closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText = 'padding:8px 20px;border-radius:8px;border:1px solid #555;background:transparent;color:#aaa;font-size:13px;cursor:pointer;transition:all 0.2s;';
    closeBtn.onmouseover = function() { this.style.borderColor = '#fff'; this.style.color = '#fff'; };
    closeBtn.onmouseout = function() { this.style.borderColor = '#555'; this.style.color = '#aaa'; };
    closeBtn.onclick = function() { overlay.remove(); };

    let dlTermsBtn = document.createElement('button');
    dlTermsBtn.textContent = '📥 下载条款.txt';
    dlTermsBtn.style.cssText = 'padding:8px 20px;border-radius:8px;border:1px solid #4ec9b0;background:transparent;color:#4ec9b0;font-size:13px;cursor:pointer;transition:all 0.2s;';
    dlTermsBtn.onmouseover = function() { this.style.background = 'rgba(78,201,176,0.1)'; };
    dlTermsBtn.onmouseout = function() { this.style.background = 'transparent'; };
    dlTermsBtn.onclick = function() { downloadTxtFile('条款.txt', TERMS_TEXT); };

    btnRow.appendChild(dlTermsBtn);
    btnRow.appendChild(closeBtn);

    box.appendChild(title);
    box.appendChild(contentArea);
    box.appendChild(btnRow);
    overlay.appendChild(box);
    document.documentElement.appendChild(overlay);
}

// 功能浏览弹窗（用于设置面板）
function showFeatureViewOverlay() {
    let overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';

    let box = document.createElement('div');
    box.style.cssText = 'background:#1e1e1e;border:1px solid #444;border-radius:12px;padding:24px 30px;width:560px;max-width:92vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.7);color:#ddd;';

    let title = document.createElement('div');
    title.innerHTML = '📖 功能浏览';
    title.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:12px;color:#da70d6;border-bottom:1px solid #333;padding-bottom:8px;';

    let contentArea = document.createElement('div');
    contentArea.style.cssText = 'flex:1;overflow-y:auto;background:#141414;border-radius:8px;padding:16px;font-size:13px;line-height:1.8;color:#ccc;white-space:pre-wrap;max-height:50vh;margin-bottom:16px;border:1px solid #333;';
    contentArea.textContent = INTRO_TEXT;

    let btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;';

    let closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText = 'padding:8px 20px;border-radius:8px;border:1px solid #555;background:transparent;color:#aaa;font-size:13px;cursor:pointer;transition:all 0.2s;';
    closeBtn.onmouseover = function() { this.style.borderColor = '#fff'; this.style.color = '#fff'; };
    closeBtn.onmouseout = function() { this.style.borderColor = '#555'; this.style.color = '#aaa'; };
    closeBtn.onclick = function() { overlay.remove(); };

    let dlIntroBtn = document.createElement('button');
    dlIntroBtn.textContent = '📥 下载介绍.txt';
    dlIntroBtn.style.cssText = 'padding:8px 20px;border-radius:8px;border:1px solid #da70d6;background:transparent;color:#da70d6;font-size:13px;cursor:pointer;transition:all 0.2s;';
    dlIntroBtn.onmouseover = function() { this.style.background = 'rgba(218,112,214,0.1)'; };
    dlIntroBtn.onmouseout = function() { this.style.background = 'transparent'; };
    dlIntroBtn.onclick = function() { downloadTxtFile('介绍.txt', INTRO_TEXT); };

    btnRow.appendChild(dlIntroBtn);
    btnRow.appendChild(closeBtn);

    box.appendChild(title);
    box.appendChild(contentArea);
    box.appendChild(btnRow);
    overlay.appendChild(box);
    document.documentElement.appendChild(overlay);
}
// ===== 一键重置 localStorage =====
function showResetLocalStorageOverlay() {
    let savedPwd = localStorage.getItem('OS_PWD');
    // 免密模式（空字符串）或从未初始化，跳过密码验证
    if (savedPwd === null || savedPwd === '') {
        showResetSecondConfirm(null, savedPwd);
        return;
    }

    let overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';

    let box = document.createElement('div');
    box.style.cssText = 'background:#1e1e1e;border:1px solid #444;border-radius:12px;padding:24px 30px;width:440px;max-width:92vw;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.7);color:#ddd;';

    let title = document.createElement('div');
    title.innerHTML = '⚠️ 重置本地数据';
    title.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:12px;color:#ff6b6b;border-bottom:1px solid #333;padding-bottom:8px;';

    let warnText = document.createElement('div');
    warnText.innerHTML = '此操作将<strong style="color:#ff6b6b;">清除本脚本所有本地数据</strong>（文件、设置、密钥等），且<strong style="color:#ff6b6b;">不可恢复</strong>！<br>请输入密码以确认操作。';
    warnText.style.cssText = 'font-size:13px;color:#ccc;line-height:1.7;margin-bottom:16px;padding:10px 12px;background:#1a1a1a;border-radius:8px;border:1px solid #333;';

    let inputRow1 = document.createElement('div');
    inputRow1.style.cssText = 'margin-bottom:10px;';
    let label1 = document.createElement('div');
    label1.textContent = '输入密码：';
    label1.style.cssText = 'font-size:12px;color:#888;margin-bottom:4px;';
    let input1 = document.createElement('input');
    input1.type = 'password';
    input1.placeholder = '请输入您的密码';
    input1.style.cssText = 'width:100%;padding:8px 12px;border-radius:8px;border:1px solid #444;background:#141414;color:#ddd;font-size:13px;outline:none;box-sizing:border-box;';
    input1.onfocus = function() { this.style.borderColor = '#4ec9b0'; };
    input1.onblur = function() { this.style.borderColor = '#444'; };
    inputRow1.appendChild(label1);
    inputRow1.appendChild(input1);

    let inputRow2 = document.createElement('div');
    inputRow2.style.cssText = 'margin-bottom:10px;';
    let label2 = document.createElement('div');
    label2.textContent = '确认密码：';
    label2.style.cssText = 'font-size:12px;color:#888;margin-bottom:4px;';
    let input2 = document.createElement('input');
    input2.type = 'password';
    input2.placeholder = '请再次输入密码';
    input2.style.cssText = 'width:100%;padding:8px 12px;border-radius:8px;border:1px solid #444;background:#141414;color:#ddd;font-size:13px;outline:none;box-sizing:border-box;';
    input2.onfocus = function() { this.style.borderColor = '#4ec9b0'; };
    input2.onblur = function() { this.style.borderColor = '#444'; };
    inputRow2.appendChild(label2);
    inputRow2.appendChild(input2);

    let errorText = document.createElement('div');
    errorText.style.cssText = 'font-size:12px;color:#ff6b6b;min-height:18px;margin-bottom:8px;';

    let btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;';

    let cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.style.cssText = 'padding:8px 20px;border-radius:8px;border:1px solid #555;background:transparent;color:#aaa;font-size:13px;cursor:pointer;transition:all 0.2s;';
    cancelBtn.onmouseover = function() { this.style.borderColor = '#fff'; this.style.color = '#fff'; };
    cancelBtn.onmouseout = function() { this.style.borderColor = '#555'; this.style.color = '#aaa'; };
    cancelBtn.onclick = function() { overlay.remove(); };

    let confirmBtn = document.createElement('button');
    confirmBtn.textContent = '下一步';
    confirmBtn.style.cssText = 'padding:8px 20px;border-radius:8px;border:none;background:#ff6b6b;color:#fff;font-size:13px;cursor:pointer;font-weight:600;transition:all 0.2s;';
    confirmBtn.onmouseover = function() { this.style.background = '#e55a5a'; };
    confirmBtn.onmouseout = function() { this.style.background = '#ff6b6b'; };

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);

    box.appendChild(title);
    box.appendChild(warnText);
    box.appendChild(inputRow1);
    box.appendChild(inputRow2);
    box.appendChild(errorText);
    box.appendChild(btnRow);
    overlay.appendChild(box);
    document.documentElement.appendChild(overlay);

    input1.focus();

    confirmBtn.onclick = function() {
        let p1 = input1.value.trim();
        let p2 = input2.value.trim();
        if (!p1 || !p2) {
            errorText.textContent = '❌ 请输入两次密码';
            return;
        }
        if (p1 !== p2) {
            errorText.textContent = '❌ 两次密码不一致，请重新输入';
            input2.value = '';
            input2.focus();
            return;
        }
        if (p1 !== savedPwd) {
            errorText.textContent = '❌ 密码错误，请重新输入';
            input1.value = '';
            input2.value = '';
            input1.focus();
            return;
        }
        // 密码正确，进入二次确认
        showResetSecondConfirm(overlay, savedPwd);
    };
}

function showResetSecondConfirm(parentOverlay, password) {
    let overlay2 = document.createElement('div');
    overlay2.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:2147483648;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';

    let box = document.createElement('div');
    box.style.cssText = 'background:#1e1e1e;border:2px solid #ff6b6b;border-radius:12px;padding:24px 30px;width:380px;max-width:90vw;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.8);color:#ddd;';

    let icon = document.createElement('div');
    icon.innerHTML = '🔴 <strong>最终确认</strong>';
    icon.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:12px;color:#ff6b6b;';

    let msg = document.createElement('div');
    msg.innerHTML = '您即将<strong style="color:#ff6b6b;">永久删除本脚本所有本地数据</strong>，此操作不可撤销！<br>仅清除本脚本数据，不影响其他网页/脚本。';
    msg.style.cssText = 'font-size:13px;color:#ccc;line-height:1.7;margin-bottom:12px;';

    let inputWrap = document.createElement('div');
    inputWrap.style.cssText = 'margin-bottom:10px;';
    let input3 = document.createElement('input');
    input3.type = 'password';
    input3.placeholder = '请再次输入密码';
    input3.style.cssText = 'width:100%;padding:8px 12px;border-radius:8px;border:1px solid #444;background:#141414;color:#ddd;font-size:13px;outline:none;box-sizing:border-box;';
    input3.onfocus = function() { this.style.borderColor = '#ff6b6b'; };
    input3.onblur = function() { this.style.borderColor = '#444'; };
    inputWrap.appendChild(input3);

    let errorText2 = document.createElement('div');
    errorText2.style.cssText = 'font-size:12px;color:#ff6b6b;min-height:18px;margin-bottom:8px;';

    let btnRow2 = document.createElement('div');
    btnRow2.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;';

    let cancelBtn2 = document.createElement('button');
    cancelBtn2.textContent = '取消';
    cancelBtn2.style.cssText = 'padding:8px 20px;border-radius:8px;border:1px solid #555;background:transparent;color:#aaa;font-size:13px;cursor:pointer;transition:all 0.2s;';
    cancelBtn2.onmouseover = function() { this.style.borderColor = '#fff'; this.style.color = '#fff'; };
    cancelBtn2.onmouseout = function() { this.style.borderColor = '#555'; this.style.color = '#aaa'; };
    cancelBtn2.onclick = function() { overlay2.remove(); };

    let finalBtn = document.createElement('button');
    finalBtn.textContent = '🗑️ 确认清空';
    finalBtn.style.cssText = 'padding:8px 20px;border-radius:8px;border:none;background:#ff6b6b;color:#fff;font-size:13px;cursor:pointer;font-weight:600;transition:all 0.2s;';
    finalBtn.onmouseover = function() { this.style.background = '#e55a5a'; };
    finalBtn.onmouseout = function() { this.style.background = '#ff6b6b'; };

    btnRow2.appendChild(cancelBtn2);
    btnRow2.appendChild(finalBtn);

    box.appendChild(icon);
    box.appendChild(msg);

    // 免密模式不需要二次输入密码
    if (password !== null && password !== '') {
        let pwdLabel = document.createElement('div');
        pwdLabel.textContent = '再次输入密码以确认：';
        pwdLabel.style.cssText = 'font-size:12px;color:#888;margin-bottom:4px;';
        box.appendChild(pwdLabel);
        box.appendChild(inputWrap);
    }
    box.appendChild(errorText2);
    box.appendChild(btnRow2);
    overlay2.appendChild(box);
    document.documentElement.appendChild(overlay2);

    if (password !== null && password !== '') {
        input3.focus();
    }

    finalBtn.onclick = function() {
        // 有密码时需要验证
        if (password !== null && password !== '') {
            let p3 = input3.value.trim();
            if (!p3) {
                errorText2.textContent = '❌ 请输入密码';
                return;
            }
            if (p3 !== password) {
                errorText2.textContent = '❌ 密码错误，请重新输入';
                input3.value = '';
                input3.focus();
                return;
            }
        }

        // 只清除本脚本的 localStorage 键（OS_ 和 MOCK_OS_ 开头）
        let keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key && (key.startsWith('OS_') || key.startsWith('MOCK_OS_'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(function(k) { localStorage.removeItem(k); });

        overlay2.remove();
        if (parentOverlay) parentOverlay.remove();

        // 成功提示
        let successDiv = document.createElement('div');
        successDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';
        let sBox = document.createElement('div');
        sBox.style.cssText = 'background:#1e1e1e;border:1px solid #4caf50;border-radius:12px;padding:30px 40px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.7);color:#ddd;';
        sBox.innerHTML = '<div style="font-size:28px;margin-bottom:12px;">✅</div><div style="font-size:16px;color:#4caf50;font-weight:bold;">本脚本数据已清空</div><div style="font-size:12px;color:#888;margin-top:8px;">已清除 ' + keysToRemove.length + ' 项数据，页面即将刷新...</div>';
        successDiv.appendChild(sBox);
        document.documentElement.appendChild(successDiv);
        setTimeout(function() {
            location.reload();
        }, 1500);
    };
}
// 首次使用检测
if (!localStorage.getItem('OS_TERMS_ACCEPTED')) {
    showTermsOverlay();
}
    if (window.top !== window.self) return;
    // --- 1. 核心持久化数据中心 ---
    let DEFAULT_OS_DATA = {
        files: [
            { id: 'f1', name: 'README.txt', type: 'txt', content: '欢迎来到优化版 Web OS！\n\n【功能列表】\n1. AI 终端支持输入 < > () 等编程符号！\n2. AI 终端输入框支持 Ctrl+Enter 快捷换行。\n3. 左侧边栏小箭头可折叠/展开侧边栏。\n4. 支持选择系统色调，含浅色模式！\n5. 支持窗口记忆，刷新后窗口不消失！\n6. C++ Snippets 快速插入（55+代码片段）！\n7. 括号自动补全 + 闭合跳过 + 配对删除！\n8. 未匹配括号实时标红（浅色模式标蓝）！\n9. 窗口最小化/全屏/还原！\n10. Word/Excel 真实格式下载！\n11. AI 回复 Markdown 渲染！\n12. AI 对话保留/删除功能！\n13. Markdown 文件创建与预览！' },
            { id: 'f2', name: 'main.cpp', type: 'cpp', content: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cout << "请输入两个整数（在右侧输入框填写，用空格隔开）：" << endl;\n    if (cin >> a >> b) {\n        cout << "👉 远程编译计算结果：" << a << " + " << b << " = " << (a + b) << endl;\n    } else {\n        cout << "⚠️ 未检测到有效的输入数据！" << endl;\n    }\n    return 0;\n}' },
            { id: 'f3', name: '季度财务核算.xlsx', type: 'xlsx', content: [["指标项目","第一季度","第二季度","环比增长"],["业务营收","89000","104000","16.8%"]] },
            { id: 'f4', name: '商业计划书.docx', type: 'docx', content: '<div><font size="5"><b>智能系统深度重构计划</b></font></div>' }
        ],
        settings: {
            blur: 10, brightness: 40, apiKey: '',
            activeModel: 'gpt-4o', modelList: ['gpt-4o', 'gpt-3.5-turbo', 'claude-3-5-sonnet'],
            theme: 'default', customAccentColor: '', rememberWindows: false, autoRestoreDesktop: false, trashAutoDeleteDays: 0
        },
        openWindows: [],
        desktopActive: false,
        settingsOpen: false,
        aiConversations: [],
        trashBin: []
    };

    let OS_DATA = JSON.parse(localStorage.getItem('MOCK_OS_DATA_V13')) || DEFAULT_OS_DATA;

    if (!OS_DATA.settings.theme) OS_DATA.settings.theme = 'default';
    if (OS_DATA.settings.rememberWindows === undefined) OS_DATA.settings.rememberWindows = false;
    if (OS_DATA.settings.autoRestoreDesktop === undefined) OS_DATA.settings.autoRestoreDesktop = false;
    if (!OS_DATA.openWindows) OS_DATA.openWindows = [];
    if (OS_DATA.desktopActive === undefined) OS_DATA.desktopActive = false;
    if (!OS_DATA.aiConversations) OS_DATA.aiConversations = [];
    if (!OS_DATA.trashBin) OS_DATA.trashBin = [];
    if (OS_DATA.settings.trashAutoDeleteDays === undefined) OS_DATA.settings.trashAutoDeleteDays = 0;
    if (OS_DATA.settings.customAccentColor === undefined) OS_DATA.settings.customAccentColor = '';
    if (OS_DATA.settingsOpen === undefined) OS_DATA.settingsOpen = false;
    if (OS_DATA.settings.model) {
        OS_DATA.settings.activeModel = OS_DATA.settings.model;
        OS_DATA.settings.modelList = ['gpt-4o', 'gpt-3.5-turbo', OS_DATA.settings.model];
        delete OS_DATA.settings.model;
        saveSystemData();
    }

    let saveTimer = null;
    function saveSystemData() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => { localStorage.setItem('MOCK_OS_DATA_V13', JSON.stringify(OS_DATA)); }, 300);
    }
    function saveSystemDataNow() {
        clearTimeout(saveTimer);
        localStorage.setItem('MOCK_OS_DATA_V13', JSON.stringify(OS_DATA));
    }

    let zIndexCounter = 200000;

    // --- 简易 Markdown 渲染 ---
    function renderMarkdown(text) {
        if (typeof marked !== 'undefined') {
            try { return marked.parse(text); } catch(e) {}
        }
        let html = escapeHTML(text);
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (m, lang, code) => {
            return `<pre style="background:rgba(0,0,0,0.3);padding:12px;border-radius:6px;overflow-x:auto;margin:8px 0;border:1px solid rgba(255,255,255,0.1);"><code>${code.trim()}</code></pre>`;
        });
        html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:3px;font-family:Consolas,monospace;font-size:0.9em;">$1</code>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
        html = html.replace(/\*(.+?)\*/g, '<i>$1</i>');
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    function escapeHTML(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

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
            bracketUnmatchedColor: '#ff3333', taskbarMinBtnBg: 'rgba(255,255,255,0.08)', taskbarMinBtnHoverBg: 'rgba(255,255,255,0.15)',
            aiBubbleUser: 'rgba(0,120,212,0.15)', aiBubbleAI: 'rgba(78,201,176,0.08)'
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
            bracketUnmatchedColor: '#ff3333', taskbarMinBtnBg: 'rgba(255,255,255,0.08)', taskbarMinBtnHoverBg: 'rgba(255,255,255,0.15)',
            aiBubbleUser: 'rgba(66,165,245,0.15)', aiBubbleAI: 'rgba(100,255,218,0.08)'
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
            bracketUnmatchedColor: '#ff3333', taskbarMinBtnBg: 'rgba(255,255,255,0.08)', taskbarMinBtnHoverBg: 'rgba(255,255,255,0.15)',
            aiBubbleUser: 'rgba(171,71,188,0.15)', aiBubbleAI: 'rgba(234,128,252,0.08)'
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
            bracketUnmatchedColor: '#ff3333', taskbarMinBtnBg: 'rgba(255,255,255,0.08)', taskbarMinBtnHoverBg: 'rgba(255,255,255,0.15)',
            aiBubbleUser: 'rgba(76,175,80,0.15)', aiBubbleAI: 'rgba(105,240,174,0.08)'
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
            bracketUnmatchedColor: '#ff3333', taskbarMinBtnBg: 'rgba(255,255,255,0.08)', taskbarMinBtnHoverBg: 'rgba(255,255,255,0.15)',
            aiBubbleUser: 'rgba(255,152,0,0.15)', aiBubbleAI: 'rgba(255,213,79,0.08)'
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
            bracketUnmatchedColor: '#ff3333', taskbarMinBtnBg: 'rgba(255,255,255,0.08)', taskbarMinBtnHoverBg: 'rgba(255,255,255,0.15)',
            aiBubbleUser: 'rgba(239,83,80,0.15)', aiBubbleAI: 'rgba(255,138,128,0.08)'
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
            bracketUnmatchedColor: '#0066ff', taskbarMinBtnBg: 'rgba(0,0,0,0.05)', taskbarMinBtnHoverBg: 'rgba(0,0,0,0.1)',
            aiBubbleUser: 'rgba(0,120,212,0.1)', aiBubbleAI: 'rgba(0,120,212,0.05)'
        }
    };

    // 自定义色调生成器：基于用户指定的主色，生成完整主题
function generateCustomTheme(accentHex) {
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        return {
            r: parseInt(hex.substring(0,2), 16),
            g: parseInt(hex.substring(2,4), 16),
            b: parseInt(hex.substring(4,6), 16)
        };
    }
    function adjustBrightness(hex, factor) {
        const c = hexToRgb(hex);
        const r = Math.min(255, Math.max(0, Math.round(c.r * factor)));
        const g = Math.min(255, Math.max(0, Math.round(c.g * factor)));
        const b = Math.min(255, Math.max(0, Math.round(c.b * factor)));
        return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
    }
    function toRgba(hex, alpha) {
        const c = hexToRgb(hex);
        return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')';
    }
    const dark = adjustBrightness(accentHex, 0.55);
    const darker = adjustBrightness(accentHex, 0.35);
    const veryDark = adjustBrightness(accentHex, 0.15);
    const light = adjustBrightness(accentHex, 1.3);
    return {
        label: '🎨 自定义 ' + accentHex,
        sidebarBg: toRgba(darker, 0.45),
        taskbarBg: toRgba(veryDark, 0.85),
        winBg: veryDark,
        winHeader: darker,
        winBorder: dark,
        winBorderBottom: adjustBrightness(accentHex, 0.4),
        statusBarBg: accentHex,
        accentColor: accentHex,
        accentHover: dark,
        entryBtnBg: accentHex,
        entryBtnHover: dark,
        sidebarToggleBg: toRgba(darker, 0.9),
        sidebarToggleHoverBg: toRgba(dark, 0.9),
        textPrimary: light,
        textSecondary: adjustBrightness(accentHex, 1.6),
        terminalBg: adjustBrightness(accentHex, 0.08),
        codeGutterBorder: darker,
        codeGutterColor: adjustBrightness(accentHex, 1.1),
        codeGutterBg: veryDark,
        terminalGreen: light,
        stdinBg: adjustBrightness(accentHex, 0.1),
        stdinBorder: darker,
        stdinTitleBg: darker,
        stdinColor: light,
        inputBg: darker,
        inputBorder: dark,
        settingsBodyBg: veryDark,
        vsTabBg: darker,
        vsTabBorder: adjustBrightness(accentHex, 0.25),
        bracketUnmatchedColor: '#ff3333',
        taskbarMinBtnBg: 'rgba(255,255,255,0.08)',
        taskbarMinBtnHoverBg: 'rgba(255,255,255,0.15)',
        aiBubbleUser: toRgba(accentHex, 0.15),
        aiBubbleAI: toRgba(accentHex, 0.08)
    };
}

function getTheme() {
    if (OS_DATA.settings.theme === 'custom' && OS_DATA.settings.customAccentColor) {
        return generateCustomTheme(OS_DATA.settings.customAccentColor);
    }
    return THEMES[OS_DATA.settings.theme] || THEMES['default'];
}

    // --- 2. Shadow DOM ---
    const host = document.createElement('div');
    host.id = 'os-shadow-host';
    host.style.cssText = 'position: fixed !important; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 2147483647 !important; pointer-events: none;';
    document.documentElement.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.innerHTML = `
        #os-entry-btn { position: fixed !important; bottom: 65px !important; right: 20px !important; background: var(--accent-color) !important; color: white !important; padding: 12px 24px !important; border-radius: 4px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important; cursor: pointer !important; font-family: system-ui, sans-serif !important; font-weight: 500 !important; pointer-events: auto !important; display: block; user-select: none; border: 1px solid rgba(255,255,255,0.2) !important; }
        #os-entry-btn:hover { background: var(--accent-hover) !important; }
        #os-desktop { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; pointer-events: none !important; font-family: 'Segoe UI', system-ui, sans-serif !important; display: none; box-sizing: border-box; }
        #os-wallpaper-blur { position: absolute; top:0; left:0; width:100%; height:100%; backdrop-filter: blur(${OS_DATA.settings.blur}px); background: rgba(0, 0, 0, ${OS_DATA.settings.brightness / 100}); z-index: -1; pointer-events: none !important; }
        #os-sidebar, #os-taskbar, .os-window { pointer-events: auto !important; }
        #os-sidebar { position: absolute; top: 0; left: 0; width: 240px; height: calc(100vh - 45px); background: var(--sidebar-bg); backdrop-filter: blur(25px); border-right: 1px solid rgba(255,255,255,0.1); color: white; display: flex; flex-direction: column; box-shadow: 5px 0 25px rgba(0,0,0,0.3); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 100; }
        #sidebar-toggle { position: absolute; right: -24px; top: 50%; transform: translateY(-50%); width: 24px; height: 50px; background: var(--sidebar-toggle-bg); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 0 6px 6px 0; border: 1px solid rgba(255,255,255,0.2); border-left: none; font-size: 12px; z-index: 101; transition: background 0.2s; }
        #sidebar-toggle:hover { background: var(--sidebar-toggle-hover-bg); }
        .sidebar-top-bar { display: flex; padding: 8px; gap: 4px; background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sidebar-create-btn { flex: 1; padding: 6px 4px; font-size: 11px; color: #fff; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; cursor: pointer; text-align: center; white-space: nowrap; }
        .sidebar-create-btn:hover { background: rgba(255,255,255,0.2); }
        .sidebar-folder-view { padding: 12px; flex-grow: 1; overflow-y: auto; }
        .folder-tree-title { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 8px; user-select:none; }
        .file-node { padding: 6px 8px 6px 16px; font-size: 13px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: space-between; border-radius: 4px; }
        .file-node:hover { background: rgba(255,255,255,0.15); }
        .file-info-part { display: flex; align-items: center; gap: 8px; pointer-events: none; }
        .file-raw-delete-btn { color: #ff5f56; font-weight: bold; font-size: 16px; padding: 0 6px; cursor: pointer; opacity: 0; transition: opacity 0.1s, transform 0.1s; }
        .file-node:hover .file-raw-delete-btn { opacity: 1; }
        .file-raw-delete-btn:hover { transform: scale(1.3); color: #ff3b30; }
        .file-rename-btn { color: #57a6ff; font-size: 14px; padding: 0 4px; cursor: pointer; opacity: 0; transition: opacity 0.1s, transform 0.1s; }
        .file-node:hover .file-rename-btn { opacity: 1; }
        .file-rename-btn:hover { transform: scale(1.3); color: #79b8ff; }
        #os-taskbar { position: absolute; bottom: 0; left: 0; width: 100vw; height: 45px; background: var(--taskbar-bg); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: space-between; padding: 0 15px; box-sizing: border-box; border-top: 1px solid rgba(255,255,255,0.1); color: white; user-select: none; z-index: 102; }
        .taskbar-left { display: flex; align-items: center; gap: 10px; height: 100%; }
        .taskbar-search-box { background: rgba(255,255,255,0.85); border: none; border-radius: 4px; padding: 6px 12px; width: 180px; font-size: 12px; color: #333; outline: none; transition: width 0.2s; }
        .taskbar-search-box:focus { width: 250px; background: #fff; }
        .taskbar-icon-btn { font-size: 18px; cursor: pointer; padding: 6px 10px; border-radius: 4px; display: flex; align-items: center; }
        .taskbar-icon-btn:hover { background: rgba(255,255,255,0.1); }
        #os-exit-btn { background: rgba(220, 53, 69, 0.8); color: white; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; }
        #os-exit-btn:hover { background: #dc3545; }
        #os-clock { font-size: 12px; color: #ccc; text-align: right; line-height:1.2; }
        .taskbar-minimized-item { background: var(--taskbar-min-btn-bg); color: white; padding: 4px 12px; border-radius: 3px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: background 0.15s; }
        .taskbar-minimized-item:hover { background: var(--taskbar-min-btn-hover-bg); }
        .os-window { position: absolute; top: 100px; left: 300px; width: 780px; height: 580px; background: var(--win-bg); border: 1px solid var(--win-border); border-radius: 6px; display: flex; flex-direction: column; box-shadow: 0 15px 40px rgba(0,0,0,0.6); overflow: hidden; min-width: 450px; min-height: 300px; transition: none; }
        .os-window.maximized { top: 0 !important; left: 0 !important; width: 100vw !important; height: calc(100vh - 45px) !important; border-radius: 0 !important; border: none !important; }
        .os-window.minimized { display: none !important; }
        .os-window-header { background: var(--win-header); padding: 0 0 0 12px; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none; color: var(--text-primary); font-size: 13px; border-bottom: 1px solid var(--win-border-bottom); height: 32px; }
        .window-controls-group { display: flex; align-items: center; height: 100%; }
        .win-ctrl-btn { width: 36px; height: 32px; color: #aaa; font-size: 14px; font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.1s; }
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
        .bracket-highlight-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden; z-index: 1; font-family: 'Consolas', monospace; font-size: 14px; padding: 12px; line-height: 1.5; white-space: pre; color: transparent; box-sizing: border-box; }
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
        .md-preview-container { display: flex; flex-direction: column; height: 100%; background: var(--win-bg); }
        .md-toolbar { height: 30px; background: var(--vs-tab-bg); display: flex; align-items: center; justify-content: space-between; padding: 0 12px; border-bottom: 1px solid var(--vs-tab-border); user-select: none; font-size: 12px; color: var(--text-secondary); }
        .md-toolbar-btn { cursor: pointer; padding: 4px 10px; border-radius: 3px; color: var(--text-primary); font-size: 12px; background: rgba(255,255,255,0.05); }
        .md-toolbar-btn:hover { background: rgba(255,255,255,0.15); }
        .md-toolbar-btn.active { background: var(--accent-color); color: #fff; }
        .md-split-view { display: flex; flex-grow: 1; overflow: hidden; }
        .md-editor-pane { flex: 1; display: flex; flex-direction: column; border-right: 1px solid var(--vs-tab-border); }
        .md-preview-pane { flex: 1; overflow-y: auto; padding: 20px; color: var(--text-primary); font-family: system-ui, sans-serif; font-size: 14px; line-height: 1.7; }
        .md-preview-pane h1 { font-size: 1.6em; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; }
        .md-preview-pane h2 { font-size: 1.3em; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; }
        .md-preview-pane h3 { font-size: 1.1em; }
        .md-preview-pane pre { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; overflow-x: auto; margin: 8px 0; }
        .md-preview-pane code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px; font-family: Consolas, monospace; font-size: 0.9em; }
        .md-preview-pane a { color: #58a6ff; }
        .md-preview-pane blockquote { border-left: 3px solid var(--accent-color); margin: 8px 0; padding: 4px 12px; color: var(--text-secondary); }
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
        .theme-swatch { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: border-color 0.2s, transform 0.15s; }
        .theme-swatch:hover { transform: scale(1.15); }
        .theme-swatch.active { border-color: #fff; transform: scale(1.15); }
        .toggle-switch { position: relative; width: 44px; height: 24px; background: #555; border-radius: 12px; cursor: pointer; transition: background 0.3s; flex-shrink: 0; }
        .toggle-switch.active { background: var(--accent-color); }
        .toggle-switch::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: transform 0.3s; }
        .toggle-switch.active::after { transform: translateX(20px); }
        .snippet-dropdown { position: absolute; top: 30px; right: 0; width: 280px; max-height: 320px; background: #252526; border: 1px solid #444; border-radius: 6px; overflow-y: auto; box-shadow: 0 8px 24px rgba(0,0,0,0.5); z-index: 9999; display: none; }
        .snippet-dropdown.show { display: block; }
        .snippet-item { padding: 8px 12px; cursor: pointer; color: #ccc; font-size: 12px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; }
        .snippet-item:last-child { border-bottom: none; }
        .snippet-item:hover { background: #094771; color: #fff; }
        .snippet-item .snippet-name { font-weight: bold; color: #4ec9b0; }
        .snippet-item .snippet-prefix { color: #888; font-family: monospace; }
        .ai-chat-msg { margin-bottom: 12px; position: relative; }
        .ai-chat-msg.user-msg { background: var(--ai-bubble-user); border-radius: 8px; padding: 10px 14px; }
        .ai-chat-msg.ai-msg { background: var(--ai-bubble-ai); border-radius: 8px; padding: 10px 14px; }
        .ai-msg-label { font-size: 11px; font-weight: bold; margin-bottom: 4px; }
        .ai-msg-del { position: absolute; top: 4px; right: 8px; cursor: pointer; opacity: 0; font-size: 16px; color: #888; transition: opacity 0.15s, color 0.15s; }
        .ai-chat-msg:hover .ai-msg-del { opacity: 1; }
        .ai-msg-del:hover { color: #ff5f56; }
        .ai-conv-item { display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: rgba(255,255,255,0.05); border-radius: 4px; cursor: pointer; font-size: 12px; transition: background 0.15s; }
        .ai-conv-item:hover { background: rgba(255,255,255,0.1); }
        .ai-conv-item.active { background: var(--accent-color); color: #fff; }
        .ai-conv-del { cursor: pointer; font-size: 14px; color: #888; padding: 0 4px; }
        .ai-conv-del:hover { color: #ff5f56; }
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
        [data-theme-active="light"] .file-rename-btn { color: #0066cc !important; }
        [data-theme-active="light"] .file-rename-btn:hover { color: #004499 !important; }
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
        .explorer-item:hover { background: rgba(255,255,255,0.1); }
        [data-theme-active="light"] .settings-input { color: #333 !important; }
        [data-theme-active="light"] .vscode-status-bar { color: #fff !important; }
        [data-theme-active="light"] .taskbar-minimized-item { color: #333 !important; }
        [data-theme-active="light"] .md-preview-pane { color: #333 !important; }
        [data-theme-active="light"] .md-preview-pane pre { background: rgba(0,0,0,0.05) !important; }
        [data-theme-active="light"] .md-preview-pane code { background: rgba(0,0,0,0.05) !important; }
        [data-theme-active="light"] .md-preview-pane a { color: #0078d4 !important; }
        [data-theme-active="light"] .md-preview-pane blockquote { border-left-color: #0078d4 !important; color: #666 !important; }
        [data-theme-active="light"] .md-toolbar-btn { color: #333 !important; }
        [data-theme-active="light"] .ai-chat-msg.user-msg { background: rgba(0,120,212,0.08) !important; }
        [data-theme-active="light"] .ai-chat-msg.ai-msg { background: rgba(0,120,212,0.04) !important; }
        [data-theme-active="light"] .ai-conv-item { background: rgba(0,0,0,0.04) !important; }
        [data-theme-active="light"] .ai-conv-item:hover { background: rgba(0,0,0,0.08) !important; }
        .folder-drop-target {
            background: rgba(0,120,215,0.15) !important;
            outline: 2px dashed var(--accent-color);
            outline-offset: -2px;
            border-radius: 6px;
        }
        .os-shortcut-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--win-bg);
            border: 1px solid var(--win-border);
            border-radius: 12px;
            padding: 20px 24px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.6);
            z-index: 9999999;
            pointer-events: none;
            min-width: 420px;
            max-height: 90vh;
            overflow-y: auto;
            opacity: 0;
            transition: opacity 0.15s;
            font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .os-shortcut-panel.visible { opacity: 1; }
        .os-shortcut-panel h3 {
            margin: 0 0 12px;
            font-size: 16px;
            color: var(--accent-color);
            border-bottom: 1px solid var(--win-border);
            padding-bottom: 8px;
        }
        .os-shortcut-group { margin-bottom: 14px; }
        .os-shortcut-group-title {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 6px;
            font-weight: bold;
        }
        .os-shortcut-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 0;
            font-size: 13px;
            color: var(--text-primary);
        }
        .os-shortcut-row kbd {
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            border-radius: 4px;
            padding: 2px 8px;
            font-family: 'Consolas', monospace;
            font-size: 12px;
            color: var(--text-primary);
            min-width: 28px;
            text-align: center;
        }
        .explorer-path-bar { display:flex;align-items:center;padding:4px 10px;border-bottom:1px solid var(--vs-tab-border);background:var(--vs-tab-bg);font-size:12px;color:var(--text-secondary);overflow-x:auto;white-space:nowrap;gap:2px;user-select:none; }
        .explorer-path-seg { padding:2px 6px;border-radius:3px;cursor:pointer;transition:background 0.15s,color 0.15s; }
        .explorer-path-seg:hover { background:rgba(255,255,255,0.12);color:var(--text-primary); }
        .explorer-path-seg.current { color:var(--accent-color);font-weight:bold;cursor:default; }
        .explorer-path-sep { color:var(--text-secondary);opacity:0.5; }
        .explorer-refresh-btn { margin-left:auto;padding:2px 8px;border-radius:3px;cursor:pointer;font-size:12px;color:var(--text-secondary);transition:background 0.15s; }
        .explorer-refresh-btn:hover { background:rgba(255,255,255,0.1);color:var(--text-primary); }
        .exe-runner-bar { height:32px; background:var(--win-header); display:flex; align-items:center; padding:0 12px; gap:8px; border-bottom:1px solid var(--win-border-bottom); user-select:none; font-size:13px; color:var(--text-primary); }
        .exe-run-btn { color:#4ec9b0; cursor:pointer; font-size:13px; padding:4px 12px; border-radius:4px; display:flex; align-items:center; font-weight:bold; background:rgba(78,201,176,0.1); border:1px solid rgba(78,201,176,0.3); }
        .exe-run-btn:hover { background:rgba(78,201,176,0.25); color:#4cee9f; }
        .exe-pane-title { font-size:11px; color:#da70d6; padding:4px 8px; background:var(--stdin-title-bg); user-select:none; font-weight:bold; border-bottom:1px solid var(--stdin-border); }
        .exe-left-pane { background:var(--stdin-bg); border-right:none; }
        .exe-right-pane { background:var(--terminal-bg); }
        .exe-stdin-input { flex:1; background:transparent; color:var(--stdin-color); font-family:'Consolas',monospace; font-size:13px; padding:8px; border:none; resize:none; outline:none; line-height:1.4; }
        .exe-stdout-output { flex:1; padding:8px; overflow-y:auto; font-size:13px; line-height:1.4; color:var(--terminal-green); white-space:pre-wrap; font-family:'Consolas',monospace; background:var(--terminal-bg); }
        .exe-divider { width:6px; cursor:col-resize; background:var(--code-gutter-border); position:relative; z-index:10; flex-shrink:0; transition:background 0.15s; }
        .exe-divider:hover { background:var(--accent-color); }
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
            ['--taskbar-min-btn-hover-bg', t.taskbarMinBtnHoverBg],
            ['--ai-bubble-user', t.aiBubbleUser], ['--ai-bubble-ai', t.aiBubbleAI]
        ];
        vars.forEach(([k, v]) => desktop.style.setProperty(k, v));
        const entryBtn = shadow.getElementById('os-entry-btn');
        if (entryBtn) { entryBtn.style.setProperty('--accent-color', t.accentColor); entryBtn.style.setProperty('--accent-hover', t.accentHover); }
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
                <div class="sidebar-create-btn" id="sbar-new-md" style="color:#dcdcaa;font-weight:bold;">M 新建.md</div>
            </div>
            <div class="sidebar-top-bar">
                <div class="sidebar-create-btn" id="sbar-new-xlsx" style="color:#107c41;font-weight:bold;">X 新建Excel</div>
                <div class="sidebar-create-btn" id="sbar-new-docx" style="color:#2b579a;font-weight:bold;">W 新建Word</div>
                <div class="sidebar-create-btn" id="sbar-new-cmt" style="color:#4ec9b0;font-weight:bold;">⌨ 新建.cmt</div>
            </div>
            <div class="sidebar-top-bar">
                <div class="sidebar-create-btn" id="sbar-new-folder" style="color:#f0c040;font-weight:bold;">📁 新建文件夹</div>
            </div>
            <div class="sidebar-folder-view">
                <div class="folder-tree-title">WORKSPACE EXPLORER <span>∨</span></div>
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

    sidebarToggle.addEventListener('click', (e) => { e.stopPropagation(); isSidebarOpen = !isSidebarOpen; sidebar.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'; sidebarToggle.innerText = isSidebarOpen ? '◀' : '▶'; });
    // ===== 开机动画系统 =====
    function showBootAnimation(callback) {
        // 30分钟冷却检查：如果上次启动距今不满30分钟，则跳过动画
        var lastBootTime = +(localStorage.getItem('OS_LAST_BOOT_TIME') || 0);
        var now = Date.now();
        var COOLDOWN = 5 * 60 * 1000; // 5分钟
        if (lastBootTime && (now - lastBootTime) < COOLDOWN) {
            callback();
            return;
        }
        // 记录本次启动时间
        localStorage.setItem('OS_LAST_BOOT_TIME', now);

        // 创建全屏开机动画遮罩
        var bootOverlay = document.createElement('div');
        bootOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;';

        // ---- 背景光晕 ----
        var bgGlow = document.createElement('div');
        bgGlow.style.cssText = 'position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(0,120,212,0.15) 0%,transparent 70%);filter:blur(80px);opacity:0;transition:opacity 2s ease;';
        bootOverlay.appendChild(bgGlow);

        // ---- Logo 容器 ----
        var logoContainer = document.createElement('div');
        logoContainer.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:center;gap:24px;opacity:0;transform:scale(0.7);transition:opacity 1.8s cubic-bezier(0.4,0,0.2,1),transform 1.8s cubic-bezier(0.4,0,0.2,1);';

        // Chrome OS 风格圆形 Logo
        var logoCircle = document.createElement('div');
        logoCircle.style.cssText = 'width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,#4285f4 0%,#34a853 33%,#fbbc04 66%,#ea4335 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 0 60px rgba(66,133,244,0.4);position:relative;';

        // Logo 内部白色圆
        var logoInner = document.createElement('div');
        logoInner.style.cssText = 'width:70px;height:70px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(255,255,255,0.3);';

        // Logo 内部电脑图标
        var logoIcon = document.createElement('div');
        logoIcon.style.cssText = 'font-size:36px;';
        logoIcon.textContent = '💻';
        logoInner.appendChild(logoIcon);
        logoCircle.appendChild(logoInner);
        logoContainer.appendChild(logoCircle);

        // 系统名称
        var logoTitle = document.createElement('div');
        logoTitle.style.cssText = 'font-family:system-ui,sans-serif;font-size:28px;color:#fff;font-weight:300;letter-spacing:4px;opacity:0;transform:translateY(10px);transition:opacity 1.2s ease 0.6s,transform 1.2s ease 0.6s;';
        logoTitle.textContent = 'Chrome OS';
        logoContainer.appendChild(logoTitle);

        // 版本号
        var logoVersion = document.createElement('div');
        logoVersion.style.cssText = 'font-family:system-ui,sans-serif;font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:2px;opacity:0;transition:opacity 1s ease 1s;';
        logoVersion.textContent = 'Version 4.3 Insider';
        logoContainer.appendChild(logoVersion);

        bootOverlay.appendChild(logoContainer);

        // ---- 加载进度条 ----
        var progressBarWrap = document.createElement('div');
        progressBarWrap.style.cssText = 'position:absolute;bottom:80px;width:320px;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;opacity:0;transition:opacity 0.8s ease 1.2s;';

        var progressBar = document.createElement('div');
        progressBar.style.cssText = 'width:0%;height:100%;background:linear-gradient(90deg,#4285f4,#34a853);border-radius:2px;transition:width 2.5s cubic-bezier(0.4,0,0.2,1);';
        progressBarWrap.appendChild(progressBar);

        // 进度条上的光点
        var progressGlow = document.createElement('div');
        progressGlow.style.cssText = 'position:absolute;right:-2px;top:-4px;width:10px;height:10px;border-radius:50%;background:#4285f4;box-shadow:0 0 12px #4285f4,0 0 24px rgba(66,133,244,0.5);opacity:0;transition:opacity 0.3s;';
        progressBar.appendChild(progressGlow);

        progressBarWrap.appendChild(progressBar);
        bootOverlay.appendChild(progressBarWrap);

        // ---- 加载提示文字 ----
        var bootStatus = document.createElement('div');
        bootStatus.style.cssText = 'position:absolute;bottom:50px;font-family:system-ui,sans-serif;font-size:12px;color:rgba(255,255,255,0.35);letter-spacing:1px;opacity:0;transition:opacity 0.6s ease 1.5s;';
        bootStatus.textContent = '正在启动系统服务...';
        bootOverlay.appendChild(bootStatus);

        // ---- 装饰粒子 ----
        var particles = [];
        for (var pi = 0; pi < 6; pi++) {
            var particle = document.createElement('div');
            var pSize = 3 + Math.random() * 4;
            var pLeft = 15 + Math.random() * 70;
            var pDelay = 0.5 + Math.random() * 2;
            var pDur = 2 + Math.random() * 2;
            particle.style.cssText = 'position:absolute;width:' + pSize + 'px;height:' + pSize + 'px;border-radius:50%;background:rgba(66,133,244,' + (0.1 + Math.random() * 0.2) + ');left:' + pLeft + '%;bottom:-10px;opacity:0;animation:osBootParticle ' + pDur + 's ease-in-out ' + pDelay + 's infinite;';
            particles.push(particle);
            bootOverlay.appendChild(particle);
        }

        document.documentElement.appendChild(bootOverlay);

        // 注入粒子动画关键帧
        var animStyle = document.createElement('style');
        animStyle.textContent = '@keyframes osBootParticle{0%{opacity:0;transform:translateY(0) scale(0.5);}30%{opacity:0.6;}70%{opacity:0.3;}100%{opacity:0;transform:translateY(-80vh) scale(1.2);}}';
        document.documentElement.appendChild(animStyle);

        // ---- 动画时间线 ----
        // 0.0s - 黑屏
        // 0.3s - 背景光晕渐显
        // 0.5s - Logo + 标题渐入
        // 1.2s - 进度条开始
        // 1.5s - 状态文字渐入
        // 3.5s - 进度条走满
        // 4.0s - 完成提示
        // 5.0s - 淡出

        // Phase 1: 光晕渐显 (0.3s后)
        setTimeout(function() {
            bgGlow.style.opacity = '1';
        }, 300);

        // Phase 2: Logo 渐入 (0.5s后)
        setTimeout(function() {
            logoContainer.style.opacity = '1';
            logoContainer.style.transform = 'scale(1)';
            logoTitle.style.opacity = '1';
            logoTitle.style.transform = 'translateY(0)';
        }, 500);

        // Phase 3: 进度条和状态文字 (1.2s后)
        setTimeout(function() {
            progressBarWrap.style.opacity = '1';
            bootStatus.style.opacity = '1';
        }, 1200);

        // Phase 4: 进度条走动 (1.5s后)
        setTimeout(function() {
            progressBar.style.width = '100%';
            progressGlow.style.opacity = '1';
        }, 1500);

        // Phase 5: 状态文字更新 (2.5s后)
        setTimeout(function() {
            bootStatus.textContent = '加载桌面环境...';
        }, 2500);

        // Phase 6: 完成提示 (3.8s后)
        setTimeout(function() {
            bootStatus.textContent = '✓ 系统就绪';
            bootStatus.style.color = 'rgba(52,168,83,0.8)';
            progressGlow.style.opacity = '0';
        }, 3800);

        // Phase 7: 淡出 (5.0s后)
        setTimeout(function() {
            bootOverlay.style.transition = 'opacity 0.8s cubic-bezier(0.4,0,0.2,1)';
            bootOverlay.style.opacity = '0';
            setTimeout(function() {
                bootOverlay.remove();
                animStyle.remove();
                if (callback) callback();
            }, 800);
        }, 5000);
    }

    function enterDesktopMode() {
        // 先显示开机动画，动画结束后再进入桌面
        showBootAnimation(function() {
            desktop.style.display = 'block';
            entryBtn.style.display = 'none';
            OS_DATA.desktopActive = true;
            saveSystemDataNow();
            if (OS_DATA.settings.rememberWindows && OS_DATA.openWindows && OS_DATA.openWindows.length > 0) restoreWindows();
            if (OS_DATA.settingsOpen) openSettingsPanel();
        });
    }
    function exitDesktopMode() {
        desktop.style.display = 'none';
        entryBtn.style.display = 'block';
        OS_DATA.desktopActive = false;
        OS_DATA.settingsOpen = false;
        // 退出桌面时记录时间，用于开机动画30分钟冷却判断
        localStorage.setItem('OS_LAST_BOOT_TIME', Date.now());
        saveSystemDataNow();
        const settingsWin = shadow.getElementById('win-runtime-sys-settings');
        if (settingsWin) settingsWin.remove();
    }
    entryBtn.addEventListener('click', (e) => { e.stopPropagation(); requestDesktop(() => enterDesktopMode()); }, true);
    shadow.getElementById('os-exit-btn').addEventListener('click', (e) => { e.stopPropagation(); exitDesktopMode(); }, true);
    if (!localStorage.getItem('MOCK_OS_WELCOMED')) {
    const welcomeOverlay = document.createElement('div');
    welcomeOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;pointer-events:auto;';
    welcomeOverlay.innerHTML = `
        <div style="background:var(--win-bg);border-radius:16px;padding:32px 40px;max-width:420px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid var(--win-border);">
            <div style="font-size:48px;margin-bottom:12px;">👋</div>
            <h2 style="margin:0 0 8px;color:var(--text-primary);font-size:20px;">欢迎使用 Chrome OS 4.1 Insider</h2>
            <p style="color:var(--text-secondary);font-size:13px;line-height:1.6;margin:0 0 20px;">
                📁 左侧管理文件，双击打开编辑<br>
                🤖 搜索框输入「对话」打开AI助手<br>
                🖱️ 右键可新建文件/文件夹<br>
                ⚙️ 右下角可切换主题和壁纸
            </p>
            <button id="os-welcome-ok" style="padding:10px 32px;border-radius:8px;border:none;background:linear-gradient(135deg,#4285f4,#34a853);color:#fff;font-size:14px;cursor:pointer;font-weight:600;">开始使用</button>
        </div>`;
    shadow.appendChild(welcomeOverlay);
    welcomeOverlay.querySelector('#os-welcome-ok').addEventListener('click', function() {
        welcomeOverlay.remove();
        localStorage.setItem('MOCK_OS_WELCOMED', '1');
    });
}
    if (OS_DATA.desktopActive && OS_DATA.settings.autoRestoreDesktop) { requestAnimationFrame(() => { requestDesktop(() => enterDesktopMode()); }); }

    setInterval(() => { const d = new Date(); shadow.getElementById('os-clock').innerHTML = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}<br><span style="font-size:10px;color:#aaa;">${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}</span>`; }, 1000);
    const clockEl = shadow.getElementById('os-clock');
    clockEl.style.cursor = 'pointer';
    clockEl.addEventListener('click', function() {
        const existing = shadow.querySelector('.os-calendar-popup');
        if (existing) { existing.remove(); return; }
        const now = new Date();
        const year = now.getFullYear(); const month = now.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = now.getDate();
        const monthNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
        let calHTML = '<div style="text-align:center;font-weight:600;margin-bottom:8px;color:var(--text-primary);">' + year + '年 ' + monthNames[month] + '</div>';
        calHTML += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:11px;">';
        ['日','一','二','三','四','五','六'].forEach(function(d) { calHTML += '<div style="color:var(--text-secondary);padding:4px 0;">' + d + '</div>'; });
        for (let i = 0; i < firstDay; i++) calHTML += '<div></div>';
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === today ? 'background:var(--accent-color);border-radius:50%;color:#fff;font-weight:700;' : 'color:var(--text-primary);';
            calHTML += '<div style="padding:4px 0;' + isToday + '">' + d + '</div>';
        }
        calHTML += '</div>';
        const popup = document.createElement('div');
        popup.className = 'os-calendar-popup';
        popup.style.cssText = 'position:fixed;bottom:56px;right:12px;background:var(--win-bg);border:1px solid var(--win-border);border-radius:12px;padding:16px;box-shadow:0 8px 30px rgba(0,0,0,0.4);z-index:999999;width:260px;pointer-events:auto;';
        popup.innerHTML = calHTML;
        shadow.appendChild(popup);
        setTimeout(function() {
            var cl = function(ev) { if (!popup.contains(ev.target) && ev.target !== clockEl) { popup.remove(); shadow.removeEventListener('click', cl, true); } };
            shadow.addEventListener('click', cl, true);
        }, 10);
    });
    (function() {
    const searchBox = shadow.getElementById('global-search');
    let searchResults = [];
    let searchResultIdx = -1;
    function performSearch(keyword) {
        searchResults = [];
        searchResultIdx = -1;
        if (!keyword) { shadow.querySelectorAll('.file-node').forEach(n => n.style.display = 'flex'); shadow.querySelectorAll('.folder-children').forEach(n => n.style.display = 'none'); return; }
        if (keyword === '对话' || keyword === 'ai') { openAIChatWindow(); searchBox.value = ''; shadow.querySelectorAll('.file-node').forEach(n => n.style.display = 'flex'); return; }
        if (keyword === 'cmt') { createNewFile('cmt'); searchBox.value = ''; shadow.querySelectorAll('.file-node').forEach(n => n.style.display = 'flex'); return; }
        shadow.querySelectorAll('.file-node').forEach(node => {
            const fileName = node.querySelector('.file-info-part span:last-child').innerText.toLowerCase();
            const fileId = node.getAttribute('data-file-id');
            if (fileName.includes(keyword)) {
                node.style.display = 'flex';
                if (fileId) searchResults.push(fileId);
            } else {
                node.style.display = 'none';
            }
        });
        shadow.querySelectorAll('.folder-children').forEach(n => n.style.display = 'block');
    }
    searchBox.addEventListener('input', function(e) { performSearch(e.target.value.toLowerCase().trim()); });
    searchBox.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && searchResults.length > 0) {
            searchResultIdx = (searchResultIdx + 1) % searchResults.length;
            openAppWindow(searchResults[searchResultIdx]);
        }
    });
})();
    shadow.getElementById('taskbar-settings-btn').addEventListener('click', () => {
        openSettingsPanel();
    });
    shadow.addEventListener('keydown', function(e) {
        const activeTag = shadow.activeElement ? shadow.activeElement.tagName : '';
        const isInput = (activeTag === 'INPUT' || activeTag === 'TEXTAREA' ||
                        shadow.activeElement.contentEditable === 'true' ||
                        shadow.activeElement.classList.contains('os-stdin-input'));
        if (isInput && !e.altKey) return;  // Alt+F4 不受影响
        if (e.ctrlKey || e.metaKey) clearTimeout(ctrlHoldTimer);
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            createNewFile('txt');
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
            e.preventDefault();
            createNewFile('folder');
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchBox = shadow.getElementById('global-search');
            if (searchBox) searchBox.focus();
        }
        if (e.altKey && e.key === 'F4') {
            e.preventDefault();
            if (confirm('确定要退出桌面模式吗？')) exitDesktopMode();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            openSettingsPanel();
        }
    });
    desktop.addEventListener('contextmenu', function(e) {
    if (e.target !== desktop && !e.target.matches('#os-wallpaper-blur')) return;
    e.preventDefault();
    const existing = shadow.querySelector('.desktop-ctx-menu');
    if (existing) existing.remove();
    const menu = document.createElement('div');
    menu.className = 'desktop-ctx-menu explorer-ctx-menu';
    menu.style.cssText = 'position:fixed;z-index:999999;background:var(--win-bg);border:1px solid var(--win-border);border-radius:8px;padding:4px 0;box-shadow:0 8px 24px rgba(0,0,0,0.3);min-width:180px;pointer-events:auto;';
    function addRow(label, action) {
        const row = document.createElement('div');
        row.textContent = label;
        row.style.cssText = 'padding:8px 16px;cursor:pointer;font-size:13px;color:var(--text-primary);transition:background 0.1s;';
        row.addEventListener('mouseenter', function() { row.style.background = 'rgba(255,255,255,0.1)'; });
        row.addEventListener('mouseleave', function() { row.style.background = 'transparent'; });
        row.addEventListener('click', function() { menu.remove(); action(); });
        menu.appendChild(row);
    }
    addRow('📄 新建文件', function() { createNewFile('txt'); });
    addRow('📁 新建文件夹', function() { createNewFile('folder'); });
    addRow('⚙️ 系统设置', function() { openSettingsPanel(); });
    addRow('🤖 AI 助手', function() { openAIChatWindow(); });
    addRow('📌 粘贴', function() {
        if (!_clipboard.action || _clipboard.ids.length === 0) {
            alert('剪贴板为空！'); return;
        }
        const count = pasteFiles(null);
        if (count > 0) alert('✅ 已粘贴 ' + count + ' 个项目到根目录');
    });
    menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px';
    shadow.appendChild(menu);
    if (e.clientX + 200 > window.innerWidth) menu.style.left = (window.innerWidth - 204) + 'px';
    if (e.clientY + 150 > window.innerHeight) menu.style.top = (window.innerHeight - 154) + 'px';
    setTimeout(function() {
        var cl = function(ev) { if (!menu.contains(ev.target)) { menu.remove(); shadow.removeEventListener('click', cl, true); } };
        shadow.addEventListener('click', cl, true);
    }, 10);
});
    // ===== 长按 Ctrl 显示快捷键面板 =====
    const shortcutPanel = document.createElement('div');
    shortcutPanel.className = 'os-shortcut-panel';
    shortcutPanel.innerHTML = `
        <h3>⌨️ 快捷键一览</h3>
        <div class="os-shortcut-group">
            <div class="os-shortcut-group-title">📁 全局</div>
            <div class="os-shortcut-row"><span>新建文件</span><kbd>Ctrl</kbd>+<kbd>N</kbd></div>
            <div class="os-shortcut-row"><span>新建文件夹</span><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>N</kbd></div>
            <div class="os-shortcut-row"><span>搜索</span><kbd>Ctrl</kbd>+<kbd>F</kbd></div>
            <div class="os-shortcut-row"><span>系统设置</span><kbd>Ctrl</kbd>+<kbd>,</kbd></div>
            <div class="os-shortcut-row"><span>退出桌面</span><kbd>Alt</kbd>+<kbd>F4</kbd></div>
            <div class="os-shortcut-row"><span>关闭菜单/弹窗</span><kbd>Esc</kbd></div>
        </div>
        <div class="os-shortcut-group">
            <div class="os-shortcut-group-title">🪟 窗口</div>
            <div class="os-shortcut-row"><span>保存</span><kbd>Ctrl</kbd>+<kbd>S</kbd></div>
            <div class="os-shortcut-row"><span>关闭窗口</span><kbd>Ctrl</kbd>+<kbd>W</kbd></div>
            <div class="os-shortcut-row"><span>最小化</span><kbd>Ctrl</kbd>+<kbd>M</kbd></div>
        </div>
        <div class="os-shortcut-group">
            <div class="os-shortcut-group-title">📝 编辑器</div>
            <div class="os-shortcut-row"><span>缩进</span><kbd>Tab</kbd></div>
            <div class="os-shortcut-row"><span>复制行</span><kbd>Ctrl</kbd>+<kbd>D</kbd></div>
            <div class="os-shortcut-row"><span>运行代码</span><kbd>F5</kbd> / <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>R</kbd></div>
            <div class="os-shortcut-row"><span>注释切换</span><kbd>Ctrl</kbd>+<kbd>/</kbd></div>
        </div>
        <div style="text-align:center;font-size:11px;color:var(--text-secondary);margin-top:8px;">松开 Ctrl 关闭</div>
    `;
    shadow.appendChild(shortcutPanel);

    let ctrlHoldTimer = null;
    let ctrlPanelShown = false;

    shadow.addEventListener('keydown', function(e) {
        // Escape 始终生效
        if (e.key === 'Escape') {
            shadow.querySelectorAll('.explorer-ctx-menu, .desktop-ctx-menu').forEach(function(m) { m.remove(); });
            const cal = shadow.querySelector('.os-calendar-popup');
            if (cal) cal.remove();
            shadow.querySelectorAll('.snippet-dropdown.show').forEach(function(d) { d.classList.remove('show'); });
            return;
        }

        // Ctrl 长按检测
        if ((e.key === 'Control' || e.key === 'Meta') && !ctrlPanelShown) {
            ctrlHoldTimer = setTimeout(function() {
                shortcutPanel.classList.add('visible');
                ctrlPanelShown = true;
            }, 500);
        }
    });

    shadow.addEventListener('keyup', function(e) {
        if (e.key === 'Control' || e.key === 'Meta') {
            clearTimeout(ctrlHoldTimer);
            if (ctrlPanelShown) {
                shortcutPanel.classList.remove('visible');
                ctrlPanelShown = false;
            }
        }
    });
    // 刷新所有打开的 explorer 窗口
    function refreshAllExplorerWindows() {
        var explorerWins = shadow.querySelectorAll('.os-window[id^="win-runtime-"]');
        explorerWins.forEach(function(win) {
            var fileId = win.id.replace('win-runtime-', '');
            var file = OS_DATA.files.find(function(f) { return f.id === fileId; });
            if (file && file.type === 'folder') {
                // 触发窗口内的 renderExplorer
                var explorerContent = win.querySelector('.explorer-content');
                if (explorerContent && explorerContent._renderExplorer) {
                    explorerContent._renderExplorer();
                }
            }
        });
    }
        // ===== 回收站系统 =====
    function moveToTrash(fileId, fromFolderId) {
        var file = OS_DATA.files.find(function(f) { return f.id === fileId; });
        if (!file) return;
        var fromParent = fromFolderId ? OS_DATA.files.find(function(f) { return f.id === fromFolderId; }) : null;
        var fromName = fromParent ? fromParent.name : '根目录';
        var trashItem = {
            id: 'trash_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
            fileId: file.id,
            fileName: file.name,
            fileType: file.type,
            fileContent: JSON.parse(JSON.stringify(file.content)),
            fileChildren: file.type === 'folder' && file.children ? file.children.slice() : [],
            fromFolderId: fromFolderId || null,
            fromFolderName: fromName,
            deletedAt: new Date().toISOString()
        };
        if (file.type === 'folder' && file.children) {
            file.children.forEach(function(childId) {
                var child = OS_DATA.files.find(function(f) { return f.id === childId; });
                if (child) moveToTrash(child.id, file.id);
            });
        }
        // 从父文件夹移除
        if (fromFolderId) {
            var parent = OS_DATA.files.find(function(f) { return f.id === fromFolderId; });
            if (parent && parent.children) {
                parent.children = parent.children.filter(function(c) { return c !== fileId; });
            }
        }
        // 从 OS_DATA.files 移除
        OS_DATA.files = OS_DATA.files.filter(function(f) { return f.id !== fileId; });
        OS_DATA.trashBin.push(trashItem);
        saveSystemData();
    }

    function restoreFromTrash(trashItemId) {
        var trashItem = OS_DATA.trashBin.find(function(t) { return t.id === trashItemId; });
        if (!trashItem) return;
        // 恢复文件
        var restoredFile = {
            id: trashItem.fileId,
            name: trashItem.fileName,
            type: trashItem.fileType,
            content: JSON.parse(JSON.stringify(trashItem.fileContent))
        };
        if (trashItem.fileType === 'folder') {
            restoredFile.children = [];
        }
        OS_DATA.files.push(restoredFile);
        // 放回原文件夹
        if (trashItem.fromFolderId) {
            var parent = OS_DATA.files.find(function(f) { return f.id === trashItem.fromFolderId; });
            if (parent && parent.type === 'folder') {
                if (!parent.children) parent.children = [];
                parent.children.push(restoredFile.id);
            }
        }
        // 从回收站移除
        OS_DATA.trashBin = OS_DATA.trashBin.filter(function(t) { return t.id !== trashItemId; });
        saveSystemData();
        renderSidebarFiles();
        refreshAllExplorerWindows();
    }

    function permanentlyDeleteFromTrash(trashItemId) {
        OS_DATA.trashBin = OS_DATA.trashBin.filter(function(t) { return t.id !== trashItemId; });
        saveSystemData();
    }

    function emptyTrashBin() {
        OS_DATA.trashBin = [];
        saveSystemData();
    }

    function openTrashBinWindow() {
        var openWinId = 'win-trash-bin';
        if (shadow.getElementById(openWinId)) {
            var w = shadow.getElementById(openWinId);
            if (w.classList.contains('minimized')) {
                w.classList.remove('minimized');
                w.style.display = 'flex';
                var item = taskbarMinList.querySelector('[data-win-id="' + openWinId + '"]');
                if (item) item.remove();
            }
            w.style.zIndex = ++zIndexCounter;
            var content = w.querySelector('.trash-bin-content');
            if (content) renderTrashContent(content);
            return;
        }
        var win = document.createElement('div');
        win.className = 'os-window';
        win.id = openWinId;
        win.style.zIndex = ++zIndexCounter;
        win.style.width = '700px';
        win.style.height = '500px';
        win.style.top = '80px';
        win.style.left = '300px';

        win.innerHTML =
            '<div class="os-window-header">' +
                '<span>🗑️ 回收站</span>' +
                '<div class="window-controls-group">' +
                    '<div class="win-ctrl-btn win-btn-min" title="最小化">—</div>' +
                    '<div class="win-ctrl-btn win-btn-max" title="最大化/还原">□</div>' +
                    '<div class="win-ctrl-btn win-btn-close" title="关闭">×</div>' +
                '</div>' +
            '</div>' +
            '<div class="os-window-body" style="background:var(--settings-body-bg);display:flex;flex-direction:column;overflow:hidden;">' +
                '<div class="explorer-path-bar" style="padding:6px 10px;">' +
                    '<span class="explorer-path-seg current" style="color:var(--accent-color);font-weight:bold;">🗑️ 回收站</span>' +
                    '<span class="explorer-refresh-btn" id="trash-refresh-btn" title="刷新">🔄</span>' +
                    '<span style="margin-left:8px;padding:2px 8px;border-radius:3px;cursor:pointer;font-size:12px;color:#ff6b6b;border:1px solid rgba(255,107,107,0.3);transition:background 0.15s;" id="trash-empty-btn">🗑️ 清空回收站</span>' +
                '</div>' +
                '<div class="trash-bin-content" style="flex:1;overflow-y:auto;padding:8px;"></div>' +
            '</div>' +
            '<div class="os-window-resize-handle"></div>';

        desktop.appendChild(win);

        var content = win.querySelector('.trash-bin-content');

        // ===== 右键菜单工具 =====
        function showTrashContextMenu(x, y, items) {
            var existing = shadow.querySelector('.trash-ctx-menu');
            if (existing) existing.remove();
            var menu = document.createElement('div');
            menu.className = 'trash-ctx-menu';
            menu.style.cssText = 'position:fixed;z-index:999999;background:var(--win-bg);border:1px solid var(--win-border);border-radius:8px;padding:4px 0;box-shadow:0 8px 24px rgba(0,0,0,0.3);min-width:180px;pointer-events:auto;';
            items.forEach(function(item) {
                if (item === 'divider') {
                    var divider = document.createElement('div');
                    divider.style.cssText = 'height:1px;background:var(--win-border);margin:4px 0;';
                    menu.appendChild(divider);
                    return;
                }
                var row = document.createElement('div');
                row.textContent = item.label;
                row.style.cssText = 'padding:8px 16px;cursor:pointer;font-size:13px;color:var(--text-primary);transition:background 0.1s;';
                row.addEventListener('mouseenter', function() { row.style.background = 'rgba(255,255,255,0.1)'; });
                row.addEventListener('mouseleave', function() { row.style.background = 'transparent'; });
                row.addEventListener('click', function() { menu.remove(); item.action(); });
                menu.appendChild(row);
            });
            menu.style.left = x + 'px';
            menu.style.top = y + 'px';
            shadow.appendChild(menu);
            requestAnimationFrame(function() {
                if (x + menu.offsetWidth > window.innerWidth) menu.style.left = (window.innerWidth - menu.offsetWidth - 4) + 'px';
                if (y + menu.offsetHeight > window.innerHeight) menu.style.top = (window.innerHeight - menu.offsetHeight - 4) + 'px';
            });
            setTimeout(function() {
                var closeHandler = function(ev) {
                    if (!menu.contains(ev.target)) {
                        menu.remove();
                        shadow.removeEventListener('click', closeHandler, true);
                        shadow.removeEventListener('contextmenu', closeHandler, true);
                    }
                };
                shadow.addEventListener('click', closeHandler, true);
                shadow.addEventListener('contextmenu', closeHandler, true);
            }, 10);
        }

        // ===== 自动清理过期文件 =====
        function autoCleanExpiredTrash() {
            var days = OS_DATA.settings.trashAutoDeleteDays;
            if (!days || days <= 0) return 0;
            var now = Date.now();
            var ms = days * 24 * 60 * 60 * 1000;
            var before = OS_DATA.trashBin.length;
            OS_DATA.trashBin = OS_DATA.trashBin.filter(function(t) {
                return (now - new Date(t.deletedAt).getTime()) < ms;
            });
            if (OS_DATA.trashBin.length < before) {
                saveSystemData();
            }
            return before - OS_DATA.trashBin.length;
        }

        // 每次打开回收站时自动清理
        var cleaned = autoCleanExpiredTrash();
        if (cleaned > 0) {
            // 可以在内容中提示
        }

        // ===== 下载回收站中的文件 =====
        function downloadTrashFile(trashItem) {
            var blob, downloadName = trashItem.fileName;
            if (trashItem.fileType === 'txt' || trashItem.fileType === 'cpp') {
                blob = new Blob([trashItem.fileContent], { type: 'text/plain;charset=utf-8' });
            } else if (trashItem.fileType === 'md') {
                blob = new Blob([trashItem.fileContent], { type: 'text/markdown;charset=utf-8' });
            } else if (trashItem.fileType === 'docx') {
                var htmlContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>body{font-family:\'宋体\',SimSun,serif;font-size:14px;line-height:1.8;}</style></head><body>' + trashItem.fileContent + '</body></html>';
                blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
                downloadName = trashItem.fileName.replace('.docx', '.doc');
            } else if (trashItem.fileType === 'xlsx') {
                var matrix = Array.isArray(trashItem.fileContent) ? trashItem.fileContent : [];
                var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table border="1">';
                matrix.forEach(function(row) {
                    html += '<tr>';
                    (row || []).forEach(function(cell) { html += '<td style="mso-number-format:\\@;">' + (cell || '') + '</td>'; });
                    html += '</tr>';
                });
                html += '</table></body></html>';
                blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
                downloadName = trashItem.fileName.replace('.xlsx', '.xls');
            } else {
                var content = typeof trashItem.fileContent === 'string' ? trashItem.fileContent : JSON.stringify(trashItem.fileContent);
                blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            }
            var link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = downloadName;
            link.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;opacity:0;pointer-events:auto;';
            document.documentElement.appendChild(link);
            link.click();
            setTimeout(function() {
                document.documentElement.removeChild(link);
                URL.revokeObjectURL(link.href);
            }, 3000);
        }

        // ===== 渲染回收站内容 =====
        function renderTrashContent(container) {
            container.innerHTML = '';
            // 先自动清理
            var cleaned = autoCleanExpiredTrash();
            if (OS_DATA.trashBin.length === 0) {
                container.innerHTML = '<div style="color:var(--text-secondary);font-size:14px;padding:40px;text-align:center;">回收站为空<br><span style="font-size:11px;">删除的文件会出现在这里</span>' + (cleaned > 0 ? '<br><span style="font-size:11px;color:#ff6b6b;">已自动清理 ' + cleaned + ' 个过期文件</span>' : '') + '</div>';
                return;
            }
            if (cleaned > 0) {
                var tip = document.createElement('div');
                tip.style.cssText = 'padding:6px 12px;margin-bottom:8px;background:rgba(255,107,107,0.1);border:1px solid rgba(255,107,107,0.3);border-radius:6px;font-size:12px;color:#ff6b6b;';
                tip.textContent = '⚠️ 已自动清理 ' + cleaned + ' 个超过 ' + OS_DATA.settings.trashAutoDeleteDays + ' 天的文件';
                container.appendChild(tip);
            }
            OS_DATA.trashBin.forEach(function(trashItem) {
                var icon = '📄';
                if (trashItem.fileType === 'cpp') icon = '⚙️';
                if (trashItem.fileType === 'xlsx') icon = '📊';
                if (trashItem.fileType === 'docx') icon = '📘';
                if (trashItem.fileType === 'md') icon = '📝';
                if (trashItem.fileType === 'folder') icon = '📁';
                if (trashItem.fileType === 'exe') icon = '💿';
                if (trashItem.fileType === 'cmt') icon = '⌨️';

                var row = document.createElement('div');
                row.className = 'trash-item-row';
                row.style.cssText = 'padding:8px 12px;margin:2px 4px;border-radius:6px;display:flex;align-items:center;gap:10px;color:var(--text-primary);font-size:13px;transition:background 0.15s;cursor:pointer;';

                // 计算剩余天数
                var daysLeft = '';
                var autoDays = OS_DATA.settings.trashAutoDeleteDays;
                if (autoDays && autoDays > 0) {
                    var elapsed = (Date.now() - new Date(trashItem.deletedAt).getTime()) / (24 * 60 * 60 * 1000);
                    var remain = Math.ceil(autoDays - elapsed);
                    if (remain <= 0) {
                        daysLeft = '<span style="color:#ff6b6b;font-size:10px;">即将删除</span>';
                    } else if (remain <= 3) {
                        daysLeft = '<span style="color:#ffaa00;font-size:10px;">剩余 ' + remain + ' 天</span>';
                    } else {
                        daysLeft = '<span style="color:var(--text-secondary);font-size:10px;">剩余 ' + remain + ' 天</span>';
                    }
                }

                row.innerHTML =
                    '<span style="font-size:18px;">' + icon + '</span>' +
                    '<div style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
                        '<div style="font-weight:500;">' + escapeHTML(trashItem.fileName) + '</div>' +
                        '<div style="font-size:11px;color:var(--text-secondary);">来自: ' + escapeHTML(trashItem.fromFolderName) + ' · ' + new Date(trashItem.deletedAt).toLocaleString() + (daysLeft ? ' · ' + daysLeft : '') + '</div>' +
                    '</div>' +
                    '<div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">' +
                        '<div class="trash-restore-btn" title="还原" style="color:#4ec9b0;cursor:pointer;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:bold;background:rgba(78,201,176,0.1);border:1px solid rgba(78,201,176,0.3);transition:background 0.15s;">↩ 还原</div>' +
                        '<div class="trash-perm-delete-btn" title="永久删除" style="color:#ff5f56;cursor:pointer;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:bold;background:rgba(255,95,86,0.1);border:1px solid rgba(255,95,86,0.3);transition:background 0.15s;">✕ 永久删除</div>' +
                    '</div>';

                row.addEventListener('mouseenter', function() { this.style.background = 'rgba(255,255,255,0.08)'; });
                row.addEventListener('mouseleave', function() { this.style.background = 'transparent'; });

                // ===== 单击下载文件 =====
                row.addEventListener('click', function(e) {
                    if (e.target.closest('.trash-restore-btn') || e.target.closest('.trash-perm-delete-btn')) return;
                    downloadTrashFile(trashItem);
                });

                // ===== 右键菜单：还原/删除 =====
                row.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    showTrashContextMenu(e.clientX, e.clientY, [
                        { label: '↩ 还原此文件', action: function() {
                            restoreFromTrash(trashItem.id);
                            renderTrashContent(container);
                            renderSidebarFiles();
                            refreshAllExplorerWindows();
                        }},
                        { label: '✕ 永久删除', action: function() {
                            if (confirm('确定要永久删除 [' + trashItem.fileName + ']？此操作不可恢复！')) {
                                permanentlyDeleteFromTrash(trashItem.id);
                                renderTrashContent(container);
                            }
                        }},
                        'divider',
                        { label: '💾 下载文件', action: function() {
                            downloadTrashFile(trashItem);
                        }}
                    ]);
                });

                var restoreBtn = row.querySelector('.trash-restore-btn');
                restoreBtn.addEventListener('mouseenter', function() { this.style.background = 'rgba(78,201,176,0.25)'; });
                restoreBtn.addEventListener('mouseleave', function() { this.style.background = 'rgba(78,201,176,0.1)'; });
                restoreBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    restoreFromTrash(trashItem.id);
                    renderTrashContent(container);
                    renderSidebarFiles();
                    refreshAllExplorerWindows();
                });

                var permDelBtn = row.querySelector('.trash-perm-delete-btn');
                permDelBtn.addEventListener('mouseenter', function() { this.style.background = 'rgba(255,95,86,0.25)'; });
                permDelBtn.addEventListener('mouseleave', function() { this.style.background = 'rgba(255,95,86,0.1)'; });
                permDelBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (confirm('确定要永久删除 [' + trashItem.fileName + ']？此操作不可恢复！')) {
                        permanentlyDeleteFromTrash(trashItem.id);
                        renderTrashContent(container);
                    }
                });

                container.appendChild(row);
            });
        }

        renderTrashContent(content);

        // ===== 空白处右键菜单：一键恢复所有/删除所有 =====
        content.addEventListener('contextmenu', function(e) {
            if (e.target.closest('.trash-item-row')) return;
            e.preventDefault();
            if (OS_DATA.trashBin.length === 0) return;
            showTrashContextMenu(e.clientX, e.clientY, [
                { label: '↩ 还原所有文件', action: function() {
                    if (confirm('确定要还原回收站中的所有文件吗？')) {
                        var items = OS_DATA.trashBin.slice();
                        items.forEach(function(t) { restoreFromTrash(t.id); });
                        renderTrashContent(content);
                        renderSidebarFiles();
                        refreshAllExplorerWindows();
                    }
                }},
                { label: '✕ 永久删除所有文件', action: function() {
                    if (confirm('确定要永久删除回收站中的所有文件吗？此操作不可恢复！')) {
                        emptyTrashBin();
                        renderTrashContent(content);
                    }
                }}
            ]);
        });

        // 清空回收站按钮
        var emptyBtn = win.querySelector('#trash-empty-btn');
        emptyBtn.addEventListener('mouseenter', function() { this.style.background = 'rgba(255,107,107,0.15)'; });
        emptyBtn.addEventListener('mouseleave', function() { this.style.background = 'transparent'; });
        emptyBtn.addEventListener('click', function() {
            if (confirm('确定要清空回收站吗？所有文件将被永久删除，不可恢复！')) {
                emptyTrashBin();
                renderTrashContent(content);
            }
        });

        // 刷新
        var refreshBtn = win.querySelector('#trash-refresh-btn');
        refreshBtn.addEventListener('click', function() { renderTrashContent(content); });

        // 窗口控制
        win.addEventListener('mousedown', function() { win.style.zIndex = ++zIndexCounter; }, true);
        bindWindowDragAndResize(win, win.querySelector('.os-window-header'), win.querySelector('.os-window-resize-handle'), null);
        bindWindowControls(win, '🗑️ 回收站', null);
    }
        // ===== 启动时自动清理过期回收站文件 =====
    (function autoCleanTrashOnStartup() {
        var days = OS_DATA.settings.trashAutoDeleteDays;
        if (!days || days <= 0) return;
        var now = Date.now();
        var ms = days * 24 * 60 * 60 * 1000;
        var before = OS_DATA.trashBin.length;
        OS_DATA.trashBin = OS_DATA.trashBin.filter(function(t) {
            return (now - new Date(t.deletedAt).getTime()) < ms;
        });
        if (OS_DATA.trashBin.length < before) {
            saveSystemDataNow();
        }
    })();
    // ===== 回收站系统 END =====
    function renderSidebarFiles() {
        const listContainer = shadow.getElementById('os-sidebar-file-list');
        listContainer.innerHTML = '';

        // 分离根目录文件和文件夹
        const rootFiles = OS_DATA.files.filter(function(f) {
            return !OS_DATA.files.some(function(parent) {
                return parent.type === 'folder' && parent.children && parent.children.includes(f.id);
            });
        });

        // ===== 公共右键菜单函数 =====
        function showSidebarContextMenu(x, y, items) {
            const existing = shadow.querySelector('.explorer-ctx-menu');
            if (existing) existing.remove();
            const menu = document.createElement('div');
            menu.className = 'explorer-ctx-menu';
            menu.style.cssText = 'position:fixed;z-index:999999;background:var(--win-bg);border:1px solid var(--win-border);border-radius:8px;padding:4px 0;box-shadow:0 8px 24px rgba(0,0,0,0.3);min-width:180px;pointer-events:auto;';
            items.forEach(function(item) {
                const row = document.createElement('div');
                row.textContent = item.label;
                row.style.cssText = 'padding:8px 16px;cursor:pointer;font-size:13px;color:var(--text-primary);transition:background 0.1s;';
                if (item.disabled) {
                    row.style.opacity = '0.4';
                    row.style.cursor = 'default';
                } else {
                    row.addEventListener('mouseenter', function() { row.style.background = 'rgba(255,255,255,0.1)'; });
                    row.addEventListener('mouseleave', function() { row.style.background = 'transparent'; });
                    row.addEventListener('click', function() { menu.remove(); item.action(); });
                }
                menu.appendChild(row);
            });
            menu.style.left = x + 'px';
            menu.style.top = y + 'px';
            shadow.appendChild(menu);
            // 边界修正
            requestAnimationFrame(function() {
                if (x + menu.offsetWidth > window.innerWidth) menu.style.left = (window.innerWidth - menu.offsetWidth - 4) + 'px';
                if (y + menu.offsetHeight > window.innerHeight) menu.style.top = (window.innerHeight - menu.offsetHeight - 4) + 'px';
            });
            setTimeout(function() {
                var closeHandler = function(ev) {
                    if (!menu.contains(ev.target)) {
                        menu.remove();
                        shadow.removeEventListener('click', closeHandler, true);
                        shadow.removeEventListener('contextmenu', closeHandler, true);
                    }
                };
                shadow.addEventListener('click', closeHandler, true);
                shadow.addEventListener('contextmenu', closeHandler, true);
            }, 10);
        }

        // ===== 文件图标映射 =====
        function getFileIcon(file) {
            if (file.type === 'cpp') return '⚙️';
            if (file.type === 'xlsx') return '📊';
            if (file.type === 'docx') return '📘';
            if (file.type === 'md') return '📝';
            if (file.type === 'folder') return '📁';
            if (file.type === 'exe') return '💿';
            if (file.type === 'cmt') return '⌨️';
            return '📄';
        }

        // ===== 拖拽移动文件到文件夹 =====
        function moveFileToFolder(fileId, targetFolderId) {
            var dragFile = OS_DATA.files.find(function(f) { return f.id === fileId; });
            if (!dragFile) return false;
            // 防止拖到自身
            if (fileId === targetFolderId) return false;
            // 防止循环
            if (dragFile.type === 'folder' && isDescendant(fileId, targetFolderId)) return false;

            // 如果目标是文件夹，检查是否已在其中
            if (targetFolderId) {
                var targetFolder = OS_DATA.files.find(function(f) { return f.id === targetFolderId; });
                if (!targetFolder || targetFolder.type !== 'folder') return false;
                if (targetFolder.children && targetFolder.children.includes(fileId)) return false;
            }

            // 从原父文件夹移除
            var oldParentId = getParentFolderId(fileId);
            if (oldParentId) {
                var oldParent = OS_DATA.files.find(function(f) { return f.id === oldParentId; });
                if (oldParent && oldParent.children) {
                    oldParent.children = oldParent.children.filter(function(c) { return c !== fileId; });
                }
            }
            // 添加到目标文件夹
            if (targetFolderId) {
                var targetFolder = OS_DATA.files.find(function(f) { return f.id === targetFolderId; });
                if (targetFolder) {
                    if (!targetFolder.children) targetFolder.children = [];
                    targetFolder.children.push(fileId);
                }
            }
            saveSystemData();
            renderSidebarFiles();
            refreshAllExplorerWindows();
            return true;
        }

        // ===== 创建文件节点 =====
        function createFileNode(file, depth) {
            var el = document.createElement('div');
            el.className = 'file-node';
            el.setAttribute('data-file-id', file.id);
            el.style.paddingLeft = (16 + depth * 20) + 'px';

            var icon = getFileIcon(file);
            el.innerHTML =
                '<div class="file-info-part">' +
                    '<span>' + icon + '</span>' +
                    '<span>' + file.name + '</span>' +
                '</div>' +
                '<div style="display:flex;align-items:center;">' +
                    '<div class="file-rename-btn" title="重命名">✏️</div>' +
                    '<div class="file-raw-delete-btn" title="彻底删除">×</div>' +
                '</div>';

            // ===== 拖拽 =====
            el.draggable = true;
            el.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/os-file-id', file.id);
                e.dataTransfer.effectAllowed = 'move';
                el.style.opacity = '0.4';
            });
            el.addEventListener('dragend', function() {
                el.style.opacity = '1';
                shadow.querySelectorAll('.folder-drop-target').forEach(function(item) {
                    item.classList.remove('folder-drop-target');
                });
            });

            // ===== 点击打开 =====
            el.addEventListener('click', function(e) {
                if (e.target.classList.contains('file-raw-delete-btn') ||
                    e.target.classList.contains('file-rename-btn')) return;
                e.stopPropagation();
                openAppWindow(file.id);
            });

            // ===== 右键菜单 =====
            el.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showSidebarContextMenu(e.clientX, e.clientY, [
                    { label: '📂 打开', action: function() { openAppWindow(file.id); } },
                    { label: '💾 下载', action: function() { downloadFile(file.id); } },
                    { label: '✏️ 重命名', action: function() {
                        var n = prompt('重命名:', file.name);
                        if (n && n.trim()) { file.name = n.trim(); saveSystemData(); renderSidebarFiles(); refreshAllExplorerWindows(); }
                    }},
                    { label: '📋 复制内容', action: function() {
                        if (file.type === 'folder') return;
                        navigator.clipboard.writeText(typeof file.content === 'string' ? file.content : JSON.stringify(file.content)).then(function() {
                            var orig = el.querySelector('.file-info-part span:last-child');
                            var t = orig.textContent; orig.textContent = '✅ 已复制'; setTimeout(function() { orig.textContent = t; }, 1000);
                        });
                    }},
                    { label: '📋 复制', action: function() {
                        _clipboard = { action: 'copy', ids: [file.id] };
                        var orig = el.querySelector('.file-info-part span:last-child');
                        var t = orig.textContent; orig.textContent = '📋 已复制'; setTimeout(function() { orig.textContent = t; }, 1000);
                    }},
                    { label: '✂️ 剪切', action: function() {
                        _clipboard = { action: 'cut', ids: [file.id] };
                        el.style.opacity = '0.5';
                        var orig = el.querySelector('.file-info-part span:last-child');
                        var t = orig.textContent; orig.textContent = '✂️ 已剪切'; setTimeout(function() { orig.textContent = t; }, 1000);
                        setTimeout(function() { el.style.opacity = '1'; }, 2000);
                    }},
                    { label: '📌 粘贴', action: function() {
                        if (!_clipboard.action || _clipboard.ids.length === 0) { alert('剪贴板为空！'); return; }
                        if (file.type === 'folder') {
                            var count = pasteFiles(file.id);
                            if (count > 0) alert('✅ 已粘贴 ' + count + ' 个项目到 ' + file.name);
                        } else {
                            var parentId = getParentFolderId(file.id);
                            var count = pasteFiles(parentId);
                            if (count > 0) alert('✅ 已粘贴 ' + count + ' 个项目');
                        }
                        renderSidebarFiles();
                        refreshAllExplorerWindows();
                    }},
                    { label: '📁 移入文件夹', action: function() {
                        if (file.type === 'folder') return;
                        var folders = OS_DATA.files.filter(function(f) { return f.type === 'folder' && f.id !== file.id; });
                        if (folders.length === 0) { alert('没有可用的文件夹'); return; }
                        var names = folders.map(function(f, i) { return i + '. ' + f.name; }).join('\n');
                        var c = prompt('移入哪个文件夹？\n' + names + '\n\n输入编号:', '0');
                        if (c !== null && parseInt(c) >= 0 && parseInt(c) < folders.length) {
                            var target = folders[parseInt(c)];
                            if (moveFileToFolder(file.id, target.id)) {
                                alert('✅ 已将 [' + file.name + '] 移入 [' + target.name + ']');
                            }
                        }
                    }},
                    { label: '🗑️ 删除', action: function() {
                        if (confirm('确定删除 [' + file.name + ']？文件将移入回收站。')) {
                            var parentId = getParentFolderId(file.id);
                            moveToTrash(file.id, parentId);
                            renderSidebarFiles(); refreshAllExplorerWindows();
                        }
                    }}
                ]);
            });

            // ===== 重命名按钮 =====
            el.querySelector('.file-rename-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                var newName = prompt('请输入新文件名:', file.name);
                if (newName && newName.trim() !== '') {
                    file.name = newName.trim();
                    saveSystemData();
                    renderSidebarFiles();
                    refreshAllExplorerWindows();
                }
            });

            // ===== 删除按钮 =====
            el.querySelector('.file-raw-delete-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm('确定要删除 [' + file.name + ']？文件将移入回收站。')) {
                    var parentId = getParentFolderId(file.id);
                    moveToTrash(file.id, parentId);
                    renderSidebarFiles(); refreshAllExplorerWindows();
                }
            });

            return el;
        }

        // ===== 创建文件夹节点 =====
        function createFolderNode(folder, depth) {
            var wrapper = document.createElement('div');

            // 文件夹头
            var header = document.createElement('div');
            header.className = 'file-node';
            header.setAttribute('data-file-id', folder.id);
            header.style.paddingLeft = (16 + depth * 20) + 'px';
            header.style.cursor = 'pointer';
            header.innerHTML =
                '<div class="file-info-part">' +
                    '<span class="folder-toggle-icon">▶</span>' +
                    '<span>📁</span>' +
                    '<span>' + folder.name + '</span>' +
                '</div>' +
                '<div style="display:flex;align-items:center;">' +
                    '<div class="file-rename-btn" title="重命名">✏️</div>' +
                    '<div class="file-raw-delete-btn" title="彻底删除">×</div>' +
                '</div>';
            wrapper.appendChild(header);

            // 子文件容器（默认收起）
            var childContainer = document.createElement('div');
            childContainer.className = 'folder-children';
            childContainer.style.display = 'none';
            wrapper.appendChild(childContainer);

            var isExpanded = false;
            var toggleIcon = header.querySelector('.folder-toggle-icon');

            // ===== 点击文件夹头部：展开/收起 =====
            header.addEventListener('click', function(e) {
                if (e.target.classList.contains('file-raw-delete-btn') ||
                    e.target.classList.contains('file-rename-btn')) return;
                e.stopPropagation();

                isExpanded = !isExpanded;
                childContainer.style.display = isExpanded ? 'block' : 'none';
                toggleIcon.textContent = isExpanded ? '▼' : '▶';
                if (isExpanded) {
                    var existing = shadow.getElementById('win-runtime-' + folder.id);
                    if (existing) { existing.querySelector('.os-window-header span').click(); }
                    else { openAppWindow(folder.id); }
                }

                if (isExpanded && childContainer.children.length === 0) {
                    renderChildren(folder, childContainer, depth + 1);
                }
            });

            // ===== 重命名 =====
            header.querySelector('.file-rename-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                var newName = prompt('请输入新文件夹名:', folder.name);
                if (newName && newName.trim() !== '') {
                    folder.name = newName.trim();
                    saveSystemData();
                    renderSidebarFiles();
                    refreshAllExplorerWindows();
                }
            });

            // ===== 删除 =====
            header.querySelector('.file-raw-delete-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm('确定要删除文件夹 [' + folder.name + '] 及其所有内容吗？文件将移入回收站。')) {
                    var parentId = getParentFolderId(folder.id);
                    moveToTrash(folder.id, parentId);
                    renderSidebarFiles(); refreshAllExplorerWindows();
                }
            });

            // ===== 文件夹右键菜单 =====
            header.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showSidebarContextMenu(e.clientX, e.clientY, [
                    { label: '📂 打开', action: function() { openAppWindow(folder.id); } },
                    { label: '💾 下载', action: function() { downloadFile(folder.id); } },
                    { label: '✏️ 重命名', action: function() {
                        var n = prompt('重命名:', folder.name);
                        if (n && n.trim()) { folder.name = n.trim(); saveSystemData(); renderSidebarFiles(); refreshAllExplorerWindows(); }
                    }},
                    { label: '📋 复制', action: function() {
                        _clipboard = { action: 'copy', ids: [folder.id] };
                        var orig = header.querySelector('.file-info-part span:last-child');
                        var t = orig.textContent; orig.textContent = '📋 已复制'; setTimeout(function() { orig.textContent = t; }, 1000);
                    }},
                    { label: '✂️ 剪切', action: function() {
                        _clipboard = { action: 'cut', ids: [folder.id] };
                        header.style.opacity = '0.5';
                        var orig = header.querySelector('.file-info-part span:last-child');
                        var t = orig.textContent; orig.textContent = '✂️ 已剪切'; setTimeout(function() { orig.textContent = t; }, 1000);
                        setTimeout(function() { header.style.opacity = '1'; }, 2000);
                    }},
                    { label: '📌 粘贴到文件夹', action: function() {
                        if (!_clipboard.action || _clipboard.ids.length === 0) { alert('剪贴板为空！'); return; }
                        var count = pasteFiles(folder.id);
                        if (count > 0) { alert('✅ 已粘贴 ' + count + ' 个项目到 ' + folder.name); renderSidebarFiles(); refreshAllExplorerWindows(); }
                    }},
                    { label: '🗑️ 删除', action: function() {
                        if (confirm('确定删除文件夹 [' + folder.name + '] 及其所有内容吗？文件将移入回收站。')) {
                            var parentId = getParentFolderId(folder.id);
                            moveToTrash(folder.id, parentId);
                            renderSidebarFiles(); refreshAllExplorerWindows();
                        }
                    }}
                ]);
            });

            // ===== 文件夹作为拖拽目标（只绑定一次） =====
            header.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                header.classList.add('folder-drop-target');
            });
            header.addEventListener('dragleave', function(e) {
                e.stopPropagation();
                if (!header.contains(e.relatedTarget)) {
                    header.classList.remove('folder-drop-target');
                }
            });
            header.addEventListener('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                header.classList.remove('folder-drop-target');

                var fileId = e.dataTransfer.getData('text/os-file-id');
                if (!fileId) return;

                if (moveFileToFolder(fileId, folder.id)) {
                    // 自动展开文件夹，让用户看到文件进去了
                    if (!isExpanded) {
                        isExpanded = true;
                        childContainer.style.display = 'block';
                        toggleIcon.textContent = '▼';
                        renderChildren(folder, childContainer, depth + 1);
                    } else {
                        renderChildren(folder, childContainer, depth + 1);
                    }
                }
            });

            return wrapper;
        }

        // ===== 渲染子项 =====
        function renderChildren(folder, container, depth) {
            container.innerHTML = '';
            if (!folder.children || folder.children.length === 0) {
                var empty = document.createElement('div');
                empty.style.cssText = 'padding:4px 8px;font-size:12px;color:rgba(255,255,255,0.3);';
                empty.textContent = '(空文件夹)';
                container.appendChild(empty);
                return;
            }
            folder.children.forEach(function(childId) {
                var child = OS_DATA.files.find(function(f) { return f.id === childId; });
                if (!child) return;
                if (child.type === 'folder') {
                    container.appendChild(createFolderNode(child, depth));
                } else {
                    container.appendChild(createFileNode(child, depth));
                }
            });
        }

        // ===== 空白处右键菜单（只绑定一次） =====
        if (!listContainer._ctxBound) {
            listContainer._ctxBound = true;
            listContainer.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                if (e.target.closest('.file-node') || e.target.closest('.folder-children')) return;
                showSidebarContextMenu(e.clientX, e.clientY, [
                    { label: '📄 新建文件', action: function() { createNewFile('txt'); } },
                    { label: '⚙️ 新建.cpp', action: function() { createNewFile('cpp'); } },
                    { label: '📝 新建.md', action: function() { createNewFile('md'); } },
                    { label: '📊 新建Excel', action: function() { createNewFile('xlsx'); } },
                    { label: '📘 新建Word', action: function() { createNewFile('docx'); } },
                    { label: '📁 新建文件夹', action: function() { createNewFile('folder'); } },
                    { label: '📌 粘贴到根目录', action: function() {
                        if (!_clipboard.action || _clipboard.ids.length === 0) { alert('剪贴板为空！'); return; }
                        var count = pasteFiles(null);
                        if (count > 0) { alert('✅ 已粘贴 ' + count + ' 个项目到根目录'); renderSidebarFiles(); refreshAllExplorerWindows(); }
                    }},
                    { label: '📤 上传文件', action: function() {
                        var input = document.createElement('input');
                        input.type = 'file'; input.multiple = true;
                        input.accept = '.txt,.cpp,.md,.html,.json,.csv,.js,.py,.css,.xml,.log,.cmt';
                        input.onchange = function(ev) {
                            Array.from(ev.target.files).forEach(function(f) {
                                var reader = new FileReader();
                                reader.onload = function(evt) {
                                    var ext = f.name.split('.').pop().toLowerCase();
                                    var type = 'txt';
                                    if (ext === 'cpp' || ext === 'c' || ext === 'h') type = 'cpp';
                                    else if (ext === 'cmt') type = 'cmt';
                                    else if (ext === 'md') type = 'md';
                                    else if (ext === 'xlsx' || ext === 'xls') type = 'xlsx';
                                    else if (ext === 'docx' || ext === 'doc') type = 'docx';
                                    var newFile = { id: 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2,6), name: f.name, type: type, content: evt.target.result };
                                    OS_DATA.files.push(newFile);
                                    saveSystemData();
                                    renderSidebarFiles();
                                    refreshAllExplorerWindows();
                                };
                                reader.readAsText(f);
                            });
                        };
                        input.click();
                    }}
                ]);
            });

            // ===== listContainer 的 dragover/drop（只绑定一次） =====
            listContainer.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            listContainer.addEventListener('drop', function(e) {
                e.preventDefault();
                var fileId = e.dataTransfer.getData('text/os-file-id');
                if (!fileId) return;

                // 拖到某个文件节点上
                var target = e.target.closest('.file-node[data-file-id]');
                if (target) {
                    var targetId = target.getAttribute('data-file-id');
                    if (targetId === fileId) return;
                    var targetFile = OS_DATA.files.find(function(f) { return f.id === targetId; });
                    if (!targetFile || targetFile.type !== 'folder') return;
                    // 静默移入，不弹 confirm
                    if (moveFileToFolder(fileId, targetId)) {
                        renderSidebarFiles();
                        refreshAllExplorerWindows();
                    }
                } else {
                    // 拖到空白处 = 移到根目录（静默，不弹 confirm）
                    var dragFile = OS_DATA.files.find(function(f) { return f.id === fileId; });
                    if (!dragFile) return;
                    var oldParentId = getParentFolderId(fileId);
                    if (!oldParentId) return; // 已经在根目录
                    // 从原父文件夹移除
                    var oldParent = OS_DATA.files.find(function(f) { return f.id === oldParentId; });
                    if (oldParent && oldParent.children) {
                        oldParent.children = oldParent.children.filter(function(c) { return c !== fileId; });
                    }
                    saveSystemData();
                    renderSidebarFiles();
                    refreshAllExplorerWindows();
                }
            });
        }

        // ===== 渲染根目录 =====
        rootFiles.forEach(function(file) {
            if (file.type === 'folder') {
                listContainer.appendChild(createFolderNode(file, 0));
            } else {
                listContainer.appendChild(createFileNode(file, 0));
            }
        });
    }

    function createNewFile(type) {
    if (type === 'folder') {
        const name = prompt('请输入文件夹名称:', '新文件夹');
        if (!name) return;
        const newFolder = { id: 'f_' + Date.now(), name, type: 'folder', content: '', children: [] };
        OS_DATA.files.push(newFolder); saveSystemData(); renderSidebarFiles();
        return;
    }
    const name = prompt(`请输入自定文件名(.${type}):`, `demo_${Date.now().toString().slice(-4)}.${type}`);
    if (!name) return;
    let content = "";
    if (type === 'xlsx') content = [["","","",""]];
    if (type === 'cpp') content = '#include <iostream>\nusing namespace std;\nint main() {\n\n return 0;}';
    if (type === 'docx') content = '<div>请输入文档内容...</div>';
    if (type === 'md') content = '# 标题\n\n正文内容...\n\n## 子标题\n\n- 列表项1\n- 列表项2\n\n```cpp\ncout << "Hello" << endl;\n```\n';
    if (type === 'cmt') content = '@echo off\nrem CMQ Terminal Script\necho Hello from CMT!\nver\n';
    const newFile = { id: 'f_' + Date.now(), name, type, content };
    const folders = OS_DATA.files.filter(f => f.type === 'folder');
                function getFolderTree(folder, depth) {
                    let prefix = '  '.repeat(depth);
                    let result = [{ folder: folder, label: prefix + '📁 ' + folder.name }];
                    if (folder.children) {
                        folder.children.forEach(childId => {
                            const child = OS_DATA.files.find(f => f.id === childId);
                            if (child && child.type === 'folder') {
                                result = result.concat(getFolderTree(child, depth + 1));
                            }
                        });
                    }
                    return result;
                }
                let allFolders = [];
                folders.forEach(f => {
                    if (!OS_DATA.files.some(p => p.type === 'folder' && p.children && p.children.includes(f.id))) {
                        allFolders = allFolders.concat(getFolderTree(f, 0));
                    }
                });
                if (allFolders.length > 0) {
                    const folderNames = ['根目录（不放入文件夹）', ...allFolders.map(f => f.label)];
                    const choice = prompt(`将文件放入哪个文件夹？\n${folderNames.map((n, i) => i + '. ' + n).join('\n')}\n\n请输入编号:`, '0');
            if (choice && parseInt(choice) > 0) {
                const targetFolder = allFolders[parseInt(choice) - 1].folder;
                if (targetFolder) { if (!targetFolder.children) targetFolder.children = []; targetFolder.children.push(newFile.id); }
            }
    }
    OS_DATA.files.push(newFile); saveSystemData(); renderSidebarFiles(); openAppWindow(newFile.id);
    }

    shadow.getElementById('sbar-new-txt').onclick = () => createNewFile('txt');
    shadow.getElementById('sbar-new-cpp').onclick = () => createNewFile('cpp');
    shadow.getElementById('sbar-new-md').onclick = () => createNewFile('md');
    shadow.getElementById('sbar-new-xlsx').onclick = () => createNewFile('xlsx');
    shadow.getElementById('sbar-new-docx').onclick = () => createNewFile('docx');
    shadow.getElementById('sbar-new-folder').onclick = () => createNewFile('folder');
    shadow.getElementById('sbar-new-cmt').onclick = () => createNewFile('cmt');
    // ===== 剪贴板系统（复制/剪切/粘贴） =====
    let _clipboard = { action: null, ids: [] }; // action: 'copy' | 'cut'

    // 深拷贝文件（支持文件夹递归）
    function deepCloneFile(file) {
        const newId = 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        if (file.type === 'folder') {
            const newChildren = [];
            if (file.children && file.children.length > 0) {
                file.children.forEach(function(childId) {
                    const child = OS_DATA.files.find(function(f) { return f.id === childId; });
                    if (child) {
                        const clonedChild = deepCloneFile(child);
                        newChildren.push(clonedChild.id);
                        OS_DATA.files.push(clonedChild);
                    }
                });
            }
            return { id: newId, name: file.name, type: 'folder', content: '', children: newChildren };
        } else {
            return { id: newId, name: file.name, type: file.type, content: JSON.parse(JSON.stringify(file.content)) };
        }
    }

    // 获取文件所在的父文件夹ID（返回null表示在根目录）
    function getParentFolderId(fileId) {
        const parent = OS_DATA.files.find(function(f) {
            return f.type === 'folder' && f.children && f.children.includes(fileId);
        });
        return parent ? parent.id : null;
    }

    // 判断 targetFolderId 是否是 fileId 的后代（防止循环粘贴）
    function isDescendant(fileId, targetFolderId) {
        if (fileId === targetFolderId) return true;
        const file = OS_DATA.files.find(function(f) { return f.id === fileId; });
        if (!file || file.type !== 'folder' || !file.children) return false;
        for (const childId of file.children) {
            if (isDescendant(childId, targetFolderId)) return true;
        }
        return false;
    }

    // 执行粘贴操作，返回粘贴的文件数量
    function pasteFiles(targetFolderId) {
        if (!_clipboard.action || _clipboard.ids.length === 0) return 0;
        let count = 0;
        _clipboard.ids.forEach(function(fileId) {
            const file = OS_DATA.files.find(function(f) { return f.id === fileId; });
            if (!file) return;

            // 防止粘贴到自身或自身的子文件夹中
            if (targetFolderId && isDescendant(fileId, targetFolderId)) return;

            if (_clipboard.action === 'copy') {
                // 复制：深拷贝文件，添加到系统
                const cloned = deepCloneFile(file);
                // 如果目标位置有同名文件，添加 "副本" 后缀
                const existingNames = getExistingNames(targetFolderId);
                cloned.name = getUniqueName(cloned.name, existingNames);
                OS_DATA.files.push(cloned);
                if (targetFolderId) {
                    const targetFolder = OS_DATA.files.find(function(f) { return f.id === targetFolderId; });
                    if (targetFolder && targetFolder.type === 'folder') {
                        if (!targetFolder.children) targetFolder.children = [];
                        targetFolder.children.push(cloned.id);
                    }
                }
                count++;
            } else if (_clipboard.action === 'cut') {
                // 剪切：移动文件到目标位置
                // 先从原父文件夹中移除
                const oldParentId = getParentFolderId(fileId);
                if (oldParentId) {
                    const oldParent = OS_DATA.files.find(function(f) { return f.id === oldParentId; });
                    if (oldParent && oldParent.children) {
                        oldParent.children = oldParent.children.filter(function(c) { return c !== fileId; });
                    }
                }
                // 如果目标是根目录，不需要做什么额外操作
                // 如果目标是文件夹，添加到其children中
                if (targetFolderId) {
                    const targetFolder = OS_DATA.files.find(function(f) { return f.id === targetFolderId; });
                    if (targetFolder && targetFolder.type === 'folder') {
                        if (!targetFolder.children) targetFolder.children = [];
                        if (!targetFolder.children.includes(fileId)) {
                            targetFolder.children.push(fileId);
                        }
                    }
                }
                count++;
            }
        });
        // 剪切操作完成后清空剪贴板
        if (_clipboard.action === 'cut') {
            _clipboard = { action: null, ids: [] };
        }
        if (count > 0) {
            saveSystemData();
            renderSidebarFiles();
        }
        return count;
    }

    // 获取某个文件夹下或根目录下已有的文件名列表
    function getExistingNames(folderId) {
        if (folderId) {
            const folder = OS_DATA.files.find(function(f) { return f.id === folderId; });
            if (!folder || !folder.children) return [];
            return folder.children.map(function(cid) {
                const child = OS_DATA.files.find(function(f) { return f.id === cid; });
                return child ? child.name : '';
            }).filter(Boolean);
        } else {
            // 根目录
            return OS_DATA.files.filter(function(f) {
                return !OS_DATA.files.some(function(parent) {
                    return parent.type === 'folder' && parent.children && parent.children.includes(f.id);
                });
            }).map(function(f) { return f.name; });
        }
    }

    // 生成不重复的文件名
    function getUniqueName(name, existingNames) {
        if (!existingNames.includes(name)) return name;
        const dotIdx = name.lastIndexOf('.');
        let base, ext;
        if (dotIdx > 0) {
            base = name.substring(0, dotIdx);
            ext = name.substring(dotIdx);
        } else {
            base = name;
            ext = '';
        }
        let counter = 1;
        let newName;
        do {
            newName = base + ' 副本' + (counter > 1 ? ' ' + counter : '') + ext;
            counter++;
        } while (existingNames.includes(newName));
        return newName;
    }
    // --- 窗口记忆 ---
    function getWindowRect(win) { const rect = win.getBoundingClientRect(); return { top: Math.round(rect.top) + 'px', left: Math.round(rect.left) + 'px', width: Math.round(rect.width) + 'px', height: Math.round(rect.height) + 'px' }; }
    function saveWindowState(winId, extraData) { if (!OS_DATA.settings.rememberWindows) return; const win = shadow.getElementById(winId); if (!win) return; const rect = getWindowRect(win); const state = { winId, id: extraData.id, type: extraData.type, top: rect.top, left: rect.left, width: rect.width, height: rect.height }; const existing = OS_DATA.openWindows.find(w => w.id === extraData.id); if (existing) Object.assign(existing, state); else OS_DATA.openWindows.push(state); saveSystemData(); }
    function removeWindowState(extraId) { if (!OS_DATA.settings.rememberWindows) return; OS_DATA.openWindows = OS_DATA.openWindows.filter(w => w.id !== extraId); saveSystemDataNow(); }
    function restoreWindows() { const windowsToRestore = JSON.parse(JSON.stringify(OS_DATA.openWindows)); windowsToRestore.forEach(wState => { if (wState.type === 'ai-chat') openAIChatWindow(wState); else openAppWindow(wState.id, wState); }); }

    // --- 窗口拖动/拉伸/最小化/全屏 ---
    function bindWindowDragAndResize(win, header, resizeHandle, extraData) {
        let isDragging = false, shiftX, shiftY;
        header.addEventListener('mousedown', (e) => { if (e.target.closest('.win-ctrl-btn') || e.target.closest('.win-btn-save')) return; isDragging = true; shiftX = e.clientX - win.getBoundingClientRect().left; shiftY = e.clientY - win.getBoundingClientRect().top; document.body.style.userSelect = 'none'; });
        let isResizing = false, startW, startH, startX, startY;
        resizeHandle.addEventListener('mousedown', (e) => { e.stopPropagation(); e.preventDefault(); isResizing = true; startW = win.offsetWidth; startH = win.offsetHeight; startX = e.clientX; startY = e.clientY; });
        document.addEventListener('mousemove', (e) => { if (isDragging && !win.classList.contains('maximized')) { let left = e.clientX - shiftX; let top = e.clientY - shiftY; if (top < 0) top = 0;if (left < -win.offsetWidth + 100) left = -win.offsetWidth + 100;if (left > window.innerWidth - 100) left = window.innerWidth - 100; win.style.left = left + 'px'; win.style.top = top + 'px'; if (extraData) saveWindowState(win.id, extraData); } if (isResizing && !win.classList.contains('maximized')) { win.style.width = Math.max(450, startW + (e.clientX - startX)) + 'px'; win.style.height = Math.max(300, startH + (e.clientY - startY)) + 'px'; if (extraData) saveWindowState(win.id, extraData); } });
        document.addEventListener('mouseup', () => { if (isDragging || isResizing) { if (extraData) { saveWindowState(win.id, extraData); saveSystemDataNow(); } } isDragging = false; isResizing = false; document.body.style.userSelect = ''; });
    }

    function bindWindowControls(win, title, onClose, onAfterClose) {
        var header = win.querySelector('.os-window-header');
        var closeBtn = win.querySelector('.win-btn-close');
        var minBtn = win.querySelector('.win-btn-min');
        var maxBtn = win.querySelector('.win-btn-max');
        var prevStyle = {};

        // 关闭
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (onClose) onClose();
            win.remove();
            if (onAfterClose) onAfterClose();
        });

        // 最小化（带收缩动画）
        minBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            // 收缩动画：先缩小+透明，再隐藏
            win.style.transition = 'transform 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.22s cubic-bezier(0.4,0,0.2,1)';
            win.style.transform = 'scale(0.6) translateY(30px)';
            win.style.opacity = '0';
            win.style.pointerEvents = 'none';
            setTimeout(function() {
                win.style.display = 'none';
                win.style.transition = '';
                win.style.transform = '';
                win.style.opacity = '';
                win.style.pointerEvents = '';
                win.classList.add('minimized');
            }, 230);
            var titleText = win.querySelector('.os-window-header span');
            var minItem = document.createElement('div');
            minItem.className = 'taskbar-minimized-item';
            minItem.setAttribute('data-win-id', win.id);
            minItem.textContent = titleText ? titleText.textContent : '窗口';
            minItem.addEventListener('click', function() {
                // 先设为不可见但 display:flex，然后播放展开动画
                win.classList.remove('minimized');
                win.style.display = 'flex';
                win.style.transform = 'scale(0.6) translateY(30px)';
                win.style.opacity = '0';
                win.style.pointerEvents = 'none';
                // 强制重绘，让浏览器认到初始状态
                void win.offsetHeight;
                win.style.transition = 'transform 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.22s cubic-bezier(0.4,0,0.2,1)';
                win.style.transform = 'scale(1) translateY(0)';
                win.style.opacity = '1';
                setTimeout(function() {
                    win.style.transition = '';
                    win.style.transform = '';
                    win.style.opacity = '';
                    win.style.pointerEvents = '';
                    win.style.zIndex = ++zIndexCounter;
                }, 230);
                minItem.remove();
            });
            taskbarMinList.appendChild(minItem);
        });

        // 最大化/还原（带平滑过渡）
        maxBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            // 加过渡
            win.style.transition = 'top 0.25s cubic-bezier(0.4,0,0.2,1), left 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1), height 0.25s cubic-bezier(0.4,0,0.2,1), border-radius 0.25s cubic-bezier(0.4,0,0.2,1)';
            if (!win.classList.contains('maximized')) {
                // 记录当前位置/大小，用于还原
                prevStyle = {
                    top: win.style.top,
                    left: win.style.left,
                    width: win.style.width,
                    height: win.style.height,
                    borderRadius: win.style.borderRadius
                };
                win.classList.add('maximized');
                win.style.top = '0';
                win.style.left = '0';
                win.style.width = '100vw';
                win.style.height = 'calc(100vh - 45px)';
                win.style.borderRadius = '0';
            } else {
                // 还原
                win.classList.remove('maximized');
                win.style.top = prevStyle.top || '';
                win.style.left = prevStyle.left || '';
                win.style.width = prevStyle.width || '';
                win.style.height = prevStyle.height || '';
                win.style.borderRadius = prevStyle.borderRadius || '';
            }
            // 动画结束后移除 transition，避免拖拽/调整大小时也有延迟
            setTimeout(function() {
                win.style.transition = '';
            }, 260);
        });

        // 双击标题栏切换最大化
        header.addEventListener('dblclick', function() {
            maxBtn.click();
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
                w.style.display = 'flex';
                const item = taskbarMinList.querySelector(`[data-win-id="${openWinId}"]`);
                if (item) item.remove();
            }
            w.style.zIndex = ++zIndexCounter;
            return;
        }
        const win = document.createElement('div');
        win.className = 'os-window'; win.id = openWinId;
        win.style.zIndex = ++zIndexCounter;
        if (restoreState) { win.style.width = restoreState.width || '520px'; win.style.height = restoreState.height || '600px'; win.style.top = restoreState.top || '60px'; win.style.left = restoreState.left || '280px'; }
        else { win.style.width = '520px'; win.style.height = '600px'; win.style.top = '60px'; win.style.left = '280px'; }

        let convListHTML = '';
        OS_DATA.aiConversations.forEach((conv, idx) => {
            convListHTML += `<div class="ai-conv-item" data-conv-idx="${idx}"><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(conv.title)}</span><span class="ai-conv-del" data-conv-del-idx="${idx}" title="删除此对话">×</span></div>`;
        });

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
                <div style="display:flex; border-bottom:1px solid rgba(255,255,255,0.1);">
                    <div style="flex:1; padding:8px 12px; display:flex; align-items:center; justify-content:space-between;">
                        <span style="font-size:12px; color:var(--text-secondary);">💬 对话列表</span>
                        <span id="ai-new-conv-btn" style="cursor:pointer; font-size:18px; color:var(--accent-color); padding:0 4px;" title="新建对话">＋</span>
                    </div>
                </div>
                <div id="ai-conv-sidebar" style="max-height:140px; overflow-y:auto; padding:4px 8px; border-bottom:1px solid rgba(255,255,255,0.05);">
                    <div class="ai-conversation-list">${convListHTML}</div>
                </div>
                <div id="ai-chat-history" style="flex-grow: 1; padding: 15px; overflow-y: auto; color: var(--text-primary); font-family: 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6;">
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
        const convSidebar = win.querySelector('#ai-conv-sidebar');
        let currentConvIdx = -1;
        let conversation = [];
        let aiIsGenerating = false; // AI 是否正在生成回复
        let currentRequest = null;   // 当前 GM_xmlhttpRequest 的 abort 引用
        function renderConvList() {
            const list = convSidebar.querySelector('.ai-conversation-list');
            list.innerHTML = '';
            OS_DATA.aiConversations.forEach((conv, idx) => {
                const item = document.createElement('div');
                item.className = 'ai-conv-item' + (idx === currentConvIdx ? ' active' : '');
                item.setAttribute('data-conv-idx', idx);
                item.innerHTML = `<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(conv.title)}</span><span class="ai-conv-del" data-conv-del-idx="${idx}" title="删除此对话">×</span>`;
                item.addEventListener('click', (e) => { if (e.target.classList.contains('ai-conv-del')) return; loadConversation(idx); });
                item.querySelector('.ai-conv-del').addEventListener('click', (e) => { e.stopPropagation(); if (confirm('确定删除此对话？')) { OS_DATA.aiConversations.splice(idx, 1); if (currentConvIdx === idx) { currentConvIdx = -1; conversation = []; historyPanel.innerHTML = `<div style="color: #4ec9b0;">[System] 对话已删除。请选择或新建对话。</div>`; } else if (currentConvIdx > idx) currentConvIdx--; saveSystemDataNow(); renderConvList(); } });
                list.appendChild(item);
            });
        }

        function loadConversation(idx) {
            currentConvIdx = idx;
            const conv = OS_DATA.aiConversations[idx];
            if (!conv) return;
            conversation = conv.messages.slice();
            historyPanel.innerHTML = '';
            conv.messages.forEach(msg => {
                if (msg.role === 'user') {
                    historyPanel.innerHTML += `<div class="ai-chat-msg user-msg"><div class="ai-msg-label" style="color:#57a6ff;">You</div><div>${escapeHTML(msg.content).replace(/\n/g, '<br>')}</div><div class="ai-msg-del" data-msg-id="${msg.id}" title="删除此消息">×</div></div>`;
                } else if (msg.role === 'assistant') {
                    historyPanel.innerHTML += `<div class="ai-chat-msg ai-msg"><div class="ai-msg-label" style="color:#4ec9b0;">AI</div><div>${renderMarkdown(msg.content)}</div><div class="ai-msg-del" data-msg-id="${msg.id}" title="删除此消息">×</div></div>`;
                }
            });
            historyPanel.scrollTop = historyPanel.scrollHeight;
            renderConvList();
        }

        win.querySelector('#ai-new-conv-btn').addEventListener('click', () => {
            const newConv = { id: 'conv_' + Date.now(), title: '新对话 ' + (OS_DATA.aiConversations.length + 1), messages: [], createdAt: Date.now() };
            OS_DATA.aiConversations.unshift(newConv);
            saveSystemDataNow(); loadConversation(0); renderConvList();
        });

        historyPanel.addEventListener('click', (e) => {
            const delBtn = e.target.closest('.ai-msg-del');
            if (!delBtn) return;
            const msgId = delBtn.getAttribute('data-msg-id');
            if (currentConvIdx < 0) return;
            const conv = OS_DATA.aiConversations[currentConvIdx];
            conv.messages = conv.messages.filter(m => m.id !== msgId);
            conversation = conv.messages.slice();
            saveSystemDataNow(); loadConversation(currentConvIdx);
        });
        win.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
                e.preventDefault();
                win.querySelector('.win-btn-close').click();
            }
        });
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.ctrlKey) { e.preventDefault(); const s = chatInput.selectionStart; const ed = chatInput.selectionEnd; chatInput.value = chatInput.value.substring(0, s) + "\n" + chatInput.value.substring(ed); chatInput.selectionStart = chatInput.selectionEnd = s + 1; return; }
                e.preventDefault();
                if (chatInput.value.trim() !== '') {
                    const userMsg = chatInput.value.trim(); chatInput.value = '';
                    if (currentConvIdx < 0) {
                        const newConv = { id: 'conv_' + Date.now(), title: userMsg.substring(0, 30) + (userMsg.length > 30 ? '...' : ''), messages: [], createdAt: Date.now() };
                        OS_DATA.aiConversations.unshift(newConv); currentConvIdx = 0; conversation = []; historyPanel.innerHTML = ''; renderConvList();
                    }
                    const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
                    const conv = OS_DATA.aiConversations[currentConvIdx];
                    conv.messages.push({ id: msgId, role: 'user', content: userMsg });
                    conversation.push({ role: 'user', content: userMsg });
                    if (conv.messages.length === 1) { conv.title = userMsg.substring(0, 30) + (userMsg.length > 30 ? '...' : ''); renderConvList(); }
                    historyPanel.innerHTML += `<div class="ai-chat-msg user-msg"><div class="ai-msg-label" style="color:#57a6ff;">You</div><div>${escapeHTML(userMsg).replace(/\n/g, '<br>')}</div><div class="ai-msg-del" data-msg-id="${msgId}" title="删除此消息">×</div></div>`;
                    historyPanel.scrollTop = historyPanel.scrollHeight; saveSystemDataNow();
                    if (!OS_DATA.settings.apiKey) { historyPanel.innerHTML += `<div style="color: #ff5f56;">[Error] 缺少 API Key。</div>`; return; }
                    historyPanel.innerHTML += `<div id="ai-typing" style="margin-bottom: 10px; color: #888;"><i>AI is typing...</i></div>`;
                    historyPanel.scrollTop = historyPanel.scrollHeight;
                    const targetModel = OS_DATA.settings.activeModel;
                    const apiMessages = conversation.map(m => ({ role: m.role, content: m.content }));
                    GM_xmlhttpRequest({
                        method: "POST", url: "https://api.apilio.ai/v1/chat/completions",
                        headers: { "Authorization": "Bearer " + OS_DATA.settings.apiKey, "Content-Type": "application/json" },
                        data: JSON.stringify({ model: targetModel, messages: apiMessages }),
                        onload: function(response) {
                            const ti = win.querySelector('#ai-typing'); if (ti) ti.remove();
                            try {
                                const res = JSON.parse(response.responseText);
                                if (res.choices && res.choices.length > 0) {
                                    const aiReply = res.choices[0].message.content;
                                    const aiMsgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
                                    conv.messages.push({ id: aiMsgId, role: 'assistant', content: aiReply });
                                    conversation.push({ role: 'assistant', content: aiReply });
                                    historyPanel.innerHTML += `<div class="ai-chat-msg ai-msg"><div class="ai-msg-label" style="color:#4ec9b0;">AI</div><div>${renderMarkdown(aiReply)}</div><div class="ai-msg-del" data-msg-id="${aiMsgId}" title="删除此消息">×</div></div>`;
                                    saveSystemDataNow();
                                } else { historyPanel.innerHTML += `<div style="color: #ff5f56;">[Error] ${response.responseText}</div>`; }
                            } catch (err) { historyPanel.innerHTML += `<div style="color: #ff5f56;">[Error] ${err.message}</div>`; }
                            historyPanel.scrollTop = historyPanel.scrollHeight;
                        },
                        onerror: function() { const ti = win.querySelector('#ai-typing'); if (ti) ti.remove(); historyPanel.innerHTML += `<div style="color: #ff5f56;">[Error] 网络连接失败。</div>`; historyPanel.scrollTop = historyPanel.scrollHeight; }
                    });
                }
            }
        });

        if (OS_DATA.aiConversations.length > 0) loadConversation(0);
        win.addEventListener('mousedown', () => { win.style.zIndex = ++zIndexCounter; }, true);
        const extraData = { id: 'ai-chat', type: 'ai-chat' };
        win.querySelector('.win-btn-close').onclick = () => { win.remove(); removeWindowState('ai-chat'); const item = taskbarMinList.querySelector(`[data-win-id="${openWinId}"]`); if (item) item.remove(); };
        bindWindowDragAndResize(win, win.querySelector('.os-window-header'), win.querySelector('.os-window-resize-handle'), extraData);
        bindWindowControls(win, '🤖 AI', extraData);
        if (!restoreState) saveWindowState(openWinId, extraData);
    }

    // --- C++ Snippets ---
    const CPP_SNIPPETS = [
        { name: 'main', prefix: 'main', body: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    $0\n    return 0;\n}' },
        { name: 'include', prefix: 'inc', body: '#include <${1:iostream}>$0' },
        { name: 'include_c', prefix: 'incc', body: '#include <${1:cstdio}>$0' },
        { name: 'define', prefix: 'def', body: '#define ${1:NAME} ${2:VALUE}$0' },
        { name: 'typedef', prefix: 'td', body: 'typedef ${1:long long} ${2:ll};$0' },
        { name: 'using', prefix: 'us', body: 'using namespace ${1:std};$0' },
        { name: 'pragma', prefix: 'prg', body: '#pragma ${1:GCC optimize("O2")}$0' },
        { name: 'if', prefix: 'if', body: 'if (${1:condition}) {\n    $0\n}' },
        { name: 'if-else', prefix: 'ife', body: 'if (${1:condition}) {\n    $2\n} else {\n    $0\n}' },
        { name: 'else-if', prefix: 'elif', body: 'else if (${1:condition}) {\n    $0\n}' },
        { name: 'switch', prefix: 'sw', body: 'switch (${1:expression}) {\n    case ${2:value}:\n        $0\n        break;\n    default:\n        break;\n}' },
        { name: 'ternary', prefix: 'ter', body: '(${1:condition}) ? ${2:true_val} : ${3:false_val}$0' },
        { name: 'for', prefix: 'for', body: 'for (int i = 0; i < ${1:n}; i++) {\n    $0\n}' },
        { name: 'for_reverse', prefix: 'forr', body: 'for (int i = ${1:n} - 1; i >= 0; i--) {\n    $0\n}' },
        { name: 'for_range', prefix: 'fora', body: 'for (auto& ${1:elem} : ${2:container}) {\n    $0\n}' },
        { name: 'while', prefix: 'while', body: 'while (${1:condition}) {\n    $0\n}' },
        { name: 'do-while', prefix: 'dow', body: 'do {\n    $0\n} while (${1:condition});' },
        { name: 'cout', prefix: 'cout', body: 'cout << ${1:value} << endl;$0' },
        { name: 'cin', prefix: 'cin', body: 'cin >> ${1:variable};$0' },
        { name: 'printf', prefix: 'pf', body: 'printf("${1:%d}\\n", ${2:value});$0' },
        { name: 'scanf', prefix: 'sf', body: 'scanf("${1:%d}", &${2:variable});$0' },
        { name: 'freopen', prefix: 'fr', body: 'freopen("${1:input.txt}", "r", stdin);\nfreopen("${2:output.txt}", "w", stdout);$0' },
        { name: 'ios_sync', prefix: 'ios', body: 'ios::sync_with_stdio(false);\ncin.tie(0);$0' },
        { name: 'vector', prefix: 'vec', body: 'vector<${1:int}> ${2:v};$0' },
        { name: 'vector_init', prefix: 'veci', body: 'vector<${1:int}> ${2:v}(${3:n}, ${4:0});$0' },
        { name: 'vector_2d', prefix: 'vec2', body: 'vector<vector<${1:int}>> ${2:mat}(${3:n}, vector<${1:int}>(${4:m}, ${5:0}));$0' },
        { name: 'pair', prefix: 'pair', body: 'pair<${1:int}, ${2:int}> ${3:p};$0' },
        { name: 'map', prefix: 'map', body: 'map<${1:int}, ${2:int}> ${3:m};$0' },
        { name: 'unordered_map', prefix: 'umap', body: 'unordered_map<${1:string}, ${2:int}> ${3:m};$0' },
        { name: 'set', prefix: 'set', body: 'set<${1:int}> ${2:s};$0' },
        { name: 'unordered_set', prefix: 'uset', body: 'unordered_set<${1:int}> ${2:s};$0' },
        { name: 'stack', prefix: 'stk', body: 'stack<${1:int}> ${2:stk};$0' },
        { name: 'queue', prefix: 'q', body: 'queue<${1:int}> ${2:q};$0' },
        { name: 'priority_queue', prefix: 'pq', body: 'priority_queue<${1:int}> ${2:pq};$0' },
        { name: 'priority_queue_min', prefix: 'pqm', body: 'priority_queue<${1:int}, vector<${1:int}>, greater<${1:int}>> ${2:pq};$0' },
        { name: 'deque', prefix: 'dq', body: 'deque<${1:int}> ${2:dq};$0' },
        { name: 'bitset', prefix: 'bs', body: 'bitset<${1:32}> ${2:b};$0' },
        { name: 'sort', prefix: 'sort', body: 'sort(${1:v}.begin(), ${1:v}.end());$0' },
        { name: 'sort_desc', prefix: 'sortd', body: 'sort(${1:v}.begin(), ${1:v}.end(), greater<${2:int}>());$0' },
        { name: 'sort_custom', prefix: 'sortc', body: 'sort(${1:v}.begin(), ${1:v}.end(), [](const auto& a, const auto& b) {\n    return ${2:a < b};\n});$0' },
        { name: 'lower_bound', prefix: 'lb', body: 'lower_bound(${1:v}.begin(), ${1:v}.end(), ${2:target})$0' },
        { name: 'upper_bound', prefix: 'ub', body: 'upper_bound(${1:v}.begin(), ${1:v}.end(), ${2:target})$0' },
        { name: 'binary_search', prefix: 'bsearch', body: 'bool found = binary_search(${1:v}.begin(), ${1:v}.end(), ${2:target});$0' },
        { name: 'find', prefix: 'find', body: 'auto it = find(${1:v}.begin(), ${1:v}.end(), ${2:target});$0' },
        { name: 'reverse', prefix: 'rev', body: 'reverse(${1:v}.begin(), ${1:v}.end());$0' },
        { name: 'unique', prefix: 'uniq', body: 'sort(${1:v}.begin(), ${1:v}.end());\n${1:v}.erase(unique(${1:v}.begin(), ${1:v}.end()), ${1:v}.end());$0' },
        { name: 'next_permutation', prefix: 'nperm', body: 'next_permutation(${1:v}.begin(), ${1:v}.end());$0' },
        { name: 'min_max', prefix: 'mm', body: 'int ans = min(${1:a}, ${2:b});$0' },
        { name: 'swap', prefix: 'swp', body: 'swap(${1:a}, ${2:b});$0' },
        { name: 'count', prefix: 'cnt', body: 'int c = count(${1:v}.begin(), ${1:v}.end(), ${2:target});$0' },
        { name: 'accumulate', prefix: 'acc', body: 'int sum = accumulate(${1:v}.begin(), ${1:v}.end(), ${2:0});$0' },
        { name: 'func', prefix: 'func', body: '${1:void} ${2:funcName}(${3:params}) {\n    $0\n}' },
        { name: 'struct', prefix: 'struct', body: 'struct ${1:Name} {\n    $0\n};' },
        { name: 'struct_cmp', prefix: 'structcmp', body: 'struct ${1:Node} {\n    ${2:int} val;\n    bool operator<(const ${1:Node}& other) const {\n        return ${3:val < other.val};\n    }\n};$0' },
        { name: 'class', prefix: 'class', body: 'class ${1:ClassName} {\npublic:\n    $0\n};' },
        { name: 'template', prefix: 'tpl', body: 'template<typename ${1:T}>\n${2:void} ${3:funcName}(${1:T} ${4:arg}) {\n    $0\n}' },
        { name: 'lambda', prefix: 'lam', body: 'auto ${1:fn} = [](${2:int x}) {\n    $0\n};' },
        { name: 'constructor', prefix: 'ctor', body: '${1:ClassName}(${2:params}) : ${3:init_list} {\n    $0\n}' },
        { name: 'dfs', prefix: 'dfs', body: 'void dfs(int u) {\n    visited[u] = true;\n    for (int v : adj[u]) {\n        if (!visited[v]) dfs(v);\n    }\n}$0' },
        { name: 'bfs', prefix: 'bfs', body: 'void bfs(int start) {\n    queue<int> q;\n    q.push(start);\n    visited[start] = true;\n    while (!q.empty()) {\n        int u = q.front(); q.pop();\n        for (int v : adj[u]) {\n            if (!visited[v]) { visited[v] = true; q.push(v); }\n        }\n    }\n}$0' },
        { name: 'binary_search_manual', prefix: 'bsm', body: 'int lo = 0, hi = ${1:n} - 1, ans = -1;\nwhile (lo <= hi) {\n    int mid = (lo + hi) / 2;\n    if (${2:check(mid)}) { ans = mid; hi = mid - 1; }\n    else { lo = mid + 1; }\n}$0' },
        { name: 'dp', prefix: 'dp', body: 'vector<int> dp(${1:n} + 1, 0);\ndp[0] = ${2:0};\nfor (int i = 1; i <= ${1:n}; i++) {\n    dp[i] = ${3:/* transition */};\n}$0' },
        { name: 'dijkstra', prefix: 'dij', body: 'vector<int> dist(n, INT_MAX);\ndist[${1:start}] = 0;\npriority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> pq;\npq.push({0, ${1:start}});\nwhile (!pq.empty()) {\n    auto [d, u] = pq.top(); pq.pop();\n    if (d > dist[u]) continue;\n    for (auto [v, w] : adj[u]) {\n        if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; pq.push({dist[v], v}); }\n    }\n}$0' },
        { name: 'union_find', prefix: 'uf', body: 'vector<int> parent(${1:n}), rank_(${1:n}, 0);\niota(parent.begin(), parent.end(), 0);\nfunction<int(int)> find = [&](int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); };\nauto unite = [&](int x, int y) {\n    int rx = find(x), ry = find(y); if (rx == ry) return false;\n    if (rank_[rx] < rank_[ry]) swap(rx, ry); parent[ry] = rx;\n    if (rank_[rx] == rank_[ry]) rank_[rx]++; return true;\n};$0' },
        { name: 'topo_sort', prefix: 'topo', body: 'vector<int> order;\nqueue<int> q;\nfor (int i = 0; i < ${1:n}; i++) { if (indegree[i] == 0) q.push(i); }\nwhile (!q.empty()) {\n    int u = q.front(); q.pop(); order.push_back(u);\n    for (int v : adj[u]) { if (--indegree[v] == 0) q.push(v); }\n}\n$0' },
        { name: 'gcd', prefix: 'gcd', body: 'int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }$0' },
        { name: 'lcm', prefix: 'lcm', body: 'int lcm(int a, int b) { return a / gcd(a, b) * b; }$0' },
        { name: 'quick_pow', prefix: 'qpow', body: 'long long qpow(long long a, long long b, long long mod) {\n    long long res = 1;\n    while (b) { if (b & 1) res = res * a % mod; a = a * a % mod; b >>= 1; }\n    return res;\n}$0' },
        { name: 'head_all', prefix: 'head', body: '#include <bits/stdc++.h>\nusing namespace std;\n$0' },
        { name: 'head_comp', prefix: 'headc', body: '#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <map>\n#include <set>\n#include <queue>\n#include <stack>\n#include <cmath>\n#include <cstring>\n#include <functional>\nusing namespace std;\n$0' },
        { name: 'macro_all', prefix: 'mac', body: 'typedef long long ll;\ntypedef pair<int, int> pii;\n#define pb push_back\n#define mp make_pair\n#define fi first\n#define se second\n#define rep(i, a, n) for (int i = a; i < n; i++)\n#define per(i, a, n) for (int i = n - 1; i >= a; i--)\n$0' },
        { name: 'debug', prefix: 'dbg', body: '#ifdef LOCAL\n#define debug(x) cerr << #x << " = " << (x) << endl\n#else\n#define debug(x)\n#endif$0' },
        { name: 'string_split', prefix: 'ssplit', body: 'vector<string> split(const string& s, char delim) {\n    vector<string> tokens; stringstream ss(s); string token;\n    while (getline(ss, token, delim)) tokens.push_back(token);\n    return tokens;\n}$0' },
        { name: 'to_string', prefix: 'tstr', body: 'string s = to_string(${1:123});$0' },
        { name: 'stoi', prefix: 'stoi', body: 'int x = stoi(${1:"123"});$0' },
        { name: 'bit_count', prefix: 'bcount', body: 'int cnt = __builtin_popcount(${1:x});$0' },
        { name: 'bit_low', prefix: 'blow', body: 'int lowbit = ${1:x} & -${1:x};$0' },
        { name: 'is_prime', prefix: 'isprime', body: 'bool isPrime(int n) {\n    if (n < 2) return false;\n    for (int i = 2; i * i <= n; i++) { if (n % i == 0) return false; }\n    return true;\n}$0' },
        { name: 'sieve', prefix: 'sieve', body: 'vector<bool> isPrime(${1:n} + 1, true);\nisPrime[0] = isPrime[1] = false;\nfor (int i = 2; i * i <= ${1:n}; i++) {\n    if (isPrime[i]) { for (int j = i * i; j <= ${1:n}; j += i) isPrime[j] = false; }\n}$0' },
        { name: 'abs', prefix: 'abs', body: 'int val = abs(${1:x});$0' },
        { name: 'mod', prefix: 'mod', body: 'const int MOD = ${1:1e9 + 7};$0' },
        { name: 'memset', prefix: 'ms', body: 'memset(${1:arr}, ${2:0}, sizeof(${1:arr}));$0' },
        { name: 'fill', prefix: 'fill', body: 'fill(${1:v}.begin(), ${1:v}.end(), ${2:0});$0' },
        { name: 'max_element', prefix: 'maxe', body: 'int mx = *max_element(${1:v}.begin(), ${1:v}.end());$0' },
        { name: 'min_element', prefix: 'mine', body: 'int mn = *min_element(${1:v}.begin(), ${1:v}.end());$0' },
        { name: 'emplace_back', prefix: 'epb', body: '${1:v}.emplace_back(${2:args});$0' },
        { name: 'tie', prefix: 'tie', body: 'auto [${1:a}, ${2:b}] = ${3:p};$0' }
    ];

    // ============================================================
    // 【修复】未匹配括号检测 — 使用独立栈
    // 旧算法：单个栈，遇到闭合括号时从栈顶往下找匹配的开括号，
    //         把中间所有不匹配的开括号都标记为未匹配 → 错误！
    //         例如 "({)}" → 遇到 ) 时，栈=[{, (]，从栈顶找到 ( 配对，
    //         但中间的 { 也被标记为未匹配 → 错！实际上 { 和 } 是配对的！
    //
    // 新算法：每种括号类型各维护一个独立栈
    //         遇到 ) 只看 ( 栈，遇到 ] 只看 [ 栈，遇到 } 只看 { 栈
    //         这样不同类型的括号互不干扰
    // ============================================================
    function findUnmatchedBrackets(text) {
        const result = new Uint8Array(text.length);

        // 每种括号类型独立栈
        const stacks = {
            '(': [],  // round brackets
            '[': [],  // square brackets
            '{': []   // curly brackets
        };
        const matchMap = { ')': '(', ']': '[', '}': '{' };

        // 先扫描标记字符串和注释，跳过它们
        const inString = new Uint8Array(text.length);
        const inComment = new Uint8Array(text.length);

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            // 检测字符串
            if (ch === '"' || ch === "'") {
                const quote = ch;
                inString[i] = 1;
                i++;
                while (i < text.length) {
                    if (text[i] === '\\') { inString[i] = 1; i++; if (i < text.length) inString[i] = 1; i++; continue; }
                    if (text[i] === quote) { inString[i] = 1; break; }
                    inString[i] = 1;
                    i++;
                }
                continue;
            }
            // 检测单行注释
            if (ch === '/' && i + 1 < text.length && text[i + 1] === '/') {
                while (i < text.length && text[i] !== '\n') { inComment[i] = 1; i++; }
                i--;
                continue;
            }
            // 检测多行注释
            if (ch === '/' && i + 1 < text.length && text[i + 1] === '*') {
                inComment[i] = 1; i++; inComment[i] = 1; i++;
                while (i < text.length) {
                    if (text[i] === '*' && i + 1 < text.length && text[i + 1] === '/') {
                        inComment[i] = 1; i++; inComment[i] = 1; break;
                    }
                    inComment[i] = 1; i++;
                }
                continue;
            }
        }

        // 实际括号匹配
        for (let i = 0; i < text.length; i++) {
            if (inString[i] || inComment[i]) continue;
            const ch = text[i];

            if (ch === '(' || ch === '[' || ch === '{') {
                stacks[ch].push(i);
            }
            else if (ch === ')' || ch === ']' || ch === '}') {
                const openChar = matchMap[ch];
                const stack = stacks[openChar];
                if (stack.length > 0) {
                    stack.pop(); // 匹配成功，弹出
                } else {
                    result[i] = 1; // 没有匹配的开括号，标记为未匹配
                }
            }
        }

        // 栈中剩余的都是未匹配的开括号
        for (const key in stacks) {
            for (const idx of stacks[key]) {
                result[idx] = 1;
            }
        }

        return result;
    }

    function buildBracketHighlightHTML(text, unmatched) {
        let html = '';
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (unmatched[i]) {
                const escaped = ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '&' ? '&amp;' : ch;
                html += `<span class="unmatched">${escaped}</span>`;
            } else if (ch === '<') html += '&lt;';
            else if (ch === '>') html += '&gt;';
            else if (ch === '&') html += '&amp;';
            else html += ch;
        }
        return html;
    }
    // 获取文件的完整路径（从根目录到当前文件）
    function getFilePath(fileId) {
        const path = [];
        let currentId = fileId;
        let maxDepth = 20; // 防止循环
        while (currentId && maxDepth-- > 0) {
            const f = OS_DATA.files.find(function(x) { return x.id === currentId; });
            if (!f) break;
            path.unshift({ id: f.id, name: f.name, type: f.type });
            const parentId = getParentFolderId(currentId);
            currentId = parentId;
        }
        return path;
    }
    // ==================== 通用下载函数 ====================
    function downloadFile(fileId) {
        var file = OS_DATA.files.find(function(f) { return f.id === fileId; });
        if (!file) return;
        var blob, downloadName = file.name;

        if (file.type === 'txt' || file.type === 'cpp') {
            blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
        } else if (file.type === 'cmt') {
            blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
        }
        else if (file.type === 'md') {
            blob = new Blob([file.content], { type: "text/markdown;charset=utf-8" });
        }
        else if (file.type === 'exe') {
            var exeCode = file._sourceCode || (typeof file.content === 'string' && file.content.indexOf('__CMQ_EXE__') === 0 ? decodeURIComponent(escape(atob(file.content.split('CODE_BASE64:')[1]))) : '');
            if (exeCode) {
                openExeRunner(file.name, exeCode);
            } else {
                var exeBody = document.createElement('div');
                exeBody.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-secondary);font-size:14px;background:var(--win-bg);';
                exeBody.textContent = '⚠️ 此 exe 文件无法运行（缺少源代码数据）';
                bodyContainer.appendChild(exeBody);
            }
        } else if (file.type === 'docx') {
            var htmlContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>body{font-family:\'宋体\',SimSun,serif;font-size:14px;line-height:1.8;}</style></head><body>' + file.content + '</body></html>';
            blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" });
            downloadName = file.name.replace('.docx', '.doc');
        } else if (file.type === 'xlsx') {
            var matrix = Array.isArray(file.content) ? file.content : [];
            var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table border="1">';
            matrix.forEach(function(row) {
                html += '<tr>';
                (row || []).forEach(function(cell) {
                    html += '<td style="mso-number-format:\\@;">' + (cell || '') + '</td>';
                });
                html += '</tr>';
            });
            html += '</table></body></html>';
            blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
            downloadName = file.name.replace('.xlsx', '.xls');
        } else if (file.type === 'folder') {
                var zip = new SimpleZip();
                addFolderToZip(zip, file.id, file.name + '/');
                blob = zip.toBlob();
                var link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = file.name + '.zip';
                link.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;opacity:0;pointer-events:auto;';
                document.documentElement.appendChild(link);
                link.click();
                setTimeout(function() {
                    document.documentElement.removeChild(link);
                    URL.revokeObjectURL(link.href);
                }, 3000);
                return;
            }
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = downloadName;
        link.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;opacity:0;pointer-events:auto;';
        document.documentElement.appendChild(link);
        link.click();
        setTimeout(function() {
            document.documentElement.removeChild(link);
            URL.revokeObjectURL(link.href);
        }, 3000);
    }

    // 收集文件夹及其所有子文件数据（用于下载）
    function collectFolderData(folderId) {
        var folder = OS_DATA.files.find(function(f) { return f.id === folderId; });
        if (!folder) return null;
        var result = { id: folder.id, name: folder.name, type: folder.type, children: [] };
        if (folder.children && folder.children.length > 0) {
            folder.children.forEach(function(childId) {
                var child = OS_DATA.files.find(function(f) { return f.id === childId; });
                if (child) {
                    if (child.type === 'folder') {
                        result.children.push(collectFolderData(child.id));
                    } else {
                        result.children.push({ id: child.id, name: child.name, type: child.type, content: child.content });
                    }
                }
            });
        }
        return result;
    }
    // ========== SimpleZip：纯手写 ZIP 生成器，零依赖，支持文件夹和中文 ==========
    // ========== SimpleZip：纯手写 ZIP 生成器，零依赖，支持文件夹和中文 ==========
function SimpleZip() {
    this._entries = [];
}

SimpleZip.prototype.file = function(name, content) {
    var data;
    if (typeof content === 'string') {
        data = SimpleZip._utf8encode(content);
    } else if (content instanceof Uint8Array) {
        data = content;
    } else if (content != null) {
        data = SimpleZip._utf8encode(String(content));
    } else {
        data = new Uint8Array(0);
    }
    this._entries.push({ name: name, data: data, isDir: false });
};

SimpleZip.prototype.folder = function(name) {
    var dirName = name;
    if (dirName.charAt(dirName.length - 1) !== '/') dirName += '/';
    this._entries.push({ name: dirName, data: new Uint8Array(0), isDir: true });
};

SimpleZip.prototype.toBlob = function() {
    var parts = [];
    var offsets = [];
    var centralParts = [];
    var offset = 0;

    for (var i = 0; i < this._entries.length; i++) {
        var entry = this._entries[i];
        var nameBytes = SimpleZip._utf8encode(entry.name);
        var data = entry.data;
        var crc = entry.isDir ? 0 : SimpleZip._crc32(data);
        var size = data.length;
        var extAttr = entry.isDir ? 0x10 : 0x00;
        var gpFlags = 0x0800;

        offsets.push(offset);

        // Local file header
        var lh = new Uint8Array(30 + nameBytes.length);
        var lv = new DataView(lh.buffer);
        lv.setUint32(0, 0x04034b50, true);
        lv.setUint16(4, 0x14, true);
        lv.setUint16(6, gpFlags, true);
        lv.setUint16(8, 0x00, true); // ★ STORE = 0x00（之前写 0x08 是错的！）
        lv.setUint16(10, 0, true);
        lv.setUint16(12, 0, true);
        lv.setUint32(14, crc, true);
        lv.setUint32(18, size, true);
        lv.setUint32(22, size, true);
        lv.setUint16(26, nameBytes.length, true);
        lv.setUint16(28, 0, true);
        lh.set(nameBytes, 30);

        parts.push(lh);
        if (size > 0) parts.push(data);
        offset += 30 + nameBytes.length + size;

        // Central directory header
        var ch = new Uint8Array(46 + nameBytes.length);
        var cv = new DataView(ch.buffer);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 0x14, true);
        cv.setUint16(6, 0x14, true);
        cv.setUint16(8, gpFlags, true);
        cv.setUint16(10, 0x00, true); // ★ STORE = 0x00
        cv.setUint16(12, 0, true);
        cv.setUint16(14, 0, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, size, true);
        cv.setUint32(24, size, true);
        cv.setUint16(28, nameBytes.length, true);
        cv.setUint16(30, 0, true);
        cv.setUint16(32, 0, true);
        cv.setUint16(34, 0, true);
        cv.setUint16(36, 0, true);
        cv.setUint32(38, extAttr, true);
        cv.setUint32(42, offsets[i], true);
        ch.set(nameBytes, 46);

        centralParts.push(ch);
    }

    var centralOffset = offset;
    var centralSize = 0;
    for (var i = 0; i < centralParts.length; i++) centralSize += centralParts[i].length;

    var eocd = new Uint8Array(22);
    var ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, this._entries.length, true);
    ev.setUint16(10, this._entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, centralOffset, true);
    ev.setUint16(20, 0, true);

    parts = parts.concat(centralParts);
    parts.push(eocd);

    return new Blob(parts, { type: 'application/zip' });
};

SimpleZip._utf8encode = function(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c < 0x80) {
            bytes.push(c);
        } else if (c < 0x800) {
            bytes.push(0xC0 | (c >> 6));
            bytes.push(0x80 | (c & 0x3F));
        } else if (c >= 0xD800 && c <= 0xDBFF) {
            var hi = c;
            var lo = str.charCodeAt(++i);
            var cp = ((hi - 0xD800) << 10) + (lo - 0xDC00) + 0x10000;
            bytes.push(0xF0 | (cp >> 18));
            bytes.push(0x80 | ((cp >> 12) & 0x3F));
            bytes.push(0x80 | ((cp >> 6) & 0x3F));
            bytes.push(0x80 | (cp & 0x3F));
        } else {
            bytes.push(0xE0 | (c >> 12));
            bytes.push(0x80 | ((c >> 6) & 0x3F));
            bytes.push(0x80 | (c & 0x3F));
        }
    }
    return new Uint8Array(bytes);
};

SimpleZip._crc32 = function(data) {
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < data.length; i++) {
        crc = (crc >>> 8) ^ SimpleZip._crcTable[(crc ^ data[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
};

SimpleZip._crcTable = (function() {
    var table = [];
    for (var i = 0; i < 256; i++) {
        var c = i;
        for (var j = 0; j < 8; j++) {
            if (c & 1) c = 0xEDB88320 ^ (c >>> 1);
            else c = c >>> 1;
        }
        table.push(c >>> 0);
    }
    return table;
})();

// ★ 递归添加文件夹内容到 ZIP（之前脚本里缺失这个函数！）
function addFolderToZip(zip, folderId, basePath) {
    var folder = OS_DATA.files.find(function(f) { return f.id === folderId; });
    if (!folder || !folder.children) return;
    // 先创建当前文件夹目录条目
    zip.folder(basePath);
    folder.children.forEach(function(childId) {
        var child = OS_DATA.files.find(function(f) { return f.id === childId; });
        if (!child) return;
        if (child.type === 'folder') {
            addFolderToZip(zip, child.id, basePath + child.name + '/');
        } else {
            var content = child.content || '';
            if (typeof content !== 'string') {
                if (Array.isArray(content)) {
                    content = content.map(function(row) { return Array.isArray(row) ? row.join(',') : String(row); }).join('\n');
                } else {
                    try { content = JSON.stringify(content); } catch(e) { content = ''; }
                }
            }
            zip.file(basePath + child.name, content);
        }
    });
}
// ========== SimpleZip 结束 ==========
    function collectAllFilesForZip(parentId, basePath) {
        var result = [];
        var children;
        if (parentId === null) {
            children = OS_DATA.files.filter(function(f) {
                return !OS_DATA.files.some(function(p) {
                    return p.type === 'folder' && p.children && p.children.indexOf(f.id) !== -1;
                });
            });
        } else {
            var folder = OS_DATA.files.find(function(f) { return f.id === parentId; });
            if (!folder || !folder.children) return result;
            children = folder.children.map(function(cid) {
                return OS_DATA.files.find(function(f) { return f.id === cid; });
            }).filter(Boolean);
        }
        children.forEach(function(child) {
            if (child.type === 'folder') {
                result = result.concat(collectAllFilesForZip(child.id, basePath + child.name + '/'));
            } else {
                result.push({ name: basePath + child.name, content: child.content || '', type: child.type });
            }
        });
        return result;
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
                w.style.display = 'flex';
                const item = taskbarMinList.querySelector(`[data-win-id="${openWinId}"]`);
                if (item) item.remove();
            }
            w.style.zIndex = ++zIndexCounter;
            return;
        }

        const win = document.createElement('div');
        win.className = 'os-window';
        win.id = openWinId;
        win.style.zIndex = ++zIndexCounter;

        if (restoreState) {
            win.style.top = restoreState.top || '100px';
            win.style.left = restoreState.left || '300px';
            win.style.width = restoreState.width || '780px';
            win.style.height = restoreState.height || '580px';
        } else {
            const offset = (zIndexCounter % 8) * 20;
            win.style.top = `${80 + offset}px`;
            win.style.left = `${280 + offset}px`;
            win.style.width = '780px';
            win.style.height = '580px';
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

        win.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveSystemDataNow();
                const origTitle = win.querySelector('.os-window-header span');
                const origText = origTitle.textContent;
                origTitle.textContent = '✅ 已保存 - ' + origText;
                setTimeout(function() { origTitle.textContent = origText; }, 1200);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
                e.preventDefault();
                win.querySelector('.win-btn-close').click();
            }
        });

        desktop.appendChild(win);
        win.style.display = 'flex';
        const bodyContainer = win.querySelector('.os-window-body');

        // ==================== 文件夹类型 ====================
        if (file.type === 'folder') {
            const explorerDiv = document.createElement('div');
            explorerDiv.style.cssText = 'display:flex;flex-direction:column;height:100%;background:var(--settings-body-bg);';
            let currentFolderId = file.id;

            explorerDiv.innerHTML = '<div class="explorer-path-bar"></div><div class="explorer-content" style="flex:1;overflow-y:auto;padding:8px;"></div>';
            bodyContainer.appendChild(explorerDiv);

            const explorerContent = explorerDiv.querySelector('.explorer-content');
            const pathBar = explorerDiv.querySelector('.explorer-path-bar');

            // ===== 路径栏点击事件（只绑定一次） =====
            pathBar.addEventListener('click', function(e) {
                const seg = e.target.closest('.explorer-path-seg');
                const refreshBtn = e.target.closest('.explorer-refresh-btn');
                if (refreshBtn) { renderExplorer(); return; }
                if (!seg || seg.classList.contains('current')) return;
                const targetId = seg.getAttribute('data-path-id');
                if (targetId === 'root') {
                    currentFolderId = null;
                    renderExplorer();
                } else {
                    const targetFile = OS_DATA.files.find(function(f) { return f.id === targetId; });
                    if (!targetFile) return;
                    if (targetFile.type === 'folder') {
                        currentFolderId = targetFile.id;
                        renderExplorer();
                    } else {
                        openAppWindow(targetFile.id);
                    }
                }
            });

            // ===== explorerContent 的 dragover/drop 只绑定一次（在 renderExplorer 外面） =====
            explorerContent.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            explorerContent.addEventListener('drop', function(e) {
                if (e.target.closest('.explorer-item')) return; // 让文件项自己处理
                e.preventDefault();
                var dragFileId = e.dataTransfer.getData('text/os-file-id');
                if (!dragFileId) return;

                var dragFile = OS_DATA.files.find(function(f) { return f.id === dragFileId; });
                if (!dragFile) return;

                // ✅ 重新查找 navFile，不用闭包旧值
                var navFile = currentFolderId ? OS_DATA.files.find(function(f) { return f.id === currentFolderId; }) : null;
                if (!navFile) return;

                // 如果已经在当前文件夹中，不操作
                if (navFile.children && navFile.children.includes(dragFileId)) return;
                // 防止文件夹拖入自身子文件夹
                if (dragFile.type === 'folder' && isDescendant(dragFileId, navFile.id)) return;

                // 从原父文件夹移除
                var oldParentId = getParentFolderId(dragFileId);
                if (oldParentId) {
                    var oldParent = OS_DATA.files.find(function(f) { return f.id === oldParentId; });
                    if (oldParent && oldParent.children) {
                        oldParent.children = oldParent.children.filter(function(c) { return c !== dragFileId; });
                    }
                }
                // 添加到当前文件夹
                if (!navFile.children) navFile.children = [];
                navFile.children.push(dragFileId);
                saveSystemData();
                renderExplorer();
                renderSidebarFiles();
            });

            // ===== Ctrl+R 刷新 =====
            explorerDiv.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                    e.preventDefault();
                    e.stopPropagation();
                    renderExplorer();
                }
            });

            // ===== 弹框显示文件夹内容 =====
            function showFolderPopup(folder, folderName) {
                const existing = shadow.querySelector('.explorer-folder-popup');
                if (existing) existing.remove();

                const popup = document.createElement('div');
                popup.className = 'explorer-folder-popup';
                popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--win-bg);border:1px solid var(--win-border);border-radius:12px;padding:20px;min-width:320px;max-width:500px;max-height:400px;box-shadow:0 12px 40px rgba(0,0,0,0.5);z-index:9999999;pointer-events:auto;font-family:system-ui;overflow-y:auto;';

                let title = document.createElement('div');
                title.textContent = '📂 ' + folderName;
                title.style.cssText = 'font-size:16px;font-weight:bold;margin-bottom:12px;color:var(--text-primary);border-bottom:1px solid var(--win-border);padding-bottom:8px;';
                popup.appendChild(title);

                let items = [];
                if (folder === null) {
                    items = OS_DATA.files.filter(function(f) {
                        return !OS_DATA.files.some(function(p) {
                            return p.type === 'folder' && p.children && p.children.includes(f.id);
                        });
                    });
                } else {
                    if (folder.children && folder.children.length > 0) {
                        items = folder.children.map(function(cid) {
                            return OS_DATA.files.find(function(f) { return f.id === cid; });
                        }).filter(Boolean);
                    }
                }

                if (items.length === 0) {
                    let empty = document.createElement('div');
                    empty.textContent = '(空)';
                    empty.style.cssText = 'color:var(--text-secondary);font-size:13px;text-align:center;padding:20px;';
                    popup.appendChild(empty);
                } else {
                    items.forEach(function(item) {
                        let icon = '📄';
                        if (item.type === 'cpp') icon = '⚙️';
                        if (item.type === 'xlsx') icon = '📊';
                        if (item.type === 'docx') icon = '📘';
                        if (item.type === 'md') icon = '📝';
                        if (item.type === 'cmt') icon = '⌨️';
                        if (item.type === 'folder') icon = '📁';

                        let row = document.createElement('div');
                        row.style.cssText = 'padding:8px 10px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:10px;color:var(--text-primary);font-size:13px;transition:background 0.15s;';
                        row.innerHTML = '<span style="font-size:18px;">' + icon + '</span><span style="flex:1;">' + item.name + '</span><span style="font-size:11px;color:var(--text-secondary);">' + item.type.toUpperCase() + '</span>';
                        row.addEventListener('mouseenter', function() { this.style.background = 'rgba(255,255,255,0.1)'; });
                        row.addEventListener('mouseleave', function() { this.style.background = 'transparent'; });
                        row.addEventListener('click', function() { popup.remove(); overlay.remove(); openAppWindow(item.id); });
                        popup.appendChild(row);
                    });
                }

                let closeBtn = document.createElement('div');
                closeBtn.textContent = '✕ 关闭';
                closeBtn.style.cssText = 'margin-top:12px;text-align:center;padding:8px;border-radius:6px;cursor:pointer;font-size:12px;color:var(--text-secondary);border:1px solid var(--win-border);transition:background 0.15s;';
                closeBtn.addEventListener('mouseenter', function() { this.style.background = 'rgba(255,255,255,0.1)'; });
                closeBtn.addEventListener('mouseleave', function() { this.style.background = 'transparent'; });
                closeBtn.addEventListener('click', function() { popup.remove(); overlay.remove(); });
                popup.appendChild(closeBtn);

                const overlay = document.createElement('div');
                overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:9999998;pointer-events:auto;';
                overlay.addEventListener('click', function() { overlay.remove(); popup.remove(); });

                shadow.appendChild(overlay);
                shadow.appendChild(popup);

                let escHandler = function(e) {
                    if (e.key === 'Escape') {
                        popup.remove(); overlay.remove();
                        shadow.removeEventListener('keydown', escHandler, true);
                    }
                };
                shadow.addEventListener('keydown', escHandler, true);
            }

            // ===== 右键菜单工具 =====
            function showExplorerContextMenu(x, y, items) {
                const existing = shadow.querySelector('.explorer-ctx-menu');
                if (existing) existing.remove();
                const menu = document.createElement('div');
                menu.className = 'explorer-ctx-menu';
                menu.style.cssText = 'position:fixed;z-index:999999;background:var(--win-bg);border:1px solid var(--win-border);border-radius:8px;padding:4px 0;box-shadow:0 8px 24px rgba(0,0,0,0.3);min-width:180px;pointer-events:auto;';
                items.forEach(function(item) {
                    const row = document.createElement('div');
                    row.textContent = item.label;
                    row.style.cssText = 'padding:8px 16px;cursor:pointer;font-size:13px;color:var(--text-primary);transition:background 0.1s;';
                    row.addEventListener('mouseenter', function() { row.style.background = 'rgba(255,255,255,0.1)'; });
                    row.addEventListener('mouseleave', function() { row.style.background = 'transparent'; });
                    row.addEventListener('click', function() { menu.remove(); item.action(); });
                    menu.appendChild(row);
                });
                menu.style.left = x + 'px';
                menu.style.top = y + 'px';
                shadow.appendChild(menu);
                if (x + menu.offsetWidth > window.innerWidth) menu.style.left = (window.innerWidth - menu.offsetWidth - 4) + 'px';
                if (y + menu.offsetHeight > window.innerHeight) menu.style.top = (window.innerHeight - menu.offsetHeight - 4) + 'px';
                setTimeout(function() {
                    const closeHandler = function(e) {
                        if (!menu.contains(e.target)) {
                            menu.remove();
                            shadow.removeEventListener('click', closeHandler, true);
                            shadow.removeEventListener('contextmenu', closeHandler, true);
                        }
                    };
                    shadow.addEventListener('click', closeHandler, true);
                    shadow.addEventListener('contextmenu', closeHandler, true);
                }, 10);
            }

            // ===== 空白处右键菜单（只绑定一次） =====
            explorerContent.addEventListener('contextmenu', function(e) {
                if (e.target.closest('.explorer-item')) return;
                e.preventDefault();

                // ✅ 重新查找 navFile
                var navFile = currentFolderId ? OS_DATA.files.find(function(f) { return f.id === currentFolderId; }) : null;
                if (!navFile) return;

                showExplorerContextMenu(e.clientX, e.clientY, [
                    { label: '📄 新建文件', action: function() {
                        const name = prompt('文件名：', '新文件.txt');
                        if (!name || !name.trim()) return;
                        const ext = name.split('.').pop().toLowerCase();
                        let type = 'txt';
                        if (ext === 'cpp' || ext === 'c' || ext === 'h') type = 'cpp';
                        else if (ext === 'cmt') type = 'cmt';
                        else if (ext === 'md' || ext === 'markdown') type = 'md';
                        else if (ext === 'xlsx') type = 'xlsx';
                        else if (ext === 'docx') type = 'docx';
                        let content = '';
                        if (type === 'cpp') content = '#include <iostream>\nusing namespace std;\nint main() {\n\n return 0;}';
                        if (type === 'md') content = '# 标题\n\n正文内容...\n';
                        if (type === 'xlsx') content = [["","","",""]];
                        if (type === 'docx') content = '<div>请输入文档内容...</div>';
                        const newId = 'f_' + Date.now();
                        OS_DATA.files.push({ id: newId, name: name.trim(), type: type, content: content });
                        if (!navFile.children) navFile.children = [];
                        navFile.children.push(newId);
                        saveSystemData(); renderExplorer(); renderSidebarFiles(); openAppWindow(newId);
                    }},
                    { label: '📁 新建文件夹', action: function() {
                        const name = prompt('文件夹名：', '新文件夹');
                        if (!name || !name.trim()) return;
                        const newId = 'f_' + Date.now();
                        OS_DATA.files.push({ id: newId, name: name.trim(), type: 'folder', children: [] });
                        if (!navFile.children) navFile.children = [];
                        navFile.children.push(newId);
                        saveSystemData(); renderExplorer(); renderSidebarFiles();
                    }},
                    { label: '📤 上传文件到此文件夹', action: function() {
                        const input = document.createElement('input');
                        input.type = 'file'; input.multiple = true;
                        input.accept = '.txt,.md,.cpp,.c,.h,.xlsx,.docx,.json,.csv';
                        input.addEventListener('change', function() {
                            Array.from(input.files).forEach(function(f) {
                                const ext = f.name.split('.').pop().toLowerCase();
                                let type = 'txt';
                                if (ext === 'cpp' || ext === 'c' || ext === 'h') type = 'cpp';
                                else if (ext === 'cmt') type = 'cmt';
                                else if (ext === 'md' || ext === 'markdown') type = 'md';
                                else if (ext === 'xlsx') type = 'xlsx';
                                else if (ext === 'docx') type = 'docx';
                                const newId = 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                                const reader = new FileReader();
                                reader.onload = function(ev) {
                                    OS_DATA.files.push({ id: newId, name: f.name, type: type, content: ev.target.result || '' });
                                    if (!navFile.children) navFile.children = [];
                                    navFile.children.push(newId);
                                    saveSystemData(); renderExplorer(); renderSidebarFiles();
                                };
                                reader.readAsText(f);
                            });
                        });
                        input.click();
                    }},
                    { label: '📌 粘贴到当前文件夹', action: function() {
                        if (!_clipboard.action || _clipboard.ids.length === 0) {
                            alert('剪贴板为空！'); return;
                        }
                        const count = pasteFiles(navFile.id);
                        if (count > 0) {
                            alert('✅ 已粘贴 ' + count + ' 个项目到 ' + navFile.name);
                            renderExplorer();
                        }
                    }},
                    { label: '📋 复制文件', action: function() {
                        const name = prompt('要复制的文件名（从系统已有文件中选择）：');
                        if (!name || !name.trim()) return;
                        const srcFile = OS_DATA.files.find(function(f) { return f.name === name.trim() && f.type !== 'folder'; });
                        if (!srcFile) { alert('未找到名为 "' + name.trim() + '" 的文件'); return; }
                        _clipboard = { action: 'copy', ids: [srcFile.id] };
                        const count = pasteFiles(navFile.id);
                        if (count > 0) {
                            alert('✅ 已复制 ' + count + ' 个项目到 ' + navFile.name);
                            renderExplorer();
                        }
                    }}
                ]);
            });

            // ===== 核心：renderExplorer =====
            function renderExplorer() {
                var navFile = currentFolderId ? OS_DATA.files.find(function(f) { return f.id === currentFolderId; }) : null;
                if (!navFile) { currentFolderId = file.id; navFile = file; }
                var navChildren = navFile.children || [];

                // 更新路径栏
                var pathBarEl = explorerDiv.querySelector('.explorer-path-bar');
                if (pathBarEl) {
                    var pathSegments = getFilePath(currentFolderId);
                    var pathBarHTML = '<span class="explorer-path-seg" data-path-id="root">F://WORKSPACE EXPLORER</span>';
                    pathSegments.forEach(function(seg, idx) {
                        pathBarHTML += '<span class="explorer-path-sep">//</span>';
                        var isCurrent = (idx === pathSegments.length - 1);
                        pathBarHTML += '<span class="explorer-path-seg' + (isCurrent ? ' current' : '') + '" data-path-id="' + seg.id + '">' + seg.name + '</span>';
                    });
                    pathBarHTML += '<span class="explorer-refresh-btn" title="刷新 (Ctrl+R)">🔄</span>';
                    pathBarEl.innerHTML = pathBarHTML;
                }

                // 渲染内容
                let html = '';
                if (!navChildren || navChildren.length === 0) {
                    html = '<div style="color:var(--text-secondary);font-size:13px;padding:40px;text-align:center;">此文件夹为空<br><span style="font-size:11px;">右键点击空白处可新建或上传</span></div>';
                } else {
                    navChildren.forEach(function(childId) {
                        const child = OS_DATA.files.find(function(f) { return f.id === childId; });
                        if (!child) return;
                        if (child.type === 'folder') {
                            html += '<div class="explorer-item" data-child-id="' + child.id + '" data-is-folder="1" style="padding:8px 12px;margin:2px 4px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:10px;color:var(--text-primary);font-size:13px;transition:background 0.15s;">' +
                            '<span style="font-size:18px;">📁</span>' +
                            '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + child.name + '</span>' +
                            '<span style="font-size:11px;color:var(--text-secondary);">FOLDER</span>' +
                            '</div>';
                            return;
                        }
                        let icon = '📄';
                        if (child.type === 'cpp') icon = '⚙️';
                        if (child.type === 'xlsx') icon = '📊';
                        if (child.type === 'docx') icon = '📘';
                        if (child.type === 'md') icon = '📝';
                        if (child.type === 'cmt') icon = '⌨️';
                        html += '<div class="explorer-item" data-child-id="' + child.id + '" style="padding:8px 12px;margin:2px 4px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:10px;color:var(--text-primary);font-size:13px;transition:background 0.15s;">' +
                            '<span style="font-size:18px;">' + icon + '</span>' +
                            '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + child.name + '</span>' +
                            '<span style="font-size:11px;color:var(--text-secondary);">' + child.type.toUpperCase() + '</span>' +
                            '</div>';
                    });
                }
                explorerContent.innerHTML = html;

                // ✅ 逐项绑定事件（dragover/drop 只绑定在文件夹项上，不再绑定在 explorerContent 上）
                explorerContent.querySelectorAll('.explorer-item').forEach(function(item) {
                    item.draggable = true;
                    item.addEventListener('dragstart', function(e) {
                        e.dataTransfer.setData('text/os-file-id', item.getAttribute('data-child-id'));
                        e.dataTransfer.effectAllowed = 'move';
                        item.style.opacity = '0.4';
                    });
                    item.addEventListener('dragend', function() {
                        item.style.opacity = '1';
                        shadow.querySelectorAll('.folder-drop-target').forEach(function(el) {
                            el.classList.remove('folder-drop-target');
                        });
                    });
                    item.addEventListener('click', function(e) {
                        var childId = item.getAttribute('data-child-id');
                        var isFolder = item.getAttribute('data-is-folder');
                        if (isFolder) {
                            currentFolderId = childId;
                            renderExplorer();
                        } else if (childId) {
                            openAppWindow(childId);
                        }
                    });
                    item.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var childId = item.getAttribute('data-child-id');
    var childFile = OS_DATA.files.find(function(f) { return f.id === childId; });
    if (!childFile) return;

    var ctxNavFile = currentFolderId ? OS_DATA.files.find(function(f) { return f.id === currentFolderId; }) : null;
    if (!ctxNavFile) return;

    showExplorerContextMenu(e.clientX, e.clientY, [
        { label: '📂 打开', action: function() { openAppWindow(childId); } },
        { label: '💾 下载', action: function() { downloadFile(childId); } },
        { label: '✏️ 重命名', action: function() {
            var newName = prompt('重命名：', childFile.name);
            if (newName && newName.trim()) { childFile.name = newName.trim(); saveSystemData(); renderExplorer(); renderSidebarFiles(); }
        }},
        { label: '🗑️ 删除', action: function() {
            if (confirm('确定删除 [' + childFile.name + ']？文件将移入回收站。')) {
                var parentId = ctxNavFile ? ctxNavFile.id : null;
                moveToTrash(childId, parentId);
                renderExplorer(); renderSidebarFiles();
            }
        }},
        { label: '📤 从文件夹移除', action: function() {
            ctxNavFile.children = ctxNavFile.children.filter(function(c) { return c !== childId; });
            saveSystemData(); renderExplorer(); renderSidebarFiles();
        }},
        { label: '📋 复制', action: function() {
            _clipboard = { action: 'copy', ids: [childId] };
        }},
        { label: '📌 粘贴到当前文件夹', action: function() {
            if (!_clipboard.action || _clipboard.ids.length === 0) { alert('剪贴板为空！'); return; }
            var count = pasteFiles(ctxNavFile.id);
            if (count > 0) { alert('✅ 已粘贴 ' + count + ' 个项目'); renderExplorer(); }
        }}
    ]);
});

                    // 文件夹项作为拖拽目标
                    if (item.getAttribute('data-is-folder')) {
                        item.addEventListener('dragover', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = 'move';
                            item.classList.add('folder-drop-target');
                        });
                        item.addEventListener('dragleave', function(e) {
                            e.stopPropagation();
                            if (!item.contains(e.relatedTarget)) {
                                item.classList.remove('folder-drop-target');
                            }
                        });
                        item.addEventListener('drop', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            item.classList.remove('folder-drop-target');

                            var dragFileId = e.dataTransfer.getData('text/os-file-id');
                            if (!dragFileId) return;
                            var targetFolderId = item.getAttribute('data-child-id');
                            if (dragFileId === targetFolderId) return;

                            var dragFile = OS_DATA.files.find(function(f) { return f.id === dragFileId; });
                            var targetFolder = OS_DATA.files.find(function(f) { return f.id === targetFolderId; });
                            if (!dragFile || !targetFolder) return;

                            if (dragFile.type === 'folder' && isDescendant(dragFileId, targetFolderId)) return;
                            if (targetFolder.children && targetFolder.children.includes(dragFileId)) return;

                            var oldParentId = getParentFolderId(dragFileId);
                            if (oldParentId) {
                                var oldParent = OS_DATA.files.find(function(f) { return f.id === oldParentId; });
                                if (oldParent && oldParent.children) {
                                    oldParent.children = oldParent.children.filter(function(c) { return c !== dragFileId; });
                                }
                            }
                            if (!targetFolder.children) targetFolder.children = [];
                            targetFolder.children.push(dragFileId);
                            saveSystemData();
                            renderExplorer();
                            renderSidebarFiles();
                        });
                    }
                });
            }
            renderExplorer();
            explorerContent._renderExplorer = renderExplorer;
        }
        // ==================== CMT 类型 ====================
        else if (file.type === 'cmt') {
            const editorContainer = document.createElement('div');
            editorContainer.className = 'code-editor-container';
            editorContainer.innerHTML = `
                <div class="vscode-tabs-bar">
                    <div class="vscode-tab-item">⌨️ ${file.name}</div>
                    <div style="position: relative; display: flex; align-items: center; gap: 8px;">
                        <div class="vscode-run-btn" title="在 CMQ Terminal 中逐行运行">▶ 运行脚本</div>
                    </div>
                </div>
                <div class="code-editor-main-split" style="height: 55%;">
                    <div class="code-gutter"><div>1</div></div>
                    <div class="code-textarea-wrap">
                        <div class="bracket-highlight-layer"></div>
                        <textarea class="os-textarea" spellcheck="false"></textarea>
                    </div>
                </div>
                <div class="vscode-terminal-panel">
                    <div class="terminal-header"><div><span class="active">CMQ Terminal 输出</span></div><div style="color:#6a9955; font-size:10px;">逐行执行 .cmt 脚本</div></div>
                    <div class="terminal-main-layout">
                        <div class="terminal-body" style="color: var(--terminal-green);">CMQ Terminal 脚本运行器就绪。\n点击 ▶ 运行脚本 开始执行。\n\n💡 支持 @echo off 语法：不显示命令本身，只显示输出</div>
                        <div class="terminal-stdin-area" style="display:none;"><div class="stdin-title">标准输入 (Stdin Data)</div><textarea class="os-stdin-input" spellcheck="false" placeholder="在此输入数据..."></textarea></div>
                    </div>
                </div>
                <div class="vscode-status-bar"><div>🔀 ${file.name} • LF</div><div style="display:flex;gap:12px;"><span class="ln-col-pointer">Ln 1, Col 1</span><span>UTF-8</span><span>CMT</span></div></div>
            `;
            bodyContainer.appendChild(editorContainer);
            const textarea = editorContainer.querySelector('.os-textarea');
            const gutter = editorContainer.querySelector('.code-gutter');
            const bracketLayer = editorContainer.querySelector('.bracket-highlight-layer');
            const termBody = editorContainer.querySelector('.terminal-body');
            textarea.value = file.content;

            const updateGutter = () => {
                const totalLines = textarea.value.split('\n').length;
                const fontSize = parseFloat(window.getComputedStyle(textarea).fontSize) || 14;
                const lineHeight = fontSize * 1.5;
                const rowHeight = lineHeight + 'px';
                gutter.style.fontSize = fontSize + 'px';
                gutter.style.lineHeight = '1.5';
                let gutterHTML = '';
                for (let i = 1; i <= totalLines; i++) {
                    gutterHTML += '<div style="height:' + rowHeight + '">' + i + '</div>';
                }
                gutter.innerHTML = gutterHTML;
            };

            const updateBracketHighlight = () => {
                const text = textarea.value;
                const unmatched = findUnmatchedBrackets(text);
                let hasUnmatched = false;
                for (let i = 0; i < unmatched.length; i++) {
                    if (unmatched[i]) { hasUnmatched = true; break; }
                }
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

            textarea.addEventListener('input', () => {
                file.content = textarea.value;
                saveSystemData();
                updateGutter();
                updateBracketHighlight();
            });
            textarea.addEventListener('scroll', () => {
                gutter.scrollTop = textarea.scrollTop;
                bracketLayer.scrollTop = textarea.scrollTop;
                bracketLayer.scrollLeft = textarea.scrollLeft;
            });

            // ===== 括号自动补全 + 缩进（和 cpp 一样）=====
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
                if (e.key === 'Backspace') {
                    const openCloseMap = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
                    if (openCloseMap[charBefore] === charAfter) {
                        e.preventDefault();
                        this.value = val.substring(0, start - 1) + val.substring(start + 1);
                        this.selectionStart = this.selectionEnd = start - 1;
                        file.content = this.value; saveSystemData(); updateGutter(); updateBracketHighlight();
                        return;
                    }
                }
                const openCloseMap = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
                const closeChars = new Set([')', ']', '}']);
                if (closeChars.has(e.key) && charAfter === e.key) {
                    e.preventDefault();
                    this.selectionStart = this.selectionEnd = start + 1;
                    return;
                }
                if (e.key === '"' || e.key === "'") {
                    const quote = e.key;
                    e.preventDefault();
                    if (charAfter === quote) { this.selectionStart = this.selectionEnd = start + 1; return; }
                    let count = 0;
                    for (let i = 0; i < start; i++) { if (val[i] === quote && (i === 0 || val[i-1] !== '\\')) count++; }
                    if (count % 2 === 1) {
                        this.value = val.substring(0, start) + quote + val.substring(end);
                        this.selectionStart = this.selectionEnd = start + 1;
                    } else {
                        this.value = val.substring(0, start) + quote + quote + val.substring(end);
                        this.selectionStart = this.selectionEnd = start + 1;
                    }
                    file.content = this.value; saveSystemData(); updateGutter(); updateBracketHighlight();
                    return;
                }
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
            });

            // ===== 运行 CMT 脚本 =====
            editorContainer.querySelector('.vscode-run-btn').onclick = function() {
                var code = textarea.value;
                if (!code.trim()) {
                    termBody.innerHTML = '<span style="color:#ff5f56;">[错误] 脚本内容为空！</span>';
                    return;
                }

                var lines = code.split('\n');
                var echoOff = false;
                termBody.innerHTML = '';

                function printTerm(text, color) {
                    var line = document.createElement('div');
                    line.textContent = text;
                    if (color) line.style.color = color;
                    termBody.appendChild(line);
                    termBody.scrollTop = termBody.scrollHeight;
                }

                printTerm('[CMT] 开始执行脚本: ' + file.name, '#4ec9b0');
                printTerm('', '');

                function executeCmtLine(lineIndex) {
                    if (lineIndex >= lines.length) {
                        printTerm('', '');
                        printTerm('[CMT] 脚本执行完毕。', '#4ec9b0');
                        return;
                    }

                    var line = lines[lineIndex];
                    var trimmed = line.trim();

                    if (!trimmed) { executeCmtLine(lineIndex + 1); return; }
                    if (trimmed.toLowerCase().startsWith('rem ') || trimmed.toLowerCase() === 'rem') { executeCmtLine(lineIndex + 1); return; }
                    if (trimmed.toLowerCase() === '@echo off') { echoOff = true; executeCmtLine(lineIndex + 1); return; }
                    if (trimmed.toLowerCase() === '@echo on') { echoOff = false; executeCmtLine(lineIndex + 1); return; }
                    if (trimmed.toLowerCase().startsWith('echo ')) { printTerm(trimmed.substring(5)); executeCmtLine(lineIndex + 1); return; }
                    if (trimmed.toLowerCase() === 'echo') { printTerm('ECHO is on.'); executeCmtLine(lineIndex + 1); return; }
                    if (trimmed.toLowerCase().startsWith('@echo ')) { printTerm(trimmed.substring(6)); executeCmtLine(lineIndex + 1); return; }
                    if (trimmed.toLowerCase() === 'pause') { printTerm('Press any key to continue . . .', '#f9f1a5'); executeCmtLine(lineIndex + 1); return; }
                    if (trimmed.toLowerCase() === 'cls' || trimmed.toLowerCase() === 'clear') { termBody.innerHTML = ''; executeCmtLine(lineIndex + 1); return; }
                    if (trimmed.toLowerCase() === 'exit') { printTerm('', ''); printTerm('[CMT] 脚本被 exit 命令终止。', '#f9f1a5'); return; }
                    if (trimmed.toLowerCase().startsWith('goto ')) {
                        var label = trimmed.substring(5).trim();
                        for (var gi = 0; gi < lines.length; gi++) {
                            if (lines[gi].trim().toLowerCase() === ':' + label.toLowerCase()) { executeCmtLine(gi + 1); return; }
                        }
                        printTerm('Label not found: ' + label, '#ff6b6b'); executeCmtLine(lineIndex + 1); return;
                    }
                    if (trimmed.startsWith(':') && !trimmed.startsWith('::')) { executeCmtLine(lineIndex + 1); return; }
                    if (trimmed.startsWith('::')) { executeCmtLine(lineIndex + 1); return; }
                    if (trimmed.toLowerCase().startsWith('set ')) {
                        var setParts = trimmed.substring(4).split('=');
                        if (setParts.length >= 2) { cmtVars[setParts[0].trim()] = setParts.slice(1).join('=').trim(); }
                        executeCmtLine(lineIndex + 1); return;
                    }
                    if (trimmed.toLowerCase().startsWith('title ')) { printTerm('[CMT] Title: ' + trimmed.substring(6), '#888'); executeCmtLine(lineIndex + 1); return; }
                    if (trimmed.toLowerCase().startsWith('color ')) { printTerm('[CMT] Color set to: ' + trimmed.substring(6), '#888'); executeCmtLine(lineIndex + 1); return; }

                    if (!echoOff) { printTerm(getCmtPrompt() + ' > ' + trimmed, '#4ec9b0'); }

                    var resolvedCmd = trimmed;
                    for (var vk in cmtVars) { resolvedCmd = resolvedCmd.replace(new RegExp('%' + vk + '%', 'g'), cmtVars[vk]); }

                    executeCmtCommand(resolvedCmd, function() { executeCmtLine(lineIndex + 1); });
                }

                var cmtVars = {};
                function getCmtPrompt() { return 'Desktop'; }

                function executeCmtCommand(cmd, callback) {
                    var parts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
                    var c = parts[0] ? parts[0].toLowerCase() : '';
                    var a1 = parts[1] ? parts[1].replace(/"/g, '') : '';

                    switch (c) {
                        case 'ver': printTerm('CMQ Terminal [Version 2026.8.2]'); break;
                        case 'date': printTerm('The current date is: ' + new Date().toLocaleDateString()); break;
                        case 'time': printTerm('The current time is: ' + new Date().toLocaleTimeString()); break;
                        case 'whoami': printTerm('cmq\\cmq'); break;
                        case 'hostname': printTerm('CMQ-PC'); break;
                        case 'dir': case 'ls':
                            printTerm(' Directory of Desktop', '#4ec9b0');
                            var items = OS_DATA.files.filter(function(f) { return !OS_DATA.files.some(function(p) { return p.type === 'folder' && p.children && p.children.includes(f.id); }); });
                            items.forEach(function(item) {
                                if (item.type === 'folder') { printTerm('  <DIR>    ' + item.name, '#61d6d6'); }
                                else { var sz = (typeof item.content === 'string') ? item.content.length : 64; printTerm('  ' + sz + ' B  ' + item.name); }
                            });
                            break;
                        case 'help': case '?': printTerm('CMT Script 支持: echo, set, goto, rem, pause, cls, ver, date, time, dir, whoami, hostname, start, type, del, touch, mkdir, @echo off/on'); break;
                        case 'start':
                            if (a1) { var t = OS_DATA.files.find(function(f) { return f.name === a1; }); if (t) { openAppWindow(t.id); printTerm('Opened: ' + a1, '#4ec9b0'); } else printTerm('File not found: ' + a1, '#ff6b6b'); }
                            break;
                        case 'type': case 'cat':
                            if (a1) { var t = OS_DATA.files.find(function(f) { return f.name === a1 && f.type !== 'folder'; }); if (t) printTerm(typeof t.content === 'string' ? t.content : JSON.stringify(t.content)); else printTerm('File not found: ' + a1, '#ff6b6b'); }
                            break;
                        case 'touch':
                            if (a1) { var ext = a1.split('.').pop().toLowerCase(); var type = 'txt'; if (ext === 'cpp' || ext === 'c' || ext === 'h') type = 'cpp'; else if (ext === 'cmt') type = 'cmt'; else if (ext === 'md') type = 'md'; var newId = 'f_' + Date.now(); OS_DATA.files.push({ id: newId, name: a1, type: type, content: '' }); saveSystemData(); renderSidebarFiles(); printTerm('Created: ' + a1, '#4ec9b0'); }
                            break;
                        case 'del': case 'rm':
                            if (a1) { var t = OS_DATA.files.find(function(f) { return f.name === a1; }); if (t) { OS_DATA.files = OS_DATA.files.filter(function(f) { return f.id !== t.id; }); saveSystemData(); renderSidebarFiles(); printTerm('Deleted: ' + a1, '#ff6b6b'); } else printTerm('File not found: ' + a1, '#ff6b6b'); }
                            break;
                        case 'mkdir':
                            if (a1) { var newId = 'f_' + Date.now(); OS_DATA.files.push({ id: newId, name: a1, type: 'folder', children: [] }); saveSystemData(); renderSidebarFiles(); printTerm('Directory created: ' + a1, '#4ec9b0'); }
                            break;
                        case 'g++': case 'gcc': printTerm('[CMT] g++ 编译需要异步操作，请使用 CMQ Terminal 直接编译', '#f9f1a5'); break;
                        default: printTerm("'" + c + "' is not recognized as a CMT command.", '#ff6b6b'); break;
                    }
                    callback();
                }

                executeCmtLine(0);
            };

            // ===== 行列显示 =====
            const lnColPointer = editorContainer.querySelector('.ln-col-pointer');
            const trackLnCol = () => {
                const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
                const lines = textBeforeCursor.split('\n');
                lnColPointer.innerText = 'Ln ' + lines.length + ', Col ' + (lines[lines.length - 1].length + 1);
            };
            textarea.addEventListener('keyup', trackLnCol);
            textarea.addEventListener('click', trackLnCol);

            // F5 快捷键运行
            textarea.addEventListener('keydown', function(e) {
                if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'r' || e.key === 'R'))) {
                    e.preventDefault();
                    const runBtn = editorContainer.querySelector('.vscode-run-btn');
                    if (runBtn) runBtn.click();
                }
            });

            updateGutter();
            updateBracketHighlight();
            bindCtrlWheelZoom(textarea, gutter, updateGutter);
        }
        // ==================== Markdown 类型 ====================
        else if (file.type === 'md') {
            const mdContainer = document.createElement('div');
            mdContainer.className = 'md-preview-container';
            mdContainer.innerHTML = `
                <div class="md-toolbar">
                    <div style="display:flex;gap:4px;">
                        <div class="md-toolbar-btn active" id="md-split-btn">分屏预览</div>
                        <div class="md-toolbar-btn" id="md-edit-btn">仅编辑</div>
                        <div class="md-toolbar-btn" id="md-preview-btn">仅预览</div>
                    </div>
                    <span style="color:var(--text-secondary);">Markdown</span>
                </div>
                <div class="md-split-view" id="md-split-view">
                    <div class="md-editor-pane" id="md-editor-pane">
                        <textarea class="os-textarea" spellcheck="false" id="md-textarea" style="height:100%;"></textarea>
                    </div>
                    <div class="md-preview-pane" id="md-preview-pane"></div>
                </div>
            `;
            bodyContainer.appendChild(mdContainer);
            const mdTextarea = mdContainer.querySelector('#md-textarea');
            const mdPreview = mdContainer.querySelector('#md-preview-pane');
            const mdEditorPane = mdContainer.querySelector('#md-editor-pane');
            mdTextarea.value = file.content;
            const updateMdPreview = () => { mdPreview.innerHTML = renderMarkdown(mdTextarea.value); };
            mdTextarea.addEventListener('input', () => { file.content = mdTextarea.value; saveSystemData(); updateMdPreview(); });
            updateMdPreview();
            mdContainer.querySelector('#md-split-btn').addEventListener('click', (e) => { mdContainer.querySelectorAll('.md-toolbar-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); mdEditorPane.style.display = 'flex'; mdPreview.style.display = 'block'; mdEditorPane.style.flex = '1'; mdPreview.style.flex = '1'; });
            mdContainer.querySelector('#md-edit-btn').addEventListener('click', (e) => { mdContainer.querySelectorAll('.md-toolbar-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); mdEditorPane.style.display = 'flex'; mdPreview.style.display = 'none'; mdEditorPane.style.flex = '1'; });
            mdContainer.querySelector('#md-preview-btn').addEventListener('click', (e) => { mdContainer.querySelectorAll('.md-toolbar-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); mdEditorPane.style.display = 'none'; mdPreview.style.display = 'block'; mdPreview.style.flex = '1'; });
            bindCtrlWheelZoom(mdTextarea);
        }
        // ==================== 文本/代码类型 ====================
        else if (file.type === 'txt' || file.type === 'cpp') {
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
                ${isCpp ? `<div class="vscode-terminal-panel">
                    <div class="terminal-header"><div><span class="active">控制台输出 (Stdout / Stderr)</span></div><div style="color:#6a9955; font-size:10px;">由高可用加速专用编译沙盒驱动</div></div>
                    <div class="terminal-main-layout">
                        <div class="terminal-body">GNU C++ Compiler 就绪。\n期待您的代码运行指令...\n\n💡 提示：如果程序包含 cin/scanf 输入，请先在右侧注入测试数据！</div>
                        <div class="terminal-stdin-area"><div class="stdin-title">标准输入 (Stdin Data)</div><textarea class="os-stdin-input" spellcheck="false" placeholder="👉 在此填写多行测试输入数据..."></textarea></div>
                    </div>
                </div>` : ''}
                <div class="vscode-status-bar"><div>🔀 main* • LF</div><div style="display:flex;gap:12px;"><span class="ln-col-pointer">Ln 1, Col 1</span><span>UTF-8</span><span>${file.type.toUpperCase()}</span></div></div>
            `;
            bodyContainer.appendChild(editorContainer);
            const textarea = editorContainer.querySelector('.os-textarea');
            const gutter = editorContainer.querySelector('.code-gutter');
            const bracketLayer = editorContainer.querySelector('.bracket-highlight-layer');
            textarea.value = file.content;

            const updateGutter = () => { const totalLines = textarea.value.split('\n').length; const fontSize = parseFloat(window.getComputedStyle(textarea).fontSize) || 14; const lineHeight = fontSize * 1.5; const rowHeight = lineHeight + 'px'; gutter.style.fontSize = fontSize + 'px'; gutter.style.lineHeight = '1.5'; let gutterHTML = ''; for (let i = 1; i <= totalLines; i++) { gutterHTML += `<div style="height:${rowHeight}">${i}</div>`; } gutter.innerHTML = gutterHTML; };
            const updateBracketHighlight = () => { if (!isCpp) { bracketLayer.innerHTML = ''; return; } const text = textarea.value; const unmatched = findUnmatchedBrackets(text); let hasUnmatched = false; for (let i = 0; i < unmatched.length; i++) { if (unmatched[i]) { hasUnmatched = true; break; } } if (hasUnmatched) { bracketLayer.innerHTML = buildBracketHighlightHTML(text, unmatched); bracketLayer.style.fontSize = window.getComputedStyle(textarea).fontSize; bracketLayer.style.paddingTop = window.getComputedStyle(textarea).paddingTop; bracketLayer.scrollTop = textarea.scrollTop; bracketLayer.scrollLeft = textarea.scrollLeft; } else { bracketLayer.innerHTML = ''; } };

            textarea.addEventListener('input', () => { file.content = textarea.value; saveSystemData(); updateGutter(); updateBracketHighlight(); });
            textarea.addEventListener('scroll', () => { gutter.scrollTop = textarea.scrollTop; bracketLayer.scrollTop = textarea.scrollTop; bracketLayer.scrollLeft = textarea.scrollLeft; });

            textarea.addEventListener('keydown', function(e) {
                const start = this.selectionStart; const end = this.selectionEnd; const val = this.value; const charBefore = val.charAt(start - 1); const charAfter = val.charAt(start);
                if (e.key === 'Tab') { e.preventDefault(); this.value = val.substring(0, start) + "    " + val.substring(end); this.selectionStart = this.selectionEnd = start + 4; file.content = this.value; saveSystemData(); updateGutter(); updateBracketHighlight(); return; }
                if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'r' || e.key === 'R'))) { e.preventDefault(); if (isCpp) { const runBtn = editorContainer.querySelector('.vscode-run-btn'); if (runBtn) runBtn.click(); } }
                if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); const lineStart = val.lastIndexOf('\n', start - 1) + 1; const lineEnd = val.indexOf('\n', start); const currentLine = val.substring(lineStart, lineEnd === -1 ? val.length : lineEnd); this.value = val.substring(0, lineEnd === -1 ? val.length : lineEnd) + '\n' + currentLine + val.substring(lineEnd === -1 ? val.length : lineEnd); this.selectionStart = this.selectionEnd = start + currentLine.length + 1; file.content = this.value; saveSystemData(); updateGutter(); updateBracketHighlight(); return; }
                if (e.key === 'Backspace' && isCpp) { const openCloseMap = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" }; if (openCloseMap[charBefore] === charAfter) { e.preventDefault(); this.value = val.substring(0, start - 1) + val.substring(start + 1); this.selectionStart = this.selectionEnd = start - 1; file.content = this.value; saveSystemData(); updateGutter(); updateBracketHighlight(); return; } }
                if (e.key === 'Enter') { e.preventDefault(); const linesBefore = val.substring(0, start).split('\n'); const currentLine = linesBefore[linesBefore.length - 1]; const baseIndentMatch = currentLine.match(/^(\s*)/); const baseIndent = baseIndentMatch ? baseIndentMatch[0] : ''; if (charBefore === '{' && charAfter === '}') { const innerIndent = baseIndent + "    "; this.value = val.substring(0, start) + "\n" + innerIndent + "\n" + baseIndent + val.substring(end); this.selectionStart = this.selectionEnd = start + 1 + innerIndent.length; } else if (charBefore === '{') { const innerIndent = baseIndent + "    "; this.value = val.substring(0, start) + "\n" + innerIndent + val.substring(end); this.selectionStart = this.selectionEnd = start + 1 + innerIndent.length; } else if (charAfter === '}') { const dedented = baseIndent.length >= 4 ? baseIndent.substring(0, baseIndent.length - 4) : ''; this.value = val.substring(0, start) + "\n" + dedented + val.substring(end); this.selectionStart = this.selectionEnd = start + 1 + dedented.length; } else { this.value = val.substring(0, start) + "\n" + baseIndent + val.substring(end); this.selectionStart = this.selectionEnd = start + 1 + baseIndent.length; } file.content = this.value; saveSystemData(); updateGutter(); updateBracketHighlight(); return; }
                if (isCpp) {
                    const openCloseMap = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
                    const closeChars = new Set([')', ']', '}']);
                    if (closeChars.has(e.key) && charAfter === e.key) { e.preventDefault(); this.selectionStart = this.selectionEnd = start + 1; return; }
                    if (e.key === '"' || e.key === "'") {
                        const quote = e.key; e.preventDefault();
                        if (charAfter === quote) { this.selectionStart = this.selectionEnd = start + 1; return; }
                        let count = 0; for (let i = 0; i < start; i++) { if (val[i] === quote && (i === 0 || val[i-1] !== '\\')) count++; }
                        if (count % 2 === 1) { this.value = val.substring(0, start) + quote + val.substring(end); this.selectionStart = this.selectionEnd = start + 1; }
                        else { this.value = val.substring(0, start) + quote + quote + val.substring(end); this.selectionStart = this.selectionEnd = start + 1; }
                        file.content = this.value; saveSystemData(); updateGutter(); updateBracketHighlight(); return;
                    }
                    if (openCloseMap[e.key] && e.key !== '"' && e.key !== "'") {
                        e.preventDefault(); const closeChar = openCloseMap[e.key];
                        if (charAfter === closeChar) { this.value = val.substring(0, start) + e.key + val.substring(end); this.selectionStart = this.selectionEnd = start + 1; }
                        else { this.value = val.substring(0, start) + e.key + closeChar + val.substring(end); this.selectionStart = this.selectionEnd = start + 1; }
                        file.content = this.value; saveSystemData(); updateGutter(); updateBracketHighlight(); return;
                    }
                }
            });

            if (isCpp) {
                const termBody = editorContainer.querySelector('.terminal-body');
                const stdinInput = editorContainer.querySelector('.os-stdin-input');
                editorContainer.querySelector('.vscode-run-btn').onclick = () => {
                    termBody.innerHTML = `[编译任务] 正在连接高可用备用节点...\n`;
                    if (typeof GM_xmlhttpRequest === 'undefined') { termBody.innerHTML = `<span style="color:#ff5f56;">[致命错误] 未检测到跨域通信组件！</span>`; return; }
                    GM_xmlhttpRequest({
                        method: "POST", url: "https://ce.judge0.com/submissions?wait=true",
                        headers: { "Content-Type": "application/json", "Accept": "application/json" },
                        data: JSON.stringify({ source_code: textarea.value, language_id: 54, stdin: stdinInput.value }),
                        onload: function(response) { try { const res = JSON.parse(response.responseText); termBody.innerHTML = `[计算集群] 代码安全沙盒执行完毕：\n------------------------------------\n`; if (res.compile_output) termBody.innerHTML += `<span style="color: #ff5f56; font-weight:bold;">[GCC 语法错误]\n${res.compile_output}</span>\n`; if (res.stdout) termBody.innerHTML += res.stdout; if (res.stderr) termBody.innerHTML += `<span style="color: #ffaa00;">[运行时断言/异常]\n${res.stderr}</span>\n`; if (!res.stdout && !res.stderr && !res.compile_output) termBody.innerHTML += `(程序安全退出，回执状态: ${res.status ? res.status.description : 'Success'})`; } catch(e) { termBody.innerHTML = `<span style="color:#ff5f56;">[解析失败] ${e.message}</span>\n${response.responseText}`; } },
                        onerror: function() { termBody.innerHTML = `<span style="color:#ff5f56;">[连接失败]</span>`; }
                    });
                };
                const snippetBtn = editorContainer.querySelector('.vscode-snippet-btn');
                const snippetDropdown = document.createElement('div'); snippetDropdown.className = 'snippet-dropdown';
                let snippetHTML = ''; CPP_SNIPPETS.forEach((s, idx) => { snippetHTML += `<div class="snippet-item" data-snippet-idx="${idx}"><span class="snippet-name">${s.name}</span><span class="snippet-prefix">${s.prefix}</span></div>`; });
                snippetDropdown.innerHTML = snippetHTML;
                const snippetSearch = document.createElement('input');
                snippetSearch.type = 'text'; snippetSearch.placeholder = '搜索片段...';
                snippetSearch.style.cssText = 'width:100%;padding:6px 8px;border:none;border-bottom:1px solid #444;background:#1e1e1e;color:#ccc;font-size:12px;outline:none;box-sizing:border-box;';
                snippetDropdown.insertBefore(snippetSearch, snippetDropdown.firstChild);
                snippetSearch.addEventListener('input', function() {
                    const keyword = this.value.toLowerCase();
                    snippetDropdown.querySelectorAll('.snippet-item').forEach(function(item) {
                        const name = item.querySelector('.snippet-name').textContent.toLowerCase();
                        const prefix = item.querySelector('.snippet-prefix').textContent.toLowerCase();
                        item.style.display = (name.includes(keyword) || prefix.includes(keyword)) ? 'flex' : 'none';
                    });
                });
                snippetBtn.addEventListener('click', function() { setTimeout(function() { snippetSearch.focus(); }, 50); });
                snippetBtn.parentElement.appendChild(snippetDropdown);
                snippetBtn.addEventListener('click', (e) => { e.stopPropagation(); snippetDropdown.classList.toggle('show'); });
                snippetDropdown.querySelectorAll('.snippet-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.stopPropagation(); const idx = parseInt(item.getAttribute('data-snippet-idx')); const snippet = CPP_SNIPPETS[idx]; if (!snippet) return;
                        let body = snippet.body, rawCursorPos = -1, processed = '', i = 0;
                        while (i < body.length) { if (body[i] === '$') { if (body[i+1] === '0') { rawCursorPos = processed.length; i += 2; continue; } else if (body[i+1] === '{') { const closeIdx = body.indexOf('}', i); if (closeIdx >= 0) { const colonIdx = body.indexOf(':', i); if (colonIdx >= 0 && colonIdx < closeIdx) processed += body.substring(colonIdx+1, closeIdx); i = closeIdx+1; continue; } } else if (/\d/.test(body[i+1])) { i += 2; continue; } } processed += body[i]; i++; }
                        const insertText = processed; const cursorOffset = rawCursorPos >= 0 ? rawCursorPos : insertText.length;
                        const start = textarea.selectionStart; const val = textarea.value;
                        const lineStart = val.lastIndexOf('\n', start - 1) + 1; const needsNewline = val.substring(lineStart, start).trim().length > 0;
                        const finalText = needsNewline ? '\n' + insertText : insertText; const finalCursorOffset = (needsNewline ? 1 : 0) + cursorOffset;
                        textarea.value = val.substring(0, start) + finalText + val.substring(textarea.selectionEnd);
                        textarea.selectionStart = textarea.selectionEnd = start + finalCursorOffset; textarea.focus();
                        file.content = textarea.value; saveSystemData(); updateGutter(); updateBracketHighlight(); snippetDropdown.classList.remove('show');
                    });
                });
                document.addEventListener('click', (e) => { if (!snippetBtn.contains(e.target) && !snippetDropdown.contains(e.target)) snippetDropdown.classList.remove('show'); });
            }
            const lnColPointer = editorContainer.querySelector('.ln-col-pointer');
            const trackLnCol = () => { const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart); const lines = textBeforeCursor.split('\n'); lnColPointer.innerText = `Ln ${lines.length}, Col ${lines[lines.length - 1].length + 1}`; };
            textarea.addEventListener('keyup', trackLnCol); textarea.addEventListener('click', trackLnCol);
            updateGutter(); updateBracketHighlight(); bindCtrlWheelZoom(textarea, gutter, updateGutter);
        }
        // ==================== Word 类型 ====================
        else if (file.type === 'docx') {
            const wordUI = document.createElement('div'); wordUI.className = 'word-container';
            wordUI.innerHTML = `<div class="word-ribbon"><span style="font-weight:bold; cursor:pointer;" onclick="document.execCommand('bold')">B 加粗</span><span style="font-style:italic; cursor:pointer;" onclick="document.execCommand('italic')">I 斜体</span><span style="text-decoration:underline; cursor:pointer;" onclick="document.execCommand('underline')">U 下划线</span></div><div class="word-page-viewport"><div class="word-page" contenteditable="true">${file.content}</div></div>`;
            bodyContainer.appendChild(wordUI);
            const pageEl = wordUI.querySelector('.word-page');
            pageEl.addEventListener('input', () => { file.content = pageEl.innerHTML; saveSystemData(); });
            bindCtrlWheelZoom(pageEl);
        }
        // ==================== Excel 类型 ====================
        else if (file.type === 'xlsx') {
            const excelUI = document.createElement('div'); excelUI.className = 'excel-container';
            let matrix = Array.isArray(file.content) ? file.content : [["","",""]];
            let tableHTML = `<table class="excel-table"><tr><th style="width:40px;"></th><th>A</th><th>B</th><th>C</th><th>D</th></tr>`;
            for (let r = 0; r < 20; r++) { tableHTML += `<tr><th style="font-weight:bold;">${r+1}</th>`; for (let c = 0; c < 4; c++) { let val = (matrix[r] && matrix[r][c]) ? matrix[r][c] : ""; tableHTML += `<td contenteditable="true" data-row="${r}" data-col="${c}">${val}</td>`; } tableHTML += `</tr>`; }
            tableHTML += `</table>`;
            excelUI.innerHTML = `<div class="excel-ribbon"><span style="cursor:pointer;padding:0 8px;" id="excel-add-row">+行</span><span style="cursor:pointer;padding:0 8px;" id="excel-add-col">+列</span><span style="cursor:pointer;padding:0 8px;" id="excel-del-row">-行</span><span style="cursor:pointer;padding:0 8px;" id="excel-del-col">-列</span></div><div class="excel-formula-bar"><span style="font-weight:bold;color:#107c41;">fx</span><input type="text" class="excel-formula-input" id="f-bar-input" placeholder="单元格编辑..."></div><div class="excel-grid-viewport">${tableHTML}</div>`;
            bodyContainer.appendChild(excelUI);
            const gridViewport = excelUI.querySelector('.excel-grid-viewport'); const fInput = excelUI.querySelector('#f-bar-input'); let activeCell = null;
            gridViewport.addEventListener('focusin', (e) => { if (e.target.tagName === 'TD') { if (activeCell) activeCell.classList.remove('selected-cell'); activeCell = e.target; activeCell.classList.add('selected-cell'); fInput.value = activeCell.innerText; } });
            gridViewport.addEventListener('input', (e) => { if (e.target.tagName === 'TD') { const r = parseInt(e.target.getAttribute('data-row')); const c = parseInt(e.target.getAttribute('data-col')); fInput.value = e.target.innerText; if (!matrix[r]) matrix[r] = []; matrix[r][c] = e.target.innerText; file.content = matrix; saveSystemData(); } });
            fInput.addEventListener('input', () => { if (activeCell) { activeCell.innerText = fInput.value; const r = parseInt(activeCell.getAttribute('data-row')); const c = parseInt(activeCell.getAttribute('data-col')); if (!matrix[r]) matrix[r] = []; matrix[r][c] = fInput.value; file.content = matrix; saveSystemData(); } });
            excelUI.querySelector('#excel-add-row').addEventListener('click', function() {
                const rowCount = gridViewport.querySelectorAll('tr').length - 1;
                const colCount = gridViewport.querySelector('tr:first-child').querySelectorAll('th').length - 1;
                if (!matrix[rowCount]) matrix[rowCount] = [];
                for (let c = 0; c < colCount; c++) matrix[rowCount][c] = matrix[rowCount][c] || '';
                file.content = matrix; saveSystemData();
                const lastRow = gridViewport.querySelector('table').insertRow(-1);
                lastRow.innerHTML = '<th style="font-weight:bold;">' + (rowCount + 1) + '</th>';
                for (let c = 0; c < colCount; c++) { const td = lastRow.insertCell(-1); td.contentEditable = 'true'; td.setAttribute('data-row', rowCount); td.setAttribute('data-col', c); td.textContent = matrix[rowCount][c] || ''; }
            });
            excelUI.querySelector('#excel-add-col').addEventListener('click', function() {
                const headerRow = gridViewport.querySelector('table tr:first-child');
                const colCount = headerRow.querySelectorAll('th').length;
                const th = document.createElement('th'); th.textContent = String.fromCharCode(64 + colCount);
                headerRow.appendChild(th);
                gridViewport.querySelectorAll('table tr').forEach(function(tr, idx) {
                    if (idx === 0) return;
                    const r = idx - 1; const td = document.createElement('td');
                    td.contentEditable = 'true'; td.setAttribute('data-row', r); td.setAttribute('data-col', colCount - 1);
                    td.textContent = ''; if (!matrix[r]) matrix[r] = []; matrix[r][colCount - 1] = '';
                    tr.appendChild(td);
                });
                file.content = matrix; saveSystemData();
            });
            bindCtrlWheelZoom(gridViewport);
        }

        // ==================== 保存按钮 ====================
        win.querySelector('.win-btn-save').onclick = (e) => {
            e.stopPropagation(); let blob, downloadName = file.name;
            if (file.type === 'txt' || file.type === 'cpp' || file.type === 'cmt') { blob = new Blob([file.content], { type: "text/plain;charset=utf-8" }); }
            else if (file.type === 'md') { blob = new Blob([file.content], { type: "text/markdown;charset=utf-8" }); }
            else if (file.type === 'docx') { const htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>body{font-family:'宋体',SimSun,serif;font-size:14px;line-height:1.8;}</style></head><body>${file.content}</body></html>`; blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" }); downloadName = file.name.replace('.docx', '.doc'); }
            else if (file.type === 'xlsx') { let matrix = Array.isArray(file.content) ? file.content : []; let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table border="1">`; matrix.forEach(row => { html += '<tr>'; (row || []).forEach(cell => { html += `<td style="mso-number-format:\\@;">${cell || ''}</td>`; }); html += '</tr>'; }); html += '</table></body></html>'; blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }); downloadName = file.name.replace('.xlsx', '.xls'); }
            const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = downloadName; link.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;opacity:0;pointer-events:auto;'; document.documentElement.appendChild(link); link.click(); setTimeout(function() { document.documentElement.removeChild(link); URL.revokeObjectURL(link.href); }, 3000);
        };

        // ==================== 窗口控制 ====================
        win.addEventListener('mousedown', () => { win.style.zIndex = ++zIndexCounter; }, true);
        const extraData = { id: file.id, type: 'file' };
        win.querySelector('.win-btn-close').onclick = () => { win.remove(); removeWindowState(file.id); const item = taskbarMinList.querySelector(`[data-win-id="${openWinId}"]`); if (item) item.remove(); };
        bindWindowDragAndResize(win, win.querySelector('.os-window-header'), win.querySelector('.os-window-resize-handle'), extraData);
        bindWindowControls(win, file.name, extraData);
        if (!restoreState) saveWindowState(openWinId, extraData);
    }

    // --- 7. 控制面板 ---
    function openSettingsPanel() {
    if (shadow.getElementById('win-runtime-sys-settings')) { shadow.getElementById('win-runtime-sys-settings').style.zIndex = ++zIndexCounter; return; }
    const win = document.createElement('div');
    win.className = 'os-window'; win.id = 'win-runtime-sys-settings'; win.style.zIndex = ++zIndexCounter;
    win.style.top = '140px'; win.style.left = '380px'; win.style.width = '520px'; win.style.height = '520px';
    let themeSwatchesHTML = '';
    const themeColors = { default: '#0078d4', blue: '#1565c0', purple: '#7b1fa2', green: '#2e7d32', amber: '#e65100', red: '#c62828', light: '#f0f0f0' };
    Object.keys(THEMES).forEach(key => { const isActive = OS_DATA.settings.theme === key ? 'active' : ''; themeSwatchesHTML += `<div class="theme-swatch ${isActive}" data-theme="${key}" style="background: ${themeColors[key]};" title="${THEMES[key].label}"></div>`; });
    win.innerHTML = `
        <div class="os-window-header"><span>⚙️ 系统控制中心</span><div class="window-controls-group"><div class="win-ctrl-btn win-btn-min" title="最小化">—</div><div class="win-ctrl-btn win-btn-max" title="最大化/还原">□</div><div class="win-ctrl-btn win-btn-close" title="关闭">×</div></div></div>
        <div class="os-window-body"><div class="settings-body">
            <div style="color:#4ec9b0; font-weight:bold; border-bottom: 1px solid #444; padding-bottom: 5px;">🎨 外观设置</div>
            <div class="settings-row"><span>系统色调:</span><div class="theme-selector">${themeSwatchesHTML}</div></div>
            <div class="settings-row"><span>自定义颜色:</span><input type="color" id="set-custom-color" style="width:36px;height:28px;padding:0;border:2px solid var(--input-border);border-radius:4px;cursor:pointer;background:transparent;" value="${OS_DATA.settings.customAccentColor || '#0078d4'}"><button class="model-btn model-btn-add" id="btn-apply-custom-color" style="margin-left:6px;">应用</button><button class="model-btn model-btn-del" id="btn-reset-theme" style="margin-left:4px;">恢复默认</button></div>
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
            <div style="color:#da70d6; font-weight:bold; border-bottom: 1px solid #444; padding-bottom: 5px; margin-top:10px;">🔒 密码设置</div>
            <div class="settings-row"><span>修改密码:</span><button class="model-btn model-btn-add" id="btn-change-pwd">修改</button></div>
            <div style="color:#4ec9b0; font-weight:bold; border-bottom: 1px solid #444; padding-bottom: 5px; margin-top:10px;">📦 数据管理</div>
            <div class="settings-row"><span>一键下载全部文件:</span><button class="model-btn model-btn-add" id="btn-download-all">📦 下载全部</button></div>
            <div style="font-size:11px; color:#888; margin-top:-8px;">将所有文件打包为压缩包下载（需要浏览器支持）</div>
            <div style="color:#57a6ff; font-weight:bold; border-bottom: 1px solid #444; padding-bottom: 5px; margin-top:10px;">📜 条款与介绍</div>
            <div class="settings-row"><span>查看使用条款:</span><button class="model-btn model-btn-add" id="btn-view-terms" style="background:#4ec9b0;">📋 查看条款</button></div>
            <div class="settings-row"><span>浏览功能介绍:</span><button class="model-btn model-btn-add" id="btn-view-features" style="background:#da70d6;">📖 功能浏览</button></div>
            <div style="font-size:11px; color:#888; margin-top:-8px;">可下载条款.txt和介绍.txt到本地</div>
            <div style="color:#4ec9b0; font-weight:bold; border-bottom: 1px solid #444; padding-bottom: 5px; margin-top:10px;">🗑️ 回收站设置</div>
            <div class="settings-row"><span>回收站：</span><div style="display:flex;align-items:center;gap:6px;"><input type="text" class="settings-input" id="set-trash-days" style="width:50px;text-align:center;" value="${OS_DATA.settings.trashAutoDeleteDays || 0}"><span style="font-size:13px;color:var(--text-secondary);">天后自动删除 (0=永不自动删除)</span></div></div>
            <div style="color:#ff6b6b; font-weight:bold; border-bottom: 1px solid #444; padding-bottom: 5px; margin-top:10px;">谨慎操作以下内容</div>
            <div class="settings-row"><span>重置本地数据:</span><button class="model-btn model-btn-add" id="btn-reset-localstorage" style="background:#ff6b6b;">🗑️ 一键重置</button></div>
            <div style="font-size:11px; color:#888; margin-top:-8px;">清除所有localStorage数据，需输入密码两次确认</div>
            </div></div>
        </div></div>
        <div class="os-window-resize-handle"></div>
    `;
    desktop.appendChild(win);
    const sBlur = win.querySelector('#set-blur'); const sBright = win.querySelector('#set-bright'); const sApi = win.querySelector('#set-apikey'); const sModelSelect = win.querySelector('#set-model-select');
    const renderModelOptions = () => { sModelSelect.innerHTML = ''; OS_DATA.settings.modelList.forEach(m => { const opt = document.createElement('option'); opt.value = m; opt.innerText = m; if (m === OS_DATA.settings.activeModel) opt.selected = true; sModelSelect.appendChild(opt); }); };
    renderModelOptions();
    win.querySelectorAll('.theme-swatch').forEach(swatch => { swatch.addEventListener('click', () => { OS_DATA.settings.theme = swatch.getAttribute('data-theme'); OS_DATA.settings.customAccentColor = ''; saveSystemData(); applyTheme(); win.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active')); swatch.classList.add('active'); }); });
// 自定义颜色
const customColorInput = win.querySelector('#set-custom-color');
win.querySelector('#btn-apply-custom-color').onclick = () => {
    const color = customColorInput.value;
    OS_DATA.settings.theme = 'custom';
    OS_DATA.settings.customAccentColor = color;
    saveSystemData();
    applyTheme();
    win.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
};
// 恢复默认设置
win.querySelector('#btn-reset-theme').onclick = () => {
    OS_DATA.settings.theme = 'default';
    OS_DATA.settings.customAccentColor = '';
    saveSystemData();
    applyTheme();
    customColorInput.value = '#0078d4';
    win.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
    win.querySelector('[data-theme="default"]').classList.add('active');
};
    const toggleRemember = win.querySelector('#toggle-remember-windows');
    toggleRemember.addEventListener('click', () => { OS_DATA.settings.rememberWindows = !OS_DATA.settings.rememberWindows; toggleRemember.classList.toggle('active', OS_DATA.settings.rememberWindows); saveSystemDataNow(); if (!OS_DATA.settings.rememberWindows) { OS_DATA.openWindows = []; saveSystemDataNow(); } });
    const toggleAutoRestore = win.querySelector('#toggle-auto-restore-desktop');
    toggleAutoRestore.addEventListener('click', () => { OS_DATA.settings.autoRestoreDesktop = !OS_DATA.settings.autoRestoreDesktop; toggleAutoRestore.classList.toggle('active', OS_DATA.settings.autoRestoreDesktop); saveSystemDataNow(); });
    sBlur.oninput = (e) => { OS_DATA.settings.blur = e.target.value; win.querySelector('#txt-blur').innerText = `${e.target.value}px`; wallpaperBlur.style.backdropFilter = `blur(${OS_DATA.settings.blur}px)`; saveSystemData(); };
    sBright.oninput = (e) => { OS_DATA.settings.brightness = e.target.value; win.querySelector('#txt-bright').innerText = `${100 - e.target.value}%`; wallpaperBlur.style.background = `rgba(0, 0, 0, ${OS_DATA.settings.brightness / 100})`; saveSystemData(); };
    sApi.oninput = (e) => { OS_DATA.settings.apiKey = e.target.value; saveSystemData(); };
    sModelSelect.onchange = (e) => { OS_DATA.settings.activeModel = e.target.value; saveSystemData(); const chatHeader = shadow.querySelector('#win-ai-chat-terminal .os-window-header span'); if (chatHeader) chatHeader.innerText = `🤖 AI 智能终端 (${OS_DATA.settings.activeModel})`; };
    win.querySelector('#btn-change-pwd').onclick = () => {
    let pwdOverlay = document.createElement('div');
    pwdOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:2147483647;display:flex;align-items:center;justify-content:center;';
    let pwdBox = document.createElement('div');
    pwdBox.style.cssText = 'background:#fff;border-radius:12px;padding:30px 40px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,0.3);font-family:system-ui;min-width:320px;';
    let pwdTitle = document.createElement('div');
    pwdTitle.textContent = '🔒 修改密码';
    pwdTitle.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:16px;color:#333;';
    let pwdHint = document.createElement('div');
    pwdHint.style.cssText = 'font-size:13px;color:#e74c3c;margin-bottom:10px;min-height:18px;';
    let oldInput = document.createElement('input');
    oldInput.type = 'password';
    oldInput.placeholder = '旧密码';
    oldInput.style.cssText = 'width:100%;padding:10px 14px;border:2px solid #ddd;border-radius:8px;font-size:15px;outline:none;box-sizing:border-box;margin-bottom:10px;';
    let newInput = document.createElement('input');
    newInput.type = 'password';
    newInput.placeholder = '新密码（留空则免密，至少4位）';
    newInput.style.cssText = 'width:100%;padding:10px 14px;border:2px solid #ddd;border-radius:8px;font-size:15px;outline:none;box-sizing:border-box;';
    let pwdBtnRow = document.createElement('div');
    pwdBtnRow.style.cssText = 'display:flex;gap:10px;margin-top:16px;';
    let pwdCancel = document.createElement('button');
    pwdCancel.textContent = '取消';
    pwdCancel.style.cssText = 'flex:1;padding:10px 0;background:#eee;color:#666;border:none;border-radius:8px;font-size:15px;cursor:pointer;';
    pwdCancel.onclick = function() { pwdOverlay.remove(); };
    let pwdConfirm = document.createElement('button');
    pwdConfirm.textContent = '确认修改';
    pwdConfirm.style.cssText = 'flex:1;padding:10px 0;background:#4285f4;color:#fff;border:none;border-radius:8px;font-size:15px;cursor:pointer;';
    pwdBtnRow.appendChild(pwdCancel);
    pwdBtnRow.appendChild(pwdConfirm);
    pwdBox.appendChild(pwdTitle);
    pwdBox.appendChild(pwdHint);
    pwdBox.appendChild(oldInput);
    pwdBox.appendChild(newInput);
    pwdBox.appendChild(pwdBtnRow);
    pwdOverlay.appendChild(pwdBox);
    document.documentElement.appendChild(pwdOverlay);
    oldInput.focus();
    pwdConfirm.onclick = function() {
        if (oldInput.value !== _pwd) { pwdHint.textContent = '❌ 旧密码错误！'; oldInput.value = ''; oldInput.focus(); return; }
        let n = newInput.value.trim();
        if (n.length > 0 && n.length < 4) { pwdHint.textContent = '❌ 密码至少4位！'; newInput.focus(); return; }
        _pwd = n;
        localStorage.setItem('OS_PWD', n);
        pwdOverlay.remove();
        let tip = document.createElement('div');
        tip.textContent = n.length === 0 ? '✅ 已设置为免密登录！' : '✅ 密码修改成功！';
        tip.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#4caf50;color:#fff;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;z-index:2147483647;pointer-events:auto;';
        document.documentElement.appendChild(tip);
        setTimeout(function() { tip.remove(); }, 1500);
    };
    newInput.onkeydown = function(e) { if (e.key === 'Enter') pwdConfirm.click(); };
    oldInput.onkeydown = function(e) { if (e.key === 'Enter') newInput.focus(); };
};
win.querySelector('#btn-download-all').onclick = () => {
    const files = collectAllFilesForZip(null, '');

    if (files.length === 0) {
        alert('没有文件可下载！');
        return;
    }

    var zip = new SimpleZip();
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let content = file.content || '';
        let name = file.name || 'unnamed';
        let type = file.type || 'txt';

        if (type === 'docx') {
            content = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>body{font-family:\'宋体\',SimSun,serif;font-size:14px;line-height:1.8;}</style></head><body>' + content + '</body></html>';
            name = name.replace('.docx', '.doc');
        } else if (type === 'xlsx') {
            var matrix = Array.isArray(content) ? content : [];
            var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table border="1">';
            matrix.forEach(function(row) {
                html += '<tr>';
                (row || []).forEach(function(cell) {
                    html += '<td style="mso-number-format:\\@;">' + (cell || '') + '</td>';
                });
                html += '</tr>';
            });
            html += '</table></body></html>';
            content = html;
            name = name.replace('.xlsx', '.xls');
        } else {
            if (typeof content !== 'string') {
                if (Array.isArray(content)) {
                    content = content.map(function(row) { return Array.isArray(row) ? row.join(',') : String(row); }).join('\n');
                } else {
                    try { content = JSON.stringify(content); } catch(e) { content = ''; }
                }
            }
        }

        zip.file(name, content);
    }

    var blob = zip.toBlob();
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'WebOS_AllFiles_' + new Date().toISOString().slice(0,10) + '.zip';
    link.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;opacity:0;pointer-events:auto;';
    document.documentElement.appendChild(link);
    link.click();
    setTimeout(function() {
        document.documentElement.removeChild(link);
        URL.revokeObjectURL(link.href);
    }, 3000);
};
    win.querySelector('#btn-view-terms').onclick = () => { showTermsViewOverlay(); };
    win.querySelector('#btn-view-features').onclick = () => { showFeatureViewOverlay(); };
    win.querySelector('#btn-reset-localstorage').onclick = () => { showResetLocalStorageOverlay(); };
    var trashDaysInput = win.querySelector('#set-trash-days');
    trashDaysInput.addEventListener('input', function() {
        var val = parseInt(trashDaysInput.value);
        if (isNaN(val) || val < 0) val = 0;
        OS_DATA.settings.trashAutoDeleteDays = val;
        saveSystemData();
    });
    win.querySelector('#btn-add-model').onclick = () => { const newModel = prompt('请输入新模型名称:'); if (newModel && newModel.trim() !== '') { const cleanModel = newModel.trim(); if (!OS_DATA.settings.modelList.includes(cleanModel)) OS_DATA.settings.modelList.push(cleanModel); OS_DATA.settings.activeModel = cleanModel; saveSystemData(); renderModelOptions(); } };
    win.querySelector('#btn-del-model').onclick = () => { if (OS_DATA.settings.modelList.length <= 1) { alert('⚠️ 至少需要保留一个模型！'); return; } if (confirm(`确定要移除模型 [${OS_DATA.settings.activeModel}] 吗？`)) { OS_DATA.settings.modelList = OS_DATA.settings.modelList.filter(m => m !== OS_DATA.settings.activeModel); OS_DATA.settings.activeModel = OS_DATA.settings.modelList[0]; saveSystemData(); renderModelOptions(); } };
    win.querySelector('.win-btn-close').onclick = () => { OS_DATA.settingsOpen = false; saveSystemDataNow(); win.remove(); };
    OS_DATA.settingsOpen = true;
    saveSystemDataNow();
    bindWindowDragAndResize(win, win.querySelector('.os-window-header'), win.querySelector('.os-window-resize-handle'), null);
    bindWindowControls(win, '⚙️ 设置', null);
}
    function bindCtrlWheelZoom(element, gutter, updateGutter) {
        element.addEventListener('wheel', function(e) { if (e.ctrlKey) { e.preventDefault(); let size = parseFloat(window.getComputedStyle(this).fontSize) || 14; size = e.deltaY < 0 ? Math.min(45, size + 1) : Math.max(10, size - 1); this.style.fontSize = size + 'px'; if (gutter && updateGutter) updateGutter(); } }, { passive: false });
    }
        // ==================== CTerminal ====================
    function openCTerminal() {
        var openWinId = 'win-cterminal';
        if (shadow.getElementById(openWinId)) {
            var w = shadow.getElementById(openWinId);
            if (w.classList.contains('minimized')) {
                w.classList.remove('minimized');
                w.style.display = 'flex';
                var item = taskbarMinList.querySelector('[data-win-id="' + openWinId + '"]');
                if (item) item.remove();
            }
            w.style.zIndex = ++zIndexCounter;
            return;
        }
        var win = document.createElement('div');
        win.className = 'os-window';
        win.id = openWinId;
        win.style.zIndex = ++zIndexCounter;
        win.style.width = '760px';
        win.style.height = '500px';
        win.style.top = '80px';
        win.style.left = '260px';

        var termFontSize = 14;

        win.innerHTML =
            '<div class="os-window-header">' +
                '<span>CMQ Terminal</span>' +
                '<div class="window-controls-group">' +
                    '<div class="win-ctrl-btn win-btn-min" title="最小化">—</div>' +
                    '<div class="win-ctrl-btn win-btn-max" title="最大化/还原">□</div>' +
                    '<div class="win-ctrl-btn win-btn-close" title="关闭">×</div>' +
                '</div>' +
            '</div>' +
            '<div class="os-window-body" style="background:#0c0c0c;display:flex;flex-direction:column;padding:0;font-family:Consolas,\'Courier New\',monospace;font-size:' + termFontSize + 'px;color:#cccccc;overflow:hidden;">' +
                '<div id="cterm-output" style="flex:1;padding:8px 12px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;"></div>' +
                '<div id="cterm-input-line" style="display:flex;align-items:center;padding:4px 12px 8px;border-top:1px solid #333;">' +
                    '<span id="cterm-prompt" style="color:#4ec9b0;white-space:nowrap;"></span>' +
                    '<span id="cterm-arrow" style="color:#4ec9b0;margin-right:4px;"> &gt;</span>' +
                    '<input id="cterm-input" type="text" style="flex:1;background:transparent;border:none;outline:none;color:#cccccc;font-family:inherit;font-size:inherit;">' +
                '</div>' +
            '</div>' +
            '<div class="os-window-resize-handle"></div>';

        desktop.appendChild(win);

        var output = win.querySelector('#cterm-output');
        var inputEl = win.querySelector('#cterm-input');
        var promptEl = win.querySelector('#cterm-prompt');
        var termBody = win.querySelector('.os-window-body');

        // ---- 颜色系统 ----
        var COLOR_MAP = {
            '0': '#0c0c0c', '1': '#0037da', '2': '#13a10e', '3': '#3a96dd',
            '4': '#c50f1f', '5': '#881798', '6': '#c19c00', '7': '#cccccc',
            '8': '#767676', '9': '#3b78ff', 'a': '#16c60c', 'b': '#61d6d6',
            'c': '#e74856', 'd': '#b4009e', 'e': '#f9f1a5', 'f': '#f2f2f2'
        };
        var termFgColor = '#cccccc';
        var termBgColor = '#0c0c0c';
        var promptColor = '#4ec9b0';

        function applyTermColors() {
            termBody.style.color = termFgColor;
            termBody.style.background = termBgColor;
            inputEl.style.color = termFgColor;
            promptEl.style.color = promptColor;
            var arrow = win.querySelector('#cterm-arrow');
            if (arrow) arrow.style.color = promptColor;
        }

        // ---- 字体缩放 ----
        win.addEventListener('keydown', function(e) {
            if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
                e.preventDefault();
                termFontSize = Math.min(termFontSize + 2, 32);
                termBody.style.fontSize = termFontSize + 'px';
            }
            if (e.ctrlKey && e.key === '-') {
                e.preventDefault();
                termFontSize = Math.max(termFontSize - 2, 8);
                termBody.style.fontSize = termFontSize + 'px';
            }
            if (e.ctrlKey && e.key === '0') {
                e.preventDefault();
                termFontSize = 14;
                termBody.style.fontSize = termFontSize + 'px';
            }
        });

        // ---- 输出函数 ----
        function print(text, color) {
            var line = document.createElement('div');
            line.textContent = text;
            if (color) line.style.color = color;
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
        }
        function printPre(text, color) {
            var pre = document.createElement('pre');
            pre.textContent = text;
            pre.style.cssText = 'margin:0;padding:0;font-family:inherit;font-size:inherit;line-height:1.15;';
            if (color) pre.style.color = color;
            output.appendChild(pre);
            output.scrollTop = output.scrollHeight;
        }

        // ---- 路径系统 ----
        var currentPath = '/';

        function getPrompt() {
            if (currentPath === '/') return 'Desktop';
            var parts = currentPath.split('/').filter(Boolean);
            if (parts[0].toLowerCase() === 'desktop') parts[0] = 'Desktop';
            return parts.join('/');
        }
        promptEl.textContent = getPrompt();

        // ---- 文件系统操作 ----
        function getFolderByPath(path) {
            if (path === '/' || path === '') return null;
            var parts = path.split('/').filter(Boolean);
            var node = null;
            for (var i = 0; i < parts.length; i++) {
                var name = parts[i];
                var searchIn;
                if (node) {
                    searchIn = (node.children || []).map(function(cid) {
                        return OS_DATA.files.find(function(f) { return f.id === cid; });
                    }).filter(Boolean);
                } else {
                    searchIn = OS_DATA.files.filter(function(f) {
                        return !OS_DATA.files.some(function(p) {
                            return p.type === 'folder' && p.children && p.children.includes(f.id);
                        });
                    });
                }
                node = searchIn.find(function(f) { return f.name === name && f.type === 'folder'; });
                if (!node) return null;
            }
            return node;
        }

        function listDir(path) {
            if (path === '/' || path === '') {
                return OS_DATA.files.filter(function(f) {
                    return !OS_DATA.files.some(function(p) {
                        return p.type === 'folder' && p.children && p.children.includes(f.id);
                    });
                });
            }
            var folder = getFolderByPath(path);
            if (!folder || !folder.children) return [];
            return folder.children.map(function(cid) {
                return OS_DATA.files.find(function(f) { return f.id === cid; });
            }).filter(Boolean);
        }

        function resolvePath(p) {
            if (!p) return currentPath;
            p = p.replace(/\\/g, '/');
            if (p.startsWith('Desktop') || p.startsWith('desktop')) {
                p = p.replace(/^[Dd]esktop\/?/, '/');
                if (p === '') p = '/';
            }
            if (p.startsWith('/')) return p.replace(/\/+$/, '') || '/';
            if (p === '..') {
                var parts = currentPath.split('/').filter(Boolean);
                parts.pop();
                return '/' + parts.join('/');
            }
            if (currentPath === '/') return '/' + p;
            return currentPath + '/' + p;
        }

        function findFileInCurrentDir(name) {
            var items = listDir(currentPath);
            return items.find(function(f) { return f.name === name; });
        }
        function findFileGlobal(name) {
            return OS_DATA.files.find(function(f) { return f.name === name; });
        }
        function addFileToCurrentDir(fileId) {
            if (currentPath === '/') return;
            var folder = getFolderByPath(currentPath);
            if (folder && folder.children && !folder.children.includes(fileId)) {
                folder.children.push(fileId);
            }
        }
        function removeFileFromCurrentDir(fileId) {
            if (currentPath === '/') return;
            var folder = getFolderByPath(currentPath);
            if (folder && folder.children) {
                folder.children = folder.children.filter(function(c) { return c !== fileId; });
            }
        }

        // ---- 启动信息 ----
        function showLogo() {
            printPre(
                ' ______  __        __ _______\n' +
                '/  ____| | \\      / | | ___ |\n' +
                '| |      |  \\    /  | | | | |\n' +
                '| |      |   \\  /   | | | | |\n' +
                '| |____  | |\\ \\/ /| | | |_| \\\n' +
                '\\______| |_| \\__/ | | \\______\\', promptColor);
            print('');
            print('CMQ Terminal [Version 2026.8.2]', '#888');
            print('(C) CMQ Corporation. All rights reserved.', '#888');
            print('');
        }
        showLogo();

        // ---- 打开OS文件 ----
        function openOSFile(filename) {
            var items = listDir(currentPath);
            var target = items.find(function(f) { return f.name === filename; });
            if (!target) {
                target = OS_DATA.files.find(function(f) { return f.name === filename && f.type !== 'folder'; });
            }
            if (!target) {
                print('The system cannot find the file specified: ' + filename, '#ff6b6b');
                return;
            }
            if (target.type === 'folder' || target.children) {
                currentPath = resolvePath(target.name);
                promptEl.textContent = getPrompt();
                return;
            }
            openAppWindow(target.id);
            print('Opened: ' + target.name, promptColor);
        }

                function compileAndRun(compiler, filename, argParts) {
            // 查找文件
            var target = findFileInCurrentDir(filename);
            if (!target) target = findFileGlobal(filename);
            if (!target) {
                print(compiler + ': error: ' + filename + ': No such file or directory', '#ff6b6b');
                return;
            }
            if (target.type === 'folder') {
                print(compiler + ': error: ' + filename + ': Is a directory', '#ff6b6b');
                return;
            }
            var code = (typeof target.content === 'string') ? target.content : '';
            if (!code.trim()) {
                print(compiler + ': error: ' + filename + ': File is empty', '#ff6b6b');
                return;
            }

            // 生成 exe 文件名（同目录）
            var exeName = filename.replace(/\.(cpp|c|h|cc|cxx)$/i, '') + '.CApp';

            print(compiler + ' ' + filename, promptColor);
            print('Compiling...', '#f9f1a5');

            // 用 judge0 真实编译（language_id: 54 = C++ GCC）
            if (typeof GM_xmlhttpRequest === 'undefined') {
                print(compiler + ': fatal error: GM_xmlhttpRequest not available', '#ff6b6b');
                return;
            }

            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://ce.judge0.com/submissions?wait=true',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                data: JSON.stringify({ source_code: code, language_id: 54, stdin: '' }),
                onload: function(response) {
                    try {
                        var res = JSON.parse(response.responseText);
                        if (res.compile_output && res.compile_output.trim()) {
                            // 编译失败
                            print('');
                            print(compiler + ': compilation error:', '#ff6b6b');
                            var errLines = res.compile_output.split('\n');
                            for (var ei = 0; ei < Math.min(errLines.length, 15); ei++) {
                                print('  ' + errLines[ei], '#ff6b6b');
                            }
                            print('');
                            print('compilation terminated.', '#ff6b6b');
                            return;
                        }
                        // 编译成功 → 停顿1秒 → 生成 exe
                        print('Compilation successful.', '#16c60c');
                        print('');
                        setTimeout(function() {
                            // 创建 exe 文件（同目录，内容为编译后的信息）
                            var exeContent = '__CMQ_EXE__\nSOURCE:' + filename + '\nTIME:' + new Date().toISOString() + '\nCODE_BASE64:' + btoa(unescape(encodeURIComponent(code)));
                            // 检查是否已有同名 exe
                            var existingExe = findFileInCurrentDir(exeName);
                            if (!existingExe) existingExe = findFileGlobal(exeName);
                            if (existingExe) {
                                existingExe.content = exeContent;
                                existingExe._sourceCode = code;
                            } else {
                                var newExeId = 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                                var newExe = { id: newExeId, name: exeName, type: 'exe', content: exeContent, _sourceCode: code };
                                OS_DATA.files.push(newExe);
                                addFileToCurrentDir(newExeId);
                            }
                            saveSystemData();
                            renderSidebarFiles();
                            refreshAllExplorerWindows();
                            print(exeName + ' generated.', '#16c60c');
                            print('');
                            // 自动打开 exe 运行窗口
                            openExeRunner(exeName, code);
                        }, 1000);
                    } catch(e) {
                        print(compiler + ': error parsing judge0 response: ' + e.message, '#ff6b6b');
                    }
                },
                onerror: function() {
                    print(compiler + ': connection to judge0 failed', '#ff6b6b');
                }
            });
        }

        // ---- 弹出输入数据对话框 ----
                // ---- exe 运行窗口（左右分栏，可拖动分割线）----
        function openExeRunner(exeName, code) {
            var exeWinId = 'win-exe-runner-' + Date.now();
            var exeWin = document.createElement('div');
            exeWin.className = 'os-window';
            exeWin.id = exeWinId;
            exeWin.style.zIndex = ++zIndexCounter;
            exeWin.style.width = '680px';
            exeWin.style.height = '480px';
            exeWin.style.top = '90px';
            exeWin.style.left = '300px';

            exeWin.innerHTML =
                '<div class="os-window-header">' +
                    '<span>▶ ' + exeName + '</span>' +
                    '<div class="window-controls-group">' +
                        '<div class="win-ctrl-btn win-btn-min" title="最小化">—</div>' +
                        '<div class="win-ctrl-btn win-btn-max" title="最大化/还原">□</div>' +
                        '<div class="win-ctrl-btn win-btn-close" title="关闭">×</div>' +
                    '</div>' +
                '</div>' +
                '<div class="os-window-body" style="padding:0;overflow:hidden;display:flex;flex-direction:column;">' +
                    '<div class="exe-runner-bar">' +
                        '<span style="color:#4ec9b0;font-weight:bold;">▶ ' + exeName + '</span>' +
                        '<button class="exe-run-btn" title="运行程序">▶ 运行</button>' +
                        '<span class="exe-status" style="margin-left:auto;font-size:11px;color:#888;">就绪</span>' +
                    '</div>' +
                    '<div class="exe-split-container" style="flex:1;display:flex;overflow:hidden;position:relative;">' +
                        '<div class="exe-left-pane" style="width:50%;display:flex;flex-direction:column;min-width:80px;">' +
                            '<div class="exe-pane-title">输入 (Stdin)</div>' +
                            '<textarea class="exe-stdin-input" spellcheck="false" placeholder="在此输入数据...&#10;例如:&#10;5&#10;1 2 3 4 5"></textarea>' +
                        '</div>' +
                        '<div class="exe-divider" title="拖动调整大小"></div>' +
                        '<div class="exe-right-pane" style="flex:1;display:flex;flex-direction:column;min-width:80px;">' +
                            '<div class="exe-pane-title">输出 (Stdout)</div>' +
                            '<div class="exe-stdout-output">运行后输出将显示在此处...</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="os-window-resize-handle"></div>';

            desktop.appendChild(exeWin);

            // 窗口拖动、缩放、控制
            exeWin.addEventListener('mousedown', function() { exeWin.style.zIndex = ++zIndexCounter; }, true);
            bindWindowDragAndResize(exeWin, exeWin.querySelector('.os-window-header'), exeWin.querySelector('.os-window-resize-handle'), null);
            bindWindowControls(exeWin, '▶ ' + exeName, null, function() {
                // 关闭窗口时删除对应的 exe 文件
                var exeFile = findFileGlobal(exeName);
                if (exeFile) {
                    // 从所有父文件夹的 children 中移除
                    OS_DATA.files.forEach(function(f) {
                        if (f.type === 'folder' && f.children) {
                            f.children = f.children.filter(function(c) { return c !== exeFile.id; });
                        }
                    });
                    // 从文件列表中移除
                    OS_DATA.files = OS_DATA.files.filter(function(f) { return f.id !== exeFile.id; });
                    saveSystemData();
                    renderSidebarFiles();
                    refreshAllExplorerWindows();
                }
                setTimeout(function() { inputEl.focus(); }, 50);
            });

            // 关闭时恢复焦点
            exeWin.querySelector('.win-btn-close').addEventListener('click', function() {
                setTimeout(function() { inputEl.focus(); }, 50);
            });

            // ---- 拖动分割线 ----
            var divider = exeWin.querySelector('.exe-divider');
            var leftPane = exeWin.querySelector('.exe-left-pane');
            var rightPane = exeWin.querySelector('.exe-right-pane');
            var splitContainer = exeWin.querySelector('.exe-split-container');

            var isDraggingDivider = false;
            divider.addEventListener('mousedown', function(e) {
                e.preventDefault();
                isDraggingDivider = true;
                document.body.style.userSelect = 'none';
                document.body.style.cursor = 'col-resize';
            });
            document.addEventListener('mousemove', function(e) {
                if (!isDraggingDivider) return;
                var containerRect = splitContainer.getBoundingClientRect();
                var offsetX = e.clientX - containerRect.left;
                var totalWidth = containerRect.width;
                var pct = Math.max(15, Math.min(85, (offsetX / totalWidth) * 100));
                leftPane.style.width = pct + '%';
                leftPane.style.flex = 'none';
                rightPane.style.flex = '1';
            });
            document.addEventListener('mouseup', function() {
                if (isDraggingDivider) {
                    isDraggingDivider = false;
                    document.body.style.userSelect = '';
                    document.body.style.cursor = '';
                }
            });

            // ---- 运行按钮 ----
            var runBtn = exeWin.querySelector('.exe-run-btn');
            var stdinArea = exeWin.querySelector('.exe-stdin-input');
            var stdoutArea = exeWin.querySelector('.exe-stdout-output');
            var statusSpan = exeWin.querySelector('.exe-status');

            runBtn.addEventListener('click', function() {
                var stdinData = stdinArea.value;
                statusSpan.textContent = '运行中...';
                statusSpan.style.color = '#f9f1a5';
                stdoutArea.innerHTML = '';

                if (typeof GM_xmlhttpRequest === 'undefined') {
                    stdoutArea.innerHTML = '<span style="color:#ff5f56;">[致命错误] 未检测到跨域通信组件！</span>';
                    statusSpan.textContent = '错误';
                    statusSpan.style.color = '#ff6b6b';
                    return;
                }

                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://ce.judge0.com/submissions?wait=true',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    data: JSON.stringify({ source_code: code, language_id: 54, stdin: stdinData }),
                    onload: function(response) {
                        try {
                            var res = JSON.parse(response.responseText);
                            var outputHTML = '';

                            if (res.compile_output && res.compile_output.trim()) {
                                outputHTML += '<div style="color:#ff5f56;font-weight:bold;">[编译错误]</div>';
                                outputHTML += '<pre style="margin:4px 0;color:#ff5f56;white-space:pre-wrap;">' + escapeHTML(res.compile_output) + '</pre>';
                            }

                            if (res.stdout) {
                                outputHTML += '<pre style="margin:4px 0;color:#33ff33;white-space:pre-wrap;">' + escapeHTML(res.stdout) + '</pre>';
                            }

                            if (res.stderr) {
                                outputHTML += '<div style="color:#ffaa00;font-weight:bold;">[运行时错误/异常]</div>';
                                outputHTML += '<pre style="margin:4px 0;color:#ffaa00;white-space:pre-wrap;">' + escapeHTML(res.stderr) + '</pre>';
                            }

                            if (!res.stdout && !res.stderr && !res.compile_output) {
                                var exitDesc = res.status ? res.status.description : 'Success';
                                outputHTML += '<div style="color:#888;">(程序正常退出，状态: ' + exitDesc + ')</div>';
                            }

                            stdoutArea.innerHTML = outputHTML;
                            statusSpan.textContent = '运行完毕';
                            statusSpan.style.color = '#16c60c';

                        } catch(e) {
                            stdoutArea.innerHTML = '<span style="color:#ff5f56;">[解析失败] ' + escapeHTML(e.message) + '</span>';
                            statusSpan.textContent = '错误';
                            statusSpan.style.color = '#ff6b6b';
                        }
                    },
                    onerror: function() {
                        stdoutArea.innerHTML = '<span style="color:#ff5f56;">[连接失败]</span>';
                        statusSpan.textContent = '连接失败';
                        statusSpan.style.color = '#ff6b6b';
                    }
                });
            });
        }

        // ---- 命令执行 ----
        var cmdHistory = [];
        var historyIndex = -1;

        function execute(rawInput) {
            var trimmed = rawInput.trim();
            if (!trimmed) return;

            print(getPrompt() + ' > ' + trimmed, promptColor);

            // ---- 解析重定向 ----
            var redirectFile = null;
            var redirectAppend = false;
            var cmdText = trimmed;

            var dblIdx = trimmed.indexOf('>>');
            if (dblIdx !== -1) {
                redirectFile = trimmed.substring(dblIdx + 2).trim();
                redirectAppend = true;
                cmdText = trimmed.substring(0, dblIdx).trim();
            } else {
                var sglIdx = trimmed.indexOf('>');
                if (sglIdx !== -1) {
                    var before = trimmed.substring(0, sglIdx).trim();
                    if (before.length > 0) {
                        redirectFile = trimmed.substring(sglIdx + 1).trim();
                        redirectAppend = false;
                        cmdText = before;
                    }
                }
            }

            // ---- .\xxx 语法 ----
            if (cmdText.startsWith('.\\')) {
                var fn = cmdText.slice(2).trim();
                if (fn) openOSFile(fn);
                else print('Usage: .\\filename', '#ff6b6b');
                return;
            }

            // ---- 命令解析 ----
            var parts = cmdText.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
            var cmd = parts[0].toLowerCase();
            var arg1 = parts[1] ? parts[1].replace(/"/g, '') : '';
            var arg2 = parts[2] ? parts[2].replace(/"/g, '') : '';
            var argRest = parts.slice(1).join(' ').replace(/"/g, '');

            // ---- g++ / gcc 编译 ----
            if (cmd === 'g++' || cmd === 'gcc') {
                if (!arg1) {
                    print(cmd + ': fatal error: no input files', '#ff6b6b');
                    print('compilation terminated.', '#ff6b6b');
                    return;
                }
                compileAndRun(cmd, arg1, parts.slice(1));
                return;
            }

            // ---- 捕获输出用于重定向 ----
            var capturedOutput = [];
            var origPrint = null;
            var origPrintPre = null;

            if (redirectFile) {
                origPrint = print;
                origPrintPre = printPre;
                print = function(text, color) { capturedOutput.push(text); };
                printPre = function(text, color) { capturedOutput.push(text); };
            }

            try {
                executeCommand(cmd, arg1, arg2, argRest, parts);
            } finally {
                if (redirectFile) {
                    print = origPrint;
                    printPre = origPrintPre;
                    var resultText = capturedOutput.join('\n');
                    writeRedirect(redirectFile, resultText, redirectAppend);
                }
            }
        }

        function executeCommand(cmd, arg1, arg2, argRest, parts) {
            switch (cmd) {

            case 'help':
            case '?':
                print('╔══════════════════════════════════════════════╗', promptColor);
                print('║          CMQ Terminal - Command List         ║', promptColor);
                print('╚══════════════════════════════════════════════╝', promptColor);
                print('');
                print('  File & Directory:', '#f9f1a5');
                print('    dir / ls              List directory contents');
                print('    cd [path]             Change directory');
                print('    mkdir [name]          Create directory');
                print('    rmdir [name]          Remove directory');
                print('    touch [name]          Create empty file');
                print('    del [file]            Delete file');
                print('    copy [src] [dst]      Copy file');
                print('    move [src] [dst]      Move file');
                print('    rename [old] [new]    Rename file');
                print('    type [file]           Display file content');
                print('    find [text] [file]    Search text in file');
                print('    replace [file] [old] [new]  Replace text in file');
                print('');
                print('  Compile & Run:', '#f9f1a5');
                print('    g++ [file.cpp]        Compile & run C++ file');
                print('    gcc [file.c]          Compile & run C file');
                print('    (Input dialog will pop up before running)');
                print('');
                print('  System:', '#f9f1a5');
                print('    cls / clear           Clear screen');
                print('    echo [text]           Print text');
                print('    ver                   Show version');
                print('    date                  Show date');
                print('    time                  Show time');
                print('    whoami                Show user');
                print('    hostname              Show computer name');
                print('    systeminfo            Show system info');
                print('    tasklist              Show running windows');
                print('    taskkill [/F] [/PID pid|/IM name]  Kill a process');
                print('    title [text]          Set terminal title');
                print('    color [attr]          Set colors (e.g. color 0a)');
                print('    shutdown / exit       Close terminal');
                print('');
                print('  CMT Script:', '#f9f1a5');
                print('    notepad [file.cmt]     Create/edit CMT script');
                print('    (CMT files run like bat, with @echo off support)');
                print('');
                print('  Launch:', '#f9f1a5');
                print('    start [file]          Open file');
                print('    .\\[file]              Open file');
                print('    explorer              Open Explorer');
                print('    notepad [file]        Open/Create file in editor');
                print('');
                print('  Redirection:', '#f9f1a5');
                print('    command > file        Overwrite file with output');
                print('    command >> file       Append output to file');
                print('');
                print('  Color Attributes:', '#f9f1a5');
                print('    0=Black  1=Blue   2=Green  3=Aqua  4=Red');
                print('    5=Purple 6=Yellow 7=White  8=Gray  9=LightBlue');
                print('    A=LightGreen B=LightAqua C=LightRed D=LightPurple');
                print('    E=LightYellow F=BrightWhite');
                print('    Usage: color [bg][fg]  e.g. color 0a, color 1f, color 0c');
                break;

            case 'ver':
                print('');
                print('CMQ Terminal [Version 2026.4.2]', promptColor);
                print('(c) CMQ Corporation. All rights reserved.');
                print('');
                break;

            case 'cls':
            case 'clear':
                output.innerHTML = '';
                showLogo();
                break;

            case 'dir':
            case 'ls':
                var dirPath = currentPath;
                if (arg1) {
                    var testPath = resolvePath(arg1);
                    var testItems = listDir(testPath);
                    if (testItems.length > 0 || getFolderByPath(testPath)) {
                        dirPath = testPath;
                    } else {
                        print('The system cannot find the path specified: ' + arg1, '#ff6b6b');
                        break;
                    }
                }
                var items = listDir(dirPath);
                var dirCount = 0, fileCount = 0, totalSize = 0;
                print(' Directory of ' + (dirPath === '/' ? 'Desktop' : getPrompt()), promptColor);
                print('');
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    if (item.type === 'folder') {
                        print('  <DIR>    ' + item.name, '#61d6d6');
                        dirCount++;
                    } else {
                        var sz = (typeof item.content === 'string') ? item.content.length : 64;
                        var szStr = (sz < 10 ? '  ' : sz < 100 ? ' ' : '') + sz;
                        print('  ' + szStr + ' B  ' + item.name);
                        fileCount++;
                        totalSize += sz;
                    }
                }
                print('');
                print('  ' + dirCount + ' Dir(s), ' + fileCount + ' File(s), ' + totalSize + ' bytes', '#888');
                break;

            case 'cd':
                if (!arg1 || arg1 === '/') {
                    currentPath = '/';
                    promptEl.textContent = getPrompt();
                    break;
                }
                // 将 Desktop/desktop 映射到根目录 /
                if (arg1 === 'Desktop' || arg1 === 'desktop') {
                    currentPath = '/';
                    promptEl.textContent = getPrompt();
                    break;
                }
                var newPath = resolvePath(arg1);
                var targetFolder = getFolderByPath(newPath);
                if (targetFolder) {
                    currentPath = newPath;
                    promptEl.textContent = getPrompt();
                } else {
                    var relItems = listDir(currentPath);
                    var relTarget = relItems.find(function(f) { return f.name === arg1 && f.type === 'folder'; });
                    if (relTarget) {
                        currentPath = resolvePath(arg1);
                        promptEl.textContent = getPrompt();
                    } else {
                        print('The system cannot find the path specified: ' + arg1, '#ff6b6b');
                    }
                }
                break;
            case 'mkdir':
            case 'md':
                if (!arg1) { print('The syntax of the command is incorrect.', '#ff6b6b'); break; }
                var newId = 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                OS_DATA.files.push({ id: newId, name: arg1, type: 'folder', children: [] });
                addFileToCurrentDir(newId);
                saveSystemData(); renderSidebarFiles(); refreshAllExplorerWindows();
                print('Directory created: ' + arg1, promptColor);
                break;

            case 'rmdir':
            case 'rd':
                if (!arg1) { print('The syntax of the command is incorrect.', '#ff6b6b'); break; }
                var target = findFileInCurrentDir(arg1);
                if (!target) { print('The system cannot find the file specified: ' + arg1, '#ff6b6b'); break; }
                if (target.type !== 'folder') { print('The directory name is invalid: ' + arg1, '#ff6b6b'); break; }
                if (target.children && target.children.length > 0) {
                    print('The directory is not empty: ' + arg1, '#f9f1a5');
                    if (parts.indexOf('/s') !== -1 || parts.indexOf('/S') !== -1 || confirm('Delete directory and all contents?')) {
                        function deleteRecursive(folderId) {
                            var f = OS_DATA.files.find(function(x) { return x.id === folderId; });
                            if (f && f.children) {
                                for (var k = 0; k < f.children.length; k++) deleteRecursive(f.children[k]);
                            }
                            OS_DATA.files = OS_DATA.files.filter(function(x) { return x.id !== folderId; });
                        }
                        removeFileFromCurrentDir(target.id);
                        deleteRecursive(target.id);
                        saveSystemData(); renderSidebarFiles(); refreshAllExplorerWindows();
                        print('Directory removed: ' + arg1, '#ff6b6b');
                    }
                } else {
                    removeFileFromCurrentDir(target.id);
                    OS_DATA.files = OS_DATA.files.filter(function(f) { return f.id !== target.id; });
                    saveSystemData(); renderSidebarFiles(); refreshAllExplorerWindows();
                    print('Directory removed: ' + arg1, '#ff6b6b');
                }
                break;

            case 'touch':
                if (!arg1) { print('The syntax of the command is incorrect.', '#ff6b6b'); break; }
                var ext = arg1.split('.').pop().toLowerCase();
                var type = 'txt';
                if (ext === 'cpp' || ext === 'c' || ext === 'h') type = 'cpp';
                else if (ext === 'cmt') type = 'cmt';
                else if (ext === 'md') type = 'md';
                else if (ext === 'xlsx') type = 'xlsx';
                else if (ext === 'docx') type = 'docx';
                var content = '';
                if (type === 'cpp') content = '#include <iostream>\nusing namespace std;\nint main() {\n\n\treturn 0;\n}';
                if (type === 'xlsx') content = [['','','','']];
                if (type === 'docx') content = '<div>请输入文档内容...</div>';
                if (type === 'md') content = '# Title\n\nContent...\n';
                var newId = 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                OS_DATA.files.push({ id: newId, name: arg1, type: type, content: content });
                addFileToCurrentDir(newId);
                saveSystemData(); renderSidebarFiles(); refreshAllExplorerWindows();
                print('Created file: ' + arg1, promptColor);
                break;

            case 'del':
            case 'rm':
            case 'erase':
                if (!arg1) { print('The syntax of the command is incorrect.', '#ff6b6b'); break; }
                var target = findFileInCurrentDir(arg1);
                if (!target) { print('Could not find ' + arg1, '#ff6b6b'); break; }
                if (target.type === 'folder') { print('Access denied. Use rmdir to remove directories.', '#ff6b6b'); break; }
                removeFileFromCurrentDir(target.id);
                OS_DATA.files = OS_DATA.files.filter(function(f) { return f.id !== target.id; });
                saveSystemData(); renderSidebarFiles(); refreshAllExplorerWindows();
                print('Deleted: ' + arg1, '#ff6b6b');
                break;

            case 'copy':
                if (!arg1 || !arg2) { print('Usage: copy [src] [dst]', '#f9f1a5'); break; }
                var src = findFileInCurrentDir(arg1);
                if (!src) { print('The system cannot find the file specified: ' + arg1, '#ff6b6b'); break; }
                if (src.type === 'folder') { print('Access denied.', '#ff6b6b'); break; }
                var newId = 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                OS_DATA.files.push({ id: newId, name: arg2, type: src.type, content: JSON.parse(JSON.stringify(src.content)) });
                addFileToCurrentDir(newId);
                saveSystemData(); renderSidebarFiles(); refreshAllExplorerWindows();
                print('Copied: ' + arg1 + ' -> ' + arg2, promptColor);
                break;

            case 'move':
                if (!arg1 || !arg2) { print('Usage: move [src] [dst]', '#f9f1a5'); break; }
                var src = findFileInCurrentDir(arg1);
                if (!src) { print('The system cannot find the file specified: ' + arg1, '#ff6b6b'); break; }
                removeFileFromCurrentDir(src.id);
                src.name = arg2;
                addFileToCurrentDir(src.id);
                saveSystemData(); renderSidebarFiles(); refreshAllExplorerWindows();
                print('Moved: ' + arg1 + ' -> ' + arg2, promptColor);
                break;

            case 'rename':
            case 'ren':
                if (!arg1 || !arg2) { print('Usage: rename [old] [new]', '#f9f1a5'); break; }
                var target = findFileInCurrentDir(arg1);
                if (!target) { print('The system cannot find the file specified: ' + arg1, '#ff6b6b'); break; }
                var oldName = target.name;
                target.name = arg2;
                saveSystemData(); renderSidebarFiles(); refreshAllExplorerWindows();
                print('Renamed: ' + oldName + ' -> ' + arg2, promptColor);
                break;

            case 'type':
            case 'cat':
                if (!arg1) { print('The syntax of the command is incorrect.', '#ff6b6b'); break; }
                var target = findFileInCurrentDir(arg1);
                if (!target) target = findFileGlobal(arg1);
                if (!target) { print('The system cannot find the file specified: ' + arg1, '#ff6b6b'); break; }
                if (target.type === 'folder') { print('Access denied.', '#ff6b6b'); break; }
                var content = (typeof target.content === 'string') ? target.content : JSON.stringify(target.content, null, 2);
                print(content);
                break;

            case 'find':
                if (!arg1 || !arg2) { print('Usage: find [text] [file]', '#f9f1a5'); break; }
                var target = findFileInCurrentDir(arg2);
                if (!target) target = findFileGlobal(arg2);
                if (!target) { print('The system cannot find the file specified: ' + arg2, '#ff6b6b'); break; }
                if (target.type === 'folder') { print('Access denied.', '#ff6b6b'); break; }
                var content = (typeof target.content === 'string') ? target.content : JSON.stringify(target.content);
                var lines = content.split('\n');
                var found = false;
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i].toLowerCase().indexOf(arg1.toLowerCase()) !== -1) {
                        print(target.name + ':' + (i + 1) + ': ' + lines[i], '#f9f1a5');
                        found = true;
                    }
                }
                if (!found) print('No matches found.', '#888');
                break;

            case 'replace':
                if (!arg1 || !arg2 || !parts[3]) { print('Usage: replace [file] [old] [new]', '#f9f1a5'); break; }
                var arg3 = parts[3].replace(/"/g, '');
                var target = findFileInCurrentDir(arg1);
                if (!target) target = findFileGlobal(arg1);
                if (!target) { print('The system cannot find the file specified: ' + arg1, '#ff6b6b'); break; }
                if (target.type === 'folder') { print('Access denied.', '#ff6b6b'); break; }
                if (typeof target.content === 'string') {
                    var count = 0;
                    var newContent = target.content.replace(new RegExp(arg2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), function() { count++; return arg3; });
                    target.content = newContent;
                    saveSystemData();
                    print('Replaced ' + count + ' occurrence(s) in ' + arg1, promptColor);
                } else {
                    print('Cannot replace in non-text file.', '#ff6b6b');
                }
                break;

            case 'write':
                if (!arg1 || !arg2) { print('Usage: write [file] [text]', '#f9f1a5'); break; }
                var target = findFileInCurrentDir(arg1);
                if (!target) target = findFileGlobal(arg1);
                if (!target) { print('The system cannot find the file specified: ' + arg1, '#ff6b6b'); break; }
                if (target.type === 'folder') { print('Access denied.', '#ff6b6b'); break; }
                target.content = arg2;
                saveSystemData();
                print('Written to ' + arg1, promptColor);
                break;

            case 'append':
                if (!arg1 || !arg2) { print('Usage: append [file] [text]', '#f9f1a5'); break; }
                var target = findFileInCurrentDir(arg1);
                if (!target) target = findFileGlobal(arg1);
                if (!target) { print('The system cannot find the file specified: ' + arg1, '#ff6b6b'); break; }
                if (target.type === 'folder') { print('Access denied.', '#ff6b6b'); break; }
                if (typeof target.content === 'string') {
                    target.content += arg2;
                    saveSystemData();
                    print('Appended to ' + arg1, promptColor);
                } else {
                    print('Cannot append to non-text file.', '#ff6b6b');
                }
                break;

            case 'echo':
                if (!argRest) { print('ECHO is on.', '#f9f1a5'); break; }
                print(argRest);
                break;

            case 'color':
                if (!arg1) {
                    print('Sets the default console foreground and background colors.');
                    print('');
                    print('COLOR [attr]', promptColor);
                    print('');
                    print('  attr  Specifies color attribute (two hex digits)');
                    print('');
                    print('  Color attributes:', '#f9f1a5');
                    print('  0=Black     1=Blue      2=Green     3=Aqua');
                    print('  4=Red       5=Purple    6=Yellow    7=White');
                    print('  8=Gray      9=Lt Blue   A=Lt Green  B=Lt Aqua');
                    print('  C=Lt Red    D=Lt Purple E=Lt Yellow F=Bright White');
                    print('');
                    print('  Example: color 0a  (Black bg, Green fg)');
                    print('           color 1f  (Blue bg, White fg)');
                    break;
                }
                var attr = arg1.toLowerCase();
                if (attr.length === 1) {
                    var fg = COLOR_MAP[attr];
                    if (!fg) { print('Invalid color attribute', '#ff6b6b'); break; }
                    if (attr === '0') { print('Cannot set foreground and background to same color', '#ff6b6b'); break; }
                    termFgColor = fg;
                    promptColor = fg;
                    applyTermColors();
                } else if (attr.length === 2) {
                    var bg = COLOR_MAP[attr[0]];
                    var fg = COLOR_MAP[attr[1]];
                    if (!bg || !fg) { print('Invalid color attribute', '#ff6b6b'); break; }
                    if (attr[0] === attr[1]) { print('Cannot set foreground and background to same color', '#ff6b6b'); break; }
                    termBgColor = bg;
                    termFgColor = fg;
                    promptColor = fg;
                    applyTermColors();
                } else {
                    print('Invalid color attribute', '#ff6b6b');
                }
                break;

            case 'title':
                if (!arg1) { print('Usage: title [text]', '#f9f1a5'); break; }
                var titleText = argRest || 'CMQ Terminal';
                win.querySelector('.os-window-header span').textContent = titleText;
                print('Title set to: ' + titleText, promptColor);
                break;

            case 'systeminfo':
                print('');
                print('Host Name:                 CMQ-PC', promptColor);
                print('OS Name:                   CMQ OS 2026');
                print('OS Version:                2026.4.2 Build 6600');
                print('System Manufacturer:       CMQ Corporation');
                print('System Type:               x64-based PC');
                print('Processor(s):              CMQ Virtual CPU @ 3.6GHz');
                print('Total Physical Memory:     16,384 MB');
                print('Available Physical Memory: 8,192 MB');
                print('Virtual Memory: Max Size:  32,768 MB');
                print('System Boot Time:          ' + new Date().toLocaleString());
                print('');
                break;

            case 'tasklist':
                print('');
                print('Image Name            PID    Status', promptColor);
                print('====================  =====  ========');
                var wins = desktop.querySelectorAll('.os-window');
                var idx = 1000;
                for (var i = 0; i < wins.length; i++) {
                    var w = wins[i];
                    var title = w.querySelector('.os-window-header span');
                    var name = title ? title.textContent : 'Unknown';
                    if (name.length > 20) name = name.substring(0, 17) + '...';
                    while (name.length < 20) name += ' ';
                    var pid = (idx++).toString();
                    while (pid.length < 5) pid = ' ' + pid;
                    print(name + '  ' + pid + '  Running');
                }
                print('');
                break;
            case 'taskkill':
            // 解析参数
            var tkForce = false;
            var tkPID = null;
            var tkIM = null;
            for (var ti = 1; ti < parts.length; ti++) {
                var p = parts[ti];
                if (p === '/F' || p === '/f') {
                    tkForce = true;
                } else if ((p === '/PID' || p === '/pid') && ti + 1 < parts.length) {
                    tkPID = parts[++ti];
                } else if ((p === '/IM' || p === '/im') && ti + 1 < parts.length) {
                    tkIM = parts[++ti];
                }
            }

            // 如果没有指定 /PID 或 /IM，显示帮助
            if (!tkPID && !tkIM) {
                print('');
                print('TASKKILL [/F] [/PID processid | /IM imagename]', promptColor);
                print('');
                print('  /F                     指定强制终止进程。');
                print('  /PID  processid        指定要终止的进程的 PID。');
                print('                         使用 TaskList 取得 PID。');
                print('  /IM  imagename         终止进程（无法终止文件编辑器，terminal本身）');
                print('');
                break;
            }

            // 获取所有窗口并建立 PID 映射
            var tkWins = desktop.querySelectorAll('.os-window');
            var tkMap = []; // { pid, name, winEl, winId }
            var tkIdx = 1000;
            for (var twi = 0; twi < tkWins.length; twi++) {
                var tw = tkWins[twi];
                var twTitle = tw.querySelector('.os-window-header span');
                var twName = twTitle ? twTitle.textContent : 'Unknown';
                var twId = tw.id || '';
                tkMap.push({ pid: (tkIdx++).toString(), name: twName, winEl: tw, winId: twId });
            }

            // 按 /PID 终止
            if (tkPID) {
                var tkTarget = tkMap.find(function(m) { return m.pid === tkPID; });
                if (!tkTarget) {
                    print('ERROR: The process with PID ' + tkPID + ' was not found.', '#ff6b6b');
                    break;
                }
                // 检查是否是 terminal 本身
                if (tkTarget.winId === 'win-cterminal') {
                    print('ERROR: Cannot terminate the terminal process itself.', '#ff6b6b');
                    break;
                }
                // 检查是否是文件编辑器（文件编辑器窗口的 winId 以 win-runtime- 开头，排除文件夹）
                var tkFileId = tkTarget.winId.replace('win-runtime-', '');
                var tkFile = OS_DATA.files.find(function(f) { return f.id === tkFileId; });
                if (tkFile && tkFile.type !== 'folder' && tkFile.type !== 'exe') {
                    // 文件编辑器：如果没有 /F 则拒绝
                    if (!tkForce) {
                        print('ERROR: The process "' + tkTarget.name + '" (PID ' + tkTarget.pid + ') is a file editor.', '#f9f1a5');
                        print('Use /F to force termination.', '#f9f1a5');
                        break;
                    }
                }
                // 执行终止
                tkTarget.winEl.querySelector('.win-btn-close').click();
                print('SUCCESS: Sent termination signal to process "' + tkTarget.name + '" (PID ' + tkTarget.pid + ').', '#16c60c');
                break;
            }

            // 按 /IM 终止
            if (tkIM) {
                var tkMatched = tkMap.filter(function(m) {
                    return m.name.toLowerCase().indexOf(tkIM.toLowerCase()) !== -1;
                });
                if (tkMatched.length === 0) {
                    print('ERROR: The process "' + tkIM + '" was not found.', '#ff6b6b');
                    break;
                }
                var tkKilled = 0;
                var tkFailed = 0;
                for (var tki = 0; tki < tkMatched.length; tki++) {
                    var tkItem = tkMatched[tki];
                    // 不能终止 terminal 本身
                    if (tkItem.winId === 'win-cterminal') {
                        print('WARNING: Cannot terminate the terminal process itself (PID ' + tkItem.pid + ').', '#f9f1a5');
                        tkFailed++;
                        continue;
                    }
                    // 检查文件编辑器
                    var tkFileId2 = tkItem.winId.replace('win-runtime-', '');
                    var tkFile2 = OS_DATA.files.find(function(f) { return f.id === tkFileId2; });
                    if (tkFile2 && tkFile2.type !== 'folder' && tkFile2.type !== 'exe') {
                        if (!tkForce) {
                            print('WARNING: "' + tkItem.name + '" (PID ' + tkItem.pid + ') is a file editor. Use /F to force.', '#f9f1a5');
                            tkFailed++;
                            continue;
                        }
                    }
                    tkItem.winEl.querySelector('.win-btn-close').click();
                    tkKilled++;
                }
                if (tkKilled > 0) {
                    print('SUCCESS: Terminated ' + tkKilled + ' process(es) matching "' + tkIM + '".', '#16c60c');
                }
                if (tkFailed > 0) {
                    print('INFO: ' + tkFailed + ' process(es) could not be terminated.', '#f9f1a5');
                }
            }
            break;
            case 'whoami':
                print('cmq\\cmq');
                break;

            case 'hostname':
                print('CMQ-PC');
                break;

            case 'date':
                var now = new Date();
                print('The current date is: ' + now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
                break;

            case 'time':
                var now = new Date();
                print('The current time is: ' + now.toLocaleTimeString());
                break;

            case 'start':
                if (!arg1) { print('Usage: start [file]', '#f9f1a5'); break; }
                openOSFile(arg1);
                break;

            case 'explorer':
                if (typeof openExplorerWindow === 'function') {
                    openExplorerWindow();
                    print('Opened Explorer.', promptColor);
                } else {
                    print('Explorer not available.', '#ff6b6b');
                }
                break;

            case 'notepad':
                if (!arg1) {
                    if (typeof openEditorWindow === 'function') {
                        openEditorWindow();
                        print('Opened Notepad.', promptColor);
                    } else {
                        print('Notepad not available.', '#ff6b6b');
                    }
                } else {
                    var target = findFileInCurrentDir(arg1);
                    if (!target) target = findFileGlobal(arg1);
                    if (target) {
                        openAppWindow(target.id);
                        print('Opened: ' + arg1, promptColor);
                    } else {
                        var newId = 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
                        OS_DATA.files.push({ id: newId, name: arg1, type: 'txt', content: '' });
                        addFileToCurrentDir(newId);
                        saveSystemData(); renderSidebarFiles(); refreshAllExplorerWindows();
                        openAppWindow(newId);
                        print('Created and opened: ' + arg1, promptColor);
                    }
                }
                break;

            case 'tree':
                function printTree(path, prefix) {
                    var items = listDir(path);
                    for (var i = 0; i < items.length; i++) {
                        var isLast = (i === items.length - 1);
                        var connector = isLast ? '└── ' : '├── ';
                        var item = items[i];
                        print(prefix + connector + item.name, item.type === 'folder' ? '#61d6d6' : undefined);
                        if (item.type === 'folder') {
                            var childPath = (path === '/') ? '/' + item.name : path + '/' + item.name;
                            var newPrefix = prefix + (isLast ? '    ' : '│   ');
                            printTree(childPath, newPrefix);
                        }
                    }
                }
                var treePath = currentPath;
                if (arg1) treePath = resolvePath(arg1);
                print((treePath === '/' ? 'Desktop' : getPrompt()), promptColor);
                printTree(treePath, '');
                break;

            case 'pwd':
                print(currentPath === '/' ? 'Desktop' : getPrompt());
                break;

            case 'shutdown':
            case 'exit':
                win.querySelector('.win-btn-close').click();
                break;

            default:
                print('\'' + cmd + '\' is not recognized as an internal or external command,', '#ff6b6b');
                print('operable program or batch file.', '#ff6b6b');
                break;
            }
        }

        // ---- 输入处理 ----
        inputEl.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                var val = inputEl.value;
                inputEl.value = '';
                if (val.trim()) {
                    cmdHistory.push(val);
                    historyIndex = cmdHistory.length;
                }
                execute(val);
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (cmdHistory.length > 0 && historyIndex > 0) {
                    historyIndex--;
                    inputEl.value = cmdHistory[historyIndex];
                }
            }
            else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex < cmdHistory.length - 1) {
                    historyIndex++;
                    inputEl.value = cmdHistory[historyIndex];
                } else {
                    historyIndex = cmdHistory.length;
                    inputEl.value = '';
                }
            }
            else if (e.key === 'Tab') {
                e.preventDefault();
                var partial = inputEl.value.trim();
                if (partial) {
                    var items = listDir(currentPath);
                    var matches = items.filter(function(f) { return f.name.toLowerCase().startsWith(partial.toLowerCase()); });
                    if (matches.length === 1) {
                        inputEl.value = matches[0].name;
                    } else if (matches.length > 1) {
                        print(matches.map(function(f) { return f.name; }).join('  '));
                    }
                }
            }
        });

        // ---- 窗口控制 ----
        win.addEventListener('mousedown', function() { win.style.zIndex = ++zIndexCounter; }, true);
        win.querySelector('.win-btn-close').onclick = function() {
            win.remove();
            var item = taskbarMinList.querySelector('[data-win-id="' + openWinId + '"]');
            if (item) item.remove();
        };
        bindWindowDragAndResize(win, win.querySelector('.os-window-header'), win.querySelector('.os-window-resize-handle'), null);
        bindWindowControls(win, 'CMQ Terminal', null);

        inputEl.focus();
        win.addEventListener('click', function() { inputEl.focus(); });
    }
    // ==================== CTerminal END ====================
    // ===== 侧边栏全局右键菜单（新建文件/文件夹，上传文件，在终端中打开，AI对话） =====
    sidebar.addEventListener('contextmenu', function(e) {
        // 如果点击的是文件节点，让文件节点自身的右键菜单处理，不拦截
        if (e.target.closest('.file-node') || e.target.closest('.folder-children')) return;
        e.preventDefault();
        e.stopPropagation();

        const existing = shadow.querySelector('.explorer-ctx-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.className = 'explorer-ctx-menu';
        menu.style.cssText = 'position:fixed;z-index:999999;background:var(--win-bg);border:1px solid var(--win-border);border-radius:8px;padding:4px 0;box-shadow:0 8px 24px rgba(0,0,0,0.3);min-width:200px;pointer-events:auto;';

        function addRow(label, action) {
            const row = document.createElement('div');
            row.textContent = label;
            row.style.cssText = 'padding:8px 16px;cursor:pointer;font-size:13px;color:var(--text-primary);transition:background 0.1s;';
            row.addEventListener('mouseenter', function() { row.style.background = 'rgba(255,255,255,0.1)'; });
            row.addEventListener('mouseleave', function() { row.style.background = 'transparent'; });
            row.addEventListener('click', function() { menu.remove(); action(); });
            menu.appendChild(row);
        }

        // 分隔线
        function addDivider() {
            const divider = document.createElement('div');
            divider.style.cssText = 'height:1px;background:var(--win-border);margin:4px 0;';
            menu.appendChild(divider);
        }

        addRow('📄 新建文件', function() { createNewFile('txt'); });
        addRow('📁 新建文件夹', function() { createNewFile('folder'); });
        addDivider();
        addRow('📤 上传文件', function() {
            var input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = '.txt,.cpp,.md,.html,.json,.csv,.js,.py,.css,.xml,.log,.xlsx,.docx';
            input.onchange = function(ev) {
                Array.from(ev.target.files).forEach(function(f) {
                    var reader = new FileReader();
                    reader.onload = function(evt) {
                        var ext = f.name.split('.').pop().toLowerCase();
                        var type = 'txt';
                        if (ext === 'cpp' || ext === 'c' || ext === 'h') type = 'cpp';
                        else if (ext === 'cmt') type = 'cmt';
                        else if (ext === 'md') type = 'md';
                        else if (ext === 'xlsx' || ext === 'xls') type = 'xlsx';
                        else if (ext === 'docx' || ext === 'doc') type = 'docx';
                        var newFile = { id: 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2,6), name: f.name, type: type, content: evt.target.result };
                        OS_DATA.files.push(newFile);
                        saveSystemData();
                        renderSidebarFiles();
                        refreshAllExplorerWindows();
                    };
                    reader.readAsText(f);
                });
            };
            input.click();
        });
        addDivider();
        addRow('💻 在终端中打开', function() { openCTerminal(); });
        addRow('🤖 AI 对话', function() { openAIChatWindow(); });
        addDivider();
        addRow('🗑️ 回收站', function() { openTrashBinWindow(); });
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        shadow.appendChild(menu);

        // 边界修正
        requestAnimationFrame(function() {
            if (e.clientX + menu.offsetWidth > window.innerWidth) menu.style.left = (window.innerWidth - menu.offsetWidth - 4) + 'px';
            if (e.clientY + menu.offsetHeight > window.innerHeight) menu.style.top = (window.innerHeight - menu.offsetHeight - 4) + 'px';
        });

        // 点击其他区域关闭菜单
        setTimeout(function() {
            var closeHandler = function(ev) {
                if (!menu.contains(ev.target)) {
                    menu.remove();
                    shadow.removeEventListener('click', closeHandler, true);
                    shadow.removeEventListener('contextmenu', closeHandler, true);
                }
            };
            shadow.addEventListener('click', closeHandler, true);
            shadow.addEventListener('contextmenu', closeHandler, true);
        }, 10);
    });
    renderSidebarFiles();
})();