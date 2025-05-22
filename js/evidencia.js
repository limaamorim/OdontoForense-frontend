document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = 'index.html';

  const selectCaso = document.getElementById('casoSelect');
  const tipoInput = document.getElementById('tipoEvidencia');
  const fileInput = document.getElementById('fileInput');
  const uploadArea = document.getElementById('uploadArea');
  const descricaoInput = document.getElementById('descricao');
  const btnSalvar = document.getElementById('btnSalvar');

  let selectedCasoId = null;

  uploadArea.addEventListener('click', () => fileInput.click());

  // Carregar casos
  fetch('http://localhost:5000/api/casos', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      (data.data.docs || data.data).forEach(caso => {
        const opt = document.createElement('option');
        opt.value = caso._id;
        opt.textContent = `${caso.numeroCaso} - ${caso.peritoResponsavel.nome}`;
        selectCaso.appendChild(opt);
      });
    });

  selectCaso.addEventListener('change', e => selectedCasoId = e.target.value);

  btnSalvar.addEventListener('click', async () => {
    if (!fileInput.files.length || !selectedCasoId || !tipoInput.value || !descricaoInput.value) {
      return alert('Preencha todos os campos.');
    }

    uploadArea.classList.add('loading');

    const formData = new FormData();
    formData.append('arquivo', fileInput.files[0]);
    formData.append('tipo', tipoInput.value);
    formData.append('descricao', descricaoInput.value);

    try {
      const response = await fetch(`http://localhost:5000/api/evidencias/casos/${selectedCasoId}/evidencias`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      

      const data = await response.json();
      if (response.ok) {
        alert('Evidência enviada com sucesso!');
        window.location.href = 'relatorio.html';
      } else {
        alert(data.error || 'Erro ao enviar evidência');
      }
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro no upload');
    } finally {
      uploadArea.classList.remove('loading');
    }
  });

  fileInput.addEventListener('change', () => {
    const fileName = fileInput.files[0]?.name || 'Nenhum arquivo selecionado';
    uploadArea.querySelector('p').textContent = fileName;
  });
});
