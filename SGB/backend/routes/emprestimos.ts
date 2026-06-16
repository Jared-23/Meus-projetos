import { Router, Request, Response } from "express";
import db from "../database";
import { realizarEmprestimo, registrarDevolucao } from "../controllers/logicaNegocio";

const router = Router();

/**
 * Função preventiva para varrer o banco e atualizar status dos empréstimos ativos cuja data prevista de devolução expirou.
 */
export function atualizarEmprestimosAtrasados() {
  try {
    const hojeStr = new Date().toISOString().split("T")[0];

    // Buscar empréstimos ativos com data prevista menor que hoje
    const vencidos = db.prepare(`
      SELECT id_emprestimo, id_usuario, data_prev_devolucao 
      FROM EMPRESTIMO 
      WHERE estado = 'ativo' AND data_prev_devolucao < ?
    `).all(hojeStr) as { id_emprestimo: number; id_usuario: number; data_prev_devolucao: string }[];

    if (vencidos.length > 0) {
      const runTransaction = db.transaction(() => {
        for (const item of vencidos) {
          const dataPrev = new Date(item.data_prev_devolucao);
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          dataPrev.setHours(0, 0, 0, 0);

          const diffTime = hoje.getTime() - dataPrev.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > 0) {
            const valorMulta = diffDays * 1000; // Kz 1000.00 por dia de atraso

            // 1. Atualiza o status do empréstimo para 'atrasado'
            db.prepare("UPDATE EMPRESTIMO SET estado = 'atrasado' WHERE id_emprestimo = ?").run(item.id_emprestimo);

            // 2. Insere/atualiza multa correspondente
            db.prepare(`
              INSERT OR REPLACE INTO MULTA (id_emprestimo, valor, dias_atraso, estado_pagamento)
              VALUES (?, ?, ?, 'pendente')
            `).run(item.id_emprestimo, valorMulta, diffDays);

            // 3. Bloqueia o utilizador
            db.prepare("UPDATE USUARIO SET estado = 'suspenso' WHERE id_usuario = ?").run(item.id_usuario);
          }
        }
      });
      runTransaction();
    }
  } catch (err) {
    console.error("Erro ao rodar varredura de empréstimos vencidos:", err);
  }
}

// GET /api/emprestimos - Listar todos os empréstimos (ativa a varredura preventiva na chamada)
router.get("/", (req: Request, res: Response) => {
  try {
    // Atualizar empréstimos vencidos primeiro para dar informações exatas
    atualizarEmprestimosAtrasados();

    const { estado } = req.query;
    let sql = `
      SELECT e.*, u.nome as nome_usuario, u.numero_identificacao as num_usuario, l.titulo as titulo_livro,
             m.valor as valor_multa, m.estado_pagamento as multa_pagamento, m.dias_atraso
      FROM EMPRESTIMO e
      LEFT JOIN USUARIO u ON e.id_usuario = u.id_usuario
      LEFT JOIN LIVRO l ON e.id_livro = l.id_livro
      LEFT JOIN MULTA m ON e.id_emprestimo = m.id_emprestimo
    `;
    const params: any[] = [];

    if (estado) {
      sql += " WHERE e.estado = ?";
      params.push(estado);
    }

    sql += " ORDER BY e.id_emprestimo DESC";
    const emprestimos = db.prepare(sql).all(...params);

    res.json({ success: true, count: emprestimos.length, data: emprestimos });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao listar empréstimos.", error: error.message });
  }
});

// GET /api/emprestimos/atrasados - Listar empréstimos em atraso
router.get("/atrasados", (req: Request, res: Response) => {
  try {
    atualizarEmprestimosAtrasados();

    const atrasados = db.prepare(`
      SELECT e.*, u.nome as nome_usuario, u.numero_identificacao as num_usuario, l.titulo as titulo_livro,
             m.valor as valor_multa, m.estado_pagamento as multa_pagamento, m.dias_atraso
      FROM EMPRESTIMO e
      LEFT JOIN USUARIO u ON e.id_usuario = u.id_usuario
      LEFT JOIN LIVRO l ON e.id_livro = l.id_livro
      LEFT JOIN MULTA m ON e.id_emprestimo = m.id_emprestimo
      WHERE e.estado = 'atrasado' OR (e.estado = 'ativo' AND e.data_prev_devolucao < DATE('now'))
      ORDER BY e.data_prev_devolucao ASC
    `).all();

    res.json({ success: true, count: atrasados.length, data: atrasados });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao buscar empréstimos em atraso.", error: error.message });
  }
});

// POST /api/emprestimos - Realizar empréstimo
router.post("/", (req: Request, res: Response) => {
  try {
    const { id_usuario, id_livro } = req.body;

    if (!id_usuario || !id_livro) {
      return res.status(400).json({ success: false, message: "ID do utilizador e ID do livro são obrigatórios." });
    }

    const resultado = realizarEmprestimo(Number(id_usuario), Number(id_livro));
    if (!resultado.success) {
      return res.status(400).json({ success: false, message: resultado.message });
    }

    res.status(201).json(resultado);
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro interno ao realizar empréstimo.", error: error.message });
  }
});

// PUT /api/emprestimos/:id/devolver - Registrar devolução
router.put("/:id/devolver", (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "ID do empréstimo é obrigatório." });
    }

    const resultado = registrarDevolucao(Number(id));
    if (!resultado.success) {
      return res.status(400).json({ success: false, message: resultado.message });
    }

    res.json(resultado);
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro interno ao registrar devolução.", error: error.message });
  }
});

export default router;
