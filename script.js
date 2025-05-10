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
        if (todo.status === '已完成') return; // 主页面不显示已完成
        const tr = document.createElement('tr');
        if (editingIdx === idx) {
            // 编辑模式
            tr.innerHTML = `
                <td><input type="text" value="${todo.description}" id="edit-desc-${idx}" style="width:95%"></td>
                <td><input type="date" value="${formatDateForInput(todo.dueDate)}" id="edit-due-${idx}"></td>
                <td>${calcRemainDays(todo.dueDate)}</td>
                <td><input type="text" value="${todo.stakeholder}" id="edit-stake-${idx}" style="width:90%"></td>
                <td><textarea id="edit-note-${idx}" style="width:90%;resize:vertical;">${todo.note}</textarea></td>
                <td>
                    <select id="edit-status-${idx}">
                        <option value="未开始" ${todo.status === '未开始' ? 'selected' : ''}>未开始</option>
                        <option value="进行中" ${todo.status === '进行中' ? 'selected' : ''}>进行中</option>
                        <option value="已完成" ${todo.status === '已完成' ? 'selected' : ''}>已完成</option>
                        <option value="延期" ${todo.status === '延期' ? 'selected' : ''}>延期</option>
                        <option value="跨周期" ${todo.status === '跨周期' ? 'selected' : ''}>跨周期</option>
                    </select>
                </td>
                <td>
                    ${(todo.remindTime ? `时间:${todo.remindTime}<br>` : '') + (todo.remindDays !== null && todo.remindDays !== undefined ? `提前:${todo.remindDays}天` : '')}
                </td>
                <td>
                    <input type="file" id="edit-image-${idx}" accept="image/*">
                    ${todo.image ? `<img src="${todo.image}" style="max-width:100px;max-height:100px;">` : ''}
                </td>
                <td>
                    <button class="action-btn" onclick="saveEdit(${idx})">保存</button>
                    <button class="action-btn" style="background:#aaa" onclick="cancelEdit()">取消</button>
                </td>
            `;
        } else {
            // 普通显示模式
            const tdDesc = document.createElement('td');
            tdDesc.textContent = todo.description;
            tr.appendChild(tdDesc);

            const tdDue = document.createElement('td');
            tdDue.textContent = todo.dueDate;
            tr.appendChild(tdDue);

            const tdRemain = document.createElement('td');
            tdRemain.textContent = calcRemainDays(todo.dueDate);
            tr.appendChild(tdRemain);

            const tdStake = document.createElement('td');
            tdStake.textContent = todo.stakeholder;
            tr.appendChild(tdStake);

            const tdNote = document.createElement('td');
            tdNote.innerHTML = todo.note.replace(/\n/g, '<br>');
            tr.appendChild(tdNote);

            const tdStatus = document.createElement('td');
            tdStatus.textContent = todo.status;
            tr.appendChild(tdStatus);

            const tdRemind = document.createElement('td');
            tdRemind.innerHTML =
                (todo.remindTime ? `时间:${todo.remindTime}<br>` : '') +
                (todo.remindDays !== null && todo.remindDays !== undefined ? `提前:${todo.remindDays}天` : '');
            tr.appendChild(tdRemind);

            const tdImage = document.createElement('td');
            if (todo.image) {
                const img = document.createElement('img');
                img.src = todo.image;
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                tdImage.appendChild(img);
            }
            tr.appendChild(tdImage);

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
    const imageFile = document.getElementById('image').files[0];
    let imageBase64 = null;
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            imageBase64 = event.target.result;
            const todo = {
                description: descriptionInput.value.trim(),
                dueDate: dueDateInput.value,
                stakeholder: stakeholderInput.value.trim(),
                note: noteInput.value.trim(),
                status: document.getElementById('status').value,
                createdAt: new Date().toISOString(),
                remindTime: document.getElementById('remindTime').value || '',
                remindDays: document.getElementById('remindDays').value !== '' ? parseInt(document.getElementById('remindDays').value, 10) : null,
                reminded: false,
                overdueReminded: false,
                image: imageBase64
            };
            todos.push(todo);
            saveTodos();
            renderTodos();
            todoForm.reset();
        };
        reader.readAsDataURL(imageFile);
    } else {
        const todo = {
            description: descriptionInput.value.trim(),
            dueDate: dueDateInput.value,
            stakeholder: stakeholderInput.value.trim(),
            note: noteInput.value.trim(),
            status: document.getElementById('status').value,
            createdAt: new Date().toISOString(),
            remindTime: document.getElementById('remindTime').value || '',
            remindDays: document.getElementById('remindDays').value !== '' ? parseInt(document.getElementById('remindDays').value, 10) : null,
            reminded: false,
            overdueReminded: false,
            image: null
        };
        todos.push(todo);
        saveTodos();
        renderTodos();
        todoForm.reset();
    }
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
    const status = document.getElementById(`edit-status-${idx}`).value;
    const imageFile = document.getElementById(`edit-image-${idx}`).files[0];
    let imageBase64 = todos[idx].image;
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            imageBase64 = event.target.result;
            todos[idx] = {
                ...todos[idx],
                description: desc,
                dueDate: due,
                stakeholder: stake,
                note: note,
                status: status,
                image: imageBase64
            };
            saveTodos();
            editingIdx = null;
            renderTodos();
        };
        reader.readAsDataURL(imageFile);
    } else {
        todos[idx] = {
            ...todos[idx],
            description: desc,
            dueDate: due,
            stakeholder: stake,
            note: note,
            status: status
        };
        saveTodos();
        editingIdx = null;
        renderTodos();
    }
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

function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
} 
