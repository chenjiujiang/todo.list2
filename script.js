window.onload = function() {
    // 获取DOM元素
    window.todoForm = document.getElementById('todoForm');
    window.descriptionInput = document.getElementById('description');
    window.dueDateInput = document.getElementById('dueDate');
    window.stakeholderInput = document.getElementById('stakeholder');
    window.noteInput = document.getElementById('note');
    window.progressInput = document.getElementById('progress');
    window.progressValue = document.getElementById('progressValue');
    window.todoTableBody = document.getElementById('todoTableBody');

    // 本地存储加载
    let todos = JSON.parse(localStorage.getItem('projectTodos')) || [];
    let editingIdx = null;

    const globalReminderKey = 'globalReminderSettings';

    // 读取全局提醒设置
    loadGlobalReminder();
    // 首次渲染
    renderTodos();
};

// 获取DOM元素
const todoForm = document.getElementById('todoForm');
const descriptionInput = document.getElementById('description');
const dueDateInput = document.getElementById('dueDate');
const stakeholderInput = document.getElementById('stakeholder');
const noteInput = document.getElementById('note');
const progressInput = document.getElementById('progress');
const progressValue = document.getElementById('progressValue');
const todoTableBody = document.getElementById('todoTableBody');

// 本地存储加载
let todos = JSON.parse(localStorage.getItem('projectTodos')) || [];
let editingIdx = null;

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

// 渲染任务列表
function renderTodos() {
    todoTableBody.innerHTML = '';
    todos.forEach((todo, idx) => {
        const tr = document.createElement('tr');

        if (editingIdx === idx) {
            // 编辑模式
            tr.innerHTML = `
                <td><input type="text" value="${todo.description}" id="edit-desc-${idx}" style="width:95%"></td>
                <td><input type="date" value="${todo.dueDate}" id="edit-due-${idx}"></td>
                <td>${calcRemainDays(todo.dueDate)}</td>
                <td><input type="text" value="${todo.stakeholder}" id="edit-stake-${idx}" style="width:90%"></td>
                <td><input type="text" value="${todo.note}" id="edit-note-${idx}" style="width:90%"></td>
                <td>
                    <input type="range" min="0" max="100" value="${todo.progress}" id="edit-progress-${idx}" oninput="document.getElementById('edit-progress-label-${idx}').textContent=this.value+'%'">
                    <span id="edit-progress-label-${idx}">${todo.progress}%</span>
                </td>
                <td>
                    <button class="action-btn" onclick="saveEdit(${idx})">保存</button>
                    <button class="action-btn" style="background:#aaa" onclick="cancelEdit()">取消</button>
                </td>
            `;
        } else {
            // 普通显示模式
            // 描述
            const tdDesc = document.createElement('td');
            tdDesc.textContent = todo.description;
            tr.appendChild(tdDesc);

            // 预计结束日期
            const tdDue = document.createElement('td');
            tdDue.textContent = todo.dueDate;
            tr.appendChild(tdDue);

            // 剩余天数
            const tdRemain = document.createElement('td');
            tdRemain.textContent = calcRemainDays(todo.dueDate);
            tr.appendChild(tdRemain);

            // 干系人
            const tdStake = document.createElement('td');
            tdStake.textContent = todo.stakeholder;
            tr.appendChild(tdStake);

            // 备注
            const tdNote = document.createElement('td');
            tdNote.textContent = todo.note;
            tr.appendChild(tdNote);

            // 进度
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

// 计算剩余天数
function calcRemainDays(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (isNaN(diff)) return '-';
    return diff >= 0 ? diff + ' 天' : '已超期';
}

// 添加任务
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

// 删除任务
function deleteTodo(idx) {
    todos.splice(idx, 1);
    saveTodos();
    renderTodos();
}

// 保存到本地
function saveTodos() {
    localStorage.setItem('projectTodos', JSON.stringify(todos));
}

// 初始化进度条数值
progressInput.addEventListener('input', () => {
    progressValue.value = progressInput.value;
});

// 首次渲染
renderTodos();

function startEdit(idx) {
    editingIdx = idx;
    renderTodos();
}

function cancelEdit() {
    editingIdx = null;
    renderTodos();
}

function saveEdit(idx) {
    const desc = document.getElementById(`edit-desc-${idx}`).value.trim();
    const due = document.getElementById(`edit-due-${idx}`).value;
    const stake = document.getElementById(`edit-stake-${idx}`).value.trim();
    const note = document.getElementById(`edit-note-${idx}`).value.trim();
    const progress = parseInt(document.getElementById(`edit-progress-${idx}`).value, 10);
    todos[idx] = {
        ...todos[idx],
        description: desc,
        dueDate: due,
        stakeholder: stake,
        note: note,
        progress: progress
    };
    saveTodos();
    editingIdx = null;
    renderTodos();
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
    // 已去除闹钟铃声播放
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

// 在文件末尾挂载全局函数
window.addTodo = addTodo;
window.saveGlobalReminder = saveGlobalReminder; 
