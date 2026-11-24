
$(function () {

    const username = "UTRGV Vaqueros";

    $("#username").append(username);

    function formatCurrency(amount) {
        return Number(amount || 0).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0
        });
    }

    async function loadDashboard() {
        try {
            const response = await fetch('/api/dashboard');
            if (!response.ok) throw new Error('Dashboard request failed');

            const data = await response.json();

            $(".revenue-amt").text(formatCurrency(data.revenue));
            $("#customer-num").text(data.customers.toLocaleString());
            $("#orders-amt").text(data.orders.toLocaleString());
            $("#issues-amt").text(data.issues.toLocaleString());
            $("#notification-num").text(data.notifications);

        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    let currentPage = 1;
    const pageLimit = 10;

    async function loadCustomers(page = 1) {
        try {
            const response = await fetch(
                `/api/customers?page=${page}&limit=${pageLimit}`
            );

            if (!response.ok) throw new Error('Customer request failed');

            const data = await response.json();

            currentPage = data.page;

            const tableBody = $("#customerTableBody");
            tableBody.empty();

            data.customers.forEach(customer => {
                const row = $("<tr>");

                const statusClass =
                    customer.status.toLowerCase() === "active"
                        ? "status-active"
                        : "status-pending";

                const joinedDate = new Date(customer.datejoined)
                    .toLocaleDateString("en-US", {
                        timeZone: "UTC"
                    });

                row.html(`
                    <td>${customer.name}</td>
                    <td>${customer.email}</td>
                    <td>
                        <span class="status ${statusClass}">
                            ${customer.status}
                        </span>
                    </td>
                    <td>${joinedDate}</td>
                `);

                tableBody.append(row);
            });

            let pagination = $("#customer-pagination");

            if (!pagination.length) {
                pagination = $('<div id="customer-pagination"></div>');
                $("#customerTable").after(pagination);
            }

            pagination.empty();

            pagination.append(`
                <button id="previousPage"
                    ${currentPage === 1 ? "disabled" : ""}>
                    Previous
                </button>

                <span>Page ${data.page} of ${data.totalPages}</span>

                <button id="nextPage"
                    ${currentPage >= data.totalPages ? "disabled" : ""}>
                    Next
                </button>
            `);

            $("#previousPage").button().on("click", function () {
                loadCustomers(currentPage - 1);
            });

            $("#nextPage").button().on("click", function () {
                loadCustomers(currentPage + 1);
            });

        } catch (error) {
            console.error('Error loading customers:', error);
        }
    }

    async function loadSales() {
        try {
            const response = await fetch('/api/sales');
            if (!response.ok) throw new Error('Sales request failed');

            const sales = await response.json();

            const tableBody = $("#salesTableBody");
            tableBody.empty();

            sales.forEach(sale => {
                const row = $("<tr>");

                row.html(`
                    <td>${sale.name}</td>
                    <td>${sale.quantity}</td>
                    <td>${formatCurrency(sale.saleamount)}</td>
                `);

                tableBody.append(row);
            });

        } catch (error) {
            console.error('Error loading sales:', error);
        }
    }

    async function loadAlerts(type, listId) {
        try {
            const response = await fetch(`/api/alerts/${type}`);

            if (!response.ok) {
                throw new Error(`Unable to load ${type}`);
            }

            const alerts = await response.json();

            const list = $(listId);
            list.empty();

            alerts.forEach(alert => {
                const li = $("<li>");
                li.text(alert.description);
                list.append(li);
            });

        } catch (error) {
            console.error(`Error loading ${type}:`, error);
        }
    }

    loadDashboard();
    loadCustomers();
    loadSales();

    loadAlerts('issues', '#system-status-list');
    loadAlerts('notifications', '#notifications-list');
    loadAlerts('tasks', '#tasks-list');

  

    $("button").button();

    $("#dashboardTabs").tabs();

    $("#customerDate").datepicker();

    $("#accordion").accordion({
        collapsible: true,
        heightStyle: "content"
    });

    $("#customerDialog").dialog({
        autoOpen: false,
        modal: true,
        width: 450,
        buttons: {
            "Create Customer": function () {
                const name = $("#customerName").val();
                const email = $("#customerEmail").val();

                if (!name || !email) {
                    alert("Please enter a name and email.");
                    return;
                }

                alert("Customer created: " + name);
                $(this).dialog("close");
            },

            "Cancel": function () {
                $(this).dialog("close");
            }
        }
    });

    $("#newCustomerButton").on("click", function () {
        $("#customerDialog").dialog("open");
    });

});
