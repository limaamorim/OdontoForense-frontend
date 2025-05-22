document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'dashboard.html';
    return;
  }

  try {
    await carregarResumoCasos(token);
    await carregarResumoUsuarios(token);
  } catch (err) {
    console.error('Erro completo:', err);
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  }
});

async function carregarResumoCasos(token) {
  const response = await fetch('https://odontoforense-backend.onrender.com/api/casos?limit=1000', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error('Falha ao carregar casos');

  const result = await response.json();
  const casos = result.data.docs || result.data;
  exibirMapaDeCasos(casos);
  const totalCasos = Array.isArray(casos) ? casos.length : 0;

  const cards = document.querySelectorAll('.card-counter h1');
  if (cards.length > 0) {
    cards[0].textContent = totalCasos;
  }

  // Contagem por status
  const statusContagem = { Aberto: 0, 'Em andamento': 0, Fechado: 0 };
  casos.forEach(caso => {
    const status = (caso.status || '').trim().toLowerCase();
    if (status === 'aberto') statusContagem.Aberto++;
    else if (status === 'em andamento') statusContagem['Em andamento']++;
    else if (status === 'fechado') statusContagem.Fechado++;
  });

  // Gráfico de pizza (status dos casos)
  const ctx = document.getElementById('graficoCasos')?.getContext('2d');
  if (ctx) {
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Aberto', 'Em andamento', 'Fechado'],
        datasets: [{
          data: [
            statusContagem.Aberto,
            statusContagem['Em andamento'],
            statusContagem.Fechado
          ],
          backgroundColor: ['#198754', '#fd7e14', '#dc3545']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  // GRÁFICO DE LINHA - Casos por MÊS
  const casosPorMes = {};

  casos.forEach(caso => {
    const data = new Date(caso.dataOcorrido);
    const mes = (data.getMonth() + 1).toString().padStart(2, '0'); // 01, 02, ...
    const ano = data.getFullYear();
    const chave = `${mes}/${ano}`; // Ex: "04/2024"
    casosPorMes[chave] = (casosPorMes[chave] || 0) + 1;
  });

  const mesesOrdenados = Object.keys(casosPorMes).sort((a, b) => {
    const [mesA, anoA] = a.split('/').map(Number);
    const [mesB, anoB] = b.split('/').map(Number);
    return new Date(anoA, mesA - 1) - new Date(anoB, mesB - 1);
  });

  const labels = mesesOrdenados;
  const dados = mesesOrdenados.map(m => casosPorMes[m]);

  const ctxLinha = document.getElementById('graficoCasosPorMes')?.getContext('2d');
  if (ctxLinha) {
    new Chart(ctxLinha, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Casos por Mês',
          data: dados,
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
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleFont: {
                size: 14
              },
              bodyFont: {
                size: 12
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              title: {
                display: true,
                text: 'Quantidade de Casos',
                font: {
                  weight: 'bold'
                }
              }
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              title: {
                display: true,
                text: 'Mês/Ano',
                font: {
                  weight: 'bold'
                }
              }
            }
          }
        }
    });
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
  } catch (err) {
    console.error('Erro ao carregar usuários:', err);
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

    // Atualizar contagem no card
    const cards = document.querySelectorAll('.card-counter h1');
    if (cards.length > 2) {
      cards[2].textContent = usuarios.length;
    }

    // Contagem por tipo
    const contagemPorTipo = { assistente: 0, perito: 0, administrador: 0 };
    usuarios.forEach(u => {
      const tipo = u.tipo?.toLowerCase();
      if (contagemPorTipo[tipo] !== undefined) {
        contagemPorTipo[tipo]++;
      }
    });

    // Gráfico de barras
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
              title: {
                display: true,
                text: 'Quantidade de Usuários',
                font: { weight: 'bold' }
              }
            },
            x: {
              title: {
                display: true,
                text: 'Tipo de Usuário',
                font: { weight: 'bold' }
              }
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

  const geocodeCache = {}; // cache para evitar chamadas repetidas

  for (const caso of casos) {
    const local = caso.local?.trim();
    if (!local) continue;

    // Verifica se já temos o local em cache
    let coords = geocodeCache[local];

    if (!coords) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(local)}`, {
          headers: {
            'User-Agent': 'ODONTOCRIM Dashboard'
          }
        });

        const data = await response.json();
        if (data.length > 0) {
          coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          geocodeCache[local] = coords; // salva no cache
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
