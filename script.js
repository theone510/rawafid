// تعريف الأوصاف المحددة مسبقاً
if (!window.predefinedDescriptions) {
    window.predefinedDescriptions = {
        income: [
            'مبيعات نقدية',
            'مبيعات آجلة',
            'تسديد ديون',
            'إيرادات أخرى'
        ],
        expense: [
            'مشتريات',
            'رواتب',
            'إيجار',
            'كهرباء',
            'ماء',
            'مصاريف نثرية',
            'مصاريف أخرى'
        ]
    };
}

// التأكد من تحميل المستند بالكامل
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من تسجيل الدخول
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // تهيئة المتغيرات العامة
    let currentDate = new Date();
    const transactionForm = document.getElementById('transactionForm');
    const transactionType = document.getElementById('transactionType');
    const descriptionSelect = document.getElementById('description');
    const transactionsBody = document.getElementById('dayTransactionsBody');
    const selectedDateInput = document.getElementById('selectedDate');
    const actualIncomeInput = document.getElementById('actualIncome');

    // تحديث الأوصاف عند تغيير النوع
    if (transactionType && descriptionSelect) {
        transactionType.addEventListener('change', function() {
            updateDescriptionOptions(descriptionSelect, this.value);
        });
        // تحديث الأوصاف عند تحميل الصفحة
        updateDescriptionOptions(descriptionSelect, transactionType.value);
    }

    // دالة إظهار الإشعارات
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // وظائف إدارة المعاملات
    function formatCurrency(amount) {
        // Convert to English numbers and format with Iraqi currency
        return amount.toLocaleString('en-US') + ' د.ع';
    }

    function extractNumber(text) {
        if (!text) return 0;
        // First convert any Arabic numbers to English
        const englishText = convertArabicToEnglishNumbers(text);
        return parseFloat(englishText.replace(/[^\d.-]/g, '')) || 0;
    }

    function convertArabicToEnglishNumbers(str) {
        if (!str) return '';
        const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        return str.toString().replace(/[٠-٩]/g, match => englishNumbers[arabicNumbers.indexOf(match)]);
    }

    // وظائف التخزين المحلي
    function getDayTransactions() {
        const dateKey = selectedDateInput.value;
        const saved = localStorage.getItem(`transactions_${dateKey}`);
        return saved ? JSON.parse(saved) : [];
    }

    function saveDayTransactions(transactions) {
        const dateKey = selectedDateInput.value;
        localStorage.setItem(`transactions_${dateKey}`, JSON.stringify(transactions));
    }

    function saveDescriptions() {
        localStorage.setItem('descriptions', JSON.stringify(window.predefinedDescriptions));
    }

    function loadDescriptions() {
        const saved = localStorage.getItem('descriptions');
        if (saved) {
            Object.assign(window.predefinedDescriptions, JSON.parse(saved));
        }
    }

    // تحديث واجهة المستخدم
    function updateDaySummary() {
        const transactions = getDayTransactions();
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(transaction => {
            const amount = typeof transaction.amount === 'string' ? 
                extractNumber(transaction.amount) : transaction.amount;
                
            if (transaction.type === 'income') {
                totalIncome += amount;
            } else {
                totalExpense += amount;
            }
        });

        const balance = totalIncome - totalExpense;

        const incomeElement = document.getElementById('dayTotalIncome');
        const expenseElement = document.getElementById('dayTotalExpense');
        const balanceElement = document.getElementById('dayBalance');

        incomeElement.textContent = formatCurrency(totalIncome);
        expenseElement.textContent = formatCurrency(totalExpense);
        balanceElement.textContent = formatCurrency(balance);

        // Apply colors
        incomeElement.style.color = '#2ecc71';  // Green for income
        expenseElement.style.color = '#e74c3c';  // Red for expense
        balanceElement.style.color = balance >= 0 ? '#2ecc71' : '#e74c3c';

        updateDifference();
    }

    function updateDifference() {
        if (!actualIncomeInput) return;

        const actualIncome = extractNumber(actualIncomeInput.value);
        const expectedIncome = extractNumber(document.getElementById('dayBalance').textContent);
        // عكس المعادلة لتصبح: الدخل الفعلي - المفروض
        const difference = actualIncome - expectedIncome;

        const differenceAmount = document.getElementById('differenceAmount');
        const differenceStatus = document.getElementById('differenceStatus');

        if (differenceAmount && differenceStatus) {
            differenceAmount.textContent = formatCurrency(difference);
            
            if (difference === 0) {
                differenceAmount.style.color = '#3498db';  // Blue for match
                differenceStatus.textContent = 'متطابق';
                differenceStatus.className = 'status-badge matched';
            } else if (difference < 0) {  // عكس الشرط هنا
                differenceAmount.style.color = '#e74c3c';  // Red for shortage
                differenceStatus.textContent = 'نقص';
                differenceStatus.className = 'status-badge shortage';
            } else {  // difference > 0
                differenceAmount.style.color = '#2ecc71';  // Green for surplus
                differenceStatus.textContent = 'زيادة';
                differenceStatus.className = 'status-badge surplus';
            }
        }

        const dateKey = selectedDateInput.value;
        localStorage.setItem(`actual_income_${dateKey}`, actualIncome);
    }

    function loadActualIncome() {
        if (!actualIncomeInput) return;
        
        const dateKey = selectedDateInput.value;
        const savedIncome = localStorage.getItem(`actual_income_${dateKey}`);
        actualIncomeInput.value = savedIncome || '';
        updateDifference();
    }

    function loadDayTransactions() {
        if (!transactionsBody) return;

        const transactions = getDayTransactions();
        transactionsBody.innerHTML = transactions.map((transaction, index) => `
            <tr>
                <td>${transaction.time}</td>
                <td>${transaction.type === 'income' ? 'داخل' : 'خارج'}</td>
                <td>${transaction.description}</td>
                <td>${formatCurrency(transaction.amount)}</td>
                <td>${transaction.notes || '-'}</td>
                <td>
                    <button onclick="deleteTransaction(${index})" class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        updateDaySummary();
    }

    // وظائف إدارة الأوصاف
    function updateDescriptionOptions(select, type) {
        if (!select || !type) return;
        
        select.innerHTML = '<option value="">اختر الوصف</option>';
        const descriptions = window.predefinedDescriptions[type] || [];
        descriptions.forEach(desc => {
            const option = document.createElement('option');
            option.value = desc;
            option.textContent = desc;
            select.appendChild(option);
        });
    }

    function showDescriptions(type) {
        const container = document.getElementById('descriptionsContainer');
        if (!container || !window.predefinedDescriptions[type]) return;
        
        container.innerHTML = window.predefinedDescriptions[type].map(desc => `
            <div class="description-item">
                <span>${desc}</span>
                <button onclick="deleteDescription('${type}', '${desc}')" class="delete-btn">
                    <i class="fas fa-trash"></i>
                    حذف
                </button>
            </div>
        `).join('');
    }

    // معالجة الأحداث
    if (transactionForm) {
        transactionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const type = transactionType.value;
            const description = descriptionSelect.value;
            const amount = extractNumber(document.getElementById('amount').value);
            const notes = document.getElementById('notes').value;
            
            if (!type || !description || !amount) {
                showNotification('جميع الحقول المطلوبة يجب ملؤها', 'error');
                return;
            }

            const now = new Date();
            const transaction = {
                time: now.toLocaleTimeString('ar-IQ'),
                type,
                description,
                amount,
                notes
            };

            const transactions = getDayTransactions();
            transactions.push(transaction);
            saveDayTransactions(transactions);
            
            loadDayTransactions();
            transactionForm.reset();
            showNotification('تم إضافة المعاملة بنجاح', 'success');
        });
    }

    // معالجة التاريخ
    if (selectedDateInput) {
        selectedDateInput.valueAsDate = currentDate;
        selectedDateInput.addEventListener('change', function() {
            loadDayTransactions();
            loadActualIncome();
        });

        document.getElementById('prevDay')?.addEventListener('click', function() {
            currentDate.setDate(currentDate.getDate() - 1);
            selectedDateInput.valueAsDate = currentDate;
            loadDayTransactions();
            loadActualIncome();
        });

        document.getElementById('nextDay')?.addEventListener('click', function() {
            currentDate.setDate(currentDate.getDate() + 1);
            selectedDateInput.valueAsDate = currentDate;
            loadDayTransactions();
            loadActualIncome();
        });
    }

    // إدارة الأوصاف
    const manageDescriptionsBtn = document.getElementById('manageDescriptions');
    const descriptionsModal = document.getElementById('descriptionsModal');
    const addDescriptionForm = document.getElementById('addDescriptionForm');
    const descriptionsContainer = document.getElementById('descriptionsContainer');
    const descriptionType = document.getElementById('descriptionType');

    if (manageDescriptionsBtn && descriptionsModal) {
        // فتح نافذة إدارة الأوصاف
        manageDescriptionsBtn.addEventListener('click', function() {
            descriptionsModal.style.display = 'block';
            showDescriptions(descriptionType.value);
        });

        // إغلاق النافذة
        const closeBtn = descriptionsModal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                descriptionsModal.style.display = 'none';
            });
        }

        // إغلاق النافذة عند النقر خارجها
        window.addEventListener('click', function(e) {
            if (e.target === descriptionsModal) {
                descriptionsModal.style.display = 'none';
            }
        });
    }

    if (addDescriptionForm) {
        addDescriptionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const type = document.getElementById('descriptionType').value;
            const desc = document.getElementById('newDescription').value.trim();

            if (!desc) return;

            // إضافة الوصف الجديد
            if (!window.predefinedDescriptions[type].includes(desc)) {
                window.predefinedDescriptions[type].push(desc);
                saveDescriptions();
                showDescriptions(type);
                updateDescriptionOptions(descriptionSelect, transactionType.value);
                showNotification('تم إضافة الوصف بنجاح', 'success');
                document.getElementById('newDescription').value = '';
            } else {
                showNotification('هذا الوصف موجود مسبقاً', 'error');
            }
        });
    }

    if (descriptionType) {
        descriptionType.addEventListener('change', function() {
            showDescriptions(this.value);
        });
    }

    function showDescriptions(type) {
        if (!descriptionsContainer || !window.predefinedDescriptions[type]) return;
        
        descriptionsContainer.innerHTML = window.predefinedDescriptions[type].map(desc => `
            <div class="description-item">
                <span>${desc}</span>
                <button onclick="deleteDescription('${type}', '${desc}')" class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    window.deleteDescription = function(type, desc) {
        const index = window.predefinedDescriptions[type].indexOf(desc);
        if (index > -1) {
            window.predefinedDescriptions[type].splice(index, 1);
            saveDescriptions();
            showDescriptions(type);
            updateDescriptionOptions(descriptionSelect, transactionType.value);
            showNotification('تم حذف الوصف بنجاح', 'success');
        }
    };

    // معالجة حذف المعاملات والأوصاف
    window.deleteTransaction = function(index) {
        if (confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
            const transactions = getDayTransactions();
            transactions.splice(index, 1);
            saveDayTransactions(transactions);
            loadDayTransactions();
            showNotification('تم حذف المعاملة بنجاح', 'success');
        }
    };

    // معالجة الدخل الفعلي
    if (actualIncomeInput) {
        actualIncomeInput.addEventListener('input', updateDifference);
    }

    // إدارة المستخدمين
    const userManagementLink = document.querySelector('[data-action="manage-users"]');
    const userManagementModal = document.getElementById('userManagementModal');
    const addUserForm = document.getElementById('addUserForm');
    const usersTableBody = document.querySelector('#usersTable tbody');

    if (userManagementLink && userManagementModal) {
        // فتح نافذة إدارة المستخدمين
        userManagementLink.addEventListener('click', function(e) {
            e.preventDefault();
            userManagementModal.style.display = 'block';
            loadUsers();
        });

        // إغلاق النافذة
        const closeButton = userManagementModal.querySelector('.close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                userManagementModal.style.display = 'none';
            });
        }

        // إغلاق النافذة عند النقر خارجها
        window.addEventListener('click', (e) => {
            if (e.target === userManagementModal) {
                userManagementModal.style.display = 'none';
            }
        });
    }

    // تحميل المستخدمين
    function loadUsers() {
        if (!usersTableBody) return;
        
        const users = userSystem.getUsers();
        usersTableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.name}</td>
                <td>${user.role === 'admin' ? 'مدير' : 'موظف'}</td>
                <td>
                    <button onclick="deleteUserHandler('${user.username}')" class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // إضافة مستخدم جديد
    if (addUserForm) {
        addUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('newUsername').value;
            const password = document.getElementById('newPassword').value;
            const name = document.getElementById('newName').value;
            const role = document.getElementById('newRole').value;

            try {
                await userSystem.addUser(username, password, role, name);
                showNotification('تم إضافة المستخدم بنجاح', 'success');
                loadUsers();
                addUserForm.reset();
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }

    // حذف مستخدم
    window.deleteUserHandler = async function(username) {
        if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            try {
                await userSystem.deleteUser(username);
                showNotification('تم حذف المستخدم بنجاح', 'success');
                loadUsers();
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    };

    // تحميل البيانات الأولية
    loadDescriptions();
    loadDayTransactions();
    loadActualIncome();

    // معالجة تسجيل الخروج
    const logoutLink = document.querySelector('[data-action="logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                sessionStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            }
        });
    }

    // إخفاء/إظهار عناصر بناءً على صلاحيات المستخدم
    if (currentUser.role !== 'admin') {
        const manageUsersLink = document.querySelector('[data-action="manage-users"]');
        if (manageUsersLink) {
            manageUsersLink.style.display = 'none';
        }
    }
});
