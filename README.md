# 💰 Paaga - Desafio de 200 Dias

Uma Progressive Web App (PWA) para acompanhar seu progresso em um desafio de economia de dinheiro durante 200 dias. A cada dia que passa, o valor a ser depositado aumenta: Dia 1 = R$1,00, Dia 2 = R$2,00, e assim por diante até o Dia 200 = R$200,00.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7.2.0-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-336791?style=flat-square&logo=postgresql)

## ✨ Funcionalidades

- 🔐 **Autenticação Segura**: Login e registro com email/senha usando NextAuth.js v5
- 📅 **Calendário Interativo**: Visualize todos os 200 dias do desafio em um calendário moderno
- 📊 **Acompanhamento de Progresso**: 
  - Círculo de progresso animado mostrando o total economizado
  - Estatísticas detalhadas (dias completos, dias restantes, percentual)
  - Progresso com 2 casas decimais para visualização precisa nos primeiros dias
- 📱 **Mobile-First**: Design responsivo otimizado para dispositivos móveis
- 🎯 **Marcação de Depósitos**: Clique nos dias para marcar como depositado
- 📈 **Visualização Semanal**: Seletor de dias da semana com scroll horizontal
- 🔒 **Proteção de Rotas**: Middleware de autenticação protegendo todas as rotas
- ⚡ **PWA**: Instalável como aplicativo nativo no celular

## 🛠️ Tecnologias

### Frontend
- **Next.js 16.1.1** - Framework React com App Router
- **React 19.2.3** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização
- **shadcn/ui** - Componentes UI (estilo Maia, tema Amber)
- **react-calendar** - Componente de calendário
- **date-fns** - Manipulação de datas
- **lucide-react** - Ícones

### Backend
- **Next.js API Routes** - API RESTful
- **NextAuth.js v5** - Autenticação
- **Prisma ORM 7.2.0** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados
- **bcryptjs** - Hash de senhas
- **Zod** - Validação de schemas

### Segurança
- Validação de entrada com Zod
- Autorização em todas as rotas de API
- Proteção contra IDOR (Insecure Direct Object Reference)
- Hash de senhas com bcrypt (12 salt rounds)
- Sanitização de inputs
- Middleware de autenticação

## 📋 Pré-requisitos

- **Node.js** 20.19+ (ou 22.12+/24.0+)
- **npm**, **yarn**, **pnpm** ou **bun**
- **PostgreSQL** (local ou remoto)
- Conta no **Prisma Data Platform** (opcional, se usar Prisma Cloud)

## 🚀 Instalação

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd montinho
   ```

2. **Instale as dependências**
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. **Configure as variáveis de ambiente**
   
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/paaga?sslmode=require"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="seu-secret-aqui-gerado-aleatoriamente"
   
   # Node Environment
   NODE_ENV="development"
   ```

   Para gerar um `NEXTAUTH_SECRET` seguro:
   ```bash
   openssl rand -base64 32
   ```

4. **Configure o banco de dados**
   
   Execute as migrações do Prisma:
   ```bash
   npx prisma migrate dev
   ```
   
   Ou se preferir usar o Prisma Studio para visualizar os dados:
   ```bash
   npm run db:studio
   ```

5. **Gere o Prisma Client**
   ```bash
   npx prisma generate
   ```

## 🎮 Como Executar

### Desenvolvimento
```bash
npm run dev
```
A aplicação estará disponível em [http://localhost:3000](http://localhost:3000)

### Produção
```bash
npm run build
npm start
```

### Outros Scripts
```bash
# Lint
npm run lint

# Testar conexão com banco
npm run db:test

# Abrir Prisma Studio
npm run db:studio
```

## 📁 Estrutura do Projeto

```
montinho/
├── app/                          # App Router (Next.js 16)
│   ├── api/                      # Rotas de API
│   │   ├── auth/                 # NextAuth
│   │   ├── challenges/           # CRUD de desafios
│   │   ├── deposits/             # CRUD de depósitos
│   │   ├── progress/             # Cálculo de progresso
│   │   └── register/             # Registro de usuários
│   ├── components/               # Componentes React
│   │   ├── DaySelector.tsx       # Seletor de dias da semana
│   │   ├── DepositCalendar.tsx   # Calendário completo
│   │   ├── ProgressStats.tsx     # Estatísticas de progresso
│   │   └── ...
│   ├── login/                    # Página de login
│   ├── register/                 # Página de registro
│   ├── layout.tsx                # Layout raiz
│   ├── page.tsx                  # Página principal
│   └── manifest.ts               # PWA Manifest
├── components/                   # Componentes shadcn/ui
│   └── ui/                       # Componentes UI reutilizáveis
├── lib/                          # Utilitários
│   ├── auth-helpers.ts           # Helpers de autenticação
│   ├── prisma.ts                 # Cliente Prisma
│   ├── validations.ts            # Schemas Zod
│   └── utils.ts                  # Funções utilitárias
├── prisma/                       # Prisma ORM
│   ├── schema.prisma             # Schema do banco
│   └── migrations/              # Migrações
├── types/                        # Definições TypeScript
│   └── next-auth.d.ts            # Tipos NextAuth
├── auth.ts                       # Configuração NextAuth
├── proxy.ts                      # Middleware de autenticação
└── package.json
```

## 🔐 Segurança

O projeto implementa várias camadas de segurança:

- ✅ **Autenticação**: NextAuth.js v5 com JWT
- ✅ **Autorização**: Verificação de ownership em todas as rotas
- ✅ **Validação**: Zod schemas em todas as entradas
- ✅ **Hash de Senhas**: bcrypt com 12 salt rounds
- ✅ **Proteção de Rotas**: Middleware verificando autenticação
- ✅ **Sanitização**: Limpeza de inputs (email, etc.)
- ✅ **Type Safety**: TypeScript em todo o código

Para mais detalhes, consulte [SECURITY.md](./SECURITY.md)

## 📱 PWA (Progressive Web App)

A aplicação é uma PWA instalável:

- **Instalação**: Adicione à tela inicial do celular
- **Offline**: Funciona parcialmente offline (cache de assets)
- **Notificações**: Preparado para notificações push (futuro)

## 🗄️ Modelo de Dados

### User
- Informações do usuário (email, nome, senha)
- Relacionamento com desafios

### Challenge
- Data de início do desafio
- Relacionamento com usuário e depósitos

### Deposit
- Dia do depósito (1-200)
- Valor depositado (igual ao número do dia)
- Data/hora do depósito

## 🔄 Fluxo da Aplicação

1. **Registro/Login**: Usuário cria conta ou faz login
2. **Criar Desafio**: Usuário escolhe a data de início
3. **Acompanhar Progresso**: 
   - Visualiza dias da semana atual
   - Marca dias como depositados
   - Vê estatísticas de progresso
4. **Calendário Completo**: Visualiza todos os 200 dias

## 🚢 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas

A aplicação pode ser deployada em qualquer plataforma que suporte Next.js:
- **Netlify**
- **Railway**
- **Render**
- **AWS Amplify**
- **Self-hosted** (Docker, etc.)

## 🧪 Testes

```bash
# Testar conexão com banco
npm run db:test

# Verificar vulnerabilidades
npx fix-react2shell-next
```

## 📝 Licença

Este projeto é privado e proprietário.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para questões e suporte:
- Abra uma issue no repositório
- Entre em contato com a equipe de desenvolvimento

## 🎯 Roadmap

- [ ] Notificações push para lembrar depósitos
- [ ] Gráficos de progresso mais detalhados
- [ ] Exportação de dados (PDF, CSV)
- [ ] Modo escuro
- [ ] Suporte a múltiplos desafios
- [ ] Compartilhamento de progresso nas redes sociais
- [ ] Integração com bancos (Open Banking)

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/)
- [Vercel](https://vercel.com/)

---

Desenvolvido com ❤️ para ajudar pessoas a economizar dinheiro
