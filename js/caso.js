document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = 'index.html';

  carregarCasosRecentes(token);
  atualizarContadorVitimas();

  // Delegar evento para remover vítimas
  document.getElementById('vitimasContainer')?.addEventListener('click', function(e) {
    if (e.target.closest('.btn-remover-vitima')) {
      e.target.closest('.vitima-card').remove();
      atualizarContadorVitimas();
    }
  });

  // Adicionar evento para botão de adicionar vítima
  document.getElementById('btnAdicionarVitima')?.addEventListener('click', function() {
    const template = document.getElementById('templateVitima');
    const clone = template.content.cloneNode(true);
    document.getElementById('vitimasContainer').appendChild(clone);
    atualizarContadorVitimas();
  });

  const form = document.getElementById('formCaso');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btnSubmit = form.querySelector('button[type="submit"]');
      btnSubmit.disabled = true;
      btnSubmit.classList.add('loading');

      try {
        const payload = {
          numeroCaso: document.getElementById('numeroCaso').value,
          titulo: document.getElementById('titulo').value,
          descricao: document.getElementById('descricao').value,
          dataOcorrido: document.getElementById('dataOcorrido').value,
          local: document.getElementById('local').value,
          status: document.getElementById('status').value,
          vitimas: Array.from(document.querySelectorAll('.vitima-card')).map(card => ({
            nic: card.querySelector('.vitima-nic').value,
            nome: card.querySelector('.vitima-nome').value,
            genero: card.querySelector('.vitima-genero').value,
            idade: parseInt(card.querySelector('.vitima-idade').value) || undefined,
            corEtnia: card.querySelector('.vitima-corEtnia').value
          }))
        };

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
          document.getElementById('vitimasContainer').innerHTML = `
            <div class="text-muted text-center py-3" id="nenhumaVitimaMsg">
              <i class="bi bi-person-x fs-4"></i>
              <p class="mt-2 mb-0">Nenhuma vítima adicionada</p>
            </div>
          `;
          atualizarContadorVitimas();
          window.location.href = 'dashboard.html';
        } else {
          throw new Error(data.error || 'Erro ao criar caso');
        }
      } catch (err) {
        console.error('Erro ao criar caso:', err);
        alert(err.message || 'Erro no servidor');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.classList.remove('loading');
      }
    });
  }

  const formEditar = document.getElementById('formEditarCaso');
  if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editarCasoId').value;
      const btnSubmit = formEditar.querySelector('button[type="submit"]');
      
      btnSubmit.disabled = true;
      btnSubmit.classList.add('loading');

      try {
        const payload = {
          numeroCaso: document.getElementById('editarNumeroCaso').value,
          titulo: document.getElementById('editarTitulo').value,
          descricao: document.getElementById('editarDescricao').value,
          dataOcorrido: document.getElementById('editarDataOcorrido').value,
          local: document.getElementById('editarLocal').value,
          status: document.getElementById('editarStatus').value
        };

        const res = await fetch(`https://odontoforense-backend.onrender.com/api/casos/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
          alert('Caso atualizado com sucesso!');
          bootstrap.Modal.getInstance(document.getElementById('modalEditarCaso')).hide();
          carregarCasosRecentes(token);
        } else {
          throw new Error(data.error || 'Erro ao atualizar caso');
        }
      } catch (err) {
        console.error('Erro ao atualizar caso:', err);
        alert(err.message || 'Erro inesperado');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.classList.remove('loading');
      }
    });
  }
});

// Função para atualizar o contador de vítimas
function atualizarContadorVitimas() {
  const vitimas = document.querySelectorAll('.vitima-card');
  const counter = document.getElementById('vitimaCounter');
  const nenhumaVitimaMsg = document.getElementById('nenhumaVitimaMsg');
  
  if (counter) counter.textContent = vitimas.length;
  
  if (nenhumaVitimaMsg) {
    nenhumaVitimaMsg.style.display = vitimas.length > 0 ? 'none' : 'block';
  }
  
  // Atualizar números das vítimas
  vitimas.forEach((vitima, index) => {
    const numeroElement = vitima.querySelector('.vitima-numero');
    if (numeroElement) numeroElement.textContent = index + 1;
  });
}

async function carregarCasosRecentes(token) {
  try {
    const response = await fetch('https://odontoforense-backend.onrender.com/api/casos?limit=1000', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Erro ao carregar casos');

    const casos = await response.json();
    const divCasosRecentes = document.getElementById('casos-recentes');
    if (!divCasosRecentes) return;

    divCasosRecentes.innerHTML = '';

    if (!casos.success || !Array.isArray(casos.data.docs) || casos.data.docs.length === 0) {
      divCasosRecentes.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-folder-x fs-1 text-muted"></i>
          <h5 class="mt-3 text-muted">Nenhum caso encontrado</h5>
        </div>
      `;
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
                ${caso.vitimas?.length ? `
                  <div class="mt-2 d-flex align-items-center">
                    <i class="bi bi-people-fill me-2 text-muted"></i>
                    <small class="text-muted">${caso.vitimas.length} vítima(s)</small>
                  </div>
                ` : ''}
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
  } catch (err) {
    console.error('Erro ao carregar casos:', err);
    const divCasosRecentes = document.getElementById('casos-recentes');
    if (divCasosRecentes) {
      divCasosRecentes.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-exclamation-triangle fs-1 text-danger"></i>
          <h5 class="mt-3 text-danger">Erro ao carregar casos</h5>
          <p class="text-muted">${err.message}</p>
        </div>
      `;
    }
  }
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
      throw new Error(data.error || 'Erro ao deletar caso');
    }
  } catch (err) {
    console.error('Erro ao deletar caso:', err);
    alert(err.message || 'Erro inesperado ao deletar caso');
  }
}
