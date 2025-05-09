// ... 现有代码 ...
const globalReminderKey = 'globalReminderSettings';

// 读取全局提醒设置
function loadGlobalReminder() {
    const settings = JSON.parse(localStorage.getItem(globalReminderKey)) || {
        time: '09:00',
        count: 1,
        days: 1
    };
    document.getElementById('global-remind-time').value = settings.time;
    document.getElementById('global-remind-count').value = settings.count;
    document.getElementById('global-remind-days').value = settings.days;
    return settings;
}

// 保存全局提醒设置
function saveGlobalReminder(e) {
    e.preventDefault();
    const time = document.getElementById('global-remind-time').value;
    const count = parseInt(document.getElementById('global-remind-count').value, 10);
    const days = parseInt(document.getElementById('global-remind-days').value, 10);
    localStorage.setItem(globalReminderKey, JSON.stringify({ time, count, days }));
    alert('全局提醒设置已保存！');
}

// 新增任务时支持单任务提醒设置
function addTodo(e) {
    e.preventDefault();
    const todo = {
        description: descriptionInput.value.trim(),
        dueDate: dueDateInput.value,
        stakeholder: stakeholderInput.value.trim(),
        note: noteInput.value.trim(),
        progress: parseInt(progressInput.value, 10),
        createdAt: new Date().toISOString(),
        remindTime: document.getElementById('remindTime').value || '',
        remindDays: document.getElementById('remindDays').value !== '' ? parseInt(document.getElementById('remindDays').value, 10) : null,
        reminded: false, // 标记是否已提醒
        overdueReminded: false // 标记是否已过期提醒
    };
    todos.push(todo);
    saveTodos();
    renderTodos();
    todoForm.reset();
    progressValue.value = 0;
}

// 渲染任务时显示提醒设置
function renderTodos() {
    todoTableBody.innerHTML = '';
    todos.forEach((todo, idx) => {
        const tr = document.createElement('tr');
        if (editingIdx === idx) {
            // ...编辑模式同前...
        } else {
            // ...普通显示模式同前...
            // ...前面代码省略...
            const tdProgress = document.createElement('td');
            const bar = document.createElement('div');
            bar.className = 'progress-bar';
            const barInner = document.createElement('div');
            barInner.className = 'progress-bar-inner';
            barInner.style.width = todo.progress + '%';
            bar.appendChild(barInner);
            const label = document.createElement('span');
            label.className = 'progress-label';
            label.textContent = todo.progress + '%';
            tdProgress.appendChild(bar);
            tdProgress.appendChild(label);
            tr.appendChild(tdProgress);

            // 提醒设置
            const tdRemind = document.createElement('td');
            tdRemind.innerHTML =
                (todo.remindTime ? `时间:${todo.remindTime}<br>` : '') +
                (todo.remindDays !== null && todo.remindDays !== undefined ? `提前:${todo.remindDays}天` : '');
            tr.appendChild(tdRemind);

            // 操作
            const tdAction = document.createElement('td');
            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn';
            editBtn.style.background = '#27ae60';
            editBtn.textContent = '编辑';
            editBtn.onclick = () => startEdit(idx);
            tdAction.appendChild(editBtn);
            const delBtn = document.createElement('button');
            delBtn.className = 'action-btn';
            delBtn.textContent = '删除';
            delBtn.onclick = () => deleteTodo(idx);
            tdAction.appendChild(delBtn);
            tr.appendChild(tdAction);
        }
        todoTableBody.appendChild(tr);
    });
}

// 通知权限
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}
requestNotificationPermission();

// 定时检查任务，满足条件时提醒
function checkReminders() {
    const now = new Date();
    const globalSettings = loadGlobalReminder();
    todos.forEach((todo, idx) => {
        // 计算剩余天数
        const remainDays = calcRemainDaysNum(todo.dueDate);
        // 1. 过期提醒
        if (remainDays < 0 && !todo.overdueReminded) {
            sendReminder(`任务已过期：${todo.description}`);
            todo.overdueReminded = true;
            saveTodos();
        }
        // 2. 临期提醒（全局或单任务）
        const remindDays = todo.remindDays !== null && todo.remindDays !== undefined ? todo.remindDays : globalSettings.days;
        if (remainDays === remindDays && !todo.reminded) {
            sendReminder(`任务临近：${todo.description}，还剩${remainDays}天`);
            todo.reminded = true;
            saveTodos();
        }
        // 3. 每天定时提醒（全局或单任务）
        const remindTimes = [];
        if (todo.remindTime) {
            remindTimes.push(todo.remindTime);
        } else {
            for (let i = 0; i < globalSettings.count; i++) {
                // 多次提醒均匀分布
                const [h, m] = globalSettings.time.split(':').map(Number);
                const minutes = h * 60 + m + Math.floor((i * 1440) / globalSettings.count);
                const hour = Math.floor(minutes / 60) % 24;
                const minute = minutes % 60;
                remindTimes.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
            }
        }
        remindTimes.forEach(remindTime => {
            if (isNowTime(remindTime) && remainDays >= 0) {
                sendReminder(`待办提醒：${todo.description}，截止${todo.dueDate}`);
            }
        });
    });
}

function isNowTime(remindTime) {
    const now = new Date();
    const [h, m] = remindTime.split(':').map(Number);
    return now.getHours() === h && now.getMinutes() === m;
}

function calcRemainDaysNum(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function sendReminder(msg) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(msg);
    } else {
        alert(msg);
    }
}

// 每分钟检查一次
setInterval(checkReminders, 60 * 1000);

// 页面加载时初始化提醒设置
loadGlobalReminder();

// ... 其余代码保持不变 ...
