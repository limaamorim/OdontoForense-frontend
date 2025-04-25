document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  console.log('Token recuperado:', token);

  if (!token) {
    console.log('Redirecionando: token não encontrado');
    window.location.href = 'index.html';
    return;
  }

  try {
    console.log('Fazendo requisição para /api/casos...');
    const response = await fetch('https://odontocrim-api.onrender.com/api/casos', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status da resposta:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na resposta:', errorData);
      throw new Error(errorData.message || 'Token inválido ou expirado');
    }

    const result = await response.json();
    console.log('Dados recebidos:', result);

    const casos = result.data.docs || result.data;
    const totalCasos = Array.isArray(casos) ? casos.length : 0;

    const cards = document.querySelectorAll('.card-counter h1');
    if (cards.length > 0) {
      cards[0].textContent = totalCasos;
    }

    carregarCasosRecentes(token);

  } catch (err) {
    console.error('Erro completo:', err);
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  }
});

async function carregarCasosRecentes(token) {
  try {
    const response = await fetch('https://odontocrim-api.onrender.com/api/casos/recentes', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Erro ao buscar casos recentes:', response.status);
      return;
    }

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
            <h6>${caso.numeroCaso && caso.numeroCaso.trim() !== '' ? 'Caso - ' + caso.numeroCaso : 'Caso - Sem número'}</h6>
            <p class="mb-1">${caso.titulo || 'Sem título'}</p>
            <span class="${statusClasse}">${caso.status || 'Aberto'}</span>
          </div>
        </div>
      `;

      divCasosRecentes.appendChild(item);
    });

  } catch (error) {
    console.error('Erro ao carregar casos recentes:', error);
  }
}
