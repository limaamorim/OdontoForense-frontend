document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  try {
    await carregarResumoCasos(token);
    await carregarCasosRecentes(token);
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
  const totalCasos = Array.isArray(casos) ? casos.length : 0;

  const cards = document.querySelectorAll('.card-counter h1');
  if (cards.length > 0) {
    cards[0].textContent = totalCasos;
  }

  const statusContagem = { Aberto: 0, 'Em andamento': 0, Fechado: 0 };
  casos.forEach(caso => {
    const status = (caso.status || '').trim().toLowerCase();
    if (status === 'aberto') statusContagem.Aberto++;
    else if (status === 'em andamento') statusContagem['Em andamento']++;
    else if (status === 'fechado') statusContagem.Fechado++;
  });

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
}

async function carregarCasosRecentes(token) {
  const response = await fetch('https://odontoforense-backend.onrender.com/api/casos/recentes?limit=1000', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) return;

  const casos = await response.json();
  const divCasosRecentes = document.getElementById('casos-recentes');
  divCasosRecentes.innerHTML = '';

  if (!Array.isArray(casos) || casos.length === 0) {
    divCasosRecentes.innerHTML = '<p>Nenhum caso recente.</p>';
    return;
  }

  casos.forEach(caso => {
    const statusMap = {
      'aberto': 'case-status-open',
      'em andamento': 'case-status-progress',
      'fechado': 'case-status-closed'
    };
    const statusClasse = statusMap[(caso.status || '').toLowerCase()] || 'case-status-open';

    const item = document.createElement('div');
    item.className = 'card-body';

    item.innerHTML = `
      <div class="card case-card">
        <div class="card-body">
          <h6>${caso.numeroCaso ? 'Caso - ' + caso.numeroCaso : 'Caso - Sem número'}</h6>
          <p class="mb-1">${caso.titulo || 'Sem título'}</p>
          <span class="${statusClasse}">${caso.status || 'Aberto'}</span>
        </div>
      </div>
    `;

    divCasosRecentes.appendChild(item);
  });
}

async function carregarResumoUsuarios(token) {
  try {
    const res = await fetch('https://odontoforense-backend.onrender.com/api/usuarios', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const resultado = await res.json();
    const usuarios = resultado.data || resultado; // compatível com array direto ou .data

    const cards = document.querySelectorAll('.card-counter h1');
    if (cards.length > 2) {
      cards[2].textContent = usuarios.length;
    }
  } catch (err) {
    console.error('Erro ao carregar usuários:', err);
  }
}
