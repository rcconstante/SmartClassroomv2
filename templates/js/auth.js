// Auth module
const auth = {
    login: async (email, password) => {
        // Simulate API call
        if (email === 'professor@university.edu' && password === 'demo123') {
            const user = {
                id: '1',
                name: 'Dr. Sarah Johnson',
                email: 'professor@university.edu',
                department: 'Computer Science',
                initials: 'SJ'
            };
            localStorage.setItem('user', JSON.stringify(user));
            state.user = user;
            state.isAuthenticated = true;
            return true;
        }
        return false;
    },

    logout: () => {
        localStorage.removeItem('user');
        state.user = null;
        state.isAuthenticated = false;
        routes.login();
    }
};

// Load login page
function loadLogin() {
    mainContent.innerHTML = `
        <div class="min-h-[80vh] flex items-center justify-center">
            <div class="bg-white p-8 rounded-lg shadow-sm border w-full max-w-md">
                <div class="text-center mb-8">
                    <h2 class="text-2xl font-bold text-gray-900">Welcome Back</h2>
                    <p class="text-gray-600 mt-2">Click the button below to sign in with the demo account</p>
                </div>
                <form id="loginForm" class="space-y-6">
                    <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Email</label>
                                <div class="mt-1 flex items-center space-x-2">
                                    <input 
                                        type="email" 
                                        name="email"
                                        value="professor@university.edu"
                                        readonly
                                        class="block w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600 cursor-not-allowed"
                                    >
                                    <div class="text-green-500">
                                        <i data-lucide="check-circle" class="h-5 w-5"></i>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Password</label>
                                <div class="mt-1 flex items-center space-x-2">
                                    <input 
                                        type="text" 
                                        name="password"
                                        value="demo123"
                                        readonly
                                        class="block w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600 cursor-not-allowed"
                                    >
                                    <div class="text-green-500">
                                        <i data-lucide="check-circle" class="h-5 w-5"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button 
                            type="submit"
                            class="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            <i data-lucide="log-in" class="h-5 w-5 mr-2"></i>
                            Sign In to Demo Account
                        </button>
                    </div>
                    <div class="text-center text-sm text-gray-500">
                        This is a demo account with pre-filled credentials
                    </div>
                </form>
            </div>
        </div>
    `;

    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const success = await auth.login(formData.get('email'), formData.get('password'));
        
        if (success) {
            routes.dashboard();
        } else {
            alert('Invalid credentials');
        }
    });
}