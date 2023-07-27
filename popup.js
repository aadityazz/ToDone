// popup.js
document.addEventListener("DOMContentLoaded", function () {
    const todoList = document.getElementById("todo-list");
    const addButton = document.getElementById("addButton");

    // Load existing todos from storage and display them
    chrome.storage.sync.get("todos", function (data) {
        const todos = data.todos || [];
        displayTodos(todos);
    });

    // Add the current page as a todo when the "Add" button is clicked
    addButton.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const tab = tabs[0];
            const todo = {
                url: tab.url,
                title: tab.title,
                done: false,
            };

            chrome.storage.sync.get("todos", function (data) {
                const todos = data.todos || [];
                todos.push(todo);

                chrome.storage.sync.set({ todos }, function () {
                    displayTodos(todos);
                });
            });
        });
    });

    // Display todos in the popup
    function displayTodos(todos) {
        let html = "";
        for (const todo of todos) {
            html += `<div class="todo-item">
                  <span class="todo-title" data-url="${todo.url}">${todo.title}</span>
                  <button class="delete-button" data-url="${
                todo.url
            }">Delete</button>
                </div>`;
        }
        todoList.innerHTML = html;

        // Add event listener to delete buttons
        const deleteButtons = document.querySelectorAll(".delete-button");
        deleteButtons.forEach((button) =>
            button.addEventListener("click", handleDelete)
        );

        // Add event listener to todo item titles
        const todoTitles = document.querySelectorAll(".todo-title");
        todoTitles.forEach((title) =>
            title.addEventListener("click", handleTodoClick)
        );
    }

    // Handle delete button click
    function handleDelete(event) {
        const url = event.target.dataset.url;
        chrome.storage.sync.get("todos", function (data) {
            const todos = data.todos || [];
            const updatedTodos = todos.filter((todo) => todo.url !== url);

            chrome.storage.sync.set({ todos: updatedTodos }, function () {
                displayTodos(updatedTodos);
            });
        });
    }

    // Handle todo item click
    function handleTodoClick(event) {
        const url = event.target.dataset.url;
        chrome.tabs.create({ url });
    }
});
