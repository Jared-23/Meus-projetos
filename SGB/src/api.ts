import { 
  Usuario, 
  Livro, 
  Categoria, 
  Emprestimo, 
  Multa, 
  DashboardStats,
  Operador
} from "./types";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}

// Em nosso ambiente fullstack, a API roda no mesmo host/porta.
const BASE_URL = "";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Erro de rede: Código ${response.status}`);
  }
  return data;
}

export const api = {
  // RELATÓRIOS & STATS
  getStats: () => fetchJson<DashboardStats>("/api/relatorios/geral"),
  getMaisEmprestados: () => fetchJson<any[]>("/api/relatorios/mais-emprestados"),
  getRelatorioAtrasos: () => fetchJson<Multa[]>("/api/relatorios/atrasos"),
  getHistoricoMensal: (periodo?: string) => 
    fetchJson<Emprestimo[]>(`/api/relatorios/historico${periodo ? `?periodo=${periodo}` : ""}`),

  // USUÁRIOS
  getUsuarios: () => fetchJson<Usuario[]>("/api/usuarios"),
  criarUsuario: (usuario: Omit<Usuario, "id_usuario" | "estado">) => 
    fetchJson<Usuario>("/api/usuarios", {
      method: "POST",
      body: JSON.stringify(usuario),
    }),
  atualizarUsuario: (id: number, usuario: Partial<Usuario>) => 
    fetchJson<Usuario>(`/api/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(usuario),
    }),
  getUsuarioHistorico: (id: number) => 
    fetchJson<{ usuario: { nome: string }; historico: Emprestimo[] }>(`/api/usuarios/${id}/historico`),
  pagarMultasUsuario: (id: number) => 
    fetchJson<any>(`/api/usuarios/${id}/pagar-multas`, {
      method: "POST",
    }),

  // LIVROS & CATEGORIAS
  getCategorias: () => fetchJson<Categoria[]>("/api/livros/categorias"),
  criarCategoria: (categoria: { nome_categoria: string; descricao?: string }) => 
    fetchJson<Categoria>("/api/livros/categorias", {
      method: "POST",
      body: JSON.stringify(categoria),
    }),
  getLivros: (filters?: { estado?: string; categoria?: string; category?: string }) => {
    const params = new URLSearchParams();
    if (filters?.estado) params.append("estado", filters.estado);
    const cat = filters?.categoria || filters?.category;
    if (cat) params.append("categoria", cat);
    const queryString = params.toString();
    return fetchJson<Livro[]>(`/api/livros${queryString ? `?${queryString}` : ""}`);
  },
  criarLivro: (livro: Omit<Livro, "id_livro" | "estado">) => 
    fetchJson<Livro>("/api/livros", {
      method: "POST",
      body: JSON.stringify(livro),
    }),
  atualizarLivro: (id: number, livro: Partial<Livro>) => 
    fetchJson<Livro>(`/api/livros/${id}`, {
      method: "PUT",
      body: JSON.stringify(livro),
    }),
  getLivroDisponibilidade: (id: number) => 
    fetchJson<{ id_livro: number; disponivel: boolean }>(`/api/livros/${id}/disponibilidade`),

  // EMPRÉSTIMOS & DEVOLUÇÕES
  getEmprestimos: (estado?: string) => {
    const query = estado ? `?estado=${estado}` : "";
    return fetchJson<Emprestimo[]>(`/api/emprestimos${query}`);
  },
  getEmprestimosAtrasados: () => fetchJson<Emprestimo[]>("/api/emprestimos/atrasados"),
  realizarEmprestimo: (id_usuario: number, id_livro: number) => 
    fetchJson<any>("/api/emprestimos", {
      method: "POST",
      body: JSON.stringify({ id_usuario, id_livro }),
    }),
  registrarDevolucao: (id: number) => 
    fetchJson<any>(`/api/emprestimos/${id}/devolver`, {
      method: "PUT",
    }),

  // OPERADORES DE SISTEMA
  getOperadores: () => fetchJson<Operador[]>("/api/operadores"),
  criarOperador: (operador: Omit<Operador, "id_operador" | "estado">) => 
    fetchJson<Operador>("/api/operadores", {
      method: "POST",
      body: JSON.stringify(operador),
    }),
  atualizarOperador: (id: number, operador: Partial<Operador>) => 
    fetchJson<Operador>(`/api/operadores/${id}`, {
      method: "PUT",
      body: JSON.stringify(operador),
    }),
  deletarOperador: (id: number) => 
    fetchJson<any>(`/api/operadores/${id}`, {
      method: "DELETE",
    }),
  loginOperador: (username: string, password: string) => 
    fetchJson<Operador>("/api/operadores/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
};
