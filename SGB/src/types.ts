export interface Categoria {
  id_categoria: number;
  nome_categoria: string;
  descricao?: string;
}

export interface Usuario {
  id_usuario: number;
  nome: string;
  tipo_usuario: "Aluno" | "Professor";
  numero_identificacao: string;
  contacto: string;
  estado: "ativo" | "suspenso";
  emprestimos_ativos?: number;
  multas_pendentes?: number;
}

export interface Livro {
  id_livro: number;
  titulo: string;
  autor: string;
  editora?: string;
  ano_publicacao?: number;
  id_categoria?: number;
  nome_categoria?: string;
  estado: "disponivel" | "emprestado";
}

export interface Emprestimo {
  id_emprestimo: number;
  id_usuario: number;
  nome_usuario?: string;
  num_usuario?: string;
  id_livro: number;
  titulo_livro?: string;
  data_emprestimo: string;
  data_prev_devolucao: string;
  data_devolucao: string | null;
  estado: "ativo" | "devolvido" | "atrasado";
  valor_multa?: number;
  dias_atraso?: number;
  multa_pagamento?: "pendente" | "pago" | null;
}

export interface Multa {
  id_multa: number;
  id_emprestimo: number;
  valor: number;
  dias_atraso: number;
  estado_pagamento: "pendente" | "pago";
  nome_usuario?: string;
  num_usuario?: string;
  titulo_livro?: string;
  data_emprestimo?: string;
  data_prev_devolucao?: string;
}

export interface DashboardStats {
  total_livros: number;
  total_usuarios: number;
  emprestimos_ativos: number;
  emprestimos_atrasados: number;
  multas_pendentes_valor: number;
  multas_pagas_valor: number;
  multas_pendentes_count: number;
}

export interface Operador {
  id_operador: number;
  nome: string;
  username: string;
  cargo: "Administrador" | "Bibliotecario";
  contacto: string | null;
  senha?: string;
  estado: "ativo" | "suspenso";
}
