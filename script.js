// ====== 全局提醒相关 ======
const globalReminderKey = 'globalReminderSettings';

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

function saveGlobalReminder(e) {
    e.preventDefault();
    const time = document.getElementById('global-remind-time').value;
    const count = parseInt(document.getElementById('global-remind-count').value, 10);
    const days = parseInt(document.getElementById('global-remind-days').value, 10);
    localStorage.setItem(globalReminderKey, JSON.stringify({ time, count, days }));
    alert('全局提醒设置已保存！');
}

// ====== 甘特图数据与渲染 ======

// 示例数据结构
const stages = [
  {
    name: "需求阶段",
    expanded: true,
    tasks: [
      { description: "需求分析", start: "2025-05-12", end: "2025-05-15", status: "未开始", stakeholder: "张三", note: "分析需求", image: null }
    ]
  }
];

// 时间轴范围（静态：2025-05-10 ~ 2025-05-25）
const ganttStart = new Date("2025-05-10");
const ganttEnd = new Date("2025-05-25");
const dayCount = Math.ceil((ganttEnd - ganttStart) / (1000*60*60*24)) + 1;

// 渲染时间轴
function renderGanttHeader() {
  const header = document.getElementById('ganttHeader');
  header.innerHTML = '';
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(ganttStart.getTime() + i*24*60*60*1000);
    const cell = document.createElement('div');
    cell.className = 'gantt-header-cell';
    cell.textContent = `${d.getMonth()+1}/${d.getDate()}`;
    header.appendChild(cell);
  }
}

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
window.saveGlobalReminder = saveGlobalReminder;
