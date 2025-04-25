document.querySelector('form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('password').value;

  console.log('Email enviado para login:', email);
  console.log('Senha enviada para login:', senha);

  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();
    console.log('Resposta do servidor:', data);

    if (response.ok) {
      // Se o login for bem-sucedido, armazena o token no localStorage
      localStorage.setItem('token', data.token);
      
      // Redireciona para a página de dashboard
      window.location.href = 'dashboard.html';
    } else {
      alert(data.msg || 'Email ou senha inválidos');
    }
  } catch (err) {
    console.error('Erro no login:', err);
    alert('Erro ao tentar fazer login');
  }
});
