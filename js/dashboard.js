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
  } catch (err) {
    console.error('Erro completo:', err);
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  }

  try {
    await carregarResumoCorEtnia(token);
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

  // Agrupar os dados por mês a partir da lista de casos
  const casosPorMes = {};
  casos.forEach(caso => {
    const data = new Date(caso.dataOcorrido);
    if (isNaN(data)) return;
    const mesAno = `${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
    casosPorMes[mesAno] = (casosPorMes[mesAno] || 0) + 1;
  });

  // Obter os meses ordenados
  const mesesOrdenados = Object.keys(casosPorMes).sort((a, b) => {
    const [mesA, anoA] = a.split('/').map(Number);
    const [mesB, anoB] = b.split('/').map(Number);
    return new Date(anoA, mesA - 1) - new Date(anoB, mesB - 1);
  });

// Calcular o valor máximo para ajustar o eixo Y
const valores = mesesOrdenados.map(m => casosPorMes[m]);
const maxValor = Math.max(...valores);
const paddingY = Math.ceil(maxValor * 0.25); // 15% de folga visual

// Criar o gráfico com os dados mensais
const ctxLinha = document.getElementById('graficoCasosPorMes').getContext('2d');
if (window.graficoLinha) window.graficoLinha.destroy();
window.graficoLinha = new Chart(ctxLinha, {
  type: 'line',
  data: {
    labels: mesesOrdenados,
    datasets: [{
      label: 'Casos por Mês',
      data: valores,
      borderColor: '#0d6efd',
      backgroundColor: 'rgba(13, 110, 253, 0.2)',
      fill: true,
      tension: 0.3,
      pointBackgroundColor: '#0d6efd',
      clip: false // impede o corte lateral dos dados/rótulos
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        anchor: 'end',
        align: 'top',
        font: { weight: 'bold' },
        formatter: (value) => value,
        color: '#0d6efd',
        clamp: true, // impede o corte do rótulo
        clip: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: maxValor + paddingY,
        title: { display: true, text: 'Quantidade de Casos' }
      },
      x: {
        title: { display: true, text: 'Mês/Ano' }
      }
    }
  },
  plugins: [ChartDataLabels]
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

async function carregarResumoCorEtnia() {
  try {
    const res = await fetch('https://odontoforense-backend.onrender.com/api/vitimas');
    if (!res.ok) {
      throw new Error('Erro na requisição: ' + res.status);
    }

    const resultado = await res.json();
    const vitimas = resultado.data?.docs || resultado.data || resultado || [];

    // Inicializa contagem para cada corEtnia conhecida
    const contagemPorCorEtnia = {
      branca: 0,
      preta: 0,
      parda: 0,
      amarela: 0,
      indigena: 0,
      nao_informado: 0
    };

    // Conta vítimas agrupando por corEtnia
    vitimas.forEach(vitima => {
      const cor = (vitima.corEtnia || 'nao_informado').toLowerCase().replace(/\s+/g, '_');
      if (contagemPorCorEtnia.hasOwnProperty(cor)) {
        contagemPorCorEtnia[cor]++;
      } else {
        contagemPorCorEtnia.nao_informado++;
      }
    });

    // Atualiza card com total de vítimas (se existir)
    const cards = document.querySelectorAll('.card-counter h1');
    if (cards.length > 3) {
      cards[3].textContent = vitimas.length;
    }

    const labels = ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Não Informado'];
    const dados = [
      contagemPorCorEtnia.branca,
      contagemPorCorEtnia.preta,
      contagemPorCorEtnia.parda,
      contagemPorCorEtnia.amarela,
      contagemPorCorEtnia.indigena,
      contagemPorCorEtnia.nao_informado
    ];

    const ctx = document.getElementById('graficoCorEtnia')?.getContext('2d');
    if (ctx) {
      if (window.graficoCorEtnia) window.graficoCorEtnia.destroy();
      window.graficoCorEtnia = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Distribuição por Cor/Etnia',
            data: dados,
            backgroundColor: ['#FFC0CB', '#000000', '#A0522D', '#FFD700', '#228B22', '#808080']
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
              title: { display: true, text: 'Quantidade de Vítimas' }
            },
            x: {
              title: { display: true, text: 'Cor/Etnia' }
            }
          }
        }
      });
    }

  } catch (err) {
    console.error('Erro ao carregar vítimas:', err);
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
