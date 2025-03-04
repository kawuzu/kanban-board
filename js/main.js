Vue.component('task-creator', {
    data() {
        return {
            taskTitle: '',
            taskDescription: '',
            taskDeadline: ''
        };
    },
    computed: {
        isTaskValid() {
            return this.taskTitle && this.taskDescription && this.taskDeadline;
        }
    },
    methods: {
        createTask() {
            if (this.isTaskValid) {
                const newTask = {
                    title: this.taskTitle,
                    description: this.taskDescription,
                    deadline: this.taskDeadline,
                    status: 'pending',
                    lastModified: new Date().toISOString()
                };

                this.$emit('add-task', newTask);
                this.clearForm();
            } else {
                alert('Пожалуйста, заполните все поля.');
            }
        },
        clearForm() {
            this.taskTitle = '';
            this.taskDescription = '';
            this.taskDeadline = '';
        }
    },
    template: `
        <div class="task-creator">
            <form @submit.prevent="createTask">
                <div>
                    <label for="taskTitle">Заголовок:</label>
                    <input type="text" id="taskTitle" v-model="taskTitle" required />
                </div>

                <div>
                    <label for="taskDescription">Описание:</label>
                    <textarea id="taskDescription" v-model="taskDescription" required></textarea>
                </div>

                <div>
                    <label for="taskDeadline">Дедлайн:</label>
                    <input type="date" id="taskDeadline" v-model="taskDeadline" required />
                </div>

                <button type="submit" :disabled="!isTaskValid">Создать задачу</button>
            </form>
        </div>
    `
});

Vue.component('task-board', {
    props: {
        tasks: {
            type: Array,
            required: true
        },
        saveTasks: {
            type: Function,
            required: true
        }
    },
    computed: {
        hasUrgentTasks() {
            const now = new Date();
            return this.tasks.some(task => {
                const deadline = new Date(task.deadline);
                const diffTime = deadline - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 2 && task.status !== 'completed';
            });
        }
    },
    methods: {
        removeTask(index) {
            this.$emit('delete-task', index);
        },
        modifyTask({ index, updatedTask }) {
            this.$emit('update-task', { index, updatedTask });
            this.saveTasks(); // Вызываем saveTasks после обновления задачи
        }
    },
    template: `
    <div class="task-board">
        <h2>Запланированные задачи</h2>
        <task-list :tasks="tasks.filter(task => task.status === 'pending')" :disabled="hasUrgentTasks" @delete-task="removeTask" @update-task="modifyTask"/>

        <h2>Задачи в работе</h2>
        <task-list :tasks="tasks.filter(task => task.status === 'inProgress')" :disabled="hasUrgentTasks" @delete-task="removeTask" @update-task="modifyTask"/>

        <h2>Тестирование</h2>
        <task-list :tasks="tasks.filter(task => task.status === 'testing')" :disabled="hasUrgentTasks" @delete-task="removeTask" @update-task="modifyTask"/>

        <h2>Выполненные задачи</h2>
        <task-list :tasks="tasks.filter(task => task.status === 'completed')" :disabled="hasUrgentTasks" @delete-task="removeTask" @update-task="modifyTask"/>
    </div>
    `
});

Vue.component('task-list', {
    props: {
        tasks: {
            type: Array,
            required: true
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        removeTask(index) {
            this.$emit('delete-task', index);
        },
        modifyTask({ index, updatedTask }) {
            this.$emit('update-task', { index, updatedTask });
        },
        isTaskUrgent(task) {
            const now = new Date();
            const deadline = new Date(task.deadline);
            const diffTime = deadline - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 2;
        }
    },
    template: `
    <ul class="task-list">
        <li v-for="(task, index) in tasks" :key="task.title + index">
            <task-item 
                :task="task" 
                :index="index"
                :disabled="disabled && !isTaskUrgent(task)"
                @delete-task="removeTask"
                @update-task="modifyTask" />
        </li>
    </ul>
    `
});

Vue.component('task-item', {
    props: {
        task: {
            type: Object,
            required: true
        },
        index: {
            type: Number,
            required: true
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            isEditing: false,
            editedTitle: this.task.title,
            editedDescription: this.task.description,
            editedDeadline: this.task.deadline,
            returnReason: ''
        };
    },
    computed: {
        isUrgent() {
            const now = new Date();
            const deadline = new Date(this.task.deadline);
            const diffTime = deadline - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 2;
        }
    },
    methods: {
        removeTask() {
            if (this.task.status === 'pending') {
                this.$emit('delete-task', this.index);
            } else {
                alert('Удаление доступно только для задач в статусе "Запланированная"');
            }
        },
        editTask() {
            this.isEditing = true;
        },
        saveTask() {
            const updatedTask = {
                ...this.task,
                title: this.editedTitle,
                description: this.editedDescription,
                deadline: this.editedDeadline,
                lastModified: new Date().toISOString()
            };
            this.$emit('update-task', { index: this.index, updatedTask });
            this.isEditing = false;
        },
        moveToInProgress() {
            const updatedTask = { ...this.task, status: 'inProgress' };
            this.$emit('update-task', { index: this.index, updatedTask });
        },
        moveToTesting() {
            const updatedTask = { ...this.task, status: 'testing' };
            this.$emit('update-task', { index: this.index, updatedTask });
        },
        returnToInProgress() {
            if (this.returnReason) {
                const updatedTask = {
                    ...this.task,
                    status: 'inProgress',
                    returnReason: this.returnReason
                };
                this.$emit('update-task', { index: this.index, updatedTask });
                this.returnReason = '';
            } else {
                alert('Укажите причину возврата');
            }
        },
        markAsCompleted() {
            const updatedTask = {
                ...this.task,
                status: 'completed',
                isOverdue: new Date(this.task.deadline) < new Date()
            };
            this.$emit('update-task', { index: this.index, updatedTask });
        }
    },
    template: `
    <div class="task-item">
        <div v-if="isEditing && task.status !== 'completed'">
            <div>
                <label for="editedTitle">Заголовок:</label>
                <input type="text" id="editedTitle" v-model="editedTitle" required />
            </div>
            <div>
                <label for="editedDescription">Описание:</label>
                <textarea id="editedDescription" v-model="editedDescription" required></textarea>
            </div>
            <div>
                <label for="editedDeadline">Дедлайн:</label>
                <input type="date" id="editedDeadline" v-model="editedDeadline" required />
            </div>
            <button @click="saveTask">Сохранить</button>
        </div>
        <div v-else>
            <h3>{{ task.title }}</h3>
            <p>{{ task.description }}</p>
            <p><em>Дедлайн: {{ task.deadline }}</em></p>
            <p>Status: {{ task.status }}</p>
            
            <div v-if="task.status === 'testing' && task.returnReason">
                <p><strong>Причина возврата:</strong> {{ task.returnReason }}</p>
            </div>
            
            <button v-if="task.status !== 'completed'" @click="editTask" :disabled="disabled">Редактировать</button>
            <button v-if="task.status === 'pending'" @click="removeTask" :disabled="disabled">Удалить</button>
            <button v-if="task.status === 'pending'" @click="moveToInProgress" :disabled="disabled">Далее</button>
            <button v-if="task.status === 'inProgress'" @click="moveToTesting" :disabled="disabled">Тестирование</button>
            <div v-if="task.status === 'testing'">
                <label for="returnReason">Причина возврата:</label>
                <textarea id="returnReason" v-model="returnReason" required></textarea>
                <button @click="returnToInProgress" :disabled="disabled">Вернуть в работу</button>
                <button @click="markAsCompleted">Завершить</button>
            </div>
            <p v-if="task.status === 'completed'">
                <strong v-if="task.isOverdue">Задача просрочена!</strong>
                <strong v-else>Задача выполнена в срок.</strong>
            </p>
        </div>
    </div>
    `
});

new Vue({
    el: '#task-manager-app',
    data() {
        return {
            tasks: JSON.parse(localStorage.getItem('tasks')) || []
        };
    },
    computed: {
        hasUrgentTasks() {
            const now = new Date();
            return this.tasks.some(task => {
                const deadline = new Date(task.deadline);
                const diffTime = deadline - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 2 && task.status !== 'completed';
            });
        }
    },
    methods: {
        addNewTask(newTask) {
            this.tasks.push(newTask);
            this.saveTasks();
        },
        removeTask(index) {
            this.tasks.splice(index, 1);
            this.saveTasks();
        },
        modifyTask({ index, updatedTask }) {
            if (index >= 0 && index < this.tasks.length) {
                this.tasks.splice(index, 1, updatedTask);
                this.saveTasks();
            } else {
                console.error("Invalid index:", index);
            }
        },
        saveTasks() {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        }
    }
});