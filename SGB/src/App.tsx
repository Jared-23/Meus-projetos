import React, { useState, useEffect } from "react";
import DashboardView from "./components/DashboardView";
import LivrosView from "./components/LivrosView";
import UsuariosView from "./components/UsuariosView";
import EmprestimosView from "./components/EmprestimosView";
import DevolucoesView from "./components/DevolucoesView";
import RelatoriosView from "./components/RelatoriosView";
import OperadoresView from "./components/OperadoresView";
import { api } from "./api";
import { Operador } from "./types";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  RefreshCw, 
  ArrowDownCircle, 
  BarChart3, 
  Menu, 
  X,
  Clock,
  BookMarked,
  Info,
  CheckCircle,
  XCircle,
  ShieldAlert
} from "lucide-react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [systemTime, setSystemTime] = useState<string>("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Estado dos Operadores do Sistema (admin vs bibliotecaria)
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [activeOperator, setActiveOperator] = useState<Operador | null>(null);

  // Estado e controle para formulário de login
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  // Carregar e sincronizar utilizadores administrativos ativos
  const carregarOperadores = async () => {
    try {
      const res = await api.getOperadores();
      if (res.success && res.data.length > 0) {
        setOperadores(res.data);
        
        const salvo = localStorage.getItem("active_operator");
        const isLoggedInVal = localStorage.getItem("is_logged_in");
        if (salvo && isLoggedInVal === "true") {
          const parsed = JSON.parse(salvo) as Operador;
          // Validar se o operador salvo em cache local ainda existe e permanece ativo
          const correspondente = res.data.find(o => o.id_operador === parsed.id_operador && o.estado === "ativo");
          if (correspondente) {
            setActiveOperator(correspondente);
            return;
          }
        }
        
        // Se vazio ou inválido, define null para forçar login
        setActiveOperator(null);
      }
    } catch (error) {
      console.error("[BIBLIOTECA] Erro ao sincronizar catálogo de funcionários:", error);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      showToast("Por favor, preencha todos os campos.", "error");
      return;
    }

    try {
      setLoginLoading(true);
      const res = await api.loginOperador(loginForm.username.trim().toLowerCase(), loginForm.password);
      if (res.success) {
        setActiveOperator(res.data);
        localStorage.setItem("active_operator", JSON.stringify(res.data));
        localStorage.setItem("is_logged_in", "true");
        showToast(`Bem-vindo de volta, ${res.data.nome}!`, "success");
        setLoginForm({ username: "", password: "" });
      } else {
        showToast(res.message || "Nome de usuário ou senha inválidos.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Falha de conexão ao autenticar.", "error");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSair = () => {
    setActiveOperator(null);
    localStorage.removeItem("active_operator");
    localStorage.removeItem("is_logged_in");
    setLoginForm({ username: "", password: "" });
    showToast("Sessão finalizada com sucesso.", "success");
  };

  useEffect(() => {
    carregarOperadores();
  }, []);

  // Evento de Segurança: se o operador ativo mudar e não for Administrador,
  // mas o painel estiver na aba restrita de operador, redirecione para o dashboard
  useEffect(() => {
    if (activeOperator && activeOperator.cargo !== "Administrador" && activeTab === "operadores") {
      setActiveTab("dashboard");
      showToast("Acesso Restrito: Apenas Administradores podem gerenciar contas de operador.", "error");
    }
  }, [activeOperator, activeTab]);

  // Atualizar relógio do sistema no cabeçalho
  useEffect(() => {
    const formatTime = () => {
      const now = new Date();
      return now.toLocaleDateString("pt-PT", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };
    setSystemTime(formatTime());
    const interval = setInterval(() => setSystemTime(formatTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Motor simples de Notificações Toast
  const showToast = (message: string, type: "success" | "error" | "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "livros", label: "Livros & Acervo", icon: BookOpen },
    { id: "utilizadores", label: "Leitores", icon: Users },
    { id: "emprestimos", label: "Empréstimos", icon: RefreshCw },
    { id: "devolucoes", label: "Devoluções", icon: ArrowDownCircle },
    { id: "relatorios", label: "Estatísticas & Multas", icon: BarChart3 },
    ...(activeOperator?.cargo === "Administrador" ? [{ id: "operadores", label: "Gerir Operadores", icon: ShieldAlert }] : []),
  ];

  if (!activeOperator) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>

        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-[#1a6bbf] rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 animate-pulse">
              <BookMarked className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-none">BiblioGest</h1>
            <p className="text-xs text-slate-400 mt-4">Digite as credenciais do operador para fazer login.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Username</label>
              <input
                type="text"
                required
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="Introduza o seu nome de usuário"
                autoComplete="off"
                className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-600 px-4 py-3 rounded-xl text-xs focus:border-[#1a6bbf] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Senha</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="Introduza a sua senha"
                autoComplete="new-password"
                className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-600 px-4 py-3 rounded-xl text-xs focus:border-[#1a6bbf] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#1a6bbf] hover:bg-blue-750 disabled:opacity-50 text-white cursor-pointer transition py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2"
            >
              {loginLoading ? "Autenticando..." : "ACESSAR SISTEMA"}
            </button>
          </form>
        </div>

        {/* TOAST SYSTEM ON LOGIN SCREEN */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => {
            const isSuccess = toast.type === "success";
            const isError = toast.type === "error";
            return (
              <div
                key={toast.id}
                className={`p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-start gap-3 pointer-events-auto transition-all duration-300 transform translate-y-0 animate-slide-in ${
                  isSuccess
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : isError
                      ? "bg-red-50 text-red-800 border-red-200"
                      : "bg-[#1a6bbf] bg-opacity-[0.05] text-blue-800 border-blue-200"
                }`}
              >
                {isSuccess ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : isError ? (
                  <XCircle className="w-4 h-4 text-red-650 flex-shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-[#1a6bbf] flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">{toast.message}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] flex flex-col md:flex-row text-slate-800 font-sans">
      
      {/* SIDEBAR FIXA EM TELAS GRANDES */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 border-r border-[#155cad] bg-[#1a6bbf] shadow-xl flex flex-col justify-between transform transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        id="sidebar"
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Brand */}
          <div className="h-16 border-b border-white/10 flex items-center px-6 gap-3">
            <div className="p-2 bg-white/10 text-white rounded-lg shadow-sm border border-white/10">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-tight leading-none uppercase">BiblioGest</h1>
              <span className="text-[10px] font-mono text-blue-100/60 font-bold tracking-wider">ACERVO CULTURAL</span>
            </div>
          </div>

          {/* Perfis Rápidos de Identificação do Usuário */}
          <div className="px-4 py-4 border-b border-white/10">
            <div 
              className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/10 group transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 bg-white/15 text-white rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs uppercase border border-white/15">
                  {activeOperator ? activeOperator.nome.slice(0, 2).toUpperCase() : "OP"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {activeOperator ? activeOperator.nome : "Carregando..."}
                  </p>
                  <span className="text-[9px] font-bold font-mono text-emerald-300 uppercase leading-none block mt-1">
                    {activeOperator ? activeOperator.cargo : "Acessando..."}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSair}
                className="text-[9px] text-white hover:text-white bg-red-650 hover:bg-red-700 font-bold px-2.5 py-1 rounded-md transition-all flex-shrink-0 cursor-pointer shadow-1xs"
                title="Sair do Sistema"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="flex-1 px-3 py-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false); // Fecha o menu mobile automático
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-white/15 text-white font-semibold shadow-xs"
                      : "text-white/70 hover:bg-white/5 hover:text-white rounded-lg"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-white/60"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer da Sidebar */}
        <div className="p-4 border-t border-white/10 text-[10px] text-white/50 leading-relaxed font-semibold">
          <div>
            <p>© 2026 BiblioGest v1.0.0</p>
            <p className="font-mono text-[9px] mt-0.5 text-white/40">SQLite Active Base Engine</p>
          </div>
        </div>
      </aside>

      {/* BACKGROUND SHADOW FOR MOBILE SIDEBAR OPEN */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs z-35 md:hidden"
        ></div>
      )}

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* CABEÇALHO SUPERIOR (TOP NAVBAR) */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex justify-between items-center z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 md:hidden hover:bg-slate-50 transition cursor-pointer"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            {/* Breadcrumb Indicador */}
            <span className="text-xs font-bold font-mono text-[#1a6bbf] bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:inline-block">
              Setor / {menuItems.find(m => m.id === activeTab)?.label}
            </span>
          </div>

          {/* Relógio em tempo real */}
          <div className="flex items-center gap-2 text-slate-500 font-semibold font-mono text-[11px] sm:text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{systemTime || "Carregando o relógio do sistema..."}</span>
          </div>
        </header>

        {/* CONTEÚDO DA VIEWS ATIVA */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === "dashboard" && (
            <DashboardView onNavigate={(tab) => setActiveTab(tab)} showToast={showToast} />
          )}
          {activeTab === "livros" && (
            <LivrosView showToast={showToast} />
          )}
          {activeTab === "utilizadores" && (
            <UsuariosView showToast={showToast} />
          )}
          {activeTab === "emprestimos" && (
            <EmprestimosView showToast={showToast} />
          )}
          {activeTab === "devolucoes" && (
            <DevolucoesView showToast={showToast} />
          )}
          {activeTab === "relatorios" && (
            <RelatoriosView showToast={showToast} />
          )}
          {activeTab === "operadores" && activeOperator?.cargo === "Administrador" && (
            <OperadoresView showToast={showToast} activeOperatorId={activeOperator.id_operador} />
          )}
        </main>
      </div>



      {/* ELEMENTO FIXO: SISTEMA TOAST NOTIFICATIONS */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          return (
            <div
              key={toast.id}
              className={`p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-start gap-3 pointer-events-auto transition-all duration-300 transform translate-y-0 animate-slide-in ${
                isSuccess
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : isError
                    ? "bg-red-50 text-red-800 border-red-200"
                    : "bg-[#1a6bbf] bg-opacity-[0.05] text-blue-800 border-blue-200"
              }`}
            >
              {isSuccess ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : isError ? (
                <XCircle className="w-4 h-4 text-red-650 flex-shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-[#1a6bbf] flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{toast.message}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
