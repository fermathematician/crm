import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import {
  Moon,
  Sun,
  LogOut,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Users,
  Calendar,
  BarChart3,
  List,
  AlignLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";


import { ScrollArea, ScrollBar } from "../components/ui/scroll-area";

interface UserMetrics {
  user: { name: string; email: string; role: string };
  metrics: {
    totalContacts: number;
    totalEmails: number;
    totalCalls: number;
    totalNotes: number;
    uniqueLeadsContacted: number;
    totalVisits: number;
    totalQualifications: number;
  };
  funnelSummary?: Record<string, number>;
  statusSummary?: Record<string, number>;
  analyticalTable: {
    leadId: string;
    leadName: string;
    funnel: string;
    status: string;
    timesContacted: number;
    funnelChanges: number;
    statusChanges: number;
    qualifications: number;
  }[];
  visitsTable?: { // 👈 NOVO
    id: string;
    leadId: string;
    leadName: string;
    createdAt: string;
    visitDate: string;
    isCompleted: boolean;
  }[];
  qualificationsTable?: {
    id: string;
    leadId: string;
    leadName: string;
    logDate: string;
    createdAt: string;
    description: string;
  }[];
}

const reverseStageMap: Record<string, string> = {
  NOVO: "Novos",
  CONTATO: "Contato",
  NEGOCIACAO: "Negociação",
  CADASTRO: "Cadastro",
  FINALIZADO: "Finalizados",
  SEM_INTERESSE: "Perdidos",
};


function getTodayFormatted() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

function getOneMonthAgoFormatted() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

const maskDate = (value: string) => {
  value = value.replace(/\D/g, "");
  if (value.length > 8) value = value.slice(0, 8);
  if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
  if (value.length > 5) value = `${value.slice(0, 5)}/${value.slice(5)}`;
  return value;
};

export function UserReport() {
  const { id } = useParams<{ id: string }>();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserMetrics | null>(null);

  const [startDate, setStartDate] = useState(getOneMonthAgoFormatted());
  const [endDate, setEndDate] = useState(getTodayFormatted());
  const [visitMode, setVisitMode] = useState<"ocorrida" | "marcada">(
    "ocorrida",
  );

  const [filterStage, setFilterStage] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const filteredAnalyticalTable = (data?.analyticalTable || []).filter((row) => {
    const matchesStage = filterStage === "ALL" || row.funnel === filterStage;
    const matchesStatus = filterStatus === "ALL" || row.status === filterStatus;
    return matchesStage && matchesStatus;
  });

  // ESTADO QUE SEGURA O NOME NO CARD ATE CLICAR
  const [appliedVisitMode, setAppliedVisitMode] = useState<
    "ocorrida" | "marcada"
  >("ocorrida");

  async function fetchUserMetrics() {
    if (!startDate || !endDate || startDate.length < 10 || endDate.length < 10)
      return;

    const [sDay, sMonth, sYear] = startDate.split("/");
    const [eDay, eMonth, eYear] = endDate.split("/");
    const apiStartDate = `${sYear}-${sMonth}-${sDay}`;
    const apiEndDate = `${eYear}-${eMonth}-${eDay}`;

    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      let targetId = id;
      if (!targetId) {
        const meResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (meResponse.ok) {
          const meData = await meResponse.json();
          targetId = meData.id;
          console.log("ID do usuário logado é:", targetId);
        } else {
          console.error("Erro ao indentificar o usuario logado");
          setData(null);
          setLoading(false);
          return;
        }
      }
      const url = `${import.meta.env.VITE_API_URL}/auth/users/${targetId}/metrics?startDate=${apiStartDate}&endDate=${apiEndDate}&visitMode=${visitMode}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
        setAppliedVisitMode(visitMode); // ATUALIZA O CARD AQUI
      } else {
        console.error("Erro ao buscar métricas do usuário");
        setData(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUserMetrics();
  }, [id]);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  return (
    <div className="h-screen w-full flex bg-background text-foreground transition-colors duration-300 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="w-full p-6 border-b border-border flex justify-between items-center bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate("/reports")}
            >
              <ArrowLeft size={16} /> Voltar para Equipe
            </Button>
            <h1 className="text-xl font-bold tracking-tight border-l border-border pl-4">
              Desempenho Individual
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut size={16} className="mr-2" />
              Sair
            </Button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto bg-background/50">
          <div className="max-w-6xl mx-auto mb-8 bg-card border border-border p-4 rounded-xl flex flex-col md:flex-row gap-4 items-end shadow-sm">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">
                Data Inicial
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  value={startDate}
                  onChange={(e) => setStartDate(maskDate(e.target.value))}
                  className="bg-background pl-9"
                />
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">
                Data Final
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  value={endDate}
                  onChange={(e) => setEndDate(maskDate(e.target.value))}
                  className="bg-background pl-9"
                />
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">
                Modo de Visita
              </label>
              <Select
                value={visitMode}
                onValueChange={(val: any) => setVisitMode(val)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ocorrida">Visita Ocorrida</SelectItem>
                  <SelectItem value="marcada">Visita Marcada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={fetchUserMetrics}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6"
              disabled={startDate.length < 10 || endDate.length < 10}
            >
              <BarChart3 size={16} /> Gerar Relatório
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-muted-foreground">
              Carregando dados...
            </div>
          ) : !data ? (
            <div className="flex justify-center items-center py-20 text-muted-foreground">
              Nenhum dado encontrado para este período.
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8 pb-10">
              <div className="flex items-center gap-4 p-6 bg-card border border-border rounded-xl shadow-sm">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <User size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{data.user.name}</h2>
                  <p className="text-muted-foreground">{data.user.email}</p>
                </div>
                <Badge
                  variant={data.user.role === "ADMIN" ? "default" : "secondary"}
                  className="ml-auto text-sm"
                >
                  {data.user.role}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-center shadow-sm items-center text-center">
                  <Users className="text-blue-500 mb-2" size={24} />
                  <span className="text-3xl font-bold text-foreground">
                    {data.metrics.uniqueLeadsContacted}
                  </span>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">
                    Leads Contactados
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-center shadow-sm items-center text-center">
                  <List className="text-foreground mb-2" size={24} />
                  <span className="text-3xl font-bold text-foreground">
                    {data.metrics.totalContacts}
                  </span>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">
                    Total de Contatos
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-center shadow-sm items-center text-center">
                  <Phone className="text-green-500 mb-2" size={24} />
                  <span className="text-3xl font-bold text-foreground">
                    {data.metrics.totalCalls}
                  </span>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">
                    Nº Ligações
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-center shadow-sm items-center text-center">
                  <Mail className="text-orange-500 mb-2" size={24} />
                  <span className="text-3xl font-bold text-foreground">
                    {data.metrics.totalEmails}
                  </span>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">
                    Nº E-mails
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card flex flex-col justify-center shadow-sm items-center text-center">
                  <CheckCircle2 className="text-emerald-500 mb-2" size={24} />
                  <span className="text-2xl font-bold text-foreground">
                    {data.metrics.totalQualifications || 0}
                  </span>
                  <p className="text-[9px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">
                    Qualificações
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-center shadow-sm items-center text-center">
                  <AlignLeft className="text-amber-500 mb-2" size={24} />
                  <span className="text-3xl font-bold text-foreground">
                    {data.metrics.totalNotes}
                  </span>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">
                    Nº Observações
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-center shadow-sm items-center text-center">
                  <Calendar className="text-purple-500 mb-2" size={24} />
                  <span className="text-3xl font-bold text-foreground">
                    {data.metrics.totalVisits}
                  </span>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">
                    Visitas ({appliedVisitMode})
                  </p>
                </div>
              </div>

              {/* Resumo de Leads no Período */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resumo por Etapa do Funil */}
                <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Leads Ativos por Etapa do Funil
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.funnelSummary && Object.keys(data.funnelSummary).length > 0 ? (
                        Object.entries(data.funnelSummary).map(([stage, count]) => (
                            <Badge key={stage} variant="outline" className="text-sm py-1.5 px-3 flex items-center gap-2">
                              <span>{reverseStageMap[stage] || stage}</span>
                              <span className="font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                            {count}
                          </span>
                            </Badge>
                        ))
                    ) : (
                        <span className="text-xs text-muted-foreground">Nenhuma movimentação no período.</span>
                    )}
                  </div>
                </div>

                {/* Resumo por Status / Etiqueta */}
                <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Leads Ativos por Status / Etiqueta
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.statusSummary && Object.keys(data.statusSummary).length > 0 ? (
                        Object.entries(data.statusSummary).map(([status, count]) => (
                            <Badge key={status} variant="secondary" className="text-sm py-1.5 px-3 flex items-center gap-2 uppercase">
                              <span>{status}</span>
                              <span className="font-bold bg-foreground/10 text-foreground px-2 py-0.5 rounded-full text-xs">
                            {count}
                          </span>
                            </Badge>
                        ))
                    ) : (
                        <span className="text-xs text-muted-foreground">Nenhuma etiqueta no período.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 🚀 PLANILHÃO DE VISITAS PARA AUDITORIA/DEBUG */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar size={22} className="text-purple-500" />
                  <h3 className="text-lg font-bold">Detalhamento de Visitas no Período</h3>
                  <Badge variant="outline" className="ml-2">
                    {data.visitsTable?.length || 0} registro(s) encontrado(s)
                  </Badge>
                </div>

                <div className="rounded-md border border-border bg-card shadow-sm max-h-[300px] w-full overflow-hidden">
                  <ScrollArea className="h-full w-full">
                    <table className="w-full text-xs text-left table-fixed">
                      <thead className="text-[11px] text-muted-foreground uppercase bg-muted/50 border-b border-border sticky top-0 backdrop-blur-sm z-10">
                      <tr>
                        <th className="px-3 py-3 font-semibold w-[35%]">Lead / Empresa</th>
                        <th className="px-2 py-3 font-semibold w-[25%]">Data em que foi Marcada (createdAt)</th>
                        <th className="px-2 py-3 font-semibold w-[25%]">Data da Visita (visitDate)</th>
                        <th className="px-2 py-3 text-center font-semibold w-[15%]">Status</th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                      {!data.visitsTable || data.visitsTable.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                              Nenhuma visita encontrada para este usuário no período selecionado.
                            </td>
                          </tr>
                      ) : (
                          data.visitsTable.map((v) => (
                              <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-3 py-2.5 font-semibold text-foreground truncate" title={v.leadName}>
                                  {v.leadName}
                                </td>
                                <td className="px-2 py-2.5 text-muted-foreground">
                                  {new Date(v.createdAt).toLocaleDateString("pt-BR")} às {new Date(v.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </td>
                                <td className="px-2 py-2.5 font-medium text-foreground">
                                  {new Date(v.visitDate).toLocaleDateString("pt-BR")}
                                </td>
                                <td className="px-2 py-2.5 text-center">
                                  <Badge
                                      variant={v.isCompleted ? "default" : "secondary"}
                                      className={`text-[10px] px-2 py-0.5 ${v.isCompleted ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                                  >
                                    {v.isCompleted ? "Ocorrida" : "Pendente"}
                                  </Badge>
                                </td>
                              </tr>
                          ))
                      )}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              </div>

              {/* 🚀 PLANILHÃO DE QUALIFICAÇÕES PARA DEBUG */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={22} className="text-emerald-500" />
                  <h3 className="text-lg font-bold">Detalhamento de Qualificações no Período</h3>
                  <Badge variant="outline" className="ml-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    {data.qualificationsTable?.length || 0} qualificação(ões)
                  </Badge>
                </div>

                <div className="rounded-md border border-border bg-card shadow-sm max-h-[300px] w-full overflow-hidden">
                  <ScrollArea className="h-full w-full">
                    <table className="w-full text-xs text-left table-fixed">
                      <thead className="text-[11px] text-muted-foreground uppercase bg-muted/50 border-b border-border sticky top-0 backdrop-blur-sm z-10">
                      <tr>
                        <th className="px-3 py-3 font-semibold w-[25%]">Lead / Empresa</th>
                        <th className="px-2 py-3 font-semibold w-[20%]">Data do Log (date)</th>
                        <th className="px-2 py-3 font-semibold w-[20%]">Criado em (createdAt)</th>
                        <th className="px-3 py-3 font-semibold w-[35%]">Descrição do Histórico</th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                      {!data.qualificationsTable || data.qualificationsTable.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                              Nenhuma qualificação registrada para este usuário no período.
                            </td>
                          </tr>
                      ) : (
                          data.qualificationsTable.map((q) => (
                              <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-3 py-2.5 font-semibold text-foreground truncate" title={q.leadName}>
                                  {q.leadName}
                                </td>
                                <td className="px-2 py-2.5 font-mono text-emerald-400">
                                  {new Date(q.logDate).toISOString().split("T")[0]}
                                </td>
                                <td className="px-2 py-2.5 text-muted-foreground">
                                  {new Date(q.createdAt).toLocaleDateString("pt-BR")} às {new Date(q.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </td>
                                <td className="px-3 py-2.5 text-muted-foreground truncate" title={q.description}>
                                  {q.description}
                                </td>
                              </tr>
                          ))
                      )}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              </div>

              <div className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 size={24} className="text-primary" />
                    <h3 className="text-xl font-bold">Relatório Analítico de Leads</h3>
                  </div>

                  {/* Filtros da Tabela Analítica */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Filtro por Etapa */}
                    <Select value={filterStage} onValueChange={setFilterStage}>
                      <SelectTrigger className="w-44 bg-card">
                        <SelectValue placeholder="Todas as Etapas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todas as Etapas</SelectItem>
                        <SelectItem value="NOVO">Novos</SelectItem>
                        <SelectItem value="CONTATO">Contato</SelectItem>
                        <SelectItem value="NEGOCIACAO">Negociação</SelectItem>
                        <SelectItem value="CADASTRO">Cadastro</SelectItem>
                        <SelectItem value="FINALIZADO">Finalizados</SelectItem>
                        <SelectItem value="SEM_INTERESSE">Sem Interesse</SelectItem>
                        <SelectItem value="FORA_DE_PERFIL">Descartado</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Filtro por Status/Etiqueta */}
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-48 bg-card uppercase text-xs">
                        <SelectValue placeholder="Todas as Etiquetas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">TODAS AS ETIQUETAS</SelectItem>
                        {data?.statusSummary &&
                            Object.keys(data.statusSummary).map((tag) => (
                                <SelectItem key={tag} value={tag} className="uppercase text-xs">
                                  {tag}
                                </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tabela Analítica Compacta (Sem Scroll Lateral) */}
                <div className="rounded-md border border-border bg-card shadow-sm h-[500px] w-full overflow-hidden">
                  <ScrollArea className="h-full w-full">
                    <table className="w-full text-xs text-left table-fixed">
                      <thead className="text-[11px] text-muted-foreground uppercase bg-muted/50 border-b border-border sticky top-0 backdrop-blur-sm z-10">
                      <tr>
                        <th className="px-3 py-3 font-semibold w-[30%]">Lead</th>
                        <th className="px-2 py-3 font-semibold w-[12%]">Etapa</th>
                        <th className="px-2 py-3 font-semibold w-[14%]">Status</th>
                        <th className="px-2 py-3 text-center font-semibold w-[10%]">Contatos</th>
                        <th className="px-2 py-3 text-center font-semibold w-[11%]">Mud. Funil</th>
                        <th className="px-2 py-3 text-center font-semibold w-[11%]">Mud. Status</th>
                        <th className="px-2 py-3 text-center font-semibold w-[12%] text-emerald-500">Qualificações</th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                      {filteredAnalyticalTable.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                              Nenhum histórico encontrado com esses filtros.
                            </td>
                          </tr>
                      ) : (
                          filteredAnalyticalTable.map((row) => (
                              <tr key={row.leadId} className="hover:bg-muted/30 transition-colors">
                                <td className="px-3 py-2.5 font-semibold text-foreground truncate" title={row.leadName}>
                                  {row.leadName}
                                </td>
                                <td className="px-2 py-2.5">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 truncate max-w-full">
                                    {reverseStageMap[row.funnel] || row.funnel}
                                  </Badge>
                                </td>
                                <td className="px-2 py-2.5">
                                  <Badge variant="secondary" className="uppercase text-[9px] px-1.5 py-0.5 truncate max-w-full">
                                    {row.status}
                                  </Badge>
                                </td>
                                <td className="px-2 py-2.5 text-center font-medium">{row.timesContacted}</td>
                                <td className="px-2 py-2.5 text-center text-muted-foreground">{row.funnelChanges}</td>
                                <td className="px-2 py-2.5 text-center text-muted-foreground">{row.statusChanges}</td>
                                <td className="px-2 py-2.5 text-center font-bold text-emerald-500">{row.qualifications || 0}</td>
                              </tr>
                          ))
                      )}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
