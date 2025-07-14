const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const addBtn = $(".add-btn");
const ListTask = $(".task-grid");
const modal = $(".modal-overlay");
const closeModol = $(".modal-close");
const closeBtn = $(".btn-secondary");
const formData = $(".todo-app-form");
const form = $("#addTaskModal");
const titleInput = $(".form-input");
const btnSubmit = $(".btn-primary");
const scrollForm = $(".modal");
const searchInput = $(".search-input");
const complete = $(".tab-button-complete");
const closeModalOver = $(".modal-overlay");
const body = document.body;

console.log(formData);

closeModalOver.onclick = function (e) {
    if (!e.target.closest(".modal")) {
        closeForm();
    }
};
// id task
let editId = null;

formData.onsubmit = async function (e) {
    e.preventDefault();
    const newTask = Object.fromEntries(new FormData(formData));
    try {
        // edit task
        if (editId) {
            const response = await fetch(
                `http://localhost:3000/tasks/${editId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newTask),
                }
            );
            if (!response.ok) throw new Error("Cập nhật thất bại");
        } else {
            const response = await fetch("http://localhost:3000/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTask),
            });
        }
        formData.reset();
        editId = null;
        closeForm();
        render();
    } catch (error) {
        console.log(error);
    }
};

ListTask.onclick = async function (e) {
    const editBtn = e.target.closest(".edit-btn");
    const taskDelete = e.target.closest(".delete");
    const btnCompleted = e.target.closest(".complete");
    // delete task
    if (taskDelete) {
        const taskItem = taskDelete.closest(".task-card");
        const taskId = taskItem?.dataset.id;
        try {
            const response = await send(
                `http://localhost:3000/tasks/${taskId}`,
                "DELETE"
            );
            render();
        } catch (error) {
            console.log(error);
        }
    }
    // edit task
    if (editBtn) {
        const formTitle = form.querySelector(".modal-title");
        const taskItem = editBtn.closest(".task-card");
        const taskId = taskItem?.dataset.id;
        const tasks = await fetch(`http://localhost:3000/tasks/${taskId}`);
        const res = await tasks.json();
        editId = taskId;
        for (const key in res) {
            const value = res[key];
            const input = $(`[name="${key}"]`);
            if (input) {
                input.value = value;
            }
        }
        if (formTitle) {
            formTitle.dataset.original = formTitle.textContent;
            formTitle.textContent = "Edit Task";
        }
        if (editBtn) {
            btnSubmit.dataset.original = btnSubmit.textContent;
            btnSubmit.textContent = "Edit Task";
        }
        openForm();
    }
    // mark task
    if (btnCompleted) {
        const taskItem = btnCompleted.closest(".task-card");
        const taskId = taskItem?.dataset.id;
        try {
            const tasks = await fetch(`http://localhost:3000/tasks/${taskId}`);
            const res = await tasks.json();
            res.isCompleted = !res.isCompleted;
            await patch(`http://localhost:3000/tasks/${taskId}`, {
                isCompleted: res.isCompleted,
            });
            taskItem.classList.toggle("active");
            render();
        } catch (error) {
            console.log(error);
        }
    }
};

function openForm() {
    modal.classList.add("show");
    setTimeout(() => titleInput.focus(), 100);
}

searchInput.oninput = async function (event) {
    // lưu giá trị input và xóa khoảng trắng
    const searchValue = event.target.value.trim().toLowerCase();
    try {
        const todoTask = await send("http://localhost:3000/tasks", "GET");
        const newTitle = todoTask.filter((task) =>
            task.title.includes(String(searchValue.toLowerCase()))
        );
        // lấy ra title từng task
        render(newTitle);
    } catch (error) {
        console.log(error);
    }
};

function closeForm() {
    const formTitle = form.querySelector(".modal-title");
    if (formTitle) {
        formTitle.textContent =
            formTitle.dataset.original || formTitle.textContent;
        delete formTitle.dataset.original;
    }
    if (btnSubmit) {
        btnSubmit.textContent =
            btnSubmit.dataset.original || btnSubmit.textContent;
        delete btnSubmit.dataset.original;
    }
    form.classList.remove("show");

    // reset form
    formData.reset();

    // cuộn lên đầu form
    setTimeout(() => (scrollForm.scrollTop = 0), 300);
    // đóng form sửa
    editIndex = null;
}

async function patch(url, data) {
    try {
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`Lỗi HTTP: ${response.status}`);
        }
        const result = await response.json();
        formData?.reset?.();
        return result;
    } catch (error) {
        console.log(error);
    }
}

async function send(url, method) {
    const res = await fetch(url, { method });
    if (!res.ok) throw new Error(`HTTP code:  ${res.status}`);
    const type = res.headers.get("content-type");
    const isJson = type && type.includes("application/json");
    try {
        const result = isJson ? await res.json() : await res.text();
        return result;
    } catch (error) {
        throw new Error("invalid JSON format");
    }
}

async function getTask() {
    try {
        const res = await fetch("http://localhost:3000/tasks");
        const data = await res.json();
        return data;
    } catch (error) {
        console.log(error);
        return null;
    }
}
getTask();
async function render(tasks = null) {
    if (!tasks) {
        tasks = await getTask();
    }
    const html = tasks
        .map(
            (task) =>
                `<div class="task-card ${escapeseHTML(task.color)} ${
                    task.isCompleted ? "completed" : ""
                }" data-id=${task.id}>
                    <div class="task-header">
                        <h3 class="task-title">${escapeseHTML(task.title)}</h3>
                        <button class="task-menu">
                            <i class="fa-solid fa-ellipsis fa-icon"></i>
                            <div class="dropdown-menu">
                                <div class="dropdown-item edit-btn" data-id=${
                                    task.id
                                }>
                                    <i
                                        class="fa-solid fa-pen-to-square fa-icon"
                                    ></i>
                                    Edit
                                </div>
                                <div class="dropdown-item complete" data-id=${
                                    task.id
                                }>
                                    <i class="fa-solid fa-check fa-icon"></i>
                                    ${
                                        task.isCompleted
                                            ? "Mark as Active"
                                            : "Mark as Complete"
                                    }
                                </div>
                                <div class="dropdown-item delete" data-id=${
                                    task.id
                                }>
                                    <i class="fa-solid fa-trash fa-icon"></i>
                                    Delete
                                </div>
                            </div>
                        </button>
                    </div>
                    <p class="task-description">${escapeseHTML(
                        task.description
                    )}
                    </p>
                    <div class="task-time">${escapeseHTML(
                        task.start
                    )} - ${escapeseHTML(task.end)}</div>
                </div>`
        )
        .join("");
    ListTask.innerHTML = html;
}
async function start() {
    try {
        const res = await fetch("http://localhost:3000/tasks");
        const tasks = await res.json();
        render(tasks);
    } catch (error) {
        console.log(error);
    }
}

addBtn.onclick = function () {
    modal.classList.add("show");
    setTimeout(() => titleInput.focus(), 100);
};

closeModol.onclick = function () {
    modal.classList.remove("show");
    closeForm();
};

closeBtn.onclick = function () {
    modal.classList.remove("show");
    closeForm();
};

function escapeseHTML(html) {
    const div = document.createElement("div");
    div.textContent = html;
    return div.innerHTML;
}

start();
