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
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface UserMetrics {
  user: { name: string; email: string; role: string };
  metrics: {
    totalContacts: number;
    totalEmails: number;
    totalCalls: number;
    uniqueLeadsContacted: number;
    totalVisits: number;
  };
  analyticalTable: {
    leadId: string;
    leadName: string;
    funnel: string;
    status: string;
    timesContacted: number;
    funnelChanges: number;
    statusChanges: number;
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
        const meResponse = await fetch("http://localhost:3000/auth/me", {
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
      const url = `http://localhost:3000/auth/users/${targetId}/metrics?startDate=${apiStartDate}&endDate=${apiEndDate}&visitMode=${visitMode}`;
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

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

              <div className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 size={24} className="text-primary" />
                  <h3 className="text-xl font-bold">
                    Relatório Analítico de Leads
                  </h3>
                </div>

                <div className="rounded-md border border-border bg-card overflow-x-auto shadow-sm flex flex-col h-[500px]">
                  <ScrollArea className="h-full">
                    <table className="w-full text-sm text-left whitespace-nowrap min-w-max">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border sticky top-0 backdrop-blur-sm z-10">
                        <tr>
                          <th className="px-6 py-4 font-medium w-[300px] max-w-[300px]">
                            Nome do Lead
                          </th>
                          <th className="px-6 py-4 font-medium">
                            Etapa do Funil
                          </th>
                          <th className="px-6 py-4 font-medium">
                            Status / Etiqueta
                          </th>
                          <th className="px-6 py-4 text-center font-medium">
                            Vezes Contactado
                          </th>
                          <th className="px-6 py-4 text-center font-medium">
                            Mudanças de Funil
                          </th>
                          <th className="px-6 py-4 text-center font-medium">
                            Mudanças de Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {data.analyticalTable.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-8 text-center text-muted-foreground"
                            >
                              Nenhum histórico encontrado para este período.
                            </td>
                          </tr>
                        ) : (
                          data.analyticalTable.map((row) => (
                            <tr
                              key={row.leadId}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="px-6 py-4 font-semibold text-foreground max-w-[300px] truncate">
                                {row.leadName}
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="outline">
                                  {reverseStageMap[row.funnel] || row.funnel}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <Badge
                                  variant="secondary"
                                  className="uppercase text-[10px]"
                                >
                                  {row.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-center font-medium">
                                {row.timesContacted}
                              </td>
                              <td className="px-6 py-4 text-center text-muted-foreground">
                                {row.funnelChanges}
                              </td>
                              <td className="px-6 py-4 text-center text-muted-foreground">
                                {row.statusChanges}
                              </td>
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
