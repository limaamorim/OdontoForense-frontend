document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = 'index.html';

  const casoSelect = document.getElementById('casoSelect');
  const btnVerRelatorio = document.getElementById('btnVerRelatorio');
  const relatorioContainer = document.getElementById('relatorioContainer');
  const btnDownloadPdf = document.getElementById('btnDownloadPdf');

  const laudoNumero = document.getElementById('laudoNumero');
  const laudoPerito = document.getElementById('laudoPerito');
  const laudoLocal = document.getElementById('laudoLocal');
  const laudoDataEmissao = document.getElementById('laudoDataEmissao');
  const tituloCaso = document.getElementById('tituloCaso');
  const dataOcorrido = document.getElementById('dataOcorrido');
  const statusCasos = document.querySelectorAll('.statusCaso');

  let casoAtual = null;

  // Corrigido: falta de aspas na URL
  fetch('http://localhost:5000/api/casos', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      (data.data.docs || data.data).forEach(caso => {
        const opt = document.createElement('option');
        opt.value = caso._id;
        opt.textContent = `${caso.numeroCaso} - ${caso.titulo}`;
        casoSelect.appendChild(opt);
      });
    })
    .catch(err => {
      console.error('Erro ao carregar casos:', err);
      alert('Erro ao carregar lista de casos.');
    });

  btnVerRelatorio.addEventListener('click', async () => {
    const casoId = casoSelect.value;
    if (!casoId) return alert('Selecione um caso');

    relatorioContainer.style.display = 'none';

    try {
      const resCaso = await fetch(`http://localhost:5000/api/casos/${casoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (resCaso.status === 403) {
        alert('Você não tem permissão para visualizar este relatório.');
        return;
      }

      const { data: caso } = await resCaso.json();
      casoAtual = caso;

      laudoNumero.textContent = caso.numeroCaso;
      laudoPerito.textContent = `Dr. ${caso.peritoResponsavel.nome}`;
      laudoLocal.textContent = caso.local;
      laudoDataEmissao.textContent = new Date().toLocaleDateString();
      tituloCaso.textContent = caso.titulo;
      dataOcorrido.textContent = new Date(caso.dataOcorrido).toLocaleDateString();
      statusCasos.forEach(el => el.textContent = caso.status);

      relatorioContainer.style.display = 'block';

    } catch (err) {
      console.error(err);
      alert('Erro ao carregar relatório');
    }
  });

  async function getImageDataURL(url) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject('Erro ao ler imagem');
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error('Erro ao buscar imagem:', err);
      return null;
    }
  }

  btnDownloadPdf.addEventListener('click', async () => {
    if (!casoAtual) return alert('Nenhum caso carregado');

    const doc = new window.jspdf.jsPDF();
    doc.setFontSize(16);
    doc.text('LAUDO PERICIAL - ODONTOCRIM', 105, 20, null, null, 'center');
    doc.line(15, 25, 195, 25);

    let y = 35;

    const addLine = (label, value) => {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 70, y);
      y += 8;
    };

    addLine('Título', casoAtual.titulo);
    addLine('Número do Caso', casoAtual.numeroCaso);
    addLine('Perito Responsável', casoAtual.peritoResponsavel.nome);
    addLine('Local', casoAtual.local);
    addLine('Data do Ocorrido', new Date(casoAtual.dataOcorrido).toLocaleDateString());
    addLine('Data da Emissão', new Date().toLocaleDateString());
    addLine('Status', casoAtual.status);

    y += 5;
    doc.setFontSize(13);
    doc.text('Descrição do Caso:', 20, y);
    y += 7;

    doc.setFontSize(11);
    const splitDescricao = doc.splitTextToSize(casoAtual.descricao || '', 170);
    doc.text(splitDescricao, 20, y);
    y += splitDescricao.length * 7 + 5;

    if (casoAtual.evidencias?.length) {
      doc.setFontSize(13);
      doc.text('Evidências:', 20, y);
      y += 8;

      for (const evidencia of casoAtual.evidencias) {
        doc.setFontSize(11);
        doc.text(`Tipo: ${evidencia.tipo}`, 20, y);
        y += 6;

        if (evidencia.descricao) {
          const splitDesc = doc.splitTextToSize(`Descrição: ${evidencia.descricao}`, 170);
          doc.text(splitDesc, 20, y);
          y += splitDesc.length * 6;
        }

        const imgUrl = `http://localhost:5000/${evidencia.caminhoArquivo}`;
        console.log('Baixando imagem:', imgUrl);

        let imgData = await getImageDataURL(imgUrl);

        if (y + 60 > 280) {
          doc.addPage();
          y = 20;
        }

        if (imgData) {
          doc.addImage(imgData, 'PNG', 20, y, 60, 50);
          y += 60;
        } else {
          doc.setFontSize(10);
          doc.text('Imagem não carregada.', 20, y);
          y += 10;
        }

        y += 10;
      }
    }

    doc.save(`Laudo_Caso_${casoAtual.numeroCaso}.pdf`);
  });
});
