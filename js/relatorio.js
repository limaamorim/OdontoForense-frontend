document.addEventListener('DOMContentLoaded', () => {
  const { jsPDF } = window.jspdf;
  const token = localStorage.getItem('token');
  console.log('Token JWT:', token);
  if (!token) window.location.href = 'index.html';

  // Elementos da UI
  const elements = {
    casoSelect: document.getElementById('casoSelect'),
    tipoDocumento: document.getElementById('tipoDocumento'),
    btnGerarDocumento: document.getElementById('btnGerarDocumento'),
    btnVisualizarRelatorio: document.getElementById('btnVisualizarRelatorio'),
    btnVisualizarLaudo: document.getElementById('btnVisualizarLaudo'),
    btnDownloadRelatorio: document.getElementById('btnDownloadRelatorio'),
    btnDownloadLaudo: document.getElementById('btnDownloadLaudo'),
    conteudoRelatorio: document.getElementById('conteudoRelatorio'),
    conteudoLaudo: document.getElementById('conteudoLaudo'),
    statusGeracao: document.getElementById('statusGeracao'),
    loadingModal: new bootstrap.Modal('#loadingModal'),
    loadingMessage: document.getElementById('loadingMessage'),
    tituloRelatorio: document.getElementById('tituloRelatorio')
  };

  let casoAtual = null;
  let documentosGerados = {
    relatorio: null,
    laudo: null
  };

  // Carregar casos
  async function carregarCasos() {
    try {
      const response = await fetch('https://odontoforense-backend.onrender.com/api/casos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Erro ao carregar casos');
      
      const data = await response.json();
      const casos = data.data.docs || data.data;
      
      casos.forEach(caso => {
        const option = document.createElement('option');
        option.value = caso._id;
        option.textContent = `${caso.numeroCaso || 'Caso'} - ${caso.titulo}`;
        elements.casoSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Erro ao carregar casos:', error);
      mostrarAlerta('Erro ao carregar lista de casos', 'danger');
    }
  }

  // Gerar documento via IA
  async function gerarDocumento() {
    const casoId = elements.casoSelect.value;
    const tipo = elements.tipoDocumento.value;
    
    if (!casoId) {
      mostrarAlerta('Selecione um caso para continuar', 'warning');
      return;
    }

    elements.loadingMessage.textContent = tipo === 'ambos' 
      ? 'Gerando relatório e laudo...' 
      : `Gerando ${tipo === 'relatorio' ? 'relatório' : 'laudo'}...`;
    elements.loadingModal.show();

    try {
      // 1. Buscar detalhes do caso
      const resCaso = await fetch(`https://odontoforense-backend.onrender.com/api/casos/${casoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!resCaso.ok) throw new Error('Erro ao buscar caso');
      
      const { data: caso } = await resCaso.json();
      casoAtual = caso;

      // 2. Gerar documentos conforme seleção
      if (tipo === 'relatorio' || tipo === 'ambos') {
        await gerarRelatorioIA(caso);
      }
      
      if (tipo === 'laudo' || tipo === 'ambos') {
        await gerarLaudoIA(caso);
      }

      // 3. Atualizar UI
      atualizarUI();
      mostrarAlerta('Documento(s) gerado(s) com sucesso!', 'success');

    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      mostrarAlerta(`Falha ao gerar documento: ${error.message}`, 'danger');
    } finally {
      elements.loadingModal.hide();
    }
  }

  // Gerar relatório por IA
  async function gerarRelatorioIA(caso) {
    try {
      const response = await fetch('https://odontoforense-backend.onrender.com/api/relatorios/ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          casoId: caso._id,
          responsavelId: getUserIdFromToken()
        })
      });

      if (!response.ok) throw new Error('Erro na API de relatórios');

      const { data: relatorio } = await response.json();
      documentosGerados.relatorio = relatorio;
      
      // Exibir relatório
      elements.conteudoRelatorio.innerHTML = formatarConteudo(relatorio.descricao);
      elements.tituloRelatorio.textContent = relatorio.titulo;
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  // Gerar laudo por IA
  async function gerarLaudoIA(caso) {
    try {
      // Verificar se há evidências
      if (!caso.evidencias || caso.evidencias.length === 0) {
        throw new Error('O caso não possui evidências para gerar um laudo');
      }

      const response = await fetch('https://odontoforense-backend.onrender.com/api/laudos/ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          evidenciaId: caso.evidencias[0]._id, // Pega a primeira evidência
          tipoLaudo: 'odontologico' // Pode ser dinâmico
        })
      });

      if (!response.ok) throw new Error('Erro na API de laudos');

      const { data: laudo } = await response.json();
      documentosGerados.laudo = laudo;
      
      // Exibir laudo
      elements.conteudoLaudo.innerHTML = `
        <div class="mb-3">${formatarConteudo(laudo.conteudo)}</div>
        <div class="conclusao p-3 bg-light rounded">
          <h5>Conclusão</h5>
          <p>${laudo.conclusao}</p>
        </div>
      `;
      elements.tituloLaudo.textContent = `Laudo Técnico - Caso ${caso.numeroCaso}`;
      
    } catch (error) {
      console.error('Erro ao gerar laudo:', error);
      throw error;
    }
  }

  // Funções auxiliares
  function getUserIdFromToken() {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.usuario.id;
  }

  function formatarConteudo(texto) {
    // Transforma markdown simples em HTML
    return texto
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gm, '<h4>$1</h4>')
      .replace(/^## (.*$)/gm, '<h5>$1</h5>')
      .replace(/\n/g, '<br>');
  }

  function atualizarUI() {
    const temRelatorio = documentosGerados.relatorio !== null;
    const temLaudo = documentosGerados.laudo !== null;

    elements.btnVisualizarRelatorio.disabled = !temRelatorio;
    elements.btnVisualizarLaudo.disabled = !temLaudo;
    elements.btnDownloadRelatorio.disabled = !temRelatorio;
    elements.btnDownloadLaudo.disabled = !temLaudo;
  }

  function mostrarAlerta(mensagem, tipo) {
    elements.statusGeracao.innerHTML = `
      <div class="alert alert-${tipo} d-flex align-items-center">
        ${mensagem}
      </div>
    `;
    elements.statusGeracao.style.display = 'block';
    setTimeout(() => elements.statusGeracao.style.display = 'none', 5000);
  }

  // Event Listeners
  elements.btnGerarDocumento.addEventListener('click', gerarDocumento);
  
  elements.btnDownloadRelatorio.addEventListener('click', () => {
    if (!documentosGerados.relatorio) return;
    gerarPDF('relatorio');
  });
  
  elements.btnDownloadLaudo.addEventListener('click', () => {
    if (!documentosGerados.laudo) return;
    gerarPDF('laudo');
  });

  // Função para gerar PDF
 function gerarPDF(tipo) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const margin = 20;
  let y = margin;

  doc.setFontSize(16);
  const titulo = tipo === 'relatorio' ? 'RELATÓRIO FORENSE' : 'LAUDO TÉCNICO';
  doc.text(titulo, 105, y, null, null, 'center');
  y += 10;
  doc.line(margin, y, 210 - margin, y);
  y += 10;

  doc.setFontSize(12);
  const conteudo = tipo === 'relatorio' 
      ? elements.conteudoRelatorio.innerText 
      : elements.conteudoLaudo.innerText;

  const linhas = doc.splitTextToSize(conteudo, 170);

  linhas.forEach(linha => {
    if (y >= 280) { // limite aproximado da página
      doc.addPage();
      y = margin;
    }
    doc.text(linha, margin, y);
    y += 7;
  });

  // Salva o arquivo
  doc.save(`${titulo}_caso_${casoAtual.numeroCaso || 'sem-numero'}.pdf`);
}
  // Inicialização
  carregarCasos();
});
