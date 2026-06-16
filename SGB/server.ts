import express from "express";
import path from "path";
import cors from "cors";
import fs from "fs";
import https from "https";
import { createServer as createViteServer } from "vite";
import { initDatabase } from "./backend/database";
import usuariosRouter from "./backend/routes/usuarios";
import livrosRouter from "./backend/routes/livros";
import emprestimosRouter, { atualizarEmprestimosAtrasados } from "./backend/routes/emprestimos";
import relatoriosRouter from "./backend/routes/relatorios";
import operadoresRouter from "./backend/routes/operadores";

async function ensureOfflineAssets() {
  const downloadFile = (url: string, dest: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const file = fs.createWriteStream(dest);
      https.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          let redirectUrl = response.headers.location!;
          if (!redirectUrl.startsWith("http")) {
            const parsedUrl = new URL(url);
            redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl.startsWith("/") ? "" : "/"}${redirectUrl}`;
          }
          downloadFile(redirectUrl, dest).then(resolve).catch(reject);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      }).on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    });
  };

  try {
    const publicVendor = path.resolve(process.cwd(), "BibliotecaGest", "public", "fornecedor");
    const tailwindDest = path.join(publicVendor, "tailwind.min.js");
    const lucideDest = path.join(publicVendor, "lucide.min.js");

    if (!fs.existsSync(tailwindDest)) {
      console.log("[BIBLIOTECA] Baixando Tailwind CSS Play CDN para modo offline...");
      await downloadFile("https://cdn.tailwindcss.com", tailwindDest);
      console.log("[BIBLIOTECA] Tailwind CSS offline salvo com sucesso.");
    }
    if (!fs.existsSync(lucideDest)) {
      console.log("[BIBLIOTECA] Baixando Lucide Icons para modo offline...");
      await downloadFile("https://unpkg.com/lucide@latest", lucideDest);
      console.log("[BIBLIOTECA] Lucide Icons offline salvo com sucesso.");
    }
  } catch (err) {
    console.error("[BIBLIOTECA] Erro ao descarregar dependências offline para BibliotecaGest:", err);
  }
}

async function startServer() {
  // Garantir ativos offline para o utilitário exportável
  await ensureOfflineAssets();

  // Inicializar Banco de Dados SQLite e popular se necessário
  try {
    initDatabase();
    console.log("[BIBLIOTECA] SQLite Banco de Dados Inicializado.");
    
    // Atualizar empréstimos vencidos na inicialização
    atualizarEmprestimosAtrasados();
  } catch (error) {
    console.error("[BIBLIOTECA] Erro ao inicializar banco de dados SQLite:", error);
  }

  const app = express();
  const PORT = 3000;

  // Middlewares globais
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rotas da API REST
  app.use("/api/usuarios", usuariosRouter);
  app.use("/api/livros", livrosRouter);
  app.use("/api/emprestimos", emprestimosRouter);
  app.use("/api/relatorios", relatoriosRouter);
  app.use("/api/operadores", operadoresRouter);

  // Servir a versão HTML pura/standalone (no sub-caminho /html)
  app.use("/html", express.static(path.join(process.cwd(), "BibliotecaGest", "public")));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "Sistema de Gestão de Biblioteca API está ativa." });
  });

  // Integrar Vite como middleware para o ambiente de desenvolvimento,
  // ou servir os arquivos estáticos de produção gerados em 'dist/'
  if (process.env.NODE_ENV !== "production") {
    console.log("[BIBLIOTECA] Rodando em modo de DESENVOLVIMENTO com middleware do Vite.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[BIBLIOTECA] Rodando em modo de PRODUÇÃO.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Escutar na porta 3000 (requisito do contêiner)
  app.listen(PORT, "0.0.0.0", () => {
    console.debug("[vite] connecting...");
    console.log("CONNECTED");
    console.log(`[BIBLIOTECA] Servidor HTTP operando na porta ${PORT}`);
  });
}

startServer();
