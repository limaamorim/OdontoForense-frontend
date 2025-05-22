document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = 'index.html';

  carregarCasosRecentes(token);

  const form = document.getElementById('formCaso');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const numeroCaso = document.getElementById('numeroCaso').value;
      const titulo = document.getElementById('titulo').value;
      const descricao = document.getElementById('descricao').value;
      const dataOcorrido = document.getElementById('dataOcorrido').value;
      const local = document.getElementById('local').value;
      const status = document.getElementById('status').value;

      const payload = {
        numeroCaso,
        titulo,
        descricao,
        dataOcorrido,
        local,
        status
      };

      try {
        const response = await fetch('https://odontoforense-backend.onrender.com/api/casos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          alert('Caso criado com sucesso!');
          form.reset();
          window.location.href = 'dashboard.html';
        } else {
          alert(data.error || 'Erro ao criar caso');
        }
      } catch (err) {
        console.error('Erro ao criar caso:', err);
        alert('Erro no servidor');
      }
    });
  }

  const formEditar = document.getElementById('formEditarCaso');
  if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editarCasoId').value;

      const payload = {
        numeroCaso: document.getElementById('editarNumeroCaso').value,
        titulo: document.getElementById('editarTitulo').value,
        descricao: document.getElementById('editarDescricao').value,
        dataOcorrido: document.getElementById('editarDataOcorrido').value,
        local: document.getElementById('editarLocal').value,
        status: document.getElementById('editarStatus').value
      };

      try {
        const res = await fetch(`https://odontoforense-backend.onrender.com/api/casos/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
          alert('Caso atualizado com sucesso!');
          bootstrap.Modal.getInstance(document.getElementById('modalEditarCaso')).hide();
          carregarCasosRecentes(localStorage.getItem('token'));
        } else {
          alert(data.error || 'Erro ao atualizar caso');
        }
      } catch (err) {
        console.error('Erro ao atualizar caso:', err);
        alert('Erro inesperado');
      }
    });
  }
});

async function carregarCasosRecentes(token) {
  const response = await fetch('https://odontoforense-backend.onrender.com/api/casos?limit=1000', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) return;

  const casos = await response.json();
  const divCasosRecentes = document.getElementById('casos-recentes');
  if (!divCasosRecentes) return;

  divCasosRecentes.innerHTML = '';

  if (!casos.success || !Array.isArray(casos.data.docs) || casos.data.docs.length === 0) {
    divCasosRecentes.innerHTML = '<p>Nenhum caso encontrado.</p>';
    return;
  }

  casos.data.docs.forEach(caso => {
    const statusMap = {
      'aberto': 'case-status-open',
      'em andamento': 'case-status-progress',
      'fechado': 'case-status-closed'
    };
    const statusClasse = statusMap[(caso.status || '').toLowerCase()] || 'case-status-open';

    const item = document.createElement('div');
    item.className = 'col-md-6 col-lg-4';
    item.innerHTML = `
      <div class="card shadow-sm border-0 rounded-4 h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="text-muted small mb-1">Caso - ${caso.numeroCaso || 'Sem número'}</h6>
              <h5 class="fw-semibold mb-2">${caso.titulo || 'Sem título'}</h5>
              <span class="badge ${statusClasse} px-3 py-2 text-uppercase small">${caso.status || 'Aberto'}</span>
            </div>
            <div>
              <button class="btn btn-sm btn-outline-secondary" onclick='abrirModalEdicao(${JSON.stringify(caso)})'>
                <i class="bi bi-pencil-square"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger ms-2" onclick='deletarCaso("${caso._id}")'>
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    divCasosRecentes.appendChild(item);
  });
}

function abrirModalEdicao(caso) {
  document.getElementById('editarCasoId').value = caso._id;
  document.getElementById('editarNumeroCaso').value = caso.numeroCaso;
  document.getElementById('editarTitulo').value = caso.titulo;
  document.getElementById('editarDescricao').value = caso.descricao;
  document.getElementById('editarDataOcorrido').value = caso.dataOcorrido?.substring(0, 10);
  document.getElementById('editarLocal').value = caso.local;
  document.getElementById('editarStatus').value = caso.status;

  const modal = new bootstrap.Modal(document.getElementById('modalEditarCaso'));
  modal.show();
}

async function deletarCaso(id) {
  if (!confirm('Tem certeza que deseja deletar este caso? Essa ação não poderá ser desfeita.')) return;

  try {
    const res = await fetch(`https://odontoforense-backend.onrender.com/api/casos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (res.ok) {
      alert('Caso deletado com sucesso!');
      carregarCasosRecentes(localStorage.getItem('token'));
    } else {
      const data = await res.json();
      alert(data.error || 'Erro ao deletar caso');
    }
  } catch (err) {
    console.error('Erro ao deletar caso:', err);
    alert('Erro inesperado ao deletar caso');
  }
}
