// ... 现有代码 ...
let editingIdx = null;

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
            // ... 现有代码 ...
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
            tdNote.textContent = todo.note;
            tr.appendChild(tdNote);

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

// ... 其余代码保持不变 ...
