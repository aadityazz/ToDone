document.addEventListener("DOMContentLoaded", function () {
    const todoList = document.getElementById("todo-list");
    const addButton = document.getElementById("addButton");
    const exportButton = document.getElementById("exportButton");

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

    // Export all todos to Excel when the "Export" button is clicked
    exportButton.addEventListener("click", function () {
        chrome.storage.sync.get("todos", function (data) {
            const todos = data.todos || [];
            exportToExcel(todos);
        });
    });

    // Display todos in the popup
    function displayTodos(todos) {
        let html = "";
        for (const todo of todos) {
            const faviconUrl = getFaviconUrl(todo.url);
            html += `<div class="todo-item">
                      <div class="dot"></div>
                      <img src="${faviconUrl}" class="favicon" alt="Favicon">
                      <span class="todo-title" data-url="${todo.url}">${todo.title}</span>
                      <button class="delete-button" data-url="${todo.url}">Done</button>
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

       // Add active dot to the currently active page
        const activeTabUrl = window.location.href;
        const dots = document.querySelectorAll(".dot");
        dots.forEach((dot) => {
            const todoUrl = dot.nextElementSibling.dataset.url;
            if (activeTabUrl === todoUrl) {
                dot.classList.add("active-dot");
            } else {
                dot.classList.remove("active-dot");
            }
        });

        // Remove green dot when the corresponding tab is closed
        chrome.tabs.query({ currentWindow: true }, function (tabs) {
            const activeTabUrls = tabs.map((tab) => tab.url);
            const dots = document.querySelectorAll(".dot");
            dots.forEach((dot) => {
                const todoUrl = dot.nextElementSibling.dataset.url;
                if (!activeTabUrls.includes(todoUrl)) {
                    dot.classList.remove("active-dot");
                }
            });
        });
    }

    // Get the favicon URL for a given webpage
    function getFaviconUrl(url) {
        return `https://www.google.com/s2/favicons?domain=${url}`;
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

    // Export todos to Excel when the "Export to Excel" button is clicked
    exportButton.addEventListener("click", function () {
        chrome.storage.sync.get("todos", function (data) {
            const todos = data.todos || [];
            exportToExcel(todos);
        });
    });

    // Function to export todos to Excel
    function exportToExcel(todos) {
        const csvRows = [];
        // Add header row
        csvRows.push(["Title", "Links"]);

        // Add each todo as a row
        for (const todo of todos) {
            csvRows.push([todo.title, todo.url]);
        }

        // Create a CSV file content
        const csvContent = csvRows.map(row => row.join(',')).join('\n');

        // Create a Blob with the CSV content
        const blob = new Blob([csvContent], { type: 'text/csv' });

        // Create a temporary link element to download the file
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'todo_list.csv';
        link.click();
    }
});
