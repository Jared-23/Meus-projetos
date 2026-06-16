import { Router, Request, Response } from "express";
import db from "../database";
import { verificarDisponibilidade } from "../controllers/logicaNegocio";

const router = Router();

// GET /api/livros/categorias - Útil para preencher comboboxes no front-end
router.get("/categorias", (req: Request, res: Response) => {
  try {
    const categorias = db.prepare("SELECT * FROM CATEGORIA ORDER BY nome_categoria ASC").all();
    res.json({ success: true, data: categorias });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao listar categorias.", error: error.message });
  }
});

// POST /api/livros/categorias - Adicionar nova categoria
router.post("/categorias", (req: Request, res: Response) => {
  try {
    const { nome_categoria, descricao } = req.body;
    if (!nome_categoria) {
      return res.status(400).json({ success: false, message: "Nome da categoria é obrigatório." });
    }

    const stmt = db.prepare("INSERT INTO CATEGORIA (nome_categoria, descricao) VALUES (?, ?)");
    const result = stmt.run(nome_categoria, descricao || null);
    
    res.status(201).json({ 
      success: true, 
      message: "Categoria criada com sucesso!", 
      data: { id_categoria: result.lastInsertRowid, nome_categoria, descricao } 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao criar categoria.", error: error.message });
  }
});

// GET /api/livros - Listar todos os livros (suporta query filters 'estado' e 'id_categoria')
router.get("/", (req: Request, res: Response) => {
  try {
    const { estado, categoria } = req.query;

    let sql = `
      SELECT l.*, c.nome_categoria 
      FROM LIVRO l
      LEFT JOIN CATEGORIA c ON l.id_categoria = c.id_categoria
      WHERE 1=1
    `;
    const params: any[] = [];

    if (estado) {
      sql += " AND l.estado = ?";
      params.push(estado);
    }

    if (categoria) {
      sql += " AND l.id_categoria = ?";
      params.push(Number(categoria));
    }

    sql += " ORDER BY l.titulo ASC";
    const livros = db.prepare(sql).all(...params);

    res.json({ success: true, count: livros.length, data: livros });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao listar livros.", error: error.message });
  }
});

// POST /api/livros - Registrar novo livro
router.post("/", (req: Request, res: Response) => {
  try {
    const { titulo, autor, editora, ano_publicacao, id_categoria, estado } = req.body;

    if (!titulo || !autor) {
      return res.status(400).json({ success: false, message: "Título e Autor são obrigatórios." });
    }

    const stmt = db.prepare(`
      INSERT INTO LIVRO (titulo, autor, editora, ano_publicacao, id_categoria, estado)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const estadoInicial = estado || "disponivel";
    const result = stmt.run(titulo, autor, editora || null, ano_publicacao ? Number(ano_publicacao) : null, id_categoria ? Number(id_categoria) : null, estadoInicial);

    const novoLivro = {
      id_livro: result.lastInsertRowid,
      titulo,
      autor,
      editora,
      ano_publicacao,
      id_categoria,
      estado: estadoInicial
    };

    res.status(201).json({ success: true, message: "Livro registrado com sucesso!", data: novoLivro });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao registrar livro.", error: error.message });
  }
});

// PUT /api/livros/:id - Atualizar dados do livro (incluindo estado)
router.put("/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { titulo, autor, editora, ano_publicacao, id_categoria, estado } = req.body;

    // Verificar se o livro existe
    const livro = db.prepare("SELECT * FROM LIVRO WHERE id_livro = ?").get(id);
    if (!livro) {
      return res.status(404).json({ success: false, message: "Livro não encontrado." });
    }

    if (estado && estado !== "disponivel" && estado !== "emprestado") {
      return res.status(400).json({ success: false, message: "O estado do livro deve ser 'disponivel' ou 'emprestado'." });
    }

    const stmt = db.prepare(`
      UPDATE LIVRO 
      SET titulo = COALESCE(?, titulo),
          autor = COALESCE(?, autor),
          editora = COALESCE(?, editora),
          ano_publicacao = COALESCE(?, ano_publicacao),
          id_categoria = COALESCE(?, id_categoria),
          estado = COALESCE(?, estado)
      WHERE id_livro = ?
    `);
    stmt.run(titulo, autor, editora, ano_publicacao ? Number(ano_publicacao) : null, id_categoria ? Number(id_categoria) : null, estado, id);

    const livroAtualizado = db.prepare("SELECT * FROM LIVRO WHERE id_livro = ?").get(id);
    res.json({ success: true, message: "Livro atualizado com sucesso!", data: livroAtualizado });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao atualizar livro.", error: error.message });
  }
});

// GET /api/livros/:id/disponibilidade - Verificar disponibilidade por ID
router.get("/:id/disponibilidade", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const livro = db.prepare("SELECT * FROM LIVRO WHERE id_livro = ?").get(id);
    if (!livro) {
      return res.status(404).json({ success: false, message: "Livro não encontrado." });
    }

    const disponivel = verificarDisponibilidade(Number(id));
    res.json({ success: true, data: { id_livro: Number(id), disponivel } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao verificar disponibilidade.", error: error.message });
  }
});

export default router;
