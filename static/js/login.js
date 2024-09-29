document.addEventListener('DOMContentLoaded', () => {
    let hostIp = 'http://localhost'
    hostIp = 'http://wordapp.liangw.de'
    let port = '80'
    const host = `${hostIp}:${port}`// google cloud vm external ip
    // const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    // login event
    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            alert('Please enter both username and password.');
            return;
        }

        try {
            const response = await fetch(`${host}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',  // 包括 cookie
                body: JSON.stringify({ username, password }),

            });

            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    window.location.href = `${host}/index.html`; // Redirect to homepage
                    localStorage.setItem('username', username)
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
            const response = await fetch(`${host}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // 包括 cookie
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                alert('Registration successful! Please log in.'); // Success message
                // Optionally clear form fields or reset the form
                // loginForm.reset();
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