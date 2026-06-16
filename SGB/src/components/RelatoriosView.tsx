import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Multa, Emprestimo } from "../types";
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  BookOpen, 
  Users,
  Award,
  Clock,
  ChevronRight,
  Filter,
  Grid
} from "lucide-react";

interface RelatoriosViewProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function RelatoriosView({ showToast }: RelatoriosViewProps) {
  const [ranking, setRanking] = useState<any[]>([]);
  const [multasDetalhadas, setMultasDetalhadas] = useState<Multa[]>([]);
  const [historicoMensal, setHistoricoMensal] = useState<Emprestimo[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros de Relatório
  const [periodoFiltro, setPeriodoFiltro] = useState("2026-06"); // Mês corrente padrão do sistema
  const [relatorioAtivo, setRelatorioAtivo] = useState<"ranking" | "atrasos" | "periodico">("ranking");

  const carregarRelatorios = async () => {
    try {
      setLoading(true);
      if (relatorioAtivo === "ranking") {
        const rankingRes = await api.getMaisEmprestados();
        if (rankingRes.success) setRanking(rankingRes.data);
      } else if (relatorioAtivo === "atrasos") {
        const atrasosRes = await api.getRelatorioAtrasos();
        if (atrasosRes.success) setMultasDetalhadas(atrasosRes.data);
      } else if (relatorioAtivo === "periodico") {
        const histRes = await api.getHistoricoMensal(periodoFiltro);
        if (histRes.success) setHistoricoMensal(histRes.data);
      }
    } catch (err: any) {
      console.error(err);
      showToast("Não foi possível carregar as planilhas estatísticas.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarRelatorios();
  }, [relatorioAtivo, periodoFiltro]);

  // Máximo em empréstimo para cálculo de barra relativa de popularidade
  const maxEmprestimos = ranking.length > 0 ? Math.max(...ranking.map((l) => l.total_emprestimos)) : 10;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight" id="relatorios-title">
          Mapas Estatísticos & Auditoria
        </h2>
        <p className="text-sm text-slate-500 mt-1 font-sans">
          Analise volumes de leitura por período, acompanhe auditorias financeiras de multas e identifique títulos de maior interesse.
        </p>
      </div>

      {/* Menu Interno de Relatórios */}
      <div className="flex border-b border-slate-200 gap-1.5 overflow-x-auto pb-px">
        <button
          onClick={() => setRelatorioAtivo("ranking")}
          className={`px-5 py-3 text-xs font-bold font-mono tracking-wider uppercase border-b-2 transition ${
            relatorioAtivo === "ranking"
              ? "border-[#1a6bbf] text-[#1a6bbf]"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          } cursor-pointer`}
        >
          🏆 Livros Mais Emprestados
        </button>

        <button
          onClick={() => setRelatorioAtivo("atrasos")}
          className={`px-5 py-3 text-xs font-bold font-mono tracking-wider uppercase border-b-2 transition ${
            relatorioAtivo === "atrasos"
              ? "border-red-600 text-red-650"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          } cursor-pointer`}
        >
          ⚠️ Auditoria de Atrasos e Multas
        </button>

        <button
          onClick={() => setRelatorioAtivo("periodico")}
          className={`px-5 py-3 text-xs font-bold font-mono tracking-wider uppercase border-b-2 transition ${
            relatorioAtivo === "periodico"
              ? "border-indigo-600 text-indigo-750"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          } cursor-pointer`}
        >
          📅 Circulação Por Período Mensal
        </button>
      </div>

      {/* Exibição Condicional dos Relatórios */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-100 shadow-xs">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a6bbf]"></div>
          <p className="mt-3 text-xs text-slate-400 font-semibold font-mono">Processando planilhas no SQLite...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6">
          
          {/* TAB 1: RANKING LINGÜÍSTICO LITERÁRIO */}
          {relatorioAtivo === "ranking" && (
            <div className="space-y-6">
              <div className="mb-4">
                <h3 className="text-md font-bold text-slate-700 flex items-center gap-1.5 leading-snug">
                  <TrendingUp className="w-5 h-5 text-[#1a6bbf]" /> Top 10 Obras Mais Populares
                </h3>
                <p className="text-xs text-slate-450 mt-1">Ranking extraído a partir do volume acumulado de empréstimos efetivados no sistema.</p>
              </div>

              {ranking.length === 0 ? (
                <p className="text-center py-12 text-slate-400 italic">Não existem empréstimos registrados para classificar.</p>
              ) : (
                <div className="space-y-4">
                  {ranking.map((book, index) => {
                    const ratioWidth = (book.total_emprestimos / maxEmprestimos) * 100;
                    return (
                      <div key={book.id_livro} className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-lg border border-slate-100 shadow-3xs hover:bg-slate-50 transition">
                        {/* Posição no Medalhista */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0 ${
                          index === 0 ? "bg-amber-400 shadow-xs" : index === 1 ? "bg-slate-400" : index === 2 ? "bg-orange-400" : "bg-slate-300"
                        }`}>
                          {index + 1}
                        </div>

                        {/* Detalhes do Livro */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-800 font-sans truncate pr-4">{book.titulo} / <span className="font-semibold text-slate-500 font-mono text-xs">{book.autor}</span></h4>
                            <span className="text-xs text-slate-500 font-bold bg-white px-2.5 py-0.5 rounded-full border border-slate-150 flex items-center gap-1 flex-shrink-0">
                              <BookOpen className="w-3 h-3 text-[#1a6bbf]" /> {book.total_emprestimos} leituras
                            </span>
                          </div>
                          
                          {/* Barra de Popularidade SVG/CSS base */}
                          <div className="mt-2.5 flex items-center gap-3">
                            <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#1a6bbf] h-full rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${ratioWidth}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-mono text-[#1a6bbf] font-extrabold">{ratioWidth.toFixed(0)}% de impacto</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUDITORIA DE MULTAS E ATRASADOS */}
          {relatorioAtivo === "atrasos" && (
            <div className="space-y-6">
              <div className="mb-4">
                <h3 className="text-md font-bold text-slate-700 flex items-center gap-1.5 leading-snug">
                  <AlertTriangle className="w-5 h-5 text-red-650" /> Detalhamento de Multas Pendentes
                </h3>
                <p className="text-xs text-slate-450 mt-1">
                  Visão analítica de leitores sob penalidades ativas, tempos de expiração e montantes residuais devidos.
                </p>
              </div>

              {multasDetalhadas.length === 0 ? (
                <div className="text-center py-12 text-emerald-600 font-medium bg-emerald-50 rounded-xl space-y-1">
                  <Award className="w-10 h-10 mx-auto text-emerald-500 animate-bounce" />
                  <p className="font-bold">Nenhuma infração pendente encontrada!</p>
                  <p className="text-xs text-emerald-500 font-semibold uppercase">Parabéns aos leitores. Orçamento limpo.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-lg">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase font-mono border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Multa ID</th>
                        <th className="px-6 py-4">Leitor devedor</th>
                        <th className="px-6 py-4">Obra retida</th>
                        <th className="px-6 py-4 font-mono">Tempo de atraso</th>
                        <th className="px-6 py-4">Fiel vencimento</th>
                        <th className="px-6 py-4 text-right">Valor da Multa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {multasDetalhadas.map((m) => (
                        <tr key={m.id_multa} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-mono font-bold text-slate-400">
                            #{m.id_multa}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 text-sm">{m.nome_usuario}</div>
                            <div className="text-[10px] font-semibold text-slate-400 uppercase font-mono mt-0.5">{m.num_usuario}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-700 font-medium max-w-[180px] break-words whitespace-normal leading-relaxed">
                            {m.titulo_livro}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            <span className="inline-flex items-center gap-1 font-bold text-red-600 bg-red-50 text-xs px-2.5 py-0.5 rounded border border-red-100">
                              <Clock className="w-3.5 h-3.5" /> {m.dias_atraso} dias civis
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-500">
                            {m.data_prev_devolucao}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-sm font-black text-red-650">
                            {m.valor.toFixed(2)} Kz
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CIRCULAÇÃO MENSAL PERIÓDICA */}
          {relatorioAtivo === "periodico" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                  <h3 className="text-md font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-5 h-5 text-indigo-600" /> Circulação Periódica Mensal
                  </h3>
                  <p className="text-xs text-slate-450 mt-1">
                    Audite em tempo real todos os empréstimos originados em qualquer mês de referência.
                  </p>
                </div>

                {/* Filtro do período */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 font-mono uppercase">Período Fiscal:</span>
                  <input
                    type="month"
                    value={periodoFiltro}
                    onChange={(e) => setPeriodoFiltro(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 font-semibold outline-none focus:border-[#1a6bbf]"
                  />
                </div>
              </div>

              {historicoMensal.length === 0 ? (
                <p className="text-center py-12 text-slate-400 italic">
                  Nenhum registro de circulação encontrado para o período de <span className="font-bold text-slate-600">{periodoFiltro}</span>.
                </p>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-lg">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase font-mono border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Ficha Saída</th>
                        <th className="px-6 py-4">Leitor</th>
                        <th className="px-6 py-4">Tombado Livro</th>
                        <th className="px-6 py-4">Data Saída</th>
                        <th className="px-6 py-4">Prazo Devolução</th>
                        <th className="px-6 py-4">Retorno Real</th>
                        <th className="px-6 py-4">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {historicoMensal.map((h) => (
                        <tr key={h.id_emprestimo} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-mono font-bold text-slate-400">
                            #{h.id_emprestimo}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 text-sm">{h.nome_usuario}</div>
                            <div className="text-[10px] font-semibold text-slate-400 uppercase font-mono mt-0.5">{h.num_usuario}</div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-750 max-w-[150px] truncate">
                            {h.titulo_livro}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-500">
                            {h.data_emprestimo}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-500">
                            {h.data_prev_devolucao}
                          </td>
                          <td className="px-6 py-4 font-mono">
                            {h.data_devolucao ? (
                              <span className="text-emerald-700 font-bold">{h.data_devolucao}</span>
                            ) : (
                              <span className="text-red-500 font-extrabold">Ainda Retido</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              h.estado === "devolvido"
                                ? "bg-green-50 text-green-700 border-green-250"
                                : h.estado === "atrasado"
                                  ? "bg-red-50 text-red-650 border-red-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              {h.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
