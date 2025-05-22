document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = 'index.html';

  const listaCasos = document.getElementById('listaCasos');
  const fileInput = document.getElementById('fileInput');
  const uploadArea = document.getElementById('uploadArea');
  const tipoInput = document.getElementById('tipoEvidencia');
  const descricaoInput = document.getElementById('descricao');
  const formEvidencia = document.getElementById('formEvidencia');
  const casoSelecionadoInput = document.getElementById('casoSelecionadoId');

  uploadArea.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const fileName = fileInput.files[0]?.name || 'Clique para selecionar a imagem';
    uploadArea.querySelector('p').textContent = fileName;
  });

  async function carregarCasos() {
    try {
      const res = await fetch('https://odontoforense-backend.onrender.com/api/casos?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { data } = await res.json();
      const casos = data.docs || data;

      listaCasos.innerHTML = '';

      casos.forEach(caso => {
        const col = document.createElement('div');
        col.className = 'col';

        col.innerHTML = `
          <div class="card shadow-sm h-100 border-0 rounded-4">
            <div class="card-body">
              <h5 class="card-title">Caso #${caso.numeroCaso}</h5>
              <p class="card-text text-muted mb-2"><strong>Perito:</strong> ${caso.peritoResponsavel?.nome || '-'}</p>
              <p class="card-text small">${caso.descricao || 'Sem descrição fornecida.'}</p>
              <button class="btn btn-outline-primary w-100 mt-3 abrir-modal-btn" data-id="${caso._id}">
                <i class="bi bi-search me-1"></i> Adicionar Evidência
              </button>
            </div>
          </div>
        `;
        listaCasos.appendChild(col);
      });

      // Delegação para abrir o modal
      listaCasos.addEventListener('click', e => {
        const btn = e.target.closest('.abrir-modal-btn');
        if (!btn) return;

        const casoId = btn.dataset.id;
        casoSelecionadoInput.value = casoId;
        tipoInput.value = '';
        descricaoInput.value = '';
        fileInput.value = '';
        uploadArea.querySelector('p').textContent = 'Clique para selecionar a imagem';

        const modal = new bootstrap.Modal(document.getElementById('modalEvidencia'));
        modal.show();
      });

    } catch (err) {
      console.error('Erro ao carregar casos:', err);
      alert('Erro ao buscar casos');
    }
  }

  formEvidencia.addEventListener('submit', async e => {
    e.preventDefault();

    const casoId = casoSelecionadoInput.value;
    if (!casoId || !fileInput.files.length || !tipoInput.value || !descricaoInput.value) {
      return alert('Preencha todos os campos.');
    }

    const formData = new FormData();
    formData.append('arquivo', fileInput.files[0]);
    formData.append('tipo', tipoInput.value);
    formData.append('descricao', descricaoInput.value);

    try {
      const res = await fetch(`https://odontoforense-backend.onrender.com/api/casos/${casoId}/evidencias`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        alert('Evidência cadastrada com sucesso!');
        bootstrap.Modal.getInstance(document.getElementById('modalEvidencia')).hide();
      } else {
        alert(data.error || 'Erro ao cadastrar evidência.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao enviar evidência.');
    }
  });

  carregarCasos();
});
