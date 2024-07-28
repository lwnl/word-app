document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');

  loginBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        window.location.href = '/index.html';
      } else {
        const result = await response.json();
        alert(result.error || 'Invalid username or password');
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('An error occurred. Please try again later.');
    }
  });

  registerBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const usernamePattern = /^[a-zA-Z0-9_]{4,}$/;
    if (!usernamePattern.test(username)) {
      alert('Username must be at least 4 characters long and can only contain letters, numbers, and underscores.');
      return;
    }

    if (password.length < 4) {
      alert('Password must be at least 4 characters long.');
      return;
    }

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();
    if (response.ok) {
      alert('Registration successful');
    } else {
      alert(result.error || 'Registration failed, please try again later.');
    }
  });
});