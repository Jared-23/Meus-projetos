import React, { useEffect, useState } from "react";
import { api } from "../api";
import { DashboardStats, Emprestimo } from "../types";
import { 
  BookOpen, 
  Users, 
  RefreshCw, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Award
} from "lucide-react";

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function DashboardView({ onNavigate, showToast }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLoans, setRecentLoans] = useState<Emprestimo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsRes = await api.getStats();
      const loansRes = await api.getEmprestimos();
      
      if (statsRes.success) setStats(statsRes.data);
      if (loansRes.success) {
        // Obter os 5 empréstimos mais recentes
        setRecentLoans(loansRes.data.slice(0, 5));
      }
    } catch (err: any) {
      console.error(err);
      showToast("Falha ao carregar métricas do painel.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a6bbf]"></div>
      </div>
    );
  }

  // Valores padrão para segurança contra nulls
  const totalLivros = stats?.total_livros || 0;
  const totalUsuarios = stats?.total_usuarios || 0;
  const empAtivos = stats?.emprestimos_ativos || 0;
  const empAtrasados = stats?.emprestimos_atrasados || 0;
  const multasPendente = stats?.multas_pendentes_valor || 0;
  const multasPagas = stats?.multas_pagas_valor || 0;
  
  // Percentual de livros atualmente emprestados
  const loanRatio = totalLivros > 0 ? (empAtivos / totalLivros) * 100 : 0;
  // Percentual de multas pagas vs totais
  const totalMultasGeradas = multasPagas + multasPendente;
  const paymentRatio = totalMultasGeradas > 0 ? (multasPagas / totalMultasGeradas) * 100 : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header do Painel */}
      <div>
        <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight" id="dashboard-title">
          Painel Geral
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Visão geral para controle administrativo, métricas de circulação e auditoria de atrasos.
        </p>
      </div>

      {/* Grid de Cards Principais - Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Livros */}
        <div 
          onClick={() => onNavigate("livros")}
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:border-[#1a6bbf] hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          id="card-total-livros"
        >
          <div className="flex justify-between items-start">
            <p className="text-slate-400 text-xs font-bold tracking-wider uppercase font-mono">Total de Livros</p>
            <BookOpen className="w-5 h-5 text-[#1a6bbf]" />
          </div>
          <div className="flex items-end justify-between mt-4">
            <h3 className="text-3xl font-bold font-sans text-slate-800 leading-none">{totalLivros}</h3>
            <span className="text-[#1a6bbf] text-[10px] font-semibold bg-blue-50 px-2 py-1 rounded">Acervo Real</span>
          </div>
        </div>

        {/* Card Usuários */}
        <div 
          onClick={() => onNavigate("utilizadores")}
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:border-[#1a6bbf] hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          id="card-total-leitores"
        >
          <div className="flex justify-between items-start">
            <p className="text-slate-400 text-xs font-bold tracking-wider uppercase font-mono">Leitores Ativos</p>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-end justify-between mt-4">
            <h3 className="text-3xl font-bold font-sans text-slate-800 leading-none">{totalUsuarios}</h3>
            <span className="text-emerald-600 text-[10px] font-semibold bg-emerald-55 px-2 py-1 rounded">Cadastrados</span>
          </div>
        </div>

        {/* Card Empréstimos Ativos */}
        <div 
          onClick={() => onNavigate("emprestimos")}
          className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-5 cursor-pointer hover:border-[#1a6bbf] hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          id="card-ativos"
        >
          <div className="flex justify-between items-start">
            <p className="text-slate-400 text-xs font-bold tracking-wider uppercase font-mono">Empréstimos Ativos</p>
            <RefreshCw className="w-5 h-5 text-indigo-600 hmr-spin-hover" />
          </div>
          <div className="flex items-end justify-between mt-4">
            <h3 className="text-3xl font-bold font-sans text-slate-800 leading-none">{empAtivos}</h3>
            <span className="text-indigo-600 text-[10px] font-semibold bg-indigo-50 px-2 py-1 rounded">Ativos</span>
          </div>
        </div>

        {/* Card Atrasos */}
        <div 
          onClick={() => onNavigate("relatorios")}
          className={`bg-white rounded-xl shadow-sm border p-5 cursor-pointer hover:shadow-md transition-all duration-300 flex flex-col justify-between ${
            empAtrasados > 0 
              ? "border-l-4 border-l-red-500 border-y-slate-100 border-r-slate-100" 
              : "border-slate-100 hover:border-[#1a6bbf]"
          }`}
          id="card-atrasados"
        >
          <div className="flex justify-between items-start">
            <p className="text-slate-400 text-xs font-bold tracking-wider uppercase font-mono">Em Atraso</p>
            <AlertTriangle className={`w-5 h-5 ${empAtrasados > 0 ? "text-red-500 animate-pulse" : "text-slate-400"}`} />
          </div>
          <div className="flex items-end justify-between mt-4">
            <h3 className={`text-3xl font-bold font-sans leading-none ${empAtrasados > 0 ? "text-red-650" : "text-slate-800"}`}>{empAtrasados}</h3>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded ${empAtrasados > 0 ? "text-red-600 bg-red-50" : "text-slate-500 bg-slate-50"}`}>
              {empAtrasados > 0 ? "Urgente" : "Regular"}
            </span>
          </div>
        </div>
      </div>

      {/* Seção Gráfica e Financeira */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 e 2 - Painel Visual */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-bold text-slate-700 font-sans flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1a6bbf]" />
              Distribuição e Uso do Acervo
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono">
              Atualizado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Gráfico SVG Radial para Taxa de Ocupação */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* SVG Circle Gauge */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    className="stroke-slate-200"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    className="stroke-[#1a6bbf] transition-all duration-1000 ease-out"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 68}
                    strokeDashoffset={2 * Math.PI * 68 * (1 - loanRatio / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-black font-sans text-slate-800">
                    {loanRatio.toFixed(1)}%
                  </span>
                  <p className="text-[10px] font-semibold text-slate-400 tracking-wider mt-0.5 uppercase">Indice Empréstimos</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium text-center mt-4 max-w-[200px]">
                {empAtivos} de {totalLivros} livros do acervo encontram-se atualmente em circulação com leitores.
              </p>
            </div>

            {/* Balanço de Multas */}
            <div className="flex flex-col justify-between space-y-5">
              <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-500 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-md">
                    <Clock className="w-3.5 h-3.5" /> Pendentes
                  </span>
                  <span className="text-lg font-bold text-slate-800 font-mono">{multasPendente.toFixed(2)} Kz</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${100 - paymentRatio}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <Award className="w-3.5 h-3.5" /> Regularizadas (Pagas)
                  </span>
                  <span className="text-lg font-bold text-slate-800 font-mono">{multasPagas.toFixed(2)} Kz</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${paymentRatio}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Taxa de Regularização Financeira:</span> {paymentRatio.toFixed(1)}% das taxas foram liquidadas.
              </div>
            </div>
          </div>
        </div>

        {/* Resumo Caixa Financeiro */}
        <div className="bg-[#1a6bbf] rounded-xl shadow-xs p-6 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
            <DollarSign className="w-64 h-64" />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-blue-100 uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-white" />
              Auditoria de Multas
            </h3>
            
            <div className="mt-4">
              <p className="text-[11px] text-blue-100">Total Acumulado Reclamado</p>
              <p className="text-4xl font-extrabold font-mono mt-1">{(totalMultasGeradas).toFixed(2)} Kz</p>
            </div>
          </div>

          <div className="bg-blue-800/40 p-4 rounded-lg border border-blue-400/20 mt-6 space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-blue-100">Em Atraso Ativo:</span>
              <span className="font-bold text-red-200">{stats?.emprestimos_atrasados} devedores</span>
            </div>
            <div className="flex justify-between border-t border-blue-400/20 pt-2 text-xs">
              <span className="text-blue-100">Regra de Multa:</span>
              <span>1000.00 Kz / Dia civil</span>
            </div>
          </div>

          <button 
            onClick={() => onNavigate("devolucoes")}
            className="mt-6 w-full py-3 bg-white hover:bg-slate-50 text-[#1a6bbf] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all duration-200"
          >
            Quitar Multas ou Devolver <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empréstimos Recentes e Atalhos rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista Empréstimos Recentes */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 lg:col-span-2 space-y-4">
          <h3 className="text-md font-bold text-slate-700 font-sans flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#1a6bbf]" /> Últimos Empréstimos Registrados
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase font-mono">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Livro</th>
                  <th className="px-4 py-3">Utilizador</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {recentLoans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                      Nenhum empréstimo cadastrado.
                    </td>
                  </tr>
                ) : (
                  recentLoans.map((loan) => (
                    <tr key={loan.id_emprestimo} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-400">
                        #{loan.id_emprestimo}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 max-w-[200px] truncate">
                        {loan.titulo_livro}
                      </td>
                      <td className="px-4 py-3 max-w-[150px] truncate">
                        {loan.nome_usuario}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {loan.data_emprestimo}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          loan.estado === "devolvido" 
                            ? "bg-green-50 text-green-700 border-green-250" 
                            : loan.estado === "atrasado" 
                              ? "bg-red-50 text-red-600 border-red-200" 
                              : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {loan.estado === "devolvido" ? "Devolvido" : loan.estado === "atrasado" ? "Atrasado" : "Ativo"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Atalhos de Operações e Instruções Rápidas */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
          <h3 className="text-md font-bold text-slate-700 font-sans flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#1a6bbf]" /> Acesso Rápido
          </h3>
          
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => onNavigate("emprestimos")}
              className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-[#1a6bbf] hover:bg-slate-50/50 flex justify-between items-center group transition"
            >
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase">Novo Empréstimo</p>
                <p className="text-[11px] text-slate-400">Validar e registrar saída</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1a6bbf] transform group-hover:translate-x-1 transition" />
            </button>

            <button 
              onClick={() => onNavigate("devolucoes")}
              className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-[#1a6bbf] hover:bg-slate-50/50 flex justify-between items-center group transition"
            >
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase">Registrar Devolução</p>
                <p className="text-[11px] text-slate-400">Quitar multas e reaver exemplar</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1a6bbf] transform group-hover:translate-x-1 transition" />
            </button>

            <button 
              onClick={() => onNavigate("livros")}
              className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-[#1a6bbf] hover:bg-slate-50/50 flex justify-between items-center group transition"
            >
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase">Verificar Acervo</p>
                <p className="text-[11px] text-slate-400">Buscar por estado ou categorias</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1a6bbf] transform group-hover:translate-x-1 transition" />
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500 space-y-2 leading-relaxed">
            <p className="font-semibold text-slate-700">Regras Importantes:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><b className="text-slate-600">Alunos:</b> Máx. de 2 livros por 7 dias.</li>
              <li><b className="text-slate-600">Professores:</b> Máx. de 5 livros por 15 dias.</li>
              <li>Leitores em atraso são suspensos preventivamente.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
