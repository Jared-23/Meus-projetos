import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Emprestimo } from "../types";
import { 
  ArrowDownCircle, 
  Search, 
  BookOpen, 
  User, 
  Clock, 
  ChevronRight, 
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  Gift,
  DollarSign
} from "lucide-react";

interface DevolucoesViewProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function DevolucoesView({ showToast }: DevolucoesViewProps) {
  const [emprestimosAtivos, setEmprestimosAtivos] = useState<Emprestimo[]>([]);
  const [buscaTexto, setBuscaTexto] = useState("");
  const [loading, setLoading] = useState(true);

  // Selecionado para Devolução Individual
  const [emprestimoSelecionado, setEmprestimoSelecionado] = useState<Emprestimo | null>(null);
  const [realizandoDevolucao, setRealizandoDevolucao] = useState(false);

  const carregarDados = async () => {
    try {
      setLoading(true);
      // Obter apenas os empréstimos ativos para agilizar devolução rápida
      const res = await api.getEmprestimos();
      if (res.success) {
        const ativos = res.data.filter((item) => item.estado === "ativo" || item.estado === "atrasado");
        setEmprestimosAtivos(ativos);
      }
    } catch (err: any) {
      console.error(err);
      showToast("Não foi possível carregar os empréstimos ativos.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleDevolucao = async (idEmprestimo: number) => {
    try {
      setRealizandoDevolucao(true);
      const res = await api.registrarDevolucao(idEmprestimo);
      
      if (res.success) {
        showToast(res.message || "Devolução registrada e exemplar retornado à estante!", "success");
        setEmprestimoSelecionado(null);
        carregarDados();
      } else {
        showToast(res.message || "Falha ao registrar devolução.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Erro no processamento da transação.", "error");
    } finally {
      setRealizandoDevolucao(false);
    }
  };

  // Filtragem conforme a caixa de busca (por ID do empréstimo, nome do usuário, ou título do livro)
  const itensFiltrados = emprestimosAtivos.filter((item) => {
    const texto = buscaTexto.toLowerCase();
    const idStr = String(item.id_emprestimo);
    const usuarioStr = item.nome_usuario?.toLowerCase() || "";
    const livroStr = item.titulo_livro?.toLowerCase() || "";
    const numUsr = item.num_usuario?.toLowerCase() || "";

    return (
      idStr.includes(texto) ||
      usuarioStr.includes(texto) ||
      livroStr.includes(texto) ||
      numUsr.includes(texto)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight" id="devolucoes-title">
          Guia de Devoluções
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Busca rápida de saídas ativas, triagem automática de multas por atraso civil e reincorporação de exemplares ao acervo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Esquerdo: Busca e Lista de Empréstimos */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-3xs p-6 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <h3 className="text-md font-bold text-slate-700 font-sans flex items-center gap-2">
              <Search className="w-5 h-5 text-[#1a6bbf]" /> Localizar Saídas Ativas
            </h3>
            
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                placeholder="ID Saída, Leitor ou Título..."
                className="w-full pl-8.5 pr-3 py-1.5 rounded-lg border border-slate-200 outline-none text-xs text-slate-700 placeholder-slate-400 focus:border-[#1a6bbf] transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-50 rounded-lg">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase font-mono border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Livro</th>
                  <th className="px-4 py-3">Leitor</th>
                  <th className="px-4 py-3">Data Limite</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#1a6bbf]"></div>
                    </td>
                  </tr>
                ) : itensFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                      {buscaTexto 
                        ? "Nenhum empréstimo ativo corresponde aos termos de busca." 
                        : "Não existem livros fora das estantes neste momento. Todos os exemplares estão disponíveis!"}
                    </td>
                  </tr>
                ) : (
                  itensFiltrados.map((item) => (
                    <tr key={item.id_emprestimo} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-400">
                        #{item.id_emprestimo}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-[150px] truncate">
                        {item.titulo_livro}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {item.nome_usuario}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-550">
                        {item.data_prev_devolucao}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          item.estado === "atrasado"
                            ? "bg-red-50 text-red-650 border-red-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {item.estado === "atrasado" ? "EXPIRADO" : "EM DIA"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setEmprestimoSelecionado(item)}
                          className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-[#1a6bbf] hover:text-white border border-slate-200 hover:border-transparent font-bold rounded text-slate-650 transition cursor-pointer"
                        >
                          Selecionar <ChevronRight className="inline w-3 h-3 ml-0.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Painel Direito: Confirmação e Detalhes da Devolução */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-3xs p-6 space-y-4 min-h-[300px] flex flex-col justify-between">
            <div>
              <h3 className="text-md font-bold text-slate-700 font-sans flex items-center gap-1.5">
                <ArrowDownCircle className="w-5 h-5 text-[#1a6bbf]" /> Checklist de Entrada
              </h3>

              {!emprestimoSelecionado ? (
                <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <HelpCircle className="w-12 h-12 text-slate-350" />
                  <p className="text-xs font-medium max-w-[200px]">
                    Selecione um empréstimo na tabela ao lado para processar a devolução.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4 animate-scale-up">
                  {/* Detalhes do Empréstimo Selecionado */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-2.5">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ficha de Circulação #{emprestimoSelecionado.id_emprestimo}</p>
                    
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 block">Obra</span>
                      <p className="text-sm font-bold text-slate-800 leading-snug flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /> {emprestimoSelecionado.titulo_livro}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 block">Leitor Responsável</span>
                      <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" /> {emprestimoSelecionado.nome_usuario} ({emprestimoSelecionado.num_usuario})
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2 text-xs">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block">Data Retirada</span>
                        <p className="font-semibold text-slate-650">{emprestimoSelecionado.data_emprestimo}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block">Prazo Entrega</span>
                        <p className="font-semibold text-slate-650">{emprestimoSelecionado.data_prev_devolucao}</p>
                      </div>
                    </div>
                  </div>

                  {/* Verificação Preventiva de Multa */}
                  {(() => {
                    const dataPrev = new Date(emprestimoSelecionado.data_prev_devolucao);
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    dataPrev.setHours(0, 0, 0, 0);

                    const diffTime = hoje.getTime() - dataPrev.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays > 0) {
                      const multaEstimada = diffDays * 1000;
                      return (
                        <div className="bg-red-50 text-red-650 p-4 border border-red-150 rounded-lg space-y-2">
                          <p className="text-xs font-black flex items-center gap-1 uppercase tracking-wider font-mono">
                            <AlertTriangle className="w-4 h-4 text-red-650 animate-pulse" /> Atenção: Devolução Atrasada
                          </p>
                          <p className="text-xs leading-relaxed font-medium">
                            O leitor ultrapassou a data em <b className="text-[#1a6bbf] underline font-mono">{diffDays} dias</b>.
                          </p>
                          <div className="flex justify-between items-center bg-white/75 p-2 rounded border border-red-200/50">
                            <span className="text-[10px] font-mono font-bold text-red-500 upper-case">Multa Gerada:</span>
                            <span className="text-sm font-black font-mono text-red-650">{multaEstimada.toFixed(2)} Kz</span>
                          </div>
                          <p className="text-[9px] text-red-600 font-semibold leading-normal">
                            Ao confirmar, o leitor será automaticamente SUSPENSO de empréstimos futuros até a quitação.
                          </p>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-emerald-50 text-emerald-700/90 p-4 rounded-lg font-medium text-xs leading-snug flex items-center gap-2 border border-emerald-150">
                          <Gift className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <span>Esta devolução está completamente dentro do prazo civil! Sem sanções financeiras.</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>

            {emprestimoSelecionado && (
              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setEmprestimoSelecionado(null)}
                  className="flex-1 py-2 text-slate-500 hover:bg-slate-50 border border-slate-200 font-semibold rounded-lg text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDevolucao(emprestimoSelecionado.id_emprestimo)}
                  disabled={realizandoDevolucao}
                  className="flex-1 py-2 bg-[#1a6bbf] hover:bg-opacity-95 text-white font-bold rounded-lg text-xs transition flex justify-center items-center gap-1 cursor-pointer"
                >
                  {realizandoDevolucao ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : "Confirmar Entrada"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
