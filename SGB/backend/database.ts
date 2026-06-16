import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "biblioteca.db");
const db = new Database(dbPath);

// Ativar suporte a Foreign Keys no SQLite
db.pragma("foreign_keys = ON");

export function initDatabase() {
  // 1. Criar Tabela CATEGORIA
  db.prepare(`
    CREATE TABLE IF NOT EXISTS CATEGORIA (
      id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_categoria TEXT NOT NULL,
      descricao TEXT
    )
  `).run();

  // 2. Criar Tabela USUARIO
  db.prepare(`
    CREATE TABLE IF NOT EXISTS USUARIO (
      id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      tipo_usuario TEXT NOT NULL, -- "Aluno" ou "Professor"
      numero_identificacao TEXT UNIQUE NOT NULL,
      contacto TEXT,
      estado TEXT NOT NULL DEFAULT 'ativo' -- "ativo" ou "suspenso"
    )
  `).run();

  // 3. Criar Tabela LIVRO
  db.prepare(`
    CREATE TABLE IF NOT EXISTS LIVRO (
      id_livro INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      autor TEXT NOT NULL,
      editora TEXT,
      ano_publicacao INTEGER,
      id_categoria INTEGER,
      estado TEXT NOT NULL DEFAULT 'disponivel', -- "disponivel" ou "emprestado"
      FOREIGN KEY(id_categoria) REFERENCES CATEGORIA(id_categoria) ON DELETE SET NULL
    )
  `).run();

  // 4. Criar Tabela EMPRESTIMO
  db.prepare(`
    CREATE TABLE IF NOT EXISTS EMPRESTIMO (
      id_emprestimo INTEGER PRIMARY KEY AUTOINCREMENT,
      id_usuario INTEGER,
      id_livro INTEGER,
      data_emprestimo TEXT NOT NULL,
      data_prev_devolucao TEXT NOT NULL,
      data_devolucao TEXT,
      estado TEXT NOT NULL DEFAULT 'ativo', -- "ativo", "devolvido", "atrasado"
      FOREIGN KEY(id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
      FOREIGN KEY(id_livro) REFERENCES LIVRO(id_livro) ON DELETE CASCADE
    )
  `).run();

  // 5. Criar Tabela MULTA
  db.prepare(`
    CREATE TABLE IF NOT EXISTS MULTA (
      id_multa INTEGER PRIMARY KEY AUTOINCREMENT,
      id_emprestimo INTEGER UNIQUE,
      valor REAL NOT NULL,
      dias_atraso INTEGER NOT NULL,
      estado_pagamento TEXT NOT NULL DEFAULT 'pendente', -- "pendente", "pago"
      FOREIGN KEY(id_emprestimo) REFERENCES EMPRESTIMO(id_emprestimo) ON DELETE CASCADE
    )
  `).run();

  // 6. Criar Tabela OPERADOR (Operadores e Bibliotecários do Sistema)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS OPERADOR (
      id_operador INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      cargo TEXT NOT NULL, -- "Administrador" ou "Bibliotecario"
      contacto TEXT,
      senha TEXT NOT NULL DEFAULT '1234',
      estado TEXT NOT NULL DEFAULT 'ativo' -- "ativo" ou "suspenso"
    )
  `).run();

  // 7. Popular dados de demonstração iniciais caso estejam vazios
  const checkCategorias = db.prepare("SELECT COUNT(*) as count FROM CATEGORIA").get() as { count: number };
  if (checkCategorias && checkCategorias.count === 0) {
    console.log("[BIBLIOTECA] Semeando categorias de demonstração...");
    
    const insertCat = db.prepare("INSERT INTO CATEGORIA (nome_categoria, descricao) VALUES (?, ?)");
    insertCat.run("Ficção Científica", "Explorações tecnológicas, viagens espaciais e mundos imaginários.");
    insertCat.run("Engenharia de Software", "Práticas de programação, lógica, arquitetura e inteligência artificial.");
    insertCat.run("Literatura Clássica", "Obras tradicionais fundamentais de grandes mestres da história.");
    insertCat.run("História & Filosofia", "Investigações acerca do conhecimento, conduta e eventos passados.");

    console.log("[BIBLIOTECA] Semeando utilizadores de demonstração...");
    const insertUser = db.prepare("INSERT INTO USUARIO (nome, tipo_usuario, numero_identificacao, contacto, estado) VALUES (?, ?, ?, ?, ?)");
    insertUser.run("Carlos Manuel Silva", "Aluno", "ALU2026", "+244 912 345 678", "ativo");
    insertUser.run("Ana Sofia Rodrigues", "Aluno", "ALU3039", "+244 931 000 111", "ativo");
    insertUser.run("Prof. Fernando Santos", "Professor", "PROF8080", "+244 961 222 333", "ativo");

    console.log("[BIBLIOTECA] Semeando livros de demonstração...");
    const insertLivro = db.prepare("INSERT INTO LIVRO (titulo, autor, editora, ano_publicacao, id_categoria, estado) VALUES (?, ?, ?, ?, ?, ?)");
    insertLivro.run("Como programar em TypeScript", "Guilherme Santos", "Edições Lidel", 2023, 2, "disponivel");
    insertLivro.run("Ensaio sobre a Cegueira", "José Saramago", "Editorial Caminho", 1995, 3, "disponivel");
    insertLivro.run("Uma Breve História do Tempo", "Stephen Hawking", "Gradiva", 1988, 1, "emprestado");
    insertLivro.run("Crítica da Razão Pura", "Immanuel Kant", "Calouste Gulbenkian", 1781, 4, "disponivel");
    insertLivro.run("A Arte da Guerra", "Sun Tzu", "Europa-América", 2004, 4, "disponivel");

    console.log("[BIBLIOTECA] Semeando empréstimos de demonstração...");
    const insertEmp = db.prepare(`
      INSERT INTO EMPRESTIMO (id_usuario, id_livro, data_emprestimo, data_prev_devolucao, data_devolucao, estado) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    // Empréstimo 1: Carlos pegou "A Arte da Guerra" e já devolveu no prazo
    insertEmp.run(1, 5, "2026-05-20", "2026-05-27", "2026-05-25", "devolvido");
    
    // Empréstimo 2: Ana Sofia pegou "Uma Breve História do Tempo" e está atrasado (hoje é 2026-06-01 e o prazo era 2026-05-25)
    insertEmp.run(2, 3, "2026-05-18", "2026-05-25", null, "ativo");

    console.log("[BIBLIOTECA] Semeando operadores de demonstração...");
    const insertOperador = db.prepare("INSERT INTO OPERADOR (nome, username, cargo, contacto, estado, senha) VALUES (?, ?, ?, ?, ?, ?)");
    insertOperador.run("Administrador Geral", "admin", "Administrador", "+244 900 000 001", "ativo", "1234");
    insertOperador.run("Maria Fernandes", "maria", "Bibliotecario", "+244 900 000 002", "ativo", "1234");
  }
}

export default db;
