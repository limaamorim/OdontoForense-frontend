document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = 'index.html';

  const form = document.getElementById('formCaso');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const numeroCaso = document.getElementById('numeroCaso').value;
      const titulo = document.getElementById('titulo').value;
      const descricao = document.getElementById('descricao').value;
      const dataOcorrido = document.getElementById('dataOcorrido').value;
      const local = document.getElementById('local').value;
      const status = document.getElementById('status').value;

      const payload = {
        numeroCaso,
        titulo,
        descricao,
        dataOcorrido,
        local,
        status
      };

      try {
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
          window.location.href = 'dashboard.html';
        } else {
          alert(data.error || 'Erro ao criar caso');
        }
      } catch (err) {
        console.error('Erro ao criar caso:', err);
        alert('Erro no servidor');
      }
    });
  }
});
