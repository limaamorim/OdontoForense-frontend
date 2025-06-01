# ODONTOCRIM - Sistema de Gestão Forense Odontológica

Este repositório contém tanto o **backend** quanto o **frontend** do sistema **ODONTOCRIM**, uma plataforma voltada para o gerenciamento de casos forenses odontológicos, relatórios e evidências digitais.

---

## 🔧 Tecnologias utilizadas

- **Frontend:** HTML, CSS, JavaScript puro, Bootstrap
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Outros:** JWT para autenticação, Multer para upload de arquivos, dotenv

---

## 📁 Estrutura geral do projeto

```
odontocrim/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   ├── uploads/              # Imagens e documentos enviados
│   ├── server.js
│   └── .env
├── frontend/
│   ├── index.html            # Tela de login
│   ├── dashboard.html        # Painel principal
│   ├── cadastro.html         # Cadastro de usuários (admin)
│   ├── caso.html             # Cadastro e listagem de casos
│   ├── evidencia.html        # Upload de evidências
│   ├── relatorio.html        # Visualização e geração de relatórios
│   ├── js/
│   └── style/
```

---

## 🚀 Como rodar o projeto localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/seuusuario/odontocrim.git
cd odontocrim
```

### 2. Backend
```bash
cd backend
npm install
```

Crie um arquivo `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/odontocrim
JWT_SECRET=sua_chave_secreta
```

Inicie o servidor:
```bash
npm run dev
# ou
node server.js
```

### 3. Frontend
Basta abrir o arquivo `frontend/index.html` no navegador:
```
file:///CAMINHO_DO_PROJETO/frontend/index.html
```

---

## 🔐 Controle de acesso por perfil

- **Administrador:**
  - Cadastrar novos usuários
  - Visualizar todos os relatórios, casos e usuários cadastrados

- **Perito:**
  - Acessa apenas seus casos
  - Visualiza relatórios de casos que é responsável
  - Cadastra evidências

- **Assistente:**
  - Acesso restrito, apenas leitura limitada.

---

## 🎯 Funcionalidades principais

### Backend
- Autenticação via JWT
- CRUD de usuários (com proteção por tipo)
- Cadastro de casos e vinculação a perito responsável
- Upload e listagem de evidências
- Geração e controle de relatórios

### Frontend
- Login com proteção por token no `localStorage`
- Layout responsivo com Bootstrap
- Exibição de relatórios, casos e evidências por perfil
- Geração de PDF com imagens e informações do caso

---

## 💡 Melhorias futuras

- Painel com gráficos estatísticos
- Filtros por data/status
- Recuperação de senha
- Controle de logs e histórico de edições
- Permissões dinâmicas por perfil

---

- Dev:
- José Fernando
- Marcello Henrique
- Glewbber Spindola
- Gabriel Ernandes
- Laís Amorim

  


