document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  //判断浏览器中是否有有效的token
  checkToken();
  // login event
  loginBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    try {
      const response = await fetch(`/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 包括 cookie
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("username", data.username);
        window.location.href = `/index.html`; // Redirect to homepage
      } else {
        const errorData = await response.json();
        alert("Login failed: " + errorData.error);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login error: " + error.message);
    }
  });

  // function handleRegister
  registerBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    try {
      const response = await fetch(`/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 包括 cookie
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        alert("Registration successful! Please log in."); // Success message
        // Optionally clear form fields or reset the form
        // loginForm.reset();
      } else {
        const errorData = await response.json();
        alert("Registration failed: " + errorData.error);
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration error: " + error.message);
    }
  });

  async function checkToken() {
    try {
      const response = await fetch("/api/checktoken", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("username", data.username);
        window.location.href = `/index.html`; // Redirect to homepage
      } else {
        const errorData = await response.json();
        console.warn("No token or Invalid token:", errorData.error);
        return;
      }
    } catch (error) {
      console.error("checking token failed", error);
    }
  }
});
