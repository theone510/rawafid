// تعريف المستخدمين الافتراضيين
const defaultUsers = [
    {
        username: 'admin',
        // كلمة المرور: admin123
        passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
        role: 'admin',
        name: 'المدير'
    }
];

// استرجاع المستخدمين من التخزين المحلي
function getUsers() {
    const users = localStorage.getItem('users');
    if (!users) {
        localStorage.setItem('users', JSON.stringify(defaultUsers));
        return defaultUsers;
    }
    return JSON.parse(users);
}

// إضافة مستخدم جديد
async function addUser(username, password, role, name) {
    const users = getUsers();
    if (users.find(u => u.username === username)) {
        throw new Error('اسم المستخدم موجود مسبقاً');
    }
    
    const passwordHash = await sha256(password);
    users.push({ username, passwordHash, role, name });
    localStorage.setItem('users', JSON.stringify(users));
}

// تحقق من صحة بيانات تسجيل الدخول
async function validateLogin(username, password) {
    try {
        const users = getUsers();
        const user = users.find(u => u.username === username);
        if (!user) {
            console.log('المستخدم غير موجود:', username);
            return null;
        }
        
        const passwordHash = await sha256(password);
        console.log('مقارنة كلمات المرور:');
        console.log('- كلمة المرور المدخلة:', passwordHash);
        console.log('- كلمة المرور المخزنة:', user.passwordHash);
        
        if (passwordHash === user.passwordHash) {
            const { passwordHash: _, ...userInfo } = user;
            return userInfo;
        }
        return null;
    } catch (error) {
        console.error('خطأ في التحقق من تسجيل الدخول:', error);
        return null;
    }
}

// تحديث بيانات المستخدم
async function updateUser(username, updates) {
    const users = getUsers();
    const index = users.findIndex(u => u.username === username);
    if (index === -1) throw new Error('المستخدم غير موجود');
    
    if (updates.password) {
        updates.passwordHash = await sha256(updates.password);
        delete updates.password;
    }
    
    users[index] = { ...users[index], ...updates };
    localStorage.setItem('users', JSON.stringify(users));
}

// حذف مستخدم
function deleteUser(username) {
    const users = getUsers();
    const filteredUsers = users.filter(u => u.username !== username);
    if (filteredUsers.length === users.length) {
        throw new Error('المستخدم غير موجود');
    }
    localStorage.setItem('users', JSON.stringify(filteredUsers));
}

// دالة SHA-256
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// التحقق من الصلاحيات
function checkPermission(user, permission) {
    if (!user) return false;
    
    const permissions = {
        admin: [
            'manage_users',
            'manage_descriptions',
            'view_all_reports',
            'add_transaction',
            'delete_transaction'
        ],
        employee: [
            'add_transaction',
            'view_own_reports'
        ]
    };
    
    return permissions[user.role]?.includes(permission) || false;
}

// تصدير الدوال
window.userSystem = {
    getUsers,
    addUser,
    validateLogin,
    updateUser,
    deleteUser,
    checkPermission
};

// تهيئة التخزين المحلي عند تحميل الملف
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(defaultUsers));
}
