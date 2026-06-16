import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Operador } from "../types";
import { 
  ShieldAlert, 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  X, 
  Phone,
  UserCheck,
  UserX,
  Lock,
  BookOpen
} from "lucide-react";

interface OperadoresViewProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  activeOperatorId: number | null;
}

export default function OperadoresView({ showToast, activeOperatorId }: OperadoresViewProps) {
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscaTexto, setBuscaTexto] = useState("");

  // Modais de controle
  const [modalOperadorAberto, setModalOperadorAberto] = useState(false);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);

  // Form de Criar Operador
  const [formOperador, setFormOperador] = useState({
    nome: "",
    username: "",
    cargo: "Bibliotecario" as "Administrador" | "Bibliotecario",
    contacto: "",
  });

  // Form de Editar Operador
  const [operadorSelecionado, setOperadorSelecionado] = useState<Operador | null>(null);
  const [formEdicao, setFormEdicao] = useState({
    nome: "",
    username: "",
    cargo: "Bibliotecario" as "Administrador" | "Bibliotecario",
    contacto: "",
    estado: "ativo" as "ativo" | "suspenso",
    senha: "",
  });

  const carregarDados = async () => {
    try {
      setLoading(true);
      const res = await api.getOperadores();
      if (res.success) {
        setOperadores(res.data);
      }
    } catch (err: any) {
      console.error(err);
      showToast("Falha ao carregar operadores do sistema.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleSubmeterOperador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOperador.nome || !formOperador.username) {
      showToast("Nome Completo e Username são requeridos para o registro.", "error");
      return;
    }

    try {
      const res = await api.criarOperador({
        nome: formOperador.nome,
        username: formOperador.username.trim().toLowerCase(),
        cargo: formOperador.cargo,
        contacto: formOperador.contacto || null,
      });

      if (res.success) {
        showToast("Novo operador registrado com sucesso!", "success");
        setFormOperador({ nome: "", username: "", cargo: "Bibliotecario", contacto: "" });
        setModalOperadorAberto(false);
        carregarDados();
      }
    } catch (err: any) {
      showToast(err.message || "Erro ao registrar novo operador.", "error");
    }
  };

  const handleSubmeterEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operadorSelecionado) return;

    if (!formEdicao.nome || !formEdicao.username) {
      showToast("Nome Completo e Username não podem ficar vazios.", "error");
      return;
    }

    try {
      const res = await api.atualizarOperador(operadorSelecionado.id_operador, {
        nome: formEdicao.nome,
        username: formEdicao.username.trim().toLowerCase(),
        cargo: formEdicao.cargo,
        contacto: formEdicao.contacto || null,
        estado: formEdicao.estado,
        senha: formEdicao.senha || "1234",
      });

      if (res.success) {
        showToast("Cadastro do operador atualizado com sucesso!", "success");
        setModalEdicaoAberto(false);
        setOperadorSelecionado(null);
        carregarDados();

        // Se o próprio operador ativo se suspender ou mudar o cargo dele, informamos
        if (operadorSelecionado.id_operador === activeOperatorId) {
          showToast("Atenção: Você realizou alterações em sua própria conta ativa.", "info");
        }
      }
    } catch (err: any) {
      showToast(err.message || "Erro ao atualizar dados do operador.", "error");
    }
  };

  const abrirModalEdicao = (operador: Operador) => {
    setOperadorSelecionado(operador);
    setFormEdicao({
      nome: operador.nome,
      username: operador.username,
      cargo: operador.cargo,
      contacto: operador.contacto || "",
      estado: operador.estado,
      senha: operador.senha || "1234",
    });
    setModalEdicaoAberto(true);
  };

  const handleApagarOperador = async (id: number, username: string) => {
    if (username === "admin") {
      showToast("Por motivos de segurança, o Administrador Geral original não pode ser removido.", "error");
      return;
    }

    if (id === activeOperatorId) {
      showToast("Você não pode apagar o seu próprio operador enquanto estiver logado nele.", "error");
      return;
    }

    if (window.confirm(`Tem certeza de que deseja remover permanentemente o operador '${username}' do sistema BiblioGest?`)) {
      try {
        const res = await api.deletarOperador(id);
        if (res.success) {
          showToast("Operador desvinculado com sucesso!", "success");
          carregarDados();
        }
      } catch (err: any) {
        showToast(err.message || "Erro ao excluir o operador de sistema.", "error");
      }
    }
  };

  // Filtragem local
  const operadoresFiltrados = operadores.filter((op) => {
    const texto = buscaTexto.toLowerCase();
    return (
      op.nome.toLowerCase().includes(texto) ||
      op.username.toLowerCase().includes(texto) ||
      (op.contacto && op.contacto.includes(texto))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho de Contexto */}
      <div className="bg-gradient-to-r from-[#1a6bbf] to-blue-750 p-6 rounded-2xl shadow-sm text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-300" />
            <h2 className="text-xl font-bold tracking-tight">Painel de Operadores</h2>
          </div>
          <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
            Área restrita a Administradores. Controle as credenciais das Bibliotecárias e demais parceiros autorizados a operar os empréstimos, devoluções e relatórios do BiblioGest.
          </p>
        </div>
        <button
          onClick={() => setModalOperadorAberto(true)}
          className="bg-white text-[#1a6bbf] hover:bg-blue-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          Registrar Operador
        </button>
      </div>

      {/* Informativo Técnico de Integração */}
      <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl text-slate-700 flex items-start gap-3.5">
        <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-900 leading-tight">Diferenciação de Hierarquia no BiblioGest</h4>
          <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
            <strong>Administradores</strong> têm acesso completo, incluindo este painel para registrar e mudar cargos. 
            <strong className="ml-1">Bibliotecárias/os</strong> operam o acervo e registram empréstimos na totalidade, porém não visualizam nem modificam as contas de outros operadores do sistema.
          </p>
        </div>
      </div>

      {/* Caixa de Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Pesquisar por nome, username ou contacto..."
            value={buscaTexto}
            onChange={(e) => setBuscaTexto(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-[#1a6bbf] focus:border-[#1a6bbf] transition-all bg-slate-50/50"
          />
        </div>
        <div className="text-[11px] font-mono font-semibold text-slate-400 hidden sm:block">
          Mostrando {operadoresFiltrados.length} operador(es)
        </div>
      </div>

      {/* Grade / Tabela de Dados */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs font-semibold text-slate-500">
            Carregando operadores de sistema...
          </div>
        ) : operadoresFiltrados.length === 0 ? (
          <div className="py-12 text-center text-xs font-medium text-slate-400 flex flex-col items-center gap-2">
            <UserX className="w-10 h-10 text-slate-300" />
            Nenhum operador de sistema encontrado para esta pesquisa.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Nome Completo</th>
                  <th className="px-6 py-4">Username de Acesso</th>
                  <th className="px-6 py-4">Nível de Acesso (Cargo)</th>
                  <th className="px-6 py-4">Contacto direto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs font-medium text-[#2d3748]">
                {operadoresFiltrados.map((op) => {
                  const isAdmin = op.cargo === "Administrador";
                  const isSuspended = op.estado === "suspenso";
                  const isLoggedNow = op.id_operador === activeOperatorId;

                  return (
                    <tr 
                      key={op.id_operador} 
                      className={`hover:bg-slate-50/50 transition-colors ${isLoggedNow ? "bg-blue-50/20" : ""}`}
                    >
                      <td className="px-6 py-4 font-bold text-slate-950">
                        <div className="flex items-center gap-2.5">
                          <div>
                            <p>{op.nome}</p>
                            {isLoggedNow && (
                              <span className="text-[9px] font-mono bg-blue-150 text-blue-800 font-bold px-1.5 py-0.2 rounded mt-0.5 inline-block">
                                Você está logado nisto
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[#1a6bbf] bg-slate-50/20">
                        @{op.username}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          isAdmin 
                            ? "bg-violet-50 text-violet-700 border border-violet-150" 
                            : "bg-blue-50 text-blue-700 border border-blue-150"
                        }`}>
                          {op.cargo}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">
                        {op.contacto ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {op.contacto}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-sans italic">Não registrado</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center w-fit gap-1 ${
                          isSuspended 
                            ? "bg-red-50 text-red-700 border border-red-150" 
                            : "bg-emerald-50 text-emerald-700 border border-emerald-150"
                        }`}>
                          {isSuspended ? (
                            <>
                              <UserX className="w-3 h-3" /> Suspenso
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" /> Ativo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-slate-500">
                          <button
                            onClick={() => abrirModalEdicao(op)}
                            title="Editar cadastro"
                            className="p-1 px-2.5 rounded-lg border border-slate-200 hover:border-[#1a6bbf] hover:bg-blue-50 hover:text-[#1a6bbf] transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">Editar</span>
                          </button>
                          
                          <button
                            onClick={() => handleApagarOperador(op.id_operador, op.username)}
                            disabled={op.username === "admin" || isLoggedNow}
                            title={op.username === "admin" ? "Sistemas protegidos" : "Remover Operador"}
                            className={`p-1 px-2 text-red-650 rounded-lg border transition ${
                              op.username === "admin" || isLoggedNow
                                ? "opacity-30 cursor-not-allowed border-slate-100 text-slate-400"
                                : "border-slate-200 hover:border-red-650 hover:bg-red-50 cursor-pointer"
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: CRIAR NOVO OPERADOR */}
      {modalOperadorAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Novo Operador</h3>
                <p className="text-[10px] text-slate-400">Atribuir acesso ao BiblioGest.</p>
              </div>
              <button
                onClick={() => setModalOperadorAberto(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmeterOperador} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formOperador.nome}
                  onChange={(e) => setFormOperador({ ...formOperador, nome: e.target.value })}
                  placeholder="Ex: Maria das Dores Fernandes"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Username de Acesso (Sem espaços)</label>
                <input
                  type="text"
                  required
                  value={formOperador.username}
                  onChange={(e) => setFormOperador({ ...formOperador, username: e.target.value.replace(/\s+/g, "") })}
                  placeholder="Ex: mariaf"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Cargo / Nível de Acesso</label>
                <select
                  value={formOperador.cargo}
                  onChange={(e) => setFormOperador({ ...formOperador, cargo: e.target.value as "Administrador" | "Bibliotecario" })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="Bibliotecario">Bibliotecário/a (Acesso Operacional de Acervo)</option>
                  <option value="Administrador">Administrador/a (Acesso Total + Gestão de Contas)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Contacto telefónico (Opcional)</label>
                <input
                  type="text"
                  value={formOperador.contacto}
                  onChange={(e) => setFormOperador({ ...formOperador, contacto: e.target.value })}
                  placeholder="Ex: +244 912 000 000"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOperadorAberto(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl text-xs font-bold shadow-3xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#1a6bbf] hover:bg-blue-750 text-white py-2.5 rounded-xl text-xs font-bold shadow-3xs cursor-pointer"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR OPERADOR EXISTENTE */}
      {modalEdicaoAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Editar Operador</h3>
                <p className="text-[10px] text-slate-400">Modificar credenciais ou gerir suspensões.</p>
              </div>
              <button
                onClick={() => {
                  setModalEdicaoAberto(false);
                  setOperadorSelecionado(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmeterEdicao} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formEdicao.nome}
                  onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })}
                  placeholder="Ex: Maria das Dores Fernandes"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Username de Acesso (Sem espaços)</label>
                <input
                  type="text"
                  required
                  disabled={operadorSelecionado?.username === "admin"}
                  value={formEdicao.username}
                  onChange={(e) => setFormEdicao({ ...formEdicao, username: e.target.value.replace(/\s+/g, "") })}
                  placeholder="Ex: mariaf"
                  className={`w-full px-3.5 py-2 border rounded-lg text-xs font-mono ${
                    operadorSelecionado?.username === "admin" 
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                      : "border-slate-200"
                  }`}
                />
                {operadorSelecionado?.username === "admin" && (
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">O utilizador principal @admin de segurança não pode mudar o username.</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Cargo / Nível de Acesso</label>
                <select
                  value={formEdicao.cargo}
                  disabled={operadorSelecionado?.username === "admin"}
                  onChange={(e) => setFormEdicao({ ...formEdicao, cargo: e.target.value as "Administrador" | "Bibliotecario" })}
                  className={`w-full px-3.5 py-2 border rounded-lg text-xs bg-white ${
                    operadorSelecionado?.username === "admin" 
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                      : "border-slate-200"
                  }`}
                >
                  <option value="Bibliotecario">Bibliotecário/a (Acesso Operacional de Acervo)</option>
                  <option value="Administrador">Administrador/a (Acesso Total + Gestão de Contas)</option>
                </select>
                {operadorSelecionado?.username === "admin" && (
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">O administrador geral deve sempre manter o nível 'Administrador'.</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Contacto telefónico (Opcional)</label>
                <input
                  type="text"
                  value={formEdicao.contacto}
                  onChange={(e) => setFormEdicao({ ...formEdicao, contacto: e.target.value })}
                  placeholder="Ex: +244 912 000 000"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Senha de Acesso do Operador</label>
                <input
                  type="text"
                  required
                  value={formEdicao.senha}
                  onChange={(e) => setFormEdicao({ ...formEdicao, senha: e.target.value })}
                  placeholder="Senha de Acesso (Ex: 1234)"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Estado do Cadastro</label>
                <select
                  value={formEdicao.estado}
                  disabled={operadorSelecionado?.id_operador === activeOperatorId}
                  onChange={(e) => setFormEdicao({ ...formEdicao, estado: e.target.value as "ativo" | "suspenso" })}
                  className={`w-full px-3.5 py-2 border rounded-lg text-xs bg-white ${
                    operadorSelecionado?.id_operador === activeOperatorId
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "border-slate-200"
                  }`}
                >
                  <option value="ativo">Ativo (Acesso Liberado)</option>
                  <option value="suspenso">Suspenso (Acesso Bloqueado imediatamente)</option>
                </select>
                {operadorSelecionado?.id_operador === activeOperatorId && (
                  <p className="text-[10px] text-[#1a6bbf] mt-1 font-semibold">Segurança: Você não pode suspender a si mesmo enquanto estiver operando.</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalEdicaoAberto(false);
                    setOperadorSelecionado(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl text-xs font-bold shadow-3xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#1a6bbf] hover:bg-blue-750 text-white py-2.5 rounded-xl text-xs font-bold shadow-3xs cursor-pointer"
                >
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
