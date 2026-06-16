import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Usuario, Livro, Emprestimo } from "../types";
import { 
  RefreshCw, 
  BookOpen, 
  User, 
  Calendar, 
  Plus, 
  FileText, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface EmprestimosViewProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function EmprestimosView({ showToast }: EmprestimosViewProps) {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [livrosDisponiveis, setLivrosDisponiveis] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form de Empréstimo
  const [usuarioSelecionado, setUsuarioSelecionado] = useState("");
  const [livroSelecionado, setLivroSelecionado] = useState("");
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [empRes, usrRes, lvrRes] = await Promise.all([
        api.getEmprestimos(),
        api.getUsuarios(),
        api.getLivros({ estado: "disponivel" })
      ]);

      if (empRes.success) setEmprestimos(empRes.data);
      if (usrRes.success) {
        // Apenas usuários ativos servem para empréstimo inicial rápido no select, mas mantemos todos para o admin saber
        setUsuarios(usrRes.data);
      }
      if (lvrRes.success) setLivrosDisponiveis(lvrRes.data);
    } catch (err: any) {
      console.error(err);
      showToast("Falha ao sincronizar cadastros para o módulo de empréstimo.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleRealizarEmprestimo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioSelecionado || !livroSelecionado) {
      showToast("Por favor, selecione o leitor e o livro para saída.", "error");
      return;
    }

    try {
      const res = await api.realizarEmprestimo(Number(usuarioSelecionado), Number(livroSelecionado));
      
      if (res.success) {
        showToast("Empréstimo concedido e registrado com sucesso!", "success");
        setUsuarioSelecionado("");
        setLivroSelecionado("");
        carregarDados();
      } else {
        showToast(res.message || "Não foi possível realizar empréstimo.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Erro durante validação da lógica de negócio.", "error");
    }
  };

  // Filtrar usuários para alertar se selecionado um suspenso
  const leitorAtual = usuarios.find(u => String(u.id_usuario) === usuarioSelecionado);

  const totalItens = emprestimos.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina) || 1;
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const emprestimosPaginados = emprestimos.slice(indiceInicial, indiceInicial + itensPorPagina);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight" id="emprestimos-title">
          Circulação & Saídas
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Registro de novas cessões literárias, controle de prazos por perfil e bloqueio preventivo de leitores irregulares.
        </p>
      </div>

      {/* Grid: Formulário + Estatísticas do Mestre de Circulação */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Saída de Livros */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-3xs p-6 lg:col-span-2 space-y-4">
          <h3 className="text-md font-bold text-slate-700 font-sans flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#1a6bbf]" /> Conceder Novo Empréstimo
          </h3>

          <form onSubmit={handleRealizarEmprestimo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Seleção de Leitor */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Selecionar Leitor *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <select
                    value={usuarioSelecionado}
                    required
                    onChange={(e) => setUsuarioSelecionado(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none text-slate-800 bg-white focus:border-[#1a6bbf]"
                  >
                    <option value="">Escolher Leitor...</option>
                    {usuarios.map((u) => (
                      <option key={u.id_usuario} value={u.id_usuario}>
                        {u.nome} ({u.tipo_usuario} — {u.numero_identificacao}) {u.estado === "suspenso" ? "❌ SUSPENSO" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Alerta de Leitor Suspenso */}
                {leitorAtual && leitorAtual.estado === "suspenso" && (
                  <div className="mt-2 text-xs text-red-650 bg-red-50 p-2 border border-red-100 rounded-md flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Este leitor encontra-se SUSPENSO. Operação impossível de ser efetivada.
                  </div>
                )}
              </div>

              {/* Seleção de Livro disponível */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Selecionar Livro Disponível *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <select
                    value={livroSelecionado}
                    required
                    onChange={(e) => setLivroSelecionado(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none text-slate-800 bg-white focus:border-[#1a6bbf]"
                  >
                    <option value="">Escolher Livro da Estante...</option>
                    {livrosDisponiveis.map((l) => (
                      <option key={l.id_livro} value={l.id_livro}>
                        {l.titulo} — por {l.autor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!usuarioSelecionado || !livroSelecionado || (leitorAtual && leitorAtual.estado === "suspenso")}
                className="px-5 py-2.5 bg-[#1a6bbf] hover:bg-opacity-95 text-white disabled:opacity-40 disabled:hover:bg-[#1a6bbf] font-bold rounded-lg text-sm transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-4 h-4" /> Emitir Guia de Saída
              </button>
            </div>
          </form>
        </div>

        {/* Quadro informativo de limites */}
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-6 flex flex-col justify-between space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider font-mono">Acordos de Biblioteca</h3>
          
          <div className="space-y-3 Divide-y divide-slate-200/60 text-xs">
            <div className="pb-3">
              <p className="font-bold text-[#1a6bbf] text-sm">Alunos</p>
              <ul className="list-disc pl-4 mt-1 text-slate-500 space-y-0.5">
                <li>Máximo de <span className="font-semibold text-slate-700">2 livros</span> ativos</li>
                <li>Prazo limite de devolução: <span className="font-semibold text-slate-700">7 dias</span></li>
              </ul>
            </div>
            
            <div className="pt-3 pb-2">
              <p className="font-bold text-indigo-650 text-sm">Professores</p>
              <ul className="list-disc pl-4 mt-1 text-slate-500 space-y-0.5">
                <li>Máximo de <span className="font-semibold text-slate-700">5 livros</span> ativos</li>
                <li>Prazo limite de devolução: <span className="font-semibold text-slate-700">15 dias</span></li>
              </ul>
            </div>
          </div>

          <div className="bg-[#1a6bbf] p-3 text-white rounded-lg border border-blue-700/20 text-[11px] leading-relaxed font-medium shadow-2xs">
            As multas correntes por atraso custam exatos <span className="text-amber-300 font-bold">1000.00 Kz por dia corrido</span>, cumulativas, geradas no momento da entrada em atraso.
          </div>
        </div>
      </div>

      {/* Tabela de Saídas Ativas & Histórico Geral de Circulação */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-md font-bold text-slate-700 font-sans flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1a6bbf]" /> Histórico Estatístico de Empréstimos
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase font-mono border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Ficha Saída</th>
                <th className="px-6 py-4">Livro Tombo</th>
                <th className="px-6 py-4">Utilizador / Código</th>
                <th className="px-6 py-4">Empréstimo em</th>
                <th className="px-6 py-4">Prazo Devolução</th>
                <th className="px-6 py-4">Retorno Real</th>
                <th className="px-6 py-4">Multa Residual</th>
                <th className="px-6 py-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a6bbf]"></div>
                    <p className="mt-2 text-xs text-slate-400">Varrendo fichas de circulação...</p>
                  </td>
                </tr>
              ) : emprestimosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum empréstimo registrado no banco.
                  </td>
                </tr>
              ) : (
                emprestimosPaginados.map((item) => (
                  <tr key={item.id_emprestimo} className="hover:bg-slate-50/40 transition">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">
                      #{item.id_emprestimo}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 text-sm max-w-[200px] truncate" title={item.titulo_livro}>
                        {item.titulo_livro}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 text-xs">{item.nome_usuario}</div>
                      <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase mt-0.5">{item.num_usuario}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {item.data_emprestimo}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {item.data_prev_devolucao}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {item.data_devolucao ? (
                        <span className="text-emerald-700 font-semibold">{item.data_devolucao}</span>
                      ) : (
                        <span className="text-red-500 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {item.valor_multa && item.valor_multa > 0 ? (
                        <div className="space-y-0.5">
                          <span className="text-red-650 font-bold bg-red-50/70 border border-red-150 px-2 py-0.5 rounded">
                            {item.valor_multa.toFixed(2)} Kz
                          </span>
                          <p className="text-[9px] font-semibold text-slate-400 uppercase">{item.multa_pagamento}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Não gerada</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        item.estado === "devolvido"
                          ? "bg-green-50 text-green-700 border-green-250"
                          : item.estado === "atrasado"
                            ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {item.estado === "devolvido" ? "Devolvido" : item.estado === "atrasado" ? "Atrasado" : "Ativo"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 font-sans">
          <div className="text-xs text-slate-500 font-semibold font-mono">
            Exibindo {totalItens > 0 ? indiceInicial + 1 : 0} a {Math.min(indiceInicial + itensPorPagina, totalItens)} de {totalItens} históricos
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
    </div>
  );
}
