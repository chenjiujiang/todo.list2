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

// 渲染任务列表
function renderTodos() {
    todoTableBody.innerHTML = '';
    todos.forEach((todo, idx) => {
        const tr = document.createElement('tr');

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

        // 操作
        const tdAction = document.createElement('td');
        const delBtn = document.createElement('button');
        delBtn.className = 'action-btn';
        delBtn.textContent = '删除';
        delBtn.onclick = () => deleteTodo(idx);
        tdAction.appendChild(delBtn);
        tr.appendChild(tdAction);

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
        createdAt: new Date().toISOString()
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