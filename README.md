# PropertyHub - Sistema de Gestão de Propriedades

Sistema completo para gestão de propriedades listadas no Airbnb, Booking e outras plataformas de aluguel por temporada.

## 🚀 Funcionalidades

### 📊 Dashboard

- Visão geral das propriedades
- Estatísticas de ocupação
- Receitas e despesas do mês
- Próximas reservas

### 🏠 Gestão de Propriedades

- Cadastro completo de propriedades
- Informações detalhadas (quartos, banheiros, comodidades)
- Definição de preços e taxas
- Status ativo/inativo

### 📅 Gestão de Reservas

- Cadastro de reservas manuais
- Visualização em lista ou calendário
- Controle de status (pendente, confirmada, check-in, check-out, cancelada)
- Origem da reserva (Airbnb, Booking, VRBO, direto)

### 💰 Gestão Financeira

- Registro de receitas e despesas
- Categorização de transações
- Gráficos de pizza por categoria
- Resumo financeiro

### 📈 Relatórios

- Receitas vs Despesas (gráfico de barras)
- Lucro líquido mensal
- Taxa de ocupação
- Ranking de propriedades por desempenho
- Diária média por propriedade

### 👥 Usuários e Permissões

- Sistema de autenticação com Firebase
- Níveis de permissão: Admin, Gerente, Visualizador
- Gerenciamento de usuários (apenas admin)

## 🛠️ Tecnologias

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Firebase** - Autenticação e Firestore
- **Tailwind CSS** - Estilização
- **React Router** - Roteamento
- **React Hook Form + Zod** - Formulários e validação
- **Recharts** - Gráficos
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones

## 📦 Instalação

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd airbnb
```

2. Instale as dependências:

```bash
npm install
```

3. Configure o Firebase:
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Ative Authentication (Email/Password)
   - Crie um banco Firestore
   - Copie as credenciais para o arquivo `.env`:

```bash
cp .env.example .env
```

4. Preencha o arquivo `.env` com suas credenciais do Firebase:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

5. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

6. Acesse `http://localhost:5173`

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── Layout/          # Sidebar, MainLayout, ProtectedRoute
│   └── UI/              # Button, Input, Card, Modal, etc.
├── config/
│   └── firebase.ts      # Configuração do Firebase
├── contexts/
│   └── AuthContext.tsx  # Contexto de autenticação
├── pages/
│   ├── Auth/            # Login, Register
│   ├── Dashboard/       # Página principal
│   ├── Properties/      # CRUD de propriedades
│   ├── Reservations/    # CRUD de reservas
│   ├── Finances/        # Gestão financeira
│   ├── Reports/         # Relatórios
│   └── Users/           # Gestão de usuários
├── services/
│   ├── propertyService.ts
│   ├── reservationService.ts
│   └── transactionService.ts
├── types/
│   └── index.ts         # Tipos TypeScript
├── App.tsx
└── main.tsx
```

## 🔐 Configuração do Firestore

Crie as seguintes coleções no Firestore:

- `users` - Dados dos usuários
- `properties` - Propriedades cadastradas
- `reservations` - Reservas
- `transactions` - Transações financeiras

### Regras de Segurança Sugeridas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /properties/{propertyId} {
      allow read, write: if request.auth != null;
    }
    match /reservations/{reservationId} {
      allow read, write: if request.auth != null;
    }
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 Deploy

Para fazer o build de produção:

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`.

### Deploy no Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 📝 Licença

MIT License
