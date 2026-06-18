# BiblioGest — Sistema de Gestão de Biblioteca 📚

Este é um **Sistema de Gestão de Biblioteca** completo e integrado. A aplicação utiliza uma arquitetura baseada em camadas no back-end (separação clara de responsabilidades: Acesso a Dados, Lógica de Negócio, Rotas da API) e uma interface responsiva SPA (Single Page Application) em React e Tailwind CSS no front-end. O banco de dados utiliza o mecanismo integrado relacional **SQLite** com drivers nativos de alto desempenho.

---

## ━━━ ARQUITETURA EM CAMADAS ━━━

O projeto foi projetado com base em princípios de separação de responsabilidades e injeção de transações atômicas:

*   **Interface do Utilizador (Front-End SPA):** Construído em React 19, empacotado pelo Vite com Tailwind CSS 4. Comunicação nativa assíncrona por meio do utilitário `api.ts` que gerencia requisições `fetch()` de forma limpa.
*   **Camada de Rotas (Controller Routing):** Controladores de roteamento restritivos agrupados em `/backend/routes/*` (usuários, livros, empréstimos, relatórios) que catalogam e validam requisições HTTP REST.
*   **Camada de Lógica de Negócio (`logicaNegocio.ts`):** Onde residem as regras operacionais severas (limiares de empréstimo por público, verificação prévia de exemplares retidos, controle cronológico de atraso e cálculo automático de multas penais).
*   **Camada de Banco de Dados (`database.ts`):** Conecta e inicializa o arquivo SQLite `biblioteca.db`, habilitando suporte rígido de chaves estrangeiras com mapeamento de exclusões em cascata.

---

## ━━━ BANCO DE DADOS (5 tabelas) ━━━

1.  **USUARIO:** `id_usuario` (PK), `nome`, `tipo_usuario` (Aluno/Professor), `numero_identificacao` (Unique), `contacto`, `estado` (ativo/suspenso)
2.  **LIVRO:** `id_livro` (PK), `titulo`, `autor`, `editora`, `ano_publicacao`, `id_categoria` (FK), `estado` (disponivel/emprestado)
3.  **EMPRESTIMO:** `id_emprestimo` (PK), `id_usuario` (FK), `id_livro` (FK), `data_emprestimo`, `data_prev_devolucao`, `data_devolucao`, `estado` (ativo/devolvido/atrasado)
4.  **MULTA:** `id_multa` (PK), `id_emprestimo` (Unique FK), `valor`, `dias_atraso`, `estado_pagamento` (pendente/pago)
5.  **CATEGORIA:** `id_categoria` (PK), `nome_categoria`, `descricao`

---

## ━━━ REQUISITOS OPERACIONAIS (LÓGICA DE NEGÓCIO) ━━━

*   **Validações de Empréstimo:**
    *   Verifica se o leitor conta com pendências monetárias ou atrasos pendentes. Se sim, bloqueia novas saídas preventivamente.
    *   **Alunos:** Limite de **2 livros** simultâneos por no máximo **7 dias**.
    *   **Professores:** Limite de **5 livros** simultâneos por no máximo **15 dias**.
    *   Atualiza o livro de imediato para o estado `emprestado`.
*   **Processamento de Devolução:**
    *   Calcula a defasagem exata em dias civis: `data_devolucao` real contra `data_prev_devolucao`.
    *   Se atrasado, aplica multa imediata de **1.50 Kz por dia de atraso**, gerando registro insolvente e suspendendo o leitor (`estado = 'suspenso'`).
    *   Atualiza o livro para `disponivel`.

---

## ━━━ INSTALAÇÃO E EXECUÇÃO ━━━

Para instalar e rodar a aplicação localmente de forma simples:

1.  **Instalar dependências primárias:**
    ```bash
    npm install
    ```
2.  **Executar em Modo de Desenvolvimento (Inicia o Express + banco SQLite + Middleware do Vite na porta 3000):**
    ```bash
    npm run dev
    ```

3.  **Compilar Ativos para Produção (Gera os bundle client em `dist/` e o servidor bundled `dist/server.cjs` via esbuild):**
    ```bash
    npm run build
    ```

4.  **Executar o Servidor Compilado de Produção:**
    ```bash
    npm run start
    ```

---

## ━━━ ENDPOINTS DA API REST ━━━

### Utilizadores
*   `GET /api/usuarios` — Lista leitores agregando multas pendentes e volumes ativos.
*   `POST /api/usuarios` — Registra novo leitor.
*   `PUT /api/usuarios/:id` — Altera cadastros e status operacional.
*   `GET /api/usuarios/:id/historico` — Ficha cronológica de retiradas e multas de um leitor.
*   `POST /api/usuarios/:id/pagar-multas` — Quita pendências financeiras.

### Livros
*   `GET /api/livros` — Lista catálogo (suporta filtros opcional de `estado` e `categoria`).
*   `GET /api/livros/categorias` — Lista as categorias cadastradas.
*   `POST /api/livros/categorias` — Cria nova categoria.
*   `POST /api/livros` — Cadastra exemplar físico.
*   `PUT /api/livros/:id` — Edita atributos ou altera estado do livro.
*   `GET /api/livros/:id/disponibilidade` — Retorna booleano de disponibilidade física.

### Empréstimos
*   `POST /api/emprestimos` — Efetiva e agenda saída sob regras de negócio.
*   `PUT /api/emprestimos/:id/devolver` — Liquida circulação e calcula eventuais multas.
*   `GET /api/emprestimos/atrasados` — Consolida empréstimos atualmente expirados.

### Relatórios
*   `GET /api/relatorios/geral` — Compila dados consolidados para os KPIs do Dashboard.
*   `GET /api/relatorios/mais-emprestados` — Top 10 títulos mais procurados do acervo.
*   `GET /api/relatorios/atrasos` — Detalhes analíticos de multas ativas.
*   `GET /api/relatorios/historico?periodo=YYYY-MM` — Extrato de circulação consolidada mensal.

## ━━━ Credenciais) ━━━

*   **Administrador**
*   `username`-admin.
*   `senha`-1234.
