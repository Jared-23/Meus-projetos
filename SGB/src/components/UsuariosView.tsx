import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Usuario, Emprestimo } from "../types";
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  X, 
  History, 
  CreditCard,
  Phone,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX
} from "lucide-react";

interface UsuariosViewProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function UsuariosView({ showToast }: UsuariosViewProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscaTexto, setBuscaTexto] = useState("");

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Modais
  const [modalUsuarioAberto, setModalUsuarioAberto] = useState(false);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);

  // Form de Criar Usuário
  const [formUsuario, setFormUsuario] = useState({
    nome: "",
    tipo_usuario: "Aluno" as "Aluno" | "Professor",
    numero_identificacao: "",
    contacto: "",
  });

  // Form de Editar Usuário
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [formEdicao, setFormEdicao] = useState({
    nome: "",
    tipo_usuario: "Aluno" as "Aluno" | "Professor",
    numero_identificacao: "",
    contacto: "",
    estado: "ativo" as "ativo" | "suspenso",
  });

  // Histórico selecionado
  const [historicoLeitor, setHistoricoLeitor] = useState<{ usuario: { nome: string }; historico: Emprestimo[] } | null>(null);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  // Pagamento amador de multa amigável sem confirm()
  const [usuarioConfirmandoPagamento, setUsuarioConfirmandoPagamento] = useState<Usuario | null>(null);
  const [executandoPagamento, setExecutandoPagamento] = useState(false);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const res = await api.getUsuarios();
      if (res.success) setUsuarios(res.data);
    } catch (err: any) {
      console.error(err);
      showToast("Falha ao carregar utilizadores.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [buscaTexto]);

  const handleSubmeterUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsuario.nome || !formUsuario.numero_identificacao) {
      showToast("Nome e Número de Identificação são obrigatórios.", "error");
      return;
    }

    try {
      const res = await api.criarUsuario(formUsuario);
      if (res.success) {
        showToast("Utilizador cadastrado com sucesso!", "success");
        setFormUsuario({ nome: "", tipo_usuario: "Aluno", numero_identificacao: "", contacto: "" });
        setModalUsuarioAberto(false);
        carregarDados();
      }
    } catch (err: any) {
      showToast(err.message || "Erro ao registrar utilizador.", "error");
    }
  };

  const handleSubmeterEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioSelecionado) return;

    if (!formEdicao.nome || !formEdicao.numero_identificacao) {
      showToast("Nome e Número de Identificação são obrigatórios.", "error");
      return;
    }

    try {
      const res = await api.atualizarUsuario(usuarioSelecionado.id_usuario, formEdicao);
      if (res.success) {
        showToast("Perfil do utilizador atualizado!", "success");
        setModalEdicaoAberto(false);
        setUsuarioSelecionado(null);
        carregarDados();
      }
    } catch (err: any) {
      showToast(err.message || "Erro ao atualizar perfil.", "error");
    }
  };

  const abrirHistorico = async (usuario: Usuario) => {
    try {
      setCarregandoHistorico(true);
      setModalHistoricoAberto(true);
      const res = await api.getUsuarioHistorico(usuario.id_usuario);
      if (res.success) {
        setHistoricoLeitor(res.data);
      }
    } catch (err: any) {
      showToast("Falha ao carregar histórico de leituras.", "error");
      setModalHistoricoAberto(false);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const pagarMultas = async (usuario: Usuario) => {
    if (!usuario.multas_pendentes || usuario.multas_pendentes === 0) {
      showToast("Este leitor não possui multas pendentes.", "info");
      return;
    }

    setUsuarioConfirmandoPagamento(usuario);
  };

  const abrirEdicao = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setFormEdicao({
      nome: usuario.nome,
      tipo_usuario: usuario.tipo_usuario,
      numero_identificacao: usuario.numero_identificacao,
      contacto: usuario.contacto || "",
      estado: usuario.estado,
    });
    setModalEdicaoAberto(true);
  };

  // Filtragem local
  const usuariosFiltrados = usuarios.filter((u) => {
    const texto = buscaTexto.toLowerCase();
    return (
      u.nome.toLowerCase().includes(texto) ||
      u.numero_identificacao.toLowerCase().includes(texto) ||
      (u.contacto && u.contacto.includes(texto))
    );
  });

  const totalItens = usuariosFiltrados.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina) || 1;
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(indiceInicial, indiceInicial + itensPorPagina);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight" id="usuarios-title">
            Cadastro de Leitores
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestão cadastral de Alunos e Professores, limites de empréstimos, monitoramento de multas e regularização de histórico.
          </p>
        </div>

        <button
          onClick={() => setModalUsuarioAberto(true)}
          className="px-4 py-2 bg-[#1a6bbf] hover:bg-opacity-95 text-white font-semibold rounded-lg flex items-center gap-1.5 text-sm transition shadow-sm cursor-pointer"
          id="btn-novo-usuario"
        >
          <Plus className="w-4 h-4" />
          Novo Leitor
        </button>
      </div>

      {/* Caixa de Ferramentas / Filtros */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-3xs p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Busca por Leitor */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={buscaTexto}
            onChange={(e) => setBuscaTexto(e.target.value)}
            placeholder="Nome Completo, ID numérico ou telefone..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 outline-none text-sm text-slate-700 placeholder-slate-400 focus:border-[#1a6bbf] focus:ring-1 focus:ring-[#1a6bbf] transition"
          />
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase font-mono">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Leitor</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Registro Acadêmico</th>
                <th className="px-6 py-4">Contato / Telefone</th>
                <th className="px-6 py-4">Uso Ativo</th>
                <th className="px-6 py-4">Multas</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a6bbf]"></div>
                    <p className="mt-2 text-xs text-slate-400">Carregando leitores...</p>
                  </td>
                </tr>
              ) : usuariosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum leitor encontrado sob este filtro.
                  </td>
                </tr>
              ) : (
                usuariosPaginados.map((u) => (
                  <tr key={u.id_usuario} className="hover:bg-slate-50/40 transition">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">
                      #{u.id_usuario}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 text-sm">{u.nome}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        u.tipo_usuario === "Professor" 
                          ? "bg-slate-100 text-slate-700" 
                          : "bg-blue-50 text-[#1a6bbf]"
                      }`}>
                        {u.tipo_usuario}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 font-semibold">
                      {u.numero_identificacao}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {u.contacto || "—"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {u.emprestimos_ativos} ativos
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {u.multas_pendentes && u.multas_pendentes > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-red-650 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">
                            {u.multas_pendentes.toFixed(2)} Kz
                          </span>
                          <button
                            onClick={() => pagarMultas(u)}
                            className="p-1 px-1.5 text-[10px] text-emerald-600 hover:bg-emerald-50 border border-emerald-100 rounded font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Quitar multas"
                          >
                            <CreditCard className="w-3 h-3" /> Pagar
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Isento</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        u.estado === "ativo"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                          : "bg-red-50 text-red-600 border-red-200"
                      }`}>
                        {u.estado === "ativo" ? (
                          <><UserCheck className="w-3.5 h-3.5" /> Ativo</>
                        ) : (
                          <><UserX className="w-3.5 h-3.5" /> Suspenso</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2.5">
                        <button
                          onClick={() => abrirHistorico(u)}
                          className="p-1 px-2 text-xs text-[#1a6bbf] hover:bg-blue-50 hover:border-[#1a6bbf] border border-slate-200 rounded-md font-semibold transition flex items-center gap-1 cursor-pointer"
                          title="Ver histórico de leituras"
                        >
                          <History className="w-3.5 h-3.5" /> Histórico
                        </button>
                        <button
                          onClick={() => abrirEdicao(u)}
                          className="p-1 px-2 text-xs text-slate-500 hover:bg-slate-100 border border-slate-200 rounded-md font-semibold transition flex items-center gap-1 cursor-pointer"
                          title="Editar cadastro"
                        >
                          <Edit className="w-3.5 h-3.5" /> Editar
                        </button>
                      </div>
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
            Exibindo {totalItens > 0 ? indiceInicial + 1 : 0} a {Math.min(indiceInicial + itensPorPagina, totalItens)} de {totalItens} leitores
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

      {/* MODAL: CRIAR LEITOR */}
      {modalUsuarioAberto && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-scale-up">
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <Users className="w-5 h-5 text-[#1a6bbf]" /> Novo Leitor
              </h3>
              <button 
                onClick={() => setModalUsuarioAberto(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmeterUsuario} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formUsuario.nome}
                  onChange={(e) => setFormUsuario({ ...formUsuario, nome: e.target.value })}
                  placeholder="Ex: João da Silva Santos"
                  className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 placeholder-slate-400 focus:border-[#1a6bbf] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Tipo de Leitor</label>
                  <select
                    value={formUsuario.tipo_usuario}
                    onChange={(e) => setFormUsuario({ ...formUsuario, tipo_usuario: e.target.value as any })}
                    className="w-full text-sm border border-slate-200 px-2 py-2 rounded-lg outline-none text-slate-800 bg-white focus:border-[#1a6bbf]"
                  >
                    <option value="Aluno">Aluno (Padrão)</option>
                    <option value="Professor">Professor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Matrícula / ID *</label>
                  <input
                    type="text"
                    required
                    value={formUsuario.numero_identificacao}
                    onChange={(e) => setFormUsuario({ ...formUsuario, numero_identificacao: e.target.value })}
                    placeholder="Ex: ALU2512"
                    className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 placeholder-slate-400 focus:border-[#1a6bbf] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Contato (Telefone / Email)</label>
                <input
                  type="text"
                  value={formUsuario.contacto}
                  onChange={(e) => setFormUsuario({ ...formUsuario, contacto: e.target.value })}
                  placeholder="Ex: +351 912 345 678"
                  className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 placeholder-slate-400 focus:border-[#1a6bbf] transition"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setModalUsuarioAberto(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 font-semibold text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a6bbf] hover:bg-opacity-95 text-white font-semibold rounded-lg text-sm transition shadow-xs"
                >
                  Salvar Leitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR LEITOR */}
      {modalEdicaoAberto && usuarioSelecionado && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-scale-up">
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <Edit className="w-5 h-5 text-[#1a6bbf]" /> Editar Leitor #{usuarioSelecionado.id_usuario}
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formEdicao.nome}
                  onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })}
                  className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 focus:border-[#1a6bbf] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Tipo de Leitor</label>
                  <select
                    value={formEdicao.tipo_usuario}
                    onChange={(e) => setFormEdicao({ ...formEdicao, tipo_usuario: e.target.value as any })}
                    className="w-full text-sm border border-slate-200 px-2 py-2 rounded-lg outline-none text-slate-800 bg-white focus:border-[#1a6bbf]"
                  >
                    <option value="Aluno">Aluno</option>
                    <option value="Professor">Professor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Matrícula / ID *</label>
                  <input
                    type="text"
                    required
                    value={formEdicao.numero_identificacao}
                    onChange={(e) => setFormEdicao({ ...formEdicao, numero_identificacao: e.target.value })}
                    className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 focus:border-[#1a6bbf] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Contato</label>
                  <input
                    type="text"
                    value={formEdicao.contacto}
                    onChange={(e) => setFormEdicao({ ...formEdicao, contacto: e.target.value })}
                    className="w-full text-sm border border-slate-200 px-3.5 py-2 rounded-lg outline-none text-slate-800 focus:border-[#1a6bbf] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Estado</label>
                  <select
                    value={formEdicao.estado}
                    onChange={(e) => setFormEdicao({ ...formEdicao, estado: e.target.value as any })}
                    className="w-full text-sm border border-slate-200 px-2 py-2 rounded-lg outline-none text-slate-800 bg-white focus:border-[#1a6bbf]"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="suspenso">Suspenso</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => {
                    setModalEdicaoAberto(false);
                    setUsuarioSelecionado(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 font-semibold text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a6bbf] hover:bg-opacity-95 text-white font-semibold rounded-lg text-sm transition shadow-xs"
                >
                  Salvar Perfis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HISTÓRICO DE EMPRÉSTIMOS DE UM LEITOR */}
      {modalHistoricoAberto && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh] animate-scale-up">
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <History className="w-5 h-5 text-[#1a6bbf]" /> Histórico de Leituras
              </h3>
              <button 
                onClick={() => {
                  setModalHistoricoAberto(false);
                  setHistoricoLeitor(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              {carregandoHistorico ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a6bbf]"></div>
                  <p className="mt-3 text-xs text-slate-400 font-semibold">Consultando fichas históricas...</p>
                </div>
              ) : !historicoLeitor ? (
                <p className="text-center py-8 text-slate-500">Nenhum registro histórico.</p>
              ) : (
                <>
                  <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Leitor Selecionado</p>
                      <h4 className="text-md font-bold text-slate-850 font-sans">{historicoLeitor.usuario.nome}</h4>
                    </div>
                    <span className="text-xs bg-blue-100 text-[#1a6bbf] font-bold px-2.5 py-1 rounded-full font-mono">
                      {historicoLeitor.historico.length} Operações
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-lg">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase font-mono border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-2.5">Data Saída</th>
                          <th className="px-4 py-2.5">Livro</th>
                          <th className="px-4 py-2.5">Data Prevista</th>
                          <th className="px-4 py-2.5">Data Devolvido</th>
                          <th className="px-4 py-2.5">Estado / Multa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
                        {historicoLeitor.historico.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                              Sem registros de empréstimos neste cadastro.
                            </td>
                          </tr>
                        ) : (
                          historicoLeitor.historico.map((h) => (
                            <tr key={h.id_emprestimo} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-mono font-semibold text-slate-500">
                                {h.data_emprestimo}
                              </td>
                              <td className="px-4 py-3 max-w-[180px] break-words whitespace-normal leading-snug font-medium text-slate-700">
                                {h.titulo_livro}
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-500">
                                {h.data_prev_devolucao}
                              </td>
                              <td className="px-4 py-3 font-mono">
                                {h.data_devolucao ? (
                                  <span className="text-slate-600 font-semibold">{h.data_devolucao}</span>
                                ) : (
                                  <span className="text-[#1a6bbf] font-bold">Em Aberto</span>
                                )}
                              </td>
                              <td className="px-4 py-3 space-y-1">
                                <div>
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    h.estado === "devolvido" 
                                      ? "bg-green-50 text-green-700 border border-green-200" 
                                      : h.estado === "atrasado"
                                        ? "bg-red-50 text-red-600 border border-red-200"
                                        : "bg-blue-50 text-blue-700 border border-blue-200"
                                  }`}>
                                    {h.estado}
                                  </span>
                                </div>
                                {h.valor_multa && h.valor_multa > 0 && (
                                  <p className="font-semibold text-[10px] text-red-500 font-mono">
                                    Multa: {h.valor_multa.toFixed(2)} Kz ({h.multa_pagamento})
                                  </p>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setModalHistoricoAberto(false);
                    setHistoricoLeitor(null);
                  }}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition text-right cursor-pointer"
                >
                  Fechar Histórico
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE PAGAMENTO DE MULTA */}
      {usuarioConfirmandoPagamento && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col animate-scale-up">
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 font-sans text-sm">
                <CreditCard className="w-4 h-4 text-[#1a6bbf]" /> Pagar Multa Pendente
              </h3>
              <button 
                onClick={() => setUsuarioConfirmandoPagamento(null)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="text-xs text-slate-500 leading-relaxed">
                Tem a certeza de que deseja registrar o pagamento de <b className="text-[#1a6bbf]">{usuarioConfirmandoPagamento.multas_pendentes.toFixed(2)} Kz</b> para o seguinte leitor?
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-150 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Nome:</span>
                  <span className="font-bold text-slate-800">{usuarioConfirmandoPagamento.nome}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Registro:</span>
                  <span className="font-mono text-slate-700">{usuarioConfirmandoPagamento.numero_identificacao}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/50 pt-2 font-mono">
                  <span className="text-red-500 font-bold uppercase text-[10px]">Multa Pendente:</span>
                  <span className="text-sm font-extrabold text-[#1a6bbf]">
                    {usuarioConfirmandoPagamento.multas_pendentes.toFixed(2)} Kz
                  </span>
                </div>
              </div>
              
              <p className="text-[10px] text-slate-400 leading-snug">
                * O leitor voltará ao estado <b>Ativo</b> automaticamente, desde que todas as obras estejam devidamente devolvidas sem atrasos ativos.
              </p>
              
              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  disabled={executandoPagamento}
                  onClick={() => setUsuarioConfirmandoPagamento(null)}
                  className="flex-1 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={executandoPagamento}
                  onClick={async () => {
                    try {
                      setExecutandoPagamento(true);
                      const res = await api.pagarMultasUsuario(usuarioConfirmandoPagamento.id_usuario);
                      if (res.success) {
                        showToast("Todas as multas foram pagas e o leitor está regularizado!", "success");
                        setUsuarioConfirmandoPagamento(null);
                        // Recarregar os dados para atualizar as multas e o estado
                        carregarDados();
                      } else {
                        showToast(res.message || "Erro no processamento da transação.", "error");
                      }
                    } catch (err: any) {
                      showToast("Erro ao quitar multas ordinárias.", "error");
                    } finally {
                      setExecutandoPagamento(false);
                    }
                  }}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition flex justify-center items-center gap-1 cursor-pointer"
                >
                  {executandoPagamento ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : "Confirmar Recebimento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
