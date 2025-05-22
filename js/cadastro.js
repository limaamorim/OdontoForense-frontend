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
  const tabelaUsuarios = document.getElementById('tabelaUsuarios');
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
        headers: { Authorization: `Bearer ${token}` }
      });

      const dados = await res.json();
      if (!res.ok) {
        alert(dados.error || 'Erro ao carregar usuários');
        return;
      }

      tbody.innerHTML = '';
      dados.data.forEach(usuario => {
        const tr = document.createElement('tr');
        const tipoBadge = usuario.tipo === 'administrador'
          ? '<span class="badge bg-primary">Administrador</span>'
          : '<span class="badge bg-success">Perito</span>';

        tr.innerHTML = `
          <td>${usuario.nome}</td>
          <td>${usuario.email}</td>
          <td>${tipoBadge}</td>
          <td>
            <button class="btn btn-sm btn-outline-secondary me-2" onclick="editarUsuario('${usuario._id}', '${usuario.nome}', '${usuario.email}', '${usuario.tipo}')">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deletarUsuario('${usuario._id}')">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      alert('Erro inesperado ao listar usuários');
    }
  }

  if (isAdmin) {
    carregarUsuarios();
  } else {
    const cardUsuarios = document.getElementById('cardUsuarios');
    if (cardUsuarios) cardUsuarios.style.display = 'none';
  }

  // Adiciona escuta ao formulário de edição (mesmo formulário reutilizado)
  window.editarUsuario = (id, nome, email, tipo) => {
    document.getElementById('modalNovoUsuarioLabel').innerHTML = '✏️ Editar Usuário';
    formCadastro.dataset.editando = id;
    nomeInput.value = nome;
    emailInput.value = email;
    tipoInput.value = tipo;
    senhaInput.value = '';
    new bootstrap.Modal(document.getElementById('modalNovoUsuario')).show();
  };

  window.deletarUsuario = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const res = await fetch(`https://odontoforense-backend.onrender.com/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        alert('Usuário excluído com sucesso');
        carregarUsuarios();
      } else {
        alert(data.error || 'Erro ao excluir usuário');
      }
    } catch (err) {
      console.error('Erro ao deletar usuário:', err);
      alert('Erro inesperado');
    }
  };

  // Ao enviar o formulário, se estiver em modo edição:
  formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = formCadastro.dataset.editando;
    if (!id) return; // já tratado acima como criação

    const payload = {
      nome: nomeInput.value.trim(),
      email: emailInput.value.trim(),
      senha: senhaInput.value.trim(),
      tipo: tipoInput.value
    };

    try {
      const res = await fetch(`https://odontoforense-backend.onrender.com/api/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        alert('Usuário atualizado com sucesso!');
        bootstrap.Modal.getInstance(document.getElementById('modalNovoUsuario')).hide();
        formCadastro.dataset.editando = '';
        formCadastro.reset();
        carregarUsuarios();
      } else {
        alert(data.error || 'Erro ao atualizar');
      }
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      alert('Erro inesperado');
    }
  });
});
