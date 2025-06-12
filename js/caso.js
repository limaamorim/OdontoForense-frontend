document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = 'index.html';

  carregarCasosRecentes(token);
  atualizarContadorVitimas();

  document.getElementById('vitimasContainer')?.addEventListener('click', function(e) {
    if (e.target.closest('.btn-remover-vitima')) {
      e.target.closest('.vitima-card').remove();
      atualizarContadorVitimas();
    }
  });

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

function atualizarContadorVitimas() {
  const vitimas = document.querySelectorAll('.vitima-card');
  const counter = document.getElementById('vitimaCounter');
  const nenhumaVitimaMsg = document.getElementById('nenhumaVitimaMsg');

  if (counter) counter.textContent = vitimas.length;

  if (nenhumaVitimaMsg) {
    nenhumaVitimaMsg.style.display = vitimas.length > 0 ? 'none' : 'block';
  }

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
              <div class="text-end">
                <button class="btn btn-sm btn-outline-primary mb-2" onclick='visualizarCaso(${JSON.stringify(caso)})'>
                  <i class="bi bi-eye-fill"></i>
                </button><br>
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

document.getElementById('inputBuscaCaso')?.addEventListener('input', function (e) {
  const termo = e.target.value.toLowerCase();
  const cards = document.querySelectorAll('#casos-recentes .card');

  cards.forEach(card => {
    const texto = card.innerText.toLowerCase();
    card.parentElement.style.display = texto.includes(termo) ? '' : 'none';
  });
});

async function visualizarCaso(caso) {
  const container = document.getElementById('detalhesCaso');
  const token = localStorage.getItem('token');

  const statusMap = {
    'aberto': 'case-status-open',
    'em andamento': 'case-status-progress',
    'fechado': 'case-status-closed'
  };
  const statusClass = statusMap[caso.status?.toLowerCase()] || 'case-status-open';

  const dataFormatada = caso.dataOcorrido ?
    new Date(caso.dataOcorrido).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }) : 'Não informada';

  // Buscar vítimas do caso
  let vitimas = [];
  try {
    const resVitimas = await fetch(`https://odontoforense-backend.onrender.com/api/vitimas/casos/${caso._id}/vitimas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (resVitimas.ok) vitimas = await resVitimas.json();
  } catch (err) {
    console.error("Erro ao buscar vítimas:", err);
  }

  // Buscar evidências do caso
  let evidencias = [];
  try {
    const resEvidencias = await fetch(`https://odontoforense-backend.onrender.com/api/evidencias?casoId=${caso._id}`);
    if (resEvidencias.ok) evidencias = await resEvidencias.json();
  } catch (err) {
    console.error("Erro ao buscar evidências:", err);
  }

  // Gerar HTML das vítimas
  const vitimasHtml = vitimas.length ? vitimas.map((v, i) => `
    <div class="victim-card">
      <div class="victim-card-header">
        <i class="bi bi-person-vcard"></i>
        Vítima ${i + 1}
      </div>
      <div class="detail-item"><span class="detail-label">NIC:</span><span class="detail-value">${v.nic || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">Nome:</span><span class="detail-value">${v.nome || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">Gênero:</span><span class="detail-value">${v.genero || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">Idade:</span><span class="detail-value">${v.idade || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">Cor/Etnia:</span><span class="detail-value">${v.corEtnia || '-'}</span></div>
    </div>
  `).join('') : `
    <div class="text-center py-4 text-muted">
      <i class="bi bi-person-x fs-2"></i>
      <p class="mt-2 mb-0">Nenhuma vítima cadastrada</p>
    </div>`;

  // Gerar HTML das evidências
const evidenciasHtml = evidencias.length ? evidencias.map(e => `
  <div class="evidence-item col-md-3 mb-3">
'    <a href="https://odontoforense-backend.onrender.com/uploads/${e.imagem}" target="_blank">
  <img src="https://odontoforense-backend.onrender.com/uploads/${e.imagem}" 
       class="img-fluid border rounded shadow-sm w-100"  
       alt="${e.nome}">
</a>
'
    <div class="evidence-caption small text-muted mt-1 text-center">${e.nome || 'Sem nome'}</div>
  </div>
`).join('') : `<p class="text-muted">Nenhuma evidência registrada</p>`;


  // Definir conteúdo do modal
  container.innerHTML = `
    <h5><i class="bi bi-folder-fill"></i> ${caso.titulo || 'Sem título'} <span class="badge ${statusClass} ms-2">${caso.status || 'Aberto'}</span></h5>

    <div class="case-detail-section">
      <div class="detail-title"><i class="bi bi-info-circle"></i> Informações do Caso</div>
      <div class="detail-content">
        <div class="detail-item"><span class="detail-label">Número:</span><span class="detail-value">${caso.numeroCaso || '-'}</span></div>
        <div class="detail-item"><span class="detail-label">Status:</span><span class="detail-value">${caso.status || 'Aberto'}</span></div>
        <div class="detail-item"><span class="detail-label">Local:</span><span class="detail-value">${caso.local || '-'}</span></div>
        <div class="detail-item"><span class="detail-label">Data:</span><span class="detail-value">${dataFormatada}</span></div>
        <div class="detail-item"><span class="detail-label">Descrição:</span><span class="detail-value">${caso.descricao || 'Nenhuma descrição fornecida'}</span></div>
      </div>
    </div>

    <hr>

    <div class="case-detail-section">
      <div class="detail-title"><i class="bi bi-people-fill"></i> Vítimas</div>
      <div>${vitimasHtml}</div>
    </div>

    <hr>

    <div class="case-detail-section">
      <div class="detail-title"><i class="bi bi-camera-fill"></i> Evidências</div>
      <div class="evidence-grid row">${evidenciasHtml}</div>
    </div>
  `;

  new bootstrap.Modal(document.getElementById('modalVisualizarCaso')).show();
}
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = 'index.html';

  carregarCasosRecentes(token);
  atualizarContadorVitimas();

  document.getElementById('vitimasContainer')?.addEventListener('click', function(e) {
    if (e.target.closest('.btn-remover-vitima')) {
      e.target.closest('.vitima-card').remove();
      atualizarContadorVitimas();
    }
  });

  document.getElementById('btnAdicionarVitima')?.addEventListener('click', function() {
    const template = document.getElementById('templateVitima');
    const clone = template.content.cloneNode(true);
    document.getElementById('vitimasContainer').appendChild(clone);
    atualizarContadorVitimas();
  });

  document.getElementById('btnAdicionarVitimaEditar')?.addEventListener('click', function() {
    const template = document.getElementById('templateVitima');
    const clone = template.content.cloneNode(true);
    document.getElementById('vitimasContainerEditar').appendChild(clone);
  });

  document.getElementById('vitimasContainerEditar')?.addEventListener('click', function(e) {
    if (e.target.closest('.btn-remover-vitima')) {
      e.target.closest('.vitima-card').remove();
    }
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
            idade: card.querySelector('.vitima-idade').value,
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
          status: document.getElementById('editarStatus').value,
          vitimas: Array.from(document.querySelectorAll('#vitimasContainerEditar .vitima-card')).map(card => ({
            nic: card.querySelector('.vitima-nic').value,
            nome: card.querySelector('.vitima-nome').value,
            genero: card.querySelector('.vitima-genero').value,
            idade: card.querySelector('.vitima-idade').value,
            corEtnia: card.querySelector('.vitima-corEtnia').value
          }))
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

async function abrirModalEdicao(caso) {
  const token = localStorage.getItem('token');
  document.getElementById('editarCasoId').value = caso._id;
  document.getElementById('editarNumeroCaso').value = caso.numeroCaso;
  document.getElementById('editarTitulo').value = caso.titulo;
  document.getElementById('editarDescricao').value = caso.descricao;
  document.getElementById('editarDataOcorrido').value = caso.dataOcorrido?.substring(0, 10);
  document.getElementById('editarLocal').value = caso.local;
  document.getElementById('editarStatus').value = caso.status;
  
  document.getElementById('vitimasContainerEditar').innerHTML = '';

  try {
    const resVitimas = await fetch(`https://odontoforense-backend.onrender.com/api/vitimas/casos/${caso._id}/vitimas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const vitimas = await resVitimas.json();

    vitimas.forEach(v => {
      const template = document.getElementById('templateVitima');
      const clone = template.content.cloneNode(true);
      document.getElementById('vitimasContainerEditar').appendChild(clone);
      const cards = document.querySelectorAll('#vitimasContainerEditar .vitima-card');
      const card = cards[cards.length - 1];

      card.querySelector('.vitima-nic').value = v.nic;
      card.querySelector('.vitima-nome').value = v.nome;
      card.querySelector('.vitima-genero').value = v.genero;
      card.querySelector('.vitima-idade').value = v.idade;
      card.querySelector('.vitima-corEtnia').value = v.corEtnia;
    });
  } catch (err) {
    console.error("Erro ao carregar vítimas na edição:", err);
  }

  const modal = new bootstrap.Modal(document.getElementById('modalEditarCaso'));
  modal.show();
}
