import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Livro, Categoria } from "../types";
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  X, 
  Bookmark, 
  Grid,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Tag
} from "lucide-react";

interface LivrosViewProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function LivrosView({ showToast }: LivrosViewProps) {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [buscaTexto, setBuscaTexto] = useState("");

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Modais
  const [modalLivroAberto, setModalLivroAberto] = useState(false);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false);

  // Form de Criar Livro
  const [formLivro, setFormLivro] = useState({
    titulo: "",
    autor: "",
    editora: "",
    ano_publicacao: "",
    id_categoria: "",
  });

  // Form de Editar Livro
  const [livroSelecionado, setLivroSelecionado] = useState<Livro | null>(null);
  const [formEdicao, setFormEdicao] = useState({
    titulo: "",
    autor: "",
    editora: "",
    ano_publicacao: "",
    id_categoria: "",
    estado: "" as "disponivel" | "emprestado",
  });

  // Form de Criar Categoria
  const [formCategoria, setFormCategoria] = useState({
    nome_categoria: "",
    descricao: "",
  });

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [livrosRes, categoriasRes] = await Promise.all([
        api.getLivros({ estado: filtroEstado, categoria: filtroCategoria }),
        api.getCategorias()
      ]);

      if (livrosRes.success) setLivros(livrosRes.data);
      if (categoriasRes.success) setCategorias(categoriasRes.data);
    } catch (err: any) {
      console.error(err);
      showToast("Não foi possível carregar os livros e categorias.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filtroEstado, filtroCategoria]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroEstado, filtroCategoria, buscaTexto]);

  const handleSubmeterLivro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLivro.titulo || !formLivro.autor) {
      showToast("Título e Autor são obrigatórios.", "error");
      return;
    }

    try {
      const res = await api.criarLivro({
        titulo: formLivro.titulo,
        autor: formLivro.autor,
        editora: formLivro.editora || undefined,
        ano_publicacao: formLivro.ano_publicacao ? Number(formLivro.ano_publicacao) : undefined,
        id_categoria: formLivro.id_categoria ? Number(formLivro.id_categoria) : undefined,
      });

      if (res.success) {
        showToast("Livro inserido no acervo real com sucesso!", "success");
        setFormLivro({ titulo: "", autor: "", editora: "", ano_publicacao: "", id_categoria: "" });
        setModalLivroAberto(false);
        carregarDados();
      }
    } catch (err: any) {
      showToast(err.message || "Erro ao registrar livro.", "error");
    }
  };

  const handleSubmeterEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!livroSelecionado) return;

    if (!formEdicao.titulo || !formEdicao.autor) {
      showToast("Título e Autor são obrigatórios.", "error");
      return;
    }

    try {
      const res = await api.atualizarLivro(livroSelecionado.id_livro, {
        titulo: formEdicao.titulo,
        autor: formEdicao.autor,
        editora: formEdicao.editora || undefined,
        ano_publicacao: formEdicao.ano_publicacao ? Number(formEdicao.ano_publicacao) : undefined,
        id_categoria: formEdicao.id_categoria ? Number(formEdicao.id_categoria) : undefined,
        estado: formEdicao.estado,
      });

      if (res.success) {
        showToast("Especificações do livro atualizadas!", "success");
        setModalEdicaoAberto(false);
        setLivroSelecionado(null);
        carregarDados();
      }
    } catch (err: any) {
      showToast(err.message || "Erro ao atualizar livro.", "error");
    }
  };

  const handleSubmeterCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategoria.nome_categoria) {
      showToast("O nome da categoria é obrigatório.", "error");
      return;
    }

    try {
      const res = await api.criarCategoria(formCategoria);
      if (res.success) {
        showToast(`Categoria '${res.data.nome_categoria}' cadastrada!`, "success");
        setFormCategoria({ nome_categoria: "", descricao: "" });
        setModalCategoriaAberto(false);
        carregarDados();
      }
    } catch (err: any) {
      showToast(err.message || "Erro ao criar categoria.", "error");
    }
  };

  const abrirModalEdicao = (livro: Livro) => {
    setLivroSelecionado(livro);
    setFormEdicao({
      titulo: livro.titulo,
      autor: livro.autor,
      editora: livro.editora || "",
      ano_publicacao: livro.ano_publicacao ? String(livro.ano_publicacao) : "",
      id_categoria: livro.id_categoria ? String(livro.id_categoria) : "",
      estado: livro.estado,
    });
    setModalEdicaoAberto(true);
  };

  // Filtragem local baseada na caixa de busca text-search
  const livrosFiltrados = livros.filter((livro) => {
    const texto = buscaTexto.toLowerCase();
    return (
      livro.titulo.toLowerCase().includes(texto) ||
      livro.autor.toLowerCase().includes(texto) ||
      (livro.editora && livro.editora.toLowerCase().includes(texto))
    );
  });

  // Cálculo da Paginação
  const totalItens = livrosFiltrados.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina) || 1;
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const livrosPaginados = livrosFiltrados.slice(indiceInicial, indiceInicial + itensPorPagina);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight" id="livros-title">
            Acervo de Livros
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestão completa do catálogo, classificação por categorias literárias e controle de disponibilidade.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalCategoriaAberto(true)}
            className="px-4 py-2 border border-slate-200 hover:border-[#1a6bbf] hover:bg-slate-50 text-slate-600 font-semibold rounded-lg flex items-center gap-1.5 text-sm transition-all duration-250 cursor-pointer"
            id="btn-nova-categoria"
          >
            <Tag className="w-4 h-4 text-slate-500" />
            Nova Categoria
          </button>
          
          <button
            onClick={() => setModalLivroAberto(true)}
            className="px-4 py-2 bg-[#1a6bbf] hover:bg-[#155a00] hover:bg-opacity-95 text-white font-semibold rounded-lg flex items-center gap-1.5 text-sm transition-all duration-200 shadow-sm cursor-pointer"
            id="btn-novo-livro"
          >
            <Plus className="w-4 h-4" />
            Novo Livro
          </button>
        </div>
      </div>

      {/* Caixa de Ferramentas / Filtros */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-3xs p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Busca Texto */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={buscaTexto}
            onChange={(e) => setBuscaTexto(e.target.value)}
            placeholder="Buscar título, autor ou editora..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 outline-none text-sm text-slate-700 placeholder-slate-400 focus:border-[#1a6bbf] focus:ring-1 focus:ring-[#1a6bbf] transition"
          />
        </div>

        {/* Filtros Dropdowns */}
        <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase font-mono">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filtrar Por:
          </div>
          
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 font-semibold outline-none focus:border-[#1a6bbf]"
          >
            <option value="">Todos os Estados</option>
            <option value="disponivel">Disponíveis</option>
            <option value="emprestado">Emprestados</option>
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 font-semibold outline-none focus:border-[#1a6bbf]"
          >
            <option value="">Todas de Categorias</option>
            {categorias.map((cat) => (
              <option key={cat.id_categoria} value={cat.id_categoria}>
                {cat.nome_categoria}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase font-mono">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Autor</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Editora / Ano</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a6bbf]"></div>
                    <p className="mt-2 text-xs text-slate-400">Carregando acervo do banco...</p>
                  </td>
                </tr>
              ) : livrosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum livro corresponde aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                livrosPaginados.map((livro) => (
                  <tr key={livro.id_livro} className="hover:bg-slate-50/40 transition">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">
                      #{livro.id_livro}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 text-sm max-w-[280px] break-words whitespace-normal leading-snug">
                        {livro.titulo}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {livro.autor}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs text-[#1a6bbf] font-medium font-sans">
                        <Grid className="w-3.5 h-3.5 text-blue-300" />
                        {livro.nome_categoria || "Sem Categoria"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {livro.editora || "—"}{" "}
                      {livro.ano_publicacao ? `(${livro.ano_publicacao})` : ""}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        livro.estado === "disponivel"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                          : "bg-red-50 text-red-650 border-red-200"
                      }`}>
                        {livro.estado === "disponivel" ? "Disponível" : "Emprestado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => abrirModalEdicao(livro)}
                        className="p-1 px-2.5 text-xs text-[#1a6bbf] hover:text-white hover:bg-[#1a6bbf] border border-blue-200 hover:border-transparent rounded-md font-semibold transition flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-slate-500 font-semibold font-mono">
            Exibindo {totalItens > 0 ? indiceInicial + 1 : 0} a {Math.min(indiceInicial + itensPorPagina, totalItens)} de {totalItens} livros
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="p-1.5 disabled:opacity-40 border border-slate-200 hover:bg-white bg-slate-50 rounded-lg text-slate-600 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold font-mono text-slate-600 px-3 bg-white py-1 rounded-lg border border-slate-200">
              Pág. {paginaAtual} / {totalPaginas}
            </span>
            <button
              onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              className="p-1.5 disabled:opacity-40 border border-slate-200 hover:bg-white bg-slate-50 rounded-lg text-slate-600 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: CRIAR NOVO LIVRO */}
      {modalLivroAberto && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-scale-up">
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <BookOpen className="w-5 h-5 text-[#1a6bbf]" /> Novo Livro
              </h3>
              <button 
                onClick={() => setModalLivroAberto(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmeterLivro} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Título do Exemplar *</label>
                <input
                  type="text"
                  required
                  value={formLivro.titulo}
                  onChange={(e) => setFormLivro({ ...formLivro, titulo: e.target.value })}
                  placeholder="Ex: Dom Casmurro"
                  className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 placeholder-slate-400 focus:border-[#1a6bbf] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Autor principal *</label>
                <input
                  type="text"
                  required
                  value={formLivro.autor}
                  onChange={(e) => setFormLivro({ ...formLivro, autor: e.target.value })}
                  placeholder="Ex: Machado de Assis"
                  className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 placeholder-slate-400 focus:border-[#1a6bbf] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Editora</label>
                  <input
                    type="text"
                    value={formLivro.editora}
                    onChange={(e) => setFormLivro({ ...formLivro, editora: e.target.value })}
                    placeholder="Ex: Garnier"
                    className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 placeholder-slate-400 focus:border-[#1a6bbf] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Ano Lançamento</label>
                  <input
                    type="number"
                    value={formLivro.ano_publicacao}
                    onChange={(e) => setFormLivro({ ...formLivro, ano_publicacao: e.target.value })}
                    placeholder="Ex: 1899"
                    className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 placeholder-slate-400 focus:border-[#1a6bbf] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Categoria Classificação</label>
                <select
                  value={formLivro.id_categoria}
                  required
                  onChange={(e) => setFormLivro({ ...formLivro, id_categoria: e.target.value })}
                  className="w-full text-sm border border-slate-200 px-3 py-2 rounded-lg outline-none text-slate-800 bg-white focus:border-[#1a6bbf]"
                >
                  <option value="">Selecione...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nome_categoria}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setModalLivroAberto(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 font-semibold text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a6bbf] hover:bg-opacity-95 text-white font-semibold rounded-lg text-sm transition shadow-xs"
                >
                  Salvar Livro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR LIVRO */}
      {modalEdicaoAberto && livroSelecionado && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-scale-up">
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <Edit className="w-5 h-5 text-[#1a6bbf]" /> Detalhes do Livro #{livroSelecionado.id_livro}
              </h3>
              <button 
                onClick={() => setModalEdicaoAberto(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmeterEdicao} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Título do Exemplar *</label>
                <input
                  type="text"
                  required
                  value={formEdicao.titulo}
                  onChange={(e) => setFormEdicao({ ...formEdicao, titulo: e.target.value })}
                  className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 focus:border-[#1a6bbf] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Autor principal *</label>
                <input
                  type="text"
                  required
                  value={formEdicao.autor}
                  onChange={(e) => setFormEdicao({ ...formEdicao, autor: e.target.value })}
                  className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 focus:border-[#1a6bbf] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Editora</label>
                  <input
                    type="text"
                    value={formEdicao.editora}
                    onChange={(e) => setFormEdicao({ ...formEdicao, editora: e.target.value })}
                    className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 focus:border-[#1a6bbf] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Ano Lançamento</label>
                  <input
                    type="number"
                    value={formEdicao.ano_publicacao}
                    onChange={(e) => setFormEdicao({ ...formEdicao, ano_publicacao: e.target.value })}
                    className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 focus:border-[#1a6bbf] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Categoria</label>
                  <select
                    value={formEdicao.id_categoria}
                    required
                    onChange={(e) => setFormEdicao({ ...formEdicao, id_categoria: e.target.value })}
                    className="w-full text-sm border border-slate-200 px-2 py-2 rounded-lg outline-none text-slate-800 bg-white focus:border-[#1a6bbf]"
                  >
                    <option value="">Selecione...</option>
                    {categorias.map((cat) => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nome_categoria}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Estado</label>
                  <select
                    value={formEdicao.estado}
                    required
                    onChange={(e) => setFormEdicao({ ...formEdicao, estado: e.target.value as any })}
                    className="w-full text-sm border border-slate-200 px-2 py-2 rounded-lg outline-none text-slate-800 bg-white focus:border-[#1a6bbf]"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="emprestado">Emprestado</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => {
                    setModalEdicaoAberto(false);
                    setLivroSelecionado(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 font-semibold text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a6bbf] hover:bg-opacity-95 text-white font-semibold rounded-lg text-sm transition shadow-xs"
                >
                  Salvar Mudanças
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR CATEGORIA */}
      {modalCategoriaAberto && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col animate-scale-up">
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 font-sans animate-fade-in">
                <Tag className="w-5 h-5 text-[#1a6bbf]" /> Nova Categoria
              </h3>
              <button 
                onClick={() => setModalCategoriaAberto(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmeterCategoria} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  value={formCategoria.nome_categoria}
                  onChange={(e) => setFormCategoria({ ...formCategoria, nome_categoria: e.target.value })}
                  placeholder="Ex: Engenharia Civil"
                  className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 placeholder-slate-400 focus:border-[#1a6bbf] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Descrição Breve</label>
                <textarea
                  rows={3}
                  value={formCategoria.descricao}
                  onChange={(e) => setFormCategoria({ ...formCategoria, descricao: e.target.value })}
                  placeholder="Descrição sobre os livros catalogados..."
                  className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 placeholder-slate-400 focus:border-[#1a6bbf] resize-none transition"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setModalCategoriaAberto(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 font-semibold text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a6bbf] hover:bg-opacity-95 text-white font-semibold rounded-lg text-sm transition shadow-xs"
                >
                  Criar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
