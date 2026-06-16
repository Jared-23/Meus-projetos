import { Router, Request, Response } from "express";
import db from "../database";

const router = Router();

// GET /api/usuarios - Listar todos os usuários com dados agregados (empréstimos ativos e multas)
router.get("/", (req: Request, res: Response) => {
  try {
    const usuarios = db.prepare(`
      SELECT u.*, 
        (SELECT COUNT(*) FROM EMPRESTIMO e WHERE e.id_usuario = u.id_usuario AND e.estado IN ('ativo', 'atrasado')) as emprestimos_ativos,
        COALESCE((SELECT SUM(m.valor) FROM MULTA m JOIN EMPRESTIMO e ON m.id_emprestimo = e.id_emprestimo WHERE e.id_usuario = u.id_usuario AND m.estado_pagamento = 'pendente'), 0) as multas_pendentes
      FROM USUARIO u
      ORDER BY u.nome ASC
    `).all();
    
    res.json({ success: true, count: usuarios.length, data: usuarios });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao listar utilizadores.", error: error.message });
  }
});

// POST /api/usuarios - Criar novo usuário
router.post("/", (req: Request, res: Response) => {
  try {
    const { nome, tipo_usuario, numero_identificacao, contacto } = req.body;
    
    if (!nome || !tipo_usuario || !numero_identificacao) {
      return res.status(400).json({ success: false, message: "Os campos nome, tipo_usuario e numero_identificacao são obrigatórios." });
    }

    if (tipo_usuario !== "Aluno" && tipo_usuario !== "Professor") {
      return res.status(400).json({ success: false, message: "O tipo de utilizador deve ser 'Aluno' ou 'Professor'." });
    }

    // Verificar se o ID d'identificação já existe
    const existente = db.prepare("SELECT id_usuario FROM USUARIO WHERE numero_identificacao = ?").get(numero_identificacao);
    if (existente) {
      return res.status(400).json({ success: false, message: "Já existe um utilizador cadastrado com este número de identificação." });
    }

    const stmt = db.prepare(`
      INSERT INTO USUARIO (nome, tipo_usuario, numero_identificacao, contacto, estado)
      VALUES (?, ?, ?, ?, 'ativo')
    `);
    const result = stmt.run(nome, tipo_usuario, numero_identificacao, contacto || null);
    
    const novoUsuario = {
      id_usuario: result.lastInsertRowid,
      nome,
      tipo_usuario,
      numero_identificacao,
      contacto,
      estado: "ativo"
    };

    res.status(201).json({ success: true, message: "Utilizador criado com sucesso!", data: novoUsuario });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao criar utilizador.", error: error.message });
  }
});

// PUT /api/usuarios/:id - Atualizar usuário
router.put("/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, tipo_usuario, numero_identificacao, contacto, estado } = req.body;

    // Verificar existência do usuário
    const usuario = db.prepare("SELECT * FROM USUARIO WHERE id_usuario = ?").get(id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: "Utilizador não encontrado." });
    }

    if (tipo_usuario && tipo_usuario !== "Aluno" && tipo_usuario !== "Professor") {
      return res.status(400).json({ success: false, message: "O tipo de utilizador deve ser 'Aluno' ou 'Professor'." });
    }

    if (estado && estado !== "ativo" && estado !== "suspenso") {
      return res.status(400).json({ success: false, message: "O estado do utilizador deve ser 'ativo' ou 'suspenso'." });
    }

    // Atualizar dados de forma flexível (mantém o valor antigo se não enviado)
    const updateStmt = db.prepare(`
      UPDATE USUARIO 
      SET nome = COALESCE(?, nome),
          tipo_usuario = COALESCE(?, tipo_usuario),
          numero_identificacao = COALESCE(?, numero_identificacao),
          contacto = COALESCE(?, contacto),
          estado = COALESCE(?, estado)
      WHERE id_usuario = ?
    `);
    updateStmt.run(nome, tipo_usuario, numero_identificacao, contacto, estado, id);

    const usuarioAtualizado = db.prepare("SELECT * FROM USUARIO WHERE id_usuario = ?").get(id);
    res.json({ success: true, message: "Utilizador atualizado com sucesso!", data: usuarioAtualizado });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao atualizar utilizador.", error: error.message });
  }
});

// GET /api/usuarios/:id/historico - Histórico de empréstimos do utilizador
router.get("/:id/historico", (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar existência
    const usuario = db.prepare("SELECT nome FROM USUARIO WHERE id_usuario = ?").get(id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: "Utilizador não encontrado." });
    }

    const historico = db.prepare(`
      SELECT e.*, l.titulo, l.autor, m.valor as valor_multa, m.estado_pagamento as multa_pagamento
      FROM EMPRESTIMO e
      JOIN LIVRO l ON e.id_livro = l.id_livro
      LEFT JOIN MULTA m ON e.id_emprestimo = m.id_emprestimo
      WHERE e.id_usuario = ?
      ORDER BY e.data_emprestimo DESC
    `).all(id);

    res.json({ success: true, data: { usuario, historico } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao buscar histórico do utilizador.", error: error.message });
  }
});

// POST /api/usuarios/:id/pagar-multas - Rota auxiliar útil para regularizar estado
router.post("/:id/pagar-multas", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Obter todas as multas pendentes desse usuário
    const multasPendentes = db.prepare(`
      SELECT m.id_multa 
      FROM MULTA m 
      JOIN EMPRESTIMO e ON m.id_emprestimo = e.id_emprestimo 
      WHERE e.id_usuario = ? AND m.estado_pagamento = 'pendente'
    `).all(id) as { id_multa: number }[];

    if (multasPendentes.length === 0) {
      return res.json({ success: true, message: "Não existem multas pendentes para esse utilizador." });
    }

    const transaction = db.transaction(() => {
      // Pagar todas as multas usando os IDs obtidos
      const ids = multasPendentes.map(m => m.id_multa);
      const updateStmt = db.prepare("UPDATE MULTA SET estado_pagamento = 'pago' WHERE id_multa = ?");
      for (const idMulta of ids) {
        updateStmt.run(idMulta);
      }

      // Reativar usuário se ele não tiver mais nenhuma irregularidade ativa
      // Ou seja, se todos os livros foram devolvidos e todas as multas pagas
      const atrasosAtivos = db.prepare(`
        SELECT COUNT(*) as count FROM EMPRESTIMO 
        WHERE id_usuario = ? AND (estado = 'atrasado' OR (estado = 'ativo' AND data_prev_devolucao < DATE('now')))
      `).get(id) as { count: number };

      if (atrasosAtivos.count === 0) {
        db.prepare("UPDATE USUARIO SET estado = 'ativo' WHERE id_usuario = ?").run(id);
      }
    });

    transaction();
    res.json({ success: true, message: "Todas as multas pendentes foram regularizadas e pagas!" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao regularizar multas.", error: error.message });
  }
});

export default router;
