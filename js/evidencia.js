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
    formData.append('imagem', fileInput.files[0]);
    formData.append('tipo', tipoInput.value);
    formData.append('descricao', descricaoInput.value);
      console.log('[DEBUG formData]');
      for (const [chave, valor] of formData.entries()) {
        console.log(`→ ${chave}:`, valor);
      }


    try {
      const res = await fetch(`https://odontoforense-backend.onrender.com/api/evidencias/casos/${casoId}/evidencias`, {
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
// Filtro de busca para os cards de casos
document.getElementById('inputBuscaEvidencia')?.addEventListener('input', function (e) {
  const termo = e.target.value.toLowerCase();
  const cards = document.querySelectorAll('#listaCasos .card');

  cards.forEach(card => {
    const texto = card.innerText.toLowerCase();
    card.parentElement.style.display = texto.includes(termo) ? '' : 'none';
  });
});
// ... (código existente até o btnVerRelatorio.addEventListener)

btnVerRelatorio.addEventListener('click', async () => {
  const casoId = casoSelect.value;
  if (!casoId) return alert('Selecione um caso');

  relatorioContainer.style.display = 'none';

  try {
    const resCaso = await fetch(`http://localhost:5000/api/casos/${casoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (resCaso.status === 403) {
      alert('Você não tem permissão para visualizar este relatório.');
      return;
    }

    const { data: caso } = await resCaso.json();
    casoAtual = caso;

    // Preenche os campos básicos
    laudoNumero.textContent = caso.numeroCaso;
    laudoPerito.textContent = `Dr. ${caso.peritoResponsavel.nome}`;
    laudoLocal.textContent = caso.local;
    laudoDataEmissao.textContent = new Date().toLocaleDateString();
    tituloCaso.textContent = caso.titulo;
    dataOcorrido.textContent = new Date(caso.dataOcorrido).toLocaleDateString();
    statusCasos.forEach(el => el.textContent = caso.status);

    // --- NOVO: GERA RELATÓRIO COM DEEPSEEK IA ---
    const promptRelatorio = `
      Gere um relatório pericial detalhado com base nas seguintes informações:
      - Título: ${caso.titulo}
      - Número do Caso: ${caso.numeroCaso}
      - Perito: ${caso.peritoResponsavel.nome}
      - Local: ${caso.local}
      - Data do Ocorrido: ${new Date(caso.dataOcorrido).toLocaleDateString()}
      - Status: ${caso.status}
      - Descrição: ${caso.descricao}
      - Evidências: ${caso.evidencias?.map(e => `Tipo: ${e.tipo}, Descrição: ${e.descricao}`).join('; ') || 'Nenhuma'}

      Estruture o relatório com:
      1. Análise Técnica
      2. Correlação de Evidências
      3. Conclusões
      4. Recomendações (se aplicável)
    `;

    const relatorioGerado = await gerarRelatorioComIA(promptRelatorio);
    
    // Exibe o relatório no HTML (adicione uma div com id="relatorioGerado" no HTML)
    document.getElementById('relatorioGerado').innerHTML = relatorioGerado;

    relatorioContainer.style.display = 'block';

  } catch (err) {
    console.error(err);
    alert('Erro ao carregar relatório');
  }
});

// Função para chamar a API da DeepSeek (ou outra IA)
async function gerarRelatorioComIA(prompt) {
  const API_KEY = 'SUA_API_KEY_DEEPSEEK'; // Substitua pela sua chave
  const API_URL = 'https://api.deepseek.com/v1/chat/completions'; // Verifique o endpoint correto

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // Verifique o modelo correto
        messages: [
          { role: 'system', content: 'Você é um assistente especializado em gerar relatórios periciais técnicos.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3 // Controla a criatividade (baixo = mais técnico)
      })
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Erro ao gerar relatório.';
  } catch (error) {
    console.error('Erro na API de IA:', error);
    return 'Não foi possível gerar o relatório automaticamente.';
  }
}
