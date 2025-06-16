document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'dashboard.html';
    return;
  }

  let todosCasos = [];

  try {
    const response = await fetch('https://odontoforense-backend.onrender.com/api/casos?limit=1000', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();
    todosCasos = result.data.docs || result.data;
    aplicarFiltroEAtualizarGraficos(); // Carrega dados iniciais com todos os casos
  } catch (err) {
    console.error('Erro ao buscar casos:', err);
  }

  try {
    await carregarResumoUsuarios(token);
    await carregarTotalEvidencias(token);
  } catch (err) {
    console.error('Erro completo:', err);
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  }

  document.getElementById('btnFiltrar').addEventListener('click', aplicarFiltroEAtualizarGraficos);

  function aplicarFiltroEAtualizarGraficos() {
    const inicio = new Date(document.getElementById('dataInicio').value);
    const fim = new Date(document.getElementById('dataFim').value);
    fim.setHours(23, 59, 59, 999);

    const casosFiltrados = todosCasos.filter(caso => {
      const data = new Date(caso.dataOcorrido);
      return (!isNaN(inicio) ? data >= inicio : true) && (!isNaN(fim) ? data <= fim : true);
    });

    carregarResumoCasosFiltrados(casosFiltrados);
    gerarGraficosVitimas(casosFiltrados);
    carregarResumoEvidenciasFiltradas(casosFiltrados);
  }
});

function carregarResumoCasosFiltrados(casos) {
  const cards = document.querySelectorAll('.card-counter h1');
  if (cards.length > 0) {
    cards[0].textContent = casos.length;
  }

  const statusContagem = { Aberto: 0, 'Em andamento': 0, Fechado: 0 };
  casos.forEach(caso => {
    const status = (caso.status || '').trim().toLowerCase();
    if (status === 'aberto') statusContagem.Aberto++;
    else if (status === 'em andamento') statusContagem['Em andamento']++;
    else if (status === 'fechado') statusContagem.Fechado++;
  });

  const ctxStatus = document.getElementById('graficoCasos').getContext('2d');
  if (window.graficoStatus) window.graficoStatus.destroy();
  window.graficoStatus = new Chart(ctxStatus, {
    type: 'doughnut',
    data: {
      labels: ['Aberto', 'Em andamento', 'Fechado'],
      datasets: [{
        data: [statusContagem.Aberto, statusContagem['Em andamento'], statusContagem.Fechado],
        backgroundColor: ['#198754', '#fd7e14', '#dc3545']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  // Gráfico de linha por dia
  const casosPorDia = {};
  casos.forEach(caso => {
    const data = new Date(caso.dataOcorrido);
    const chave = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;
    casosPorDia[chave] = (casosPorDia[chave] || 0) + 1;
  });

  const diasOrdenados = Object.keys(casosPorDia).sort((a, b) => {
    const [diaA, mesA] = a.split('/').map(Number);
    const [diaB, mesB] = b.split('/').map(Number);
    return new Date(2000, mesA - 1, diaA) - new Date(2000, mesB - 1, diaB);
  });

  const ctxLinha = document.getElementById('graficoCasosPorMes').getContext('2d');
  if (window.graficoLinha) window.graficoLinha.destroy();
  window.graficoLinha = new Chart(ctxLinha, {
    type: 'line',
    data: {
      labels: diasOrdenados,
      datasets: [{
        label: 'Casos por Dia',
        data: diasOrdenados.map(d => casosPorDia[d]),
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.2)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#0d6efd'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Quantidade de Casos' }
        },
        x: {
          title: { display: true, text: 'Dia/Mês' }
        }
      }
    }
  });

  exibirMapaDeCasos(casos);
}

async function carregarResumoEvidenciasFiltradas(casos) {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('https://odontoforense-backend.onrender.com/api/evidencias?limit=1000', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    const evidencias = result.data.docs || result.data;

    const idsCasos = casos.map(c => c._id);
    const evidenciasFiltradas = evidencias.filter(ev => idsCasos.includes(ev.caso));

    const cards = document.querySelectorAll('.card-counter h1');
    if (cards.length > 1) {
      cards[1].textContent = evidenciasFiltradas.length;
    }
  } catch (err) {
    console.error('Erro ao carregar evidências:', err);
  }
}

async function carregarResumoUsuarios(token) {
  try {
    const res = await fetch('https://odontoforense-backend.onrender.com/api/usuarios', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const resultado = await res.json();
    const usuarios = resultado.data || resultado;

    const cards = document.querySelectorAll('.card-counter h1');
    if (cards.length > 2) {
      cards[2].textContent = usuarios.length;
    }

    const contagemPorTipo = { assistente: 0, perito: 0, administrador: 0 };
    usuarios.forEach(u => {
      const tipo = u.tipo?.toLowerCase();
      if (contagemPorTipo[tipo] !== undefined) {
        contagemPorTipo[tipo]++;
      }
    });

    const ctx = document.getElementById('graficoUsuariosPorTipo')?.getContext('2d');
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Assistente', 'Perito', 'Administrador'],
          datasets: [{
            label: 'Usuários por Tipo',
            data: [
              contagemPorTipo.assistente,
              contagemPorTipo.perito,
              contagemPorTipo.administrador
            ],
            backgroundColor: ['#0dcaf0', '#198754', '#6f42c1']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              bodyFont: { size: 12 }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Quantidade de Usuários' }
            },
            x: {
              title: { display: true, text: 'Tipo de Usuário' }
            }
          }
        }
      });
    }
  } catch (err) {
    console.error('Erro ao carregar usuários:', err);
  }
}

async function exibirMapaDeCasos(casos) {
  const mapa = L.map('mapaCasos').setView([-14.2350, -51.9253], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapa);

  const geocodeCache = {};

  for (const caso of casos) {
    const local = caso.local?.trim();
    if (!local) continue;

    let coords = geocodeCache[local];

    if (!coords) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(local)}`, {
          headers: { 'User-Agent': 'ODONTOCRIM Dashboard' }
        });

        const data = await response.json();
        if (data.length > 0) {
          coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          geocodeCache[local] = coords;
        } else {
          console.warn('Local não encontrado:', local);
          continue;
        }
      } catch (error) {
        console.error('Erro ao buscar coordenadas de:', local, error);
        continue;
      }
    }

    L.marker(coords).addTo(mapa)
      .bindPopup(`<strong>${caso.titulo}</strong><br>${local}<br>Status: ${caso.status}`);
  }
}
async function carregarTotalEvidencias(token) {
  try {
    const response = await fetch('https://odontoforense-backend.onrender.com/api/evidencias?limit=1000', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    const evidencias = result.data.docs || result.data;

    const cards = document.querySelectorAll('.card-counter h1');
    if (cards.length > 1) {
      cards[1].textContent = evidencias.length;
    }
  } catch (err) {
    console.error('Erro ao carregar evidências:', err);
  }
}
function gerarGraficosVitimas(casos) {
  const generoContagem = {
    masculino: 0,
    feminino: 0,
    outro: 0,
    'nao informado': 0
  };

  const idadeContagem = {
    bebe: 0,
    crianca: 0,
    adolescente: 0,
    adulta: 0,
    idosa: 0,
    nao_informado: 0
  };

  casos.forEach(caso => {
    if (!caso.vitimas) return;
    caso.vitimas.forEach(v => {
      const genero = (v.genero || 'nao informado').toLowerCase();
      const idade = (v.idade || 'nao_informado').toLowerCase();

      if (generoContagem[genero] !== undefined) generoContagem[genero]++;
      if (idadeContagem[idade] !== undefined) idadeContagem[idade]++;
    });
  });

  // Gênero
  const ctxGenero = document.getElementById('graficoGeneroVitimas')?.getContext('2d');
  if (window.graficoGenero) window.graficoGenero.destroy();
  if (ctxGenero) {
    window.graficoGenero = new Chart(ctxGenero, {
      type: 'bar',
      data: {
        labels: Object.keys(generoContagem),
        datasets: [{
          label: 'Nº de Vítimas',
          data: Object.values(generoContagem),
          backgroundColor: ['#0d6efd', '#dc3545', '#6f42c1', '#adb5bd']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
          x: { title: { display: true, text: 'Gênero' } }
        }
      }
    });
  }

  // Idade
  const ctxIdade = document.getElementById('graficoIdadeVitimas')?.getContext('2d');
  if (window.graficoIdade) window.graficoIdade.destroy();
  if (ctxIdade) {
    window.graficoIdade = new Chart(ctxIdade, {
      type: 'bar',
      data: {
        labels: Object.keys(idadeContagem),
        datasets: [{
          label: 'Nº de Vítimas',
          data: Object.values(idadeContagem),
          backgroundColor: '#20c997'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
          x: { title: { display: true, text: 'Faixa Etária' } }
        }
      }
    });
  }
}

