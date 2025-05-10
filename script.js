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

// 示例数据结构
const stages = [
  {
    name: "需求阶段",
    expanded: true,
    tasks: [
      { description: "需求分析", start: "2025-05-12", end: "2025-05-15", status: "未开始", stakeholder: "张三", note: "分析需求", image: null },
      { description: "需求初审", start: "2025-05-16", end: "2025-05-16", status: "未开始", stakeholder: "李四", note: "初步评审", image: null }
    ]
  },
  {
    name: "开发阶段",
    expanded: true,
    tasks: [
      { description: "方案设计", start: "2025-05-19", end: "2025-05-21", status: "未开始", stakeholder: "王五", note: "设计方案", image: null }
    ]
  }
];

// 时间轴范围（静态：2025-05-10 ~ 2025-05-25）
const ganttStart = new Date("2025-05-10");
const ganttEnd = new Date("2025-05-25");
const dayCount = Math.ceil((ganttEnd - ganttStart) / (1000*60*60*24)) + 1;

// 工具函数：生成任务详情HTML
function getTaskDetailHTML(task) {
  return `
    <div class="task-detail-popup">
      <strong>${task.description}</strong><br>
      <span>起: ${task.start}</span><br>
      <span>止: ${task.end}</span><br>
      <span>状态: ${task.status}</span><br>
      <span>干系人: ${task.stakeholder}</span><br>
      <span>备注: ${task.note ? task.note.replace(/\n/g, '<br>') : ''}</span><br>
      ${task.image ? `<img src="${task.image}" style="max-width:120px;max-height:80px;display:block;margin:4px 0;">` : ''}
      ${task.remindTime ? `<span>提醒时间: ${task.remindTime}</span><br>` : ''}
      ${task.remindDays !== null && task.remindDays !== undefined ? `<span>提前提醒: ${task.remindDays}天</span><br>` : ''}
    </div>
  `;
}

// 悬停详情：用于甘特条和任务列表项
function attachTaskHoverDetail(dom, task) {
  let popup;
  dom.addEventListener('mouseenter', e => {
    popup = document.createElement('div');
    popup.className = 'task-detail-popup-outer';
    popup.innerHTML = getTaskDetailHTML(task);
    document.body.appendChild(popup);
    const rect = dom.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.left = (rect.right + 10) + 'px';
    popup.style.top = (rect.top) + 'px';
    popup.style.zIndex = 9999;
  });
  dom.addEventListener('mouseleave', e => {
    if (popup) popup.remove();
  });
}

// 弹出编辑表单
function showEditTaskForm(stageIdx, taskIdx) {
  const task = stages[stageIdx].tasks[taskIdx];
  // 简单弹窗表单
  const formHtml = `
    <div class="edit-task-modal-bg" id="editTaskModalBg"></div>
    <div class="edit-task-modal" id="editTaskModal">
      <h3>编辑任务</h3>
      <form id="editTaskForm">
        <label>描述：<input type="text" id="edit-desc" value="${task.description}" required></label><br>
        <label>起始日期：<input type="date" id="edit-start" value="${task.start}" required></label><br>
        <label>结束日期：<input type="date" id="edit-end" value="${task.end}" required></label><br>
        <label>干系人：<input type="text" id="edit-stakeholder" value="${task.stakeholder}" required></label><br>
        <label>备注：<textarea id="edit-note" rows="3" style="width:90%;resize:vertical;">${task.note || ''}</textarea></label><br>
        <label>状态：<select id="edit-status">
          <option value="未开始" ${task.status === '未开始' ? 'selected' : ''}>未开始</option>
          <option value="进行中" ${task.status === '进行中' ? 'selected' : ''}>进行中</option>
          <option value="已完成" ${task.status === '已完成' ? 'selected' : ''}>已完成</option>
          <option value="延期" ${task.status === '延期' ? 'selected' : ''}>延期</option>
          <option value="跨周期" ${task.status === '跨周期' ? 'selected' : ''}>跨周期</option>
        </select></label><br>
        <label>提醒时间：<input type="time" id="edit-remindTime" value="${task.remindTime || ''}"></label><br>
        <label>提前提醒天数：<input type="number" id="edit-remindDays" min="0" max="30" value="${task.remindDays !== null && task.remindDays !== undefined ? task.remindDays : ''}"></label><br>
        <label>图片：<input type="file" id="edit-image" accept="image/*"></label><br>
        ${task.image ? `<img src="${task.image}" style="max-width:100px;max-height:80px;display:block;margin:4px 0;">` : ''}
        <div style="margin-top:10px;text-align:right;">
          <button type="submit">保存</button>
          <button type="button" onclick="closeEditTaskModal()">取消</button>
        </div>
      </form>
    </div>
  `;
  const modalDiv = document.createElement('div');
  modalDiv.innerHTML = formHtml;
  document.body.appendChild(modalDiv);
  document.getElementById('editTaskForm').onsubmit = function(e) {
    e.preventDefault();
    // 处理图片
    const imageFile = document.getElementById('edit-image').files[0];
    function doSave(imageBase64) {
      task.description = document.getElementById('edit-desc').value.trim();
      task.start = document.getElementById('edit-start').value;
      task.end = document.getElementById('edit-end').value;
      task.stakeholder = document.getElementById('edit-stakeholder').value.trim();
      task.note = document.getElementById('edit-note').value.trim();
      task.status = document.getElementById('edit-status').value;
      task.remindTime = document.getElementById('edit-remindTime').value;
      task.remindDays = document.getElementById('edit-remindDays').value !== '' ? parseInt(document.getElementById('edit-remindDays').value, 10) : null;
      if (imageBase64 !== undefined) task.image = imageBase64;
      renderStageTree();
      renderGanttChart();
      closeEditTaskModal();
    }
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = function(event) {
        doSave(event.target.result);
      };
      reader.readAsDataURL(imageFile);
    } else {
      doSave();
    }
  };
  window.closeEditTaskModal = function() {
    modalDiv.remove();
    delete window.closeEditTaskModal;
  };
}

// 删除任务
function deleteTask(stageIdx, taskIdx) {
  if (confirm('确定要删除该任务吗？')) {
    stages[stageIdx].tasks.splice(taskIdx, 1);
    renderStageTree();
    renderGanttChart();
  }
}

// 任务项和甘特条添加操作按钮
function renderStageTree() {
  const tree = document.getElementById('stageTree');
  tree.innerHTML = '';
  stages.forEach((stage, sIdx) => {
    const stageDiv = document.createElement('div');
    stageDiv.className = 'stage-group';
    // 阶段标题可点击
    const titleDiv = document.createElement('div');
    titleDiv.className = 'stage-title';
    titleDiv.textContent = stage.name + (stage.expanded ? ' ▼' : ' ▶');
    titleDiv.style.cursor = 'pointer';
    titleDiv.onclick = () => {
      stage.expanded = !stage.expanded;
      renderStageTree();
      renderGanttChart();
    };
    stageDiv.appendChild(titleDiv);
    // 任务列表
    if (stage.expanded) {
      const ul = document.createElement('ul');
      ul.className = 'task-list';
      stage.tasks.forEach((task, tIdx) => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `<span>${task.description}</span> <button class='task-op-btn' onclick='showEditTaskForm(${sIdx},${tIdx})'>编辑</button> <button class='task-op-btn' onclick='deleteTask(${sIdx},${tIdx})'>删除</button>`;
        attachTaskHoverDetail(li, task);
        ul.appendChild(li);
      });
      stageDiv.appendChild(ul);
    }
    tree.appendChild(stageDiv);
  });
}

function renderGanttChart() {
  const chart = document.getElementById('ganttChart');
  chart.innerHTML = '';
  let barIdx = 0;
  stages.forEach((stage, sIdx) => {
    if (!stage.expanded) return;
    stage.tasks.forEach((task, tIdx) => {
      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      // 计算横向位置和宽度
      const start = Math.max(0, Math.floor((new Date(task.start) - ganttStart) / (1000*60*60*24)));
      const end = Math.min(dayCount-1, Math.floor((new Date(task.end) - ganttStart) / (1000*60*60*24)));
      bar.style.left = (start * 40) + 'px'; // 40px/天
      bar.style.width = ((end-start+1) * 40) + 'px';
      bar.style.top = (barIdx * 36) + 'px';
      bar.innerHTML = `<span class=\"gantt-bar-label\">${task.description}</span> <button class='task-op-btn' onclick='showEditTaskForm(${sIdx},${tIdx})'>编辑</button> <button class='task-op-btn' onclick='deleteTask(${sIdx},${tIdx})'>删除</button>`;
      attachTaskHoverDetail(bar, task);
      chart.appendChild(bar);
      barIdx++;
    });
  });
  chart.style.height = (barIdx * 36 + 20) + 'px';
}

// 初始化渲染
renderStageTree();
renderGanttHeader();
renderGanttChart();

// 任务添加功能
function addTask(e) {
  e.preventDefault();
  const desc = document.getElementById('description').value.trim();
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;
  const stakeholder = document.getElementById('stakeholder').value.trim();
  const note = document.getElementById('note').value.trim();
  const status = document.getElementById('status').value;
  const stageName = document.getElementById('stage').value.trim();
  const remindTime = document.getElementById('remindTime').value || '';
  const remindDays = document.getElementById('remindDays').value !== '' ? parseInt(document.getElementById('remindDays').value, 10) : null;
  const imageFile = document.getElementById('image').files[0];

  function doAdd(imageBase64) {
    // 查找或新建阶段
    let stage = stages.find(s => s.name === stageName);
    if (!stage) {
      stage = { name: stageName, expanded: true, tasks: [] };
      stages.push(stage);
    }
    stage.tasks.push({
      description: desc,
      start,
      end,
      stakeholder,
      note,
      status,
      remindTime,
      remindDays,
      image: imageBase64 || null
    });
    renderStageTree();
    renderGanttChart();
    document.getElementById('taskForm').reset();
  }

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function(event) {
      doAdd(event.target.result);
    };
    reader.readAsDataURL(imageFile);
  } else {
    doAdd(null);
  }
}

// 绑定表单事件
window.addTask = addTask; 
