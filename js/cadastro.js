document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Você precisa estar logado');
    window.location.href = 'index.html';
    return;
  }

  const formCadastro = document.getElementById('formCadastro');
  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  const tipoInput = document.getElementById('tipo');
  const tabelaUsuarios = document.getElementById('tabelaUsuarios'); // tabela com id no HTML
  const tbody = tabelaUsuarios?.querySelector('tbody');

  let isAdmin = false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    isAdmin = payload?.usuario?.tipo === 'administrador';
  } catch (err) {
    console.warn('Token inválido:', err);
  }

  formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();
    const senha = senhaInput.value.trim();
    const tipo = tipoInput.value;

    try {
      const response = await fetch('https://odontoforense-backend.onrender.com/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nome, email, senha, tipo })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Erro ao cadastrar usuário');
        return;
      }

      alert('Usuário cadastrado com sucesso!');
      formCadastro.reset();
      if (isAdmin) carregarUsuarios();

    } catch (err) {
      console.error('Erro ao cadastrar:', err);
      alert('Erro inesperado ao cadastrar');
    }
  });

  async function carregarUsuarios() {
    if (!tabelaUsuarios || !tbody) return;

    try {
      const res = await fetch('https://odontoforense-backend.onrender.com/api/usuarios', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const dados = await res.json();

      if (!res.ok) {
        alert(dados.error || 'Erro ao carregar usuários');
        return;
      }

      tbody.innerHTML = '';
      dados.data.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${usuario.nome}</td>
          <td>${usuario.email}</td>
          <td>${usuario.tipo}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      alert('Erro inesperado ao listar usuários');
    }
  }

  // Carregar usuários apenas se for administrador
  if (isAdmin) {
    carregarUsuarios();
  } else {
    const cardUsuarios = document.getElementById('cardUsuarios');
    if (cardUsuarios) cardUsuarios.style.display = 'none';
  }
});
