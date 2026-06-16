import { Router, Request, Response } from "express";
import db from "../database";

const router = Router();

// Listar todos os operadores (Apenas Administradores costumam acessar, mas vamos expor para seleção também)
router.get("/", (req: Request, res: Response) => {
  try {
    const operadores = db.prepare("SELECT * FROM OPERADOR ORDER BY nome ASC").all();
    res.json({ success: true, count: operadores.length, data: operadores });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao listar operadores.", error: error.message });
  }
});

// Registrar operador novo (Gerido pelo Administrador Principal)
router.post("/", (req: Request, res: Response) => {
  try {
    const { nome, username, cargo, contacto } = req.body;
    if (!nome || !username || !cargo) {
      return res.status(400).json({ success: false, message: "Campos nome, username e cargo são obrigatórios." });
    }

    if (cargo !== "Administrador" && cargo !== "Bibliotecario") {
      return res.status(400).json({ success: false, message: "O cargo deve ser 'Administrador' ou 'Bibliotecario'." });
    }

    // Verificar duplicidade de username de acesso
    const existente = db.prepare("SELECT id_operador FROM OPERADOR WHERE username = ?").get(username);
    if (existente) {
      return res.status(400).json({ success: false, message: "Já existe um operador cadastrado com este username." });
    }

    const stmt = db.prepare("INSERT INTO OPERADOR (nome, username, cargo, contacto, senha, estado) VALUES (?, ?, ?, ?, ?, 'ativo')");
    const result = stmt.run(nome, username, cargo, contacto || null, "1234");

    res.status(201).json({
      success: true,
      message: "Operador de sistema criado com sucesso!",
      data: { id_operador: result.lastInsertRowid, nome, username, cargo, contacto, estado: "ativo" }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao criar operador.", error: error.message });
  }
});

// Atualizar dados de um operador
router.put("/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, username, cargo, contacto, estado, senha } = req.body;

    const operador = db.prepare("SELECT * FROM OPERADOR WHERE id_operador = ?").get(id);
    if (!operador) {
      return res.status(404).json({ success: false, message: "Operador não encontrado." });
    }

    if (cargo && cargo !== "Administrador" && cargo !== "Bibliotecario") {
      return res.status(400).json({ success: false, message: "O cargo deve ser 'Administrador' ou 'Bibliotecario'." });
    }

    if (estado && estado !== "ativo" && estado !== "suspenso") {
      return res.status(400).json({ success: false, message: "O estado do operador deve ser 'ativo' ou 'suspenso'." });
    }

    const updateStmt = db.prepare(`
      UPDATE OPERADOR
      SET nome = COALESCE(?, nome),
          username = COALESCE(?, username),
          cargo = COALESCE(?, cargo),
          contacto = COALESCE(?, contacto),
          estado = COALESCE(?, estado),
          senha = COALESCE(?, senha)
      WHERE id_operador = ?
    `);
    updateStmt.run(nome, username, cargo, contacto, estado, senha, id);

    const operadorAtualizado = db.prepare("SELECT * FROM OPERADOR WHERE id_operador = ?").get(id);
    res.json({ success: true, message: "Operador de sistema atualizado com sucesso!", data: operadorAtualizado });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao atualizar operador.", error: error.message });
  }
});

// Deletar um operador (Com trave de segurança contra auto-deletar admin principal)
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const operador = db.prepare("SELECT * FROM OPERADOR WHERE id_operador = ?").get(id) as any;
    if (!operador) {
      return res.status(404).json({ success: false, message: "Operador não encontrado." });
    }

    if (operador.username === "admin") {
      return res.status(400).json({ success: false, message: "Segurança: Não é possível apagar o Administrador Geral original." });
    }

    db.prepare("DELETE FROM OPERADOR WHERE id_operador = ?").run(id);
    res.json({ success: true, message: "Operador de sistema removido com sucesso!" });
  } catch (error: any) {
    res.status(550).json({ success: false, message: "Erro ao apagar operador de sistema.", error: error.message });
  }
});

// Endpoint de login/autenticação de operador ativo com senha
router.post("/login", (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username e senha são obrigatórios." });
    }

    const operador = db.prepare("SELECT * FROM OPERADOR WHERE username = ?").get(username) as any;
    if (!operador) {
      return res.status(400).json({ success: false, message: "Credenciais inválidas: Operador não cadastrado." });
    }

    if (operador.senha !== password) {
      return res.status(400).json({ success: false, message: "Sua senha inserida está incorreta." });
    }

    if (operador.estado === "suspenso") {
      return res.status(400).json({ success: false, message: "Esta conta de operador de sistema está suspensa administrativamente." });
    }

    res.json({ success: true, message: "Autenticação efetuada com sucesso!", data: operador });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro no processo de autorização.", error: error.message });
  }
});

export default router;
