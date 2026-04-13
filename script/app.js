(function() {
    const titleInput = document.getElementById('title');
    const categorySelect = document.getElementById('category');
    const prioritySelect = document.getElementById('priority');
    const dateInput = document.getElementById('dueDate');
    const addBtn = document.getElementById('addTaskBtn');
    const taskListContainer = document.getElementById('tasklist');
    const themeToggle = document.getElementById('theme-toggle');

    const STORAGE_KEY = 'jipangenow_editable_tasks';

    function loadTasks() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    function saveTasks(tasks) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    function isOverdue(dateString) {
        if (!dateString) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(dateString);
        return dueDate < today;
    }

    function renderTasks(tasks) {
        if (!taskListContainer) return;
        taskListContainer.innerHTML = '';

        tasks.forEach((task, idx) => {
            const card = document.createElement('div');
            card.className = `task-card ${task.isDone ? 'completed' : ''} ${!task.isDone && isOverdue(task.dueDate) ? 'overdue' : ''}`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'task-content';

            // --- DONE CHECKBOX ---
            const doneCheck = document.createElement('input');
            doneCheck.type = 'checkbox';
            doneCheck.className = 'task-checkbox';
            doneCheck.checked = task.isDone || false;
            doneCheck.onclick = (e) => {
                e.stopPropagation();
                tasks[idx].isDone = doneCheck.checked;
                saveTasks(tasks);
                renderTasks(tasks);
            };

            const titleEl = document.createElement('div');
            titleEl.className = 'task-title';
            titleEl.textContent = task.title;

            const metaDiv = document.createElement('div');
            metaDiv.className = 'task-meta';

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'task-actions';

            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            const saveBtn = document.createElement('button');
            saveBtn.textContent = '💾';
            saveBtn.style.display = 'none';
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';

            const renderViewMode = () => {
                const overdueTag = (!task.isDone && isOverdue(task.dueDate)) ? '<span class="overdue-badge">⚠️ OVERDUE</span>' : '';
                metaDiv.innerHTML = `
                    <span class="priority-badge">${task.priority.toUpperCase()}</span>
                    <span class="category-badge">${task.category}</span>
                    ${task.dueDate ? `<span class="date-badge">📅 ${task.dueDate}</span>` : ''}
                    ${overdueTag}
                `;
            };
            renderViewMode();

            editBtn.onclick = () => {
                card.classList.add('edit-mode');
                editBtn.style.display = 'none';
                saveBtn.style.display = 'inline-block';
                titleEl.setAttribute('contenteditable', 'true');
                titleEl.focus();

                metaDiv.innerHTML = `
                    <select id="edit-priority-${idx}">
                        <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                        <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                    </select>
                    <select id="edit-category-${idx}">
                        <option value="work" ${task.category === 'work' ? 'selected' : ''}>Work</option>
                        <option value="Personal" ${task.category === 'Personal' ? 'selected' : ''}>Personal</option>
                        <option value="Study" ${task.category === 'Study' ? 'selected' : ''}>Study</option>
                    </select>
                    <input type="date" id="edit-date-${idx}" value="${task.dueDate || ''}">
                `;
            };

            saveBtn.onclick = () => {
                const newTitle = titleEl.textContent.trim();
                if (!newTitle) return alert("Title required");

                tasks[idx] = {
                    ...tasks[idx],
                    title: newTitle,
                    priority: document.getElementById(`edit-priority-${idx}`).value,
                    category: document.getElementById(`edit-category-${idx}`).value,
                    dueDate: document.getElementById(`edit-date-${idx}`).value
                };

                saveTasks(tasks);
                renderTasks(tasks);
            };

            deleteBtn.onclick = () => {
                tasks.splice(idx, 1);
                saveTasks(tasks);
                renderTasks(tasks);
            };

            contentDiv.append(doneCheck, titleEl, metaDiv);
            actionsDiv.append(editBtn, saveBtn, deleteBtn);
            card.append(contentDiv, actionsDiv);
            taskListContainer.appendChild(card);
        });
    }

    function addNewTask() {
        if (!titleInput.value.trim()) return alert("Enter a title");
        const tasks = loadTasks();
        tasks.unshift({
            title: titleInput.value.trim(),
            category: categorySelect.value,
            priority: prioritySelect.value,
            dueDate: dateInput.value,
            isDone: false,
            createdAt: Date.now()
        });
        saveTasks(tasks);
        renderTasks(tasks);
        titleInput.value = '';
        dateInput.value = '';
    }

    themeToggle.onclick = () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('jipange_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    };

    if (localStorage.getItem('jipange_theme') === 'dark') document.body.classList.add('dark');
    addBtn.onclick = addNewTask;
    renderTasks(loadTasks());
})();