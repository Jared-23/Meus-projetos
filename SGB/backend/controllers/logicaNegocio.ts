import db from "../database";

interface Usuario {
  id_usuario: number;
  nome: string;
  tipo_usuario: string;
  numero_identificacao: string;
  contacto: string;
  estado: string;
}

interface Livro {
  id_livro: number;
  titulo: string;
  autor: string;
  editora: string;
  ano_publicacao: number;
  id_categoria: number;
  estado: string;
}

interface Emprestimo {
  id_emprestimo: number;
  id_usuario: number;
  id_livro: number;
  data_emprestimo: string;
  data_prev_devolucao: string;
  data_devolucao: string | null;
  estado: string;
}

/**
 * Verifica a disponibilidade de um livro pelo seu ID.
 */
export function verificarDisponibilidade(idLivro: number): boolean {
  const livro = db.prepare("SELECT estado FROM LIVRO WHERE id_livro = ?").get(idLivro) as { estado: string } | undefined;
  if (!livro) return false;
  return livro.estado === "disponivel";
}

/**
 * Bloqueia um utilizador definindo seu estado como "suspenso".
 */
export function bloquearUsuario(idUsuario: number): void {
  db.prepare("UPDATE USUARIO SET estado = 'suspenso' WHERE id_usuario = ?").run(idUsuario);
}

/**
 * Realiza um empréstimo com todas as regras de negócio associadas.
 */
export function realizarEmprestimo(idUsuario: number, idLivro: number): { success: boolean; message: string; data?: any } {
  // Transação do SQLite para garantir consistência
  const transaction = db.transaction(() => {
    // 1. Verificar se o utilizador existe e está ativo
    const usuario = db.prepare("SELECT * FROM USUARIO WHERE id_usuario = ?").get(idUsuario) as Usuario | undefined;
    if (!usuario) {
      throw new Error("Utilizador não encontrado.");
    }
    if (usuario.estado === "suspenso") {
      throw new Error("Este utilizador está suspenso e não pode realizar novos empréstimos.");
    }

    // 2. Verificar se o utilizador tem pendências (empréstimos em atraso)
    const atrasos = db.prepare(`
      SELECT COUNT(*) as count FROM EMPRESTIMO 
      WHERE id_usuario = ? AND (estado = 'atrasado' OR (estado = 'ativo' AND data_prev_devolucao < DATE('now')))
    `).get(idUsuario) as { count: number };

    if (atrasos && atrasos.count > 0) {
      // Bloquear preventivamente o utilizador se já tiver algum atraso pendente
      bloquearUsuario(idUsuario);
      throw new Error("O utilizador tem empréstimos em atraso pendentes de devolução.");
    }

    // 3. Verificar o limite de livros por tipo de utilizador
    const emprestimosAtivos = db.prepare(`
      SELECT COUNT(*) as count FROM EMPRESTIMO 
      WHERE id_usuario = ? AND estado IN ('ativo', 'atrasado')
    `).get(idUsuario) as { count: number };

    const limite = usuario.tipo_usuario === "Professor" ? 5 : 2;
    if (emprestimosAtivos && emprestimosAtivos.count >= limite) {
      throw new Error(`Limite de empréstimos atingido. ${usuario.tipo_usuario}s podem ter no máximo ${limite} empréstimos ativos simultâneos.`);
    }

    // 4. Verificar se o livro está disponível
    const disponivel = verificarDisponibilidade(idLivro);
    if (!disponivel) {
      throw new Error("O livro solicitado não está disponível para empréstimo.");
    }

    // 5. Calcular datas relevantes
    const hoje = new Date();
    const dataEmprestimoStr = hoje.toISOString().split("T")[0];
    
    const prazoDias = usuario.tipo_usuario === "Professor" ? 15 : 7;
    const dataPrevDev = new Date();
    dataPrevDev.setDate(hoje.getDate() + prazoDias);
    const dataPrevDevStr = dataPrevDev.toISOString().split("T")[0];

    // 6. Inserir empréstimo
    const insertStmt = db.prepare(`
      INSERT INTO EMPRESTIMO (id_usuario, id_livro, data_emprestimo, data_prev_devolucao, estado)
      VALUES (?, ?, ?, ?, 'ativo')
    `);
    const result = insertStmt.run(idUsuario, idLivro, dataEmprestimoStr, dataPrevDevStr);
    const idEmprestimo = result.lastInsertRowid;

    // 7. Atualizar estado do livro
    db.prepare("UPDATE LIVRO SET estado = 'emprestado' WHERE id_livro = ?").run(idLivro);

    return {
      id_emprestimo: idEmprestimo,
      id_usuario: idUsuario,
      id_livro: idLivro,
      data_emprestimo: dataEmprestimoStr,
      data_prev_devolucao: dataPrevDevStr,
      estado: "ativo"
    };
  });

  try {
    const data = transaction();
    return { success: true, message: "Empréstimo realizado com sucesso!", data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Registra a devolução de um empréstimo.
 */
export function registrarDevolucao(idEmprestimo: number): { success: boolean; message: string; data?: any } {
  const transaction = db.transaction(() => {
    // 1. Obter empréstimo
    const emprestimo = db.prepare("SELECT * FROM EMPRESTIMO WHERE id_emprestimo = ?").get(idEmprestimo) as Emprestimo | undefined;
    if (!emprestimo) {
      throw new Error("Empréstimo não encontrado.");
    }
    if (emprestimo.estado === "devolvido") {
      throw new Error("Este empréstimo já foi devolvido anteriormente.");
    }

    // 2. Registrar data real de devolução (hoje)
    const hoje = new Date();
    const dataDevolucaoStr = hoje.toISOString().split("T")[0];

    // Calcular atraso
    const dataPrevDev = new Date(emprestimo.data_prev_devolucao);
    // Configurar horas para zero para comparar apenas datas corretas
    hoje.setHours(0, 0, 0, 0);
    dataPrevDev.setHours(0, 0, 0, 0);

    const diffTime = hoje.getTime() - dataPrevDev.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let multaAdicionada = null;

    if (diffDays > 0) {
      // 3. Se houver atraso: Gerar multa (1000.00 Kz por dia de atraso) e suspender o utilizador
      const valorMulta = diffDays * 1000;
      
      // Criar relação de multa
      db.prepare(`
        INSERT OR REPLACE INTO MULTA (id_emprestimo, valor, dias_atraso, estado_pagamento)
        VALUES (?, ?, ?, 'pendente')
      `).run(idEmprestimo, valorMulta, diffDays);

      // Bloquear utilizador
      bloquearUsuario(emprestimo.id_usuario);

      multaAdicionada = {
        valor: valorMulta,
        dias_atraso: diffDays,
        estado_pagamento: "pendente"
      };
    }

    // 4. Atualizar empréstimo para devolvido
    db.prepare(`
      UPDATE EMPRESTIMO 
      SET data_devolucao = ?, estado = 'devolvido' 
      WHERE id_emprestimo = ?
    `).run(dataDevolucaoStr, idEmprestimo);

    // 5. Atualizar estado do livro para disponível
    db.prepare("UPDATE LIVRO SET estado = 'disponivel' WHERE id_livro = ?").run(emprestimo.id_livro);

    // 6. Verificar se o utilizador ainda tem algum outro empréstimo atrasado.
    // Se não tiver nenhum atraso, mas foi suspenso por este empréstimo específico, restaura se a multa for paga?
    // A regra diz "Se atrasado: suspender utilizador". O administrador poderá libertar ou a regularização da multa ativará novamente.
    
    return {
      id_emprestimo: idEmprestimo,
      data_devolucao: dataDevolucaoStr,
      dias_atraso: diffDays > 0 ? diffDays : 0,
      multa: multaAdicionada
    };
  });

  try {
    const data = transaction();
    const msg = data.dias_atraso > 0 
      ? `Devolução registrada com atraso de ${data.dias_atraso} dias. Multa de ${data.multa.valor.toFixed(2)} Kz gerada e utilizador suspenso.` 
      : "Devolução registrada com sucesso!";
    return { success: true, message: msg, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
