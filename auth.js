const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://REPLACE_WITH_YOUR_RAILWAY_BACKEND_URL';

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const full_name = document.getElementById('full_name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const messageEl = document.getElementById('formMessage');

    fetch(API_URL + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ full_name, email, phone, password })
    })
      .then(function (res) { return res.json().then(function (data) { return { status: res.status, data: data }; }); })
      .then(function (result) {
        if (result.status === 201) {
          messageEl.textContent = 'Account created! Redirecting to login...';
          messageEl.className = 'form-message success';
          setTimeout(function () {
            window.location.href = 'login.html';
          }, 1500);
        } else {
          messageEl.textContent = result.data.message || 'Something went wrong.';
          messageEl.className = 'form-message error';
        }
      })
      .catch(function () {
        messageEl.textContent = 'Could not connect to server. Is the backend running?';
        messageEl.className = 'form-message error';
      });
  });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageEl = document.getElementById('formMessage');

    fetch(API_URL + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    })
      .then(function (res) { return res.json().then(function (data) { return { status: res.status, data: data }; }); })
      .then(function (result) {
        if (result.status === 200) {
          messageEl.textContent = 'Login successful! Redirecting...';
          messageEl.className = 'form-message success';
          setTimeout(function () {
            window.location.href = 'index.html';
          }, 1000);
        } else {
          messageEl.textContent = result.data.message || 'Invalid login.';
          messageEl.className = 'form-message error';
        }
      })
      .catch(function () {
        messageEl.textContent = 'Could not connect to server. Is the backend running?';
        messageEl.className = 'form-message error';
      });
  });
}

function checkLoginStatus() {
  const navAuthArea = document.getElementById('navAuthArea');
  if (!navAuthArea) return;

  fetch(API_URL + '/check-session', {
    credentials: 'include'
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.loggedIn) {
        navAuthArea.innerHTML = '<span class="nav-greeting">Hi, ' + data.full_name.split(' ')[0] + '</span><button id="logoutBtn" class="btn btn-nav">Logout</button>';
        document.getElementById('logoutBtn').addEventListener('click', function () {
          fetch(API_URL + '/logout', {
            method: 'POST',
            credentials: 'include'
          }).then(function () {
            window.location.href = 'login.html';
          });
        });
        document.documentElement.classList.add('auth-verified');
      } else {
        window.location.href = 'login.html';
      }
    })
    .catch(function () {
      window.location.href = 'login.html';
    });
}

checkLoginStatus();