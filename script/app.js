(function() {
    const titleInput = document.getElementById('title');
    const categorySelect = document.getElementById('category');
    const prioritySelect = document.getElementById('priority');
    const dateInput = document.getElementById('dueDate');
    const addBtn = document.getElementById('addTaskBtn');
    const taskListContainer = document.getElementById('tasklist');
    const themeToggle = document.getElementById('theme-toggle');
    const bubble = document.getElementById('bubble-pop');

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

    // --- PROGRESS BUBBLE LOGIC ---
    function updateProgress() {
        const tasks = loadTasks();
        if (!bubble) return;

        if (tasks.length === 0) {
            bubble.textContent = "0%";
            bubble.style.transform = "scale(1)";
            bubble.classList.remove('burst');
            return;
        }

        const completedCount = tasks.filter(t => t.isDone).length;
        const percent = Math.round((completedCount / tasks.length) * 100);
        
        // Handle the Burst effect at 100%
        if (percent === 100 && !bubble.classList.contains('burst')) {
            bubble.textContent = `${percent}%`;
            bubble.style.transform = "scale(2)"; 
            bubble.classList.add('burst');
            
            setTimeout(() => {
                bubble.textContent = "💥";
                setTimeout(() => {
                    bubble.classList.remove('burst');
                    // Recalculate to reset the visual state after the pop
                    updateProgress();
                }, 1500);
            }, 500);
        } else if (percent < 100) {
            bubble.classList.remove('burst');
            bubble.textContent = `${percent}%`;
            // Scale grows between 1.0 and 1.8 based on progress
            const scaleValue = 1 + (percent / 125); 
            bubble.style.transform = `scale(${scaleValue})`;
        }
    }

    // --- RENDERING LOGIC ---
    function renderTasks(tasks) {
        if (!taskListContainer) return;
        taskListContainer.innerHTML = '';
        updateProgress();

        tasks.forEach((task, idx) => {
            const card = document.createElement('div');
            // 'completed' class handles the strike-through via CSS
            card.className = `task-card ${task.isDone ? 'completed' : ''} ${!task.isDone && isOverdue(task.dueDate) ? 'overdue' : ''}`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'task-content';

            const doneCheck = document.createElement('input');
            doneCheck.type = 'checkbox';
            doneCheck.className = 'task-checkbox';
            doneCheck.checked = task.isDone || false;
            doneCheck.onchange = () => {
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
                const categoryIcons = {
                    work: '💼', Personal: '🧘', Study: '📚', 
                    Finances: '💰', Health: '🏥', Spirituality: '✨'
                };
                metaDiv.innerHTML = `
                    <span class="priority-badge">${task.priority.toUpperCase()}</span>
                    <span class="category-badge">${categoryIcons[task.category] || ''} ${task.category}</span>
                    ${task.dueDate ? `<span class="date-badge">📅 ${task.dueDate}</span>` : ''}
                    ${overdueTag}
                `;
            };
            renderViewMode();

            // --- EDIT MODE LOGIC ---
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
                        <option value="Finances" ${task.category === 'Finances' ? 'selected' : ''}>Finances</option>
                        <option value="Health" ${task.category === 'Health' ? 'selected' : ''}>Health</option>
                        <option value="Spirituality" ${task.category === 'Spirituality' ? 'selected' : ''}>Spirituality</option>
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
        titleInput.focus();
    }

    // --- THEME LOGIC ---
    function initTheme() {
        const savedTheme = localStorage.getItem('jipange_theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
            themeToggle.textContent = '☀️ Light mode';
        } else {
            document.body.classList.remove('dark');
            themeToggle.textContent = '🌓 Dark mode';
        }
    }

    themeToggle.onclick = () => {
        const isDarkNow = document.body.classList.toggle('dark');
        localStorage.setItem('jipange_theme', isDarkNow ? 'dark' : 'light');
        themeToggle.textContent = isDarkNow ? '☀️ Light mode' : '🌓 Dark mode';
    };

    // --- INITIALIZE ---
    initTheme();
    addBtn.onclick = addNewTask;
    renderTasks(loadTasks());
})();