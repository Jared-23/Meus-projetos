import { Router, Request, Response } from "express";
import db from "../database";
import { atualizarEmprestimosAtrasados } from "./emprestimos";

const router = Router();

// GET /api/relatorios/geral - Rota para estatísticas consolidadas no dashboard
router.get("/geral", (req: Request, res: Response) => {
  try {
    // Forçar atualização de atrasos para estatísticas em tempo real
    atualizarEmprestimosAtrasados();

    const totalLivros = db.prepare("SELECT COUNT(*) as count FROM LIVRO").get() as { count: number };
    const totalUsuarios = db.prepare("SELECT COUNT(*) as count FROM USUARIO").get() as { count: number };
    const emprestimosAtivos = db.prepare("SELECT COUNT(*) as count FROM EMPRESTIMO WHERE estado IN ('ativo', 'atrasado')").get() as { count: number };
    const emprestimosAtrasados = db.prepare("SELECT COUNT(*) as count FROM EMPRESTIMO WHERE estado = 'atrasado'").get() as { count: number };
    
    const multasInfo = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN estado_pagamento = 'pendente' THEN valor ELSE 0 END), 0) as pendente,
        COALESCE(SUM(CASE WHEN estado_pagamento = 'pago' THEN valor ELSE 0 END), 0) as pago,
        COUNT(CASE WHEN estado_pagamento = 'pendente' THEN 1 END) as count_pendentes
      FROM MULTA
    `).get() as { pendente: number; pago: number; count_pendentes: number };

    res.json({
      success: true,
      data: {
        total_livros: totalLivros.count,
        total_usuarios: totalUsuarios.count,
        emprestimos_ativos: emprestimosAtivos.count,
        emprestimos_atrasados: emprestimosAtrasados.count,
        multas_pendentes_valor: multasInfo.pendente,
        multas_pagas_valor: multasInfo.pago,
        multas_pendentes_count: multasInfo.count_pendentes
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao gerar relatório geral.", error: error.message });
  }
});

// GET /api/relatorios/mais-emprestados - Ranking de livros mais populares
router.get("/mais-emprestados", (req: Request, res: Response) => {
  try {
    const ranking = db.prepare(`
      SELECT l.id_livro, l.titulo, l.autor, COUNT(e.id_emprestimo) as total_emprestimos, c.nome_categoria
      FROM EMPRESTIMO e
      JOIN LIVRO l ON e.id_livro = l.id_livro
      LEFT JOIN CATEGORIA c ON l.id_categoria = c.id_categoria
      GROUP BY l.id_livro
      ORDER BY total_emprestimos DESC
      LIMIT 10
    `).all();

    res.json({ success: true, count: ranking.length, data: ranking });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao buscar rank de livros mais emprestados.", error: error.message });
  }
});

// GET /api/relatorios/atrasos - Informações detalhadas sobre atrasos e multas residuais
router.get("/atrasos", (req: Request, res: Response) => {
  try {
    atualizarEmprestimosAtrasados();

    const multasPendentes = db.prepare(`
      SELECT 
        m.id_multa, m.valor, m.dias_atraso, m.estado_pagamento,
        e.data_emprestimo, e.data_prev_devolucao,
        u.nome as nome_usuario, u.numero_identificacao as num_usuario,
        l.titulo as titulo_livro
      FROM MULTA m
      JOIN EMPRESTIMO e ON m.id_emprestimo = e.id_emprestimo
      JOIN USUARIO u ON e.id_usuario = u.id_usuario
      JOIN LIVRO l ON e.id_livro = l.id_livro
      WHERE m.estado_pagamento = 'pendente'
      ORDER BY m.valor DESC
    `).all();

    res.json({ success: true, count: multasPendentes.length, data: multasPendentes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao carregar detalhes de multas.", error: error.message });
  }
});

// GET /api/relatorios/historico?periodo=YYYY-MM - Filtrar histórico por período mensal
router.get("/historico", (req: Request, res: Response) => {
  try {
    let { periodo } = req.query;

    if (!periodo) {
      // Se não informado, calcula o mês atual (por exemplo, "2026-06")
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, "0");
      periodo = `${ano}-${mes}`;
    }

    // SQLite strftime('%Y-%m', data_emprestimo)
    const historico = db.prepare(`
      SELECT e.*, u.nome as nome_usuario, u.numero_identificacao as num_usuario, l.titulo as titulo_livro,
             m.valor as valor_multa, m.estado_pagamento as multa_pagamento
      FROM EMPRESTIMO e
      JOIN USUARIO u ON e.id_usuario = u.id_usuario
      JOIN LIVRO l ON e.id_livro = l.id_livro
      LEFT JOIN MULTA m ON e.id_emprestimo = m.id_emprestimo
      WHERE strftime('%Y-%m', e.data_emprestimo) = ?
      ORDER BY e.data_emprestimo DESC
    `).all(periodo);

    res.json({ 
      success: true, 
      periodo,
      count: historico.length, 
      data: historico 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao gerar histórico por período.", error: error.message });
  }
});

export default router;
