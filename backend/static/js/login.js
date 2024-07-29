document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    // 处理登录
    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            alert('Please enter both username and password.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    localStorage.setItem('jwtToken', data.token); // Save token
                    localStorage.setItem('username', username); // Save username
                    window.location.href = 'http://localhost:3000/index.html'; // Redirect to homepage
                } else {
                    alert('Login failed: No token returned');
                }
            } else {
                const errorData = await response.json();
                alert('Login failed: ' + errorData.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login error: ' + error.message);
        }
    });

    // function handleRegister
    registerBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            alert('Please enter both username and password.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                alert('Registration successful! Please log in.'); // Success message
                // Optionally clear form fields or reset the form
                loginForm.reset();
            } else {
                const errorData = await response.json();
                alert('Registration failed: ' + errorData.error);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration error: ' + error.message);
        }
    });
});