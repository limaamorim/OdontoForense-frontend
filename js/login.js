document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const button = document.getElementById('submitBtn');
  const buttonText = button.querySelector('.button-text');
  const spinner = button.querySelector('.spinner');

  try {
    // Mostrar spinner
    button.disabled = true;
    buttonText.style.opacity = '0';
    spinner.classList.add('active');

    const response = await fetch('https://odontoforense-backend.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha: password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.usuario));

      // Feedback visual de sucesso
      button.style.background = '#4CAF50';
      buttonText.textContent = 'Login realizado!';
      buttonText.style.opacity = '1';
      spinner.classList.remove('active');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      throw new Error(data.msg || 'Email ou senha inválidos');
    }
  } catch (err) {
    console.error('Erro no login:', err);
    
    // Feedback visual de erro
    button.style.background = '#e74c3c';
    buttonText.textContent = 'Erro ao entrar';
    buttonText.style.opacity = '1';
    spinner.classList.remove('active');

    setTimeout(() => {
      button.style.background = 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
      buttonText.textContent = 'Entrar';
      button.disabled = false;
    }, 1500);
    
    alert(err.message);
  }
});

// Toggle password visibility
document.querySelector('.toggle-password').addEventListener('click', function() {
  const passwordInput = document.getElementById('password');
  const icon = this;
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
});
