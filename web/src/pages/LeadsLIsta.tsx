import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Moon,
  Sun,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowLeft,
  Filter,
  Phone,
  Building2,
  Mail,
  MapPin,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";

import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface ApiLead {
  id: string;
  companyName: string;
  cnpj: string | null;
  cnae: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  funnelStage:
    | "NOVO"
    | "CONTATO"
    | "NEGOCIACAO"
    | "CADASTRO"
    | "FINALIZADO"
    | "SEM_INTERESSE";
  tags: string[];
}

// --- FUNÇÕES DE MÁSCARA ---
const maskCNPJ = (value: string) => {
  value = value.replace(/\D/g, "");
  if (value.length > 14) value = value.slice(0, 14);
  if (value.length > 2) value = `${value.slice(0, 2)}.${value.slice(2)}`;
  if (value.length > 6) value = `${value.slice(0, 6)}.${value.slice(6)}`;
  if (value.length > 10) value = `${value.slice(0, 10)}/${value.slice(10)}`;
  if (value.length > 15) value = `${value.slice(0, 15)}-${value.slice(15)}`;
  return value;
};

const maskPhone = (value: string) => {
  value = value.replace(/\D/g, "");
  if (value.length > 11) value = value.slice(0, 11);
  if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
  if (value.length > 9) value = `${value.slice(0, 10)}-${value.slice(10)}`;
  return value;
};

const maskCNAE = (value: string) => {
  value = value.replace(/\D/g, "");
  if (value.length > 7) value = value.slice(0, 7);
  if (value.length > 4) value = `${value.slice(0, 4)}-${value.slice(4)}`;
  if (value.length > 6) value = `${value.slice(0, 6)}/${value.slice(6)}`;
  return value;
};

const ALL_TAGS = [
  "novo",
  "a qualificar",
  "sem resposta",
  "respondido",
  "frio",
  "morno",
  "quente",
  "promessa",
  "parcial",
  "completa",
  "aprovado",
  "recusado",
  "sem interesse",
  "fora de perfil",
];

const allowedTagsByStage: Record<string, string[]> = {
  NOVO: ["novo"],
  CONTATO: ["a qualificar", "sem resposta", "respondido"],
  NEGOCIACAO: ["frio", "morno", "quente"],
  CADASTRO: ["promessa", "parcial", "completa"],
  FINALIZADO: ["aprovado", "recusado"],
  SEM_INTERESSE: ["sem interesse"],
  FORA_DE_PERFIL: ["fora de perfil"],
};

export function LeadsList() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Estados de Dados e Paginação
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Estados de Filtro
  const [searchInput, setSearchInput] = useState(""); // O que o usuário digita
  const [activeSearch, setActiveSearch] = useState(""); // A busca que foi enviada pro backend
  const [filterStage, setFilterStage] = useState("ALL");
  const [filterTag, setFilterTag] = useState("ALL");

  //filtro por listas

  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [importedBatches, setImportedBatches] = useState<
    { id: string; tag: string }[]
  >([]);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<ApiLead | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importTag, setImportTag] = useState("");

  // Estado do Formulário
  const [formData, setFormData] = useState({
    companyName: "",
    cnpj: "",
    cnae: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    address: "",
    funnelStage: "NOVO",
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      // Adicionando os parâmetros de paginação e filtro na URL
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50", // Quantidade de leads por página
        search: activeSearch,
        stage: filterStage,
      });

      if (filterTag != "ALL") {
        queryParams.append("tag", filterTag);
      }

      //parametros do outro filtro
      if (selectedBatchId === "manual") {
        queryParams.append("isManual", "true");
      } else if (selectedBatchId !== "all") {
        queryParams.append("importBatchId", selectedBatchId);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/leads?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }

      const data = await response.json();

      // Atualizando os estados com o novo formato de resposta do backend
      if (data.leads) {
        setLeads(data.leads);
        setTotalPages(data.totalPages || 1);
        setTotalLeads(data.totalCount || 0);
      } else {
        // Fallback caso o backend ainda retorne um Array direto (durante a transição)
        setLeads(data.length ? data : []);
      }
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
    } finally {
      setLoading(false);
    }
  }, [
    navigate,
    currentPage,
    activeSearch,
    filterStage,
    selectedBatchId,
    filterTag,
  ]);

  // Recarrega os leads sempre que a página, a busca ativa ou o estágio mudarem
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reseta a página para 1 sempre que trocar o filtro de estágio
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStage, activeSearch, selectedBatchId, filterTag]);

  // buscar listas pro filtro
  useEffect(() => {
    async function fetchBatches() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/import-batches`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setImportedBatches(data);
        }
      } catch (error) {
        console.error("Erro ao carregar lista: ", error);
      }
    }

    fetchBatches();
  }, []);

  function handleSearchSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setActiveSearch(searchInput);
  }

  // --- DELETAR LEAD (DELETE) ---
  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este lead permanentemente?"))
      return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/leads/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchLeads(); // Recarrega a página atual para manter a paginação correta
      } else {
        alert("Erro ao excluir lead");
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  }

  async function handleLocalChange(
    leadId: string,
    field: keyof ApiLead,
    value: any,
  ) {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, [field]: value } : lead,
      ),
    );
  }

  async function handleSaveCell(leadId: string, field: string, value: any) {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/leads/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lead_id: leadId, [field]: value }),
      });
    } catch (error) {
      console.error("Erro ao salvar celula: ", error);
    }
  }

  async function handleSave() {
    const token = localStorage.getItem("token");

    const isEditing = !!editingLead;
    const url = isEditing
      ? `${import.meta.env.VITE_API_URL}/auth/leads/update`
      : `${import.meta.env.VITE_API_URL}/auth/leads`;

    const method = isEditing ? "PUT" : "POST";

    const body = isEditing
      ? { lead_id: editingLead.id, ...formData }
      : { ...formData, tags: ["novo"] };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchLeads();
      } else {
        alert("Erro ao salvar lead");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  }

  async function handleImport() {
    if (!selectedFile) return;

    if (!importTag.trim()) {
      alert("Por favor, digite um nome para a lista");
      return;
    }

    setIsImporting(true);
    const token = localStorage.getItem("token");

    const formDataPayload = new FormData();
    formDataPayload.append("file", selectedFile);
    formDataPayload.append("tag", importTag);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/leads/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataPayload,
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Sucesso! ${result.imported} leads foram importados.`);
        setIsImportModalOpen(false);
        setSelectedFile(null);
        setImportTag("");
        setCurrentPage(1); // Volta para a primeira página após importar
        fetchLeads();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Erro na importação.");
      }
    } catch (error) {
      console.error("Erro ao importar:", error);
      alert("Erro de conexão com o servidor.");
    } finally {
      setIsImporting(false);
    }
  }

  async function handleExport() {
    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        page: "1",
        limit: "9999",
        search: activeSearch,
        stage: filterStage,
      });

      if (selectedBatchId === "manual") {
        queryParams.append("isManual", "true");
      } else if (selectedBatchId !== "all") {
        queryParams.append("importBatchId", selectedBatchId);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/leads?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      const leadsToExport = data.leads || [];

      if (leadsToExport.length === 0) {
        alert("Nao ha dados para exportar com os filtros atuais");
        return;
      }

      const headers = [
        "Razão Social",
        "CNPJ",
        // "CNAE",
        "Telefone",
        "Email",
        "Cidade",
        "UF",
        "Endereço",
        "Etapa",
        "Etiqueta",
      ];

      const csvRows = leadsToExport.map((l: ApiLead) =>
        [
          `"${l.companyName || ""}"`,
          `"${l.cnpj || ""}"`,
          // `"${l.cnae || ""}"`,
          `"${l.phone || ""}"`,
          `"${l.email || ""}"`,
          `"${l.city || ""}"`,
          `"${l.state || ""}"`,
          `"${l.address || ""}"`,
          `"${l.funnelStage || ""}"`,
          `"${(l.tags && l.tags[0]) || ""}"`,
        ].join(","),
      );

      const csvContent = "\uFEFF" + [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `export_leads_${filterStage.toLowerCase()}_${new Date().toLocaleDateString()}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao exportar: ", error);
      alert("Falha ao gerar exportação");
    } finally {
      setLoading(false);
    }
  }

  // --- FUNÇÕES AUXILIARES DO MODAL ---
  function openNewModal() {
    setEditingLead(null);
    setFormData({
      companyName: "",
      cnpj: "",
      cnae: "",
      phone: "",
      email: "",
      city: "",
      state: "",
      address: "",
      funnelStage: "NOVO",
    });
    setIsModalOpen(true);
  }

  function openEditModal(lead: ApiLead) {
    setEditingLead(lead);
    setFormData({
      companyName: lead.companyName,
      cnpj: lead.cnpj || "",
      cnae: lead.cnae || "",
      phone: lead.phone || "",
      email: lead.email || "",
      city: lead.city || "",
      state: lead.state || "",
      address: lead.address || "",
      funnelStage: lead.funnelStage,
    });
    setIsModalOpen(true);
  }

  return (
    <div className="h-screen w-full flex bg-background text-foreground transition-colors duration-300 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="w-full p-6 border-b border-border flex justify-between items-center bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft size={16} /> Voltar ao DashBoard
            </Button>
            <h1 className="text-xl font-bold tracking-tight border-l border-border pl-4">
              Lista de Leads
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
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/");
              }}
            >
              <LogOut size={16} className="mr-2" />
              Sair
            </Button>
          </div>
        </header>

        {/* CONTEÚDO */}
        <main className="flex-1 p-8 overflow-hidden flex flex-col bg-background/50">
          {/* BARRA DE FERRAMENTAS */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex gap-2 w-full md:w-auto flex-1">
              <form
                onSubmit={handleSearchSubmit}
                className="relative w-full md:w-96 flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar empresa, CNPJ ou telefone..."
                    className="pl-8 bg-card border-border"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Buscar
                </Button>
              </form>

              <div className="relative w-full md:w-56">
                <Filter className="absolute left-2 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                <Select value={filterStage} onValueChange={setFilterStage}>
                  <SelectTrigger className="pl-9 h-10 w-full bg-card border-border">
                    <SelectValue placeholder="Filtrar por etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as Etapas</SelectItem>
                    <SelectItem value="NOVO">Novos</SelectItem>
                    <SelectItem value="CONTATO">Contato</SelectItem>
                    <SelectItem value="NEGOCIACAO">Negociação</SelectItem>
                    <SelectItem value="CADASTRO">Cadastro</SelectItem>
                    <SelectItem value="FINALIZADO">Finalizados</SelectItem>
                    <SelectItem value="SEM_INTERESSE">Sem Interesse</SelectItem>
                    <SelectItem value="FORA_DE_PERFIL">
                      Fora de Perfil
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative w-full md:w-56">
                <Filter className="absolute left-2 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="pl-9 h-10 w-full bg-card border-border uppercase text-xs">
                    <SelectValue placeholder="Filtrar por etiqueta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">TODAS AS ETIQUETAS</SelectItem>
                    {ALL_TAGS.map((tag) => (
                      <SelectItem
                        key={tag}
                        value={tag}
                        className="uppercase text-xs"
                      >
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative w-full md:w-56">
                <Filter className="absolute left-2 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                <select
                  className="flex h-10 w-56 rounded-md border border-input bg-background px-8 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                >
                  <option value="all">Todas as Listas</option>
                  <option value="manual">Sem Listas</option>
                  {importedBatches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.tag}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              {/* Modais omitidos para brevidade (MANTENHA OS SEUS AQUI) */}
              <Button
                variant="outline"
                className="gap-2 border-green-600 text-green-600 hover:bg-green-600/1"
                onClick={handleExport}
                disabled={loading || leads.length === 0}
              >
                <FileText size={18} /> Exportar CSV
              </Button>
              <Dialog
                open={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 border-primary text-primary hover:bg-primary/10"
                  >
                    <FileText size={18} /> Importar Planilha
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileText className="text-primary" /> Importar Leads via
                      CSV
                    </DialogTitle>
                  </DialogHeader>

                  <div className="grid gap-4 py-6">
                    <div className="grid gap-2 mb-2">
                      <Label htmlFor="tagNome">Origem da lista *</Label>
                      <Input
                        id="tagNome"
                        placeholder="Ex: FCG, Receita..."
                        value={importTag}
                        onChange={(e) => setImportTag(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 bg-muted/30 gap-3">
                      <FileText size={40} className="text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium">
                          Arraste ou selecione seu arquivo
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Formato aceito: .csv, .xlsx (UTF-8)
                        </p>
                      </div>
                      <Input
                        type="file"
                        accept=".csv, .xlsx, .xls"
                        className="cursor-pointer"
                        onChange={(e) =>
                          setSelectedFile(e.target.files?.[0] || null)
                        }
                      />
                      {selectedFile && (
                        <p className="text-xs text-blue-500 font-semibold">
                          Selecionado: {selectedFile.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsImportModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={!selectedFile || isImporting}
                      className="gap-2"
                    >
                      {isImporting ? "Processando..." : "Começar Importação"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={openNewModal}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap shadow-sm"
                  >
                    <Plus size={18} /> Novo Lead
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {editingLead ? <Pencil size={18} /> : <Plus size={18} />}
                      {editingLead ? "Editar Lead" : "Criar Novo Lead"}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Razão Social *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          className="pl-8"
                          placeholder="Nome da Empresa"
                          value={formData.companyName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              companyName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <div className="relative">
                          <FileText className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="cnpj"
                            className="pl-8"
                            placeholder="00.000.000/0000-00"
                            value={formData.cnpj}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                cnpj: maskCNPJ(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cnae">CNAE</Label>
                        <Input
                          id="cnae"
                          placeholder="Ex: 6204-0/00"
                          value={formData.cnae}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cnae: maskCNAE(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Telefone / WhatsApp</Label>
                        <div className="relative">
                          <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            className="pl-8"
                            placeholder="(XX) 99999-9999"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: maskPhone(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            className="pl-8"
                            placeholder="contato@empresa.com"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          placeholder="Sua Cidade"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="state">UF</Label>
                        <Input
                          id="state"
                          placeholder="EX: SP"
                          maxLength={2}
                          value={formData.state}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              state: e.target.value.toUpperCase(),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-2 border-b border-border pb-4">
                      <Label htmlFor="address">Endereço</Label>
                      <div className="relative">
                        <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="address"
                          className="pl-8"
                          placeholder="Rua, Número, Bairro"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>Salvar Lead</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* TABELA DE DADOS */}
          <div className="rounded-t-md border border-border bg-card overflow-x-auto flex-1 shadow-sm">
            <ScrollArea className="h-full">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border sticky top-0 backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-4 py-3 font-medium">Razão Social</th>
                    <th className="px-4 py-3 font-medium">CNPJ</th>
                    <th className="px-4 py-3 font-medium">Telefone</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Cidade</th>
                    <th className="px-4 py-3 font-medium">UF</th>
                    <th className="px-4 py-3 font-medium">Endereço</th>
                    <th className="px-4 py-3 font-medium">Etapa</th>
                    <th className="px-4 py-3 font-medium">Etiqueta</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-6 py-8 text-center text-muted-foreground"
                      >
                        Carregando leads...
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-6 py-8 text-center text-muted-foreground"
                      >
                        Nenhum lead encontrado.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-mted/20 transition-colors group"
                      >
                        <td className="px-1 py-1">
                          <Input
                            value={lead.companyName || ""}
                            onChange={(e) =>
                              handleLocalChange(
                                lead.id,
                                "companyName",
                                e.target.value,
                              )
                            }
                            onFocus={(e) => {
                              e.target.dataset.original = e.target.value;
                            }}
                            onBlur={(e) => {
                              if (
                                e.target.value !== e.target.dataset.original
                              ) {
                                handleSaveCell(
                                  lead.id,
                                  "companyName",
                                  e.target.value,
                                );
                              }
                            }}
                            className="h-8 min-w-[180px] border-transparent bg-transparent hover:bg-muted/50 focus:bg-background focus:border-primary focus:ring-1 shadow-none px-2 font-semibold text-foreground transition-all"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            value={lead.cnpj || ""}
                            onChange={(e) =>
                              handleLocalChange(
                                lead.id,
                                "cnpj",
                                maskCNPJ(e.target.value),
                              )
                            }
                            onFocus={(e) => {
                              e.target.dataset.original = e.target.value;
                            }}
                            onBlur={(e) => {
                              if (
                                e.target.value !== e.target.dataset.original
                              ) {
                                handleSaveCell(lead.id, "cnpj", e.target.value);
                              }
                            }}
                            className="h-8 min-w-[140px] border-transparent bg-transparent hover:bg-muted/50 focus:bg-background focus:border-primary focus:ring-1 shadow-none px-2 text-muted-foreground transition-all"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            value={lead.phone || ""}
                            onChange={(e) =>
                              handleLocalChange(
                                lead.id,
                                "phone",
                                maskPhone(e.target.value),
                              )
                            }
                            onFocus={(e) => {
                              e.target.dataset.original = e.target.value;
                            }}
                            onBlur={(e) => {
                              if (
                                e.target.value !== e.target.dataset.original
                              ) {
                                handleSaveCell(
                                  lead.id,
                                  "phone",
                                  e.target.value,
                                );
                              }
                            }}
                            className="h-8 min-w-[140px] border-transparent bg-transparent hover:bg-muted/50 focus:bg-background focus:border-primary focus:ring-1 shadow-none px-2 text-muted-foreground transition-all"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            value={lead.email || ""}
                            onChange={(e) =>
                              handleLocalChange(
                                lead.id,
                                "email",
                                e.target.value,
                              )
                            }
                            onFocus={(e) => {
                              e.target.dataset.original = e.target.value;
                            }}
                            onBlur={(e) => {
                              if (
                                e.target.value !== e.target.dataset.original
                              ) {
                                handleSaveCell(
                                  lead.id,
                                  "email",
                                  e.target.value,
                                );
                              }
                            }}
                            className="h-8 min-w-[180px] border-transparent bg-transparent hover:bg-muted/50 focus:bg-background focus:border-primary focus:ring-1 shadow-none px-2 text-muted-foreground transition-all"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            value={lead.city || ""}
                            onChange={(e) =>
                              handleLocalChange(lead.id, "city", e.target.value)
                            }
                            onFocus={(e) => {
                              e.target.dataset.original = e.target.value;
                            }}
                            onBlur={(e) => {
                              if (
                                e.target.value !== e.target.dataset.original
                              ) {
                                handleSaveCell(lead.id, "city", e.target.value);
                              }
                            }}
                            className="h-8 min-w-[120px] border-transparent bg-transparent hover:bg-muted/50 focus:bg-background focus:border-primary focus:ring-1 shadow-none px-2 text-muted-foreground transition-all"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            value={lead.state || ""}
                            maxLength={2}
                            onChange={(e) =>
                              handleLocalChange(
                                lead.id,
                                "state",
                                e.target.value.toUpperCase(),
                              )
                            }
                            onFocus={(e) => {
                              e.target.dataset.original = e.target.value;
                            }}
                            onBlur={(e) => {
                              if (
                                e.target.value !== e.target.dataset.original
                              ) {
                                handleSaveCell(
                                  lead.id,
                                  "state",
                                  e.target.value,
                                );
                              }
                            }}
                            className="h-8 min-w-[60px] border-transparent bg-transparent hover:bg-muted/50 focus:bg-background focus:border-primary focus:ring-1 shadow-none px-2 text-muted-foreground transition-all text-center"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            value={lead.address || ""}
                            onChange={(e) =>
                              handleLocalChange(
                                lead.id,
                                "address",
                                e.target.value,
                              )
                            }
                            onFocus={(e) => {
                              e.target.dataset.original = e.target.value;
                            }}
                            onBlur={(e) => {
                              if (
                                e.target.value !== e.target.dataset.original
                              ) {
                                handleSaveCell(
                                  lead.id,
                                  "address",
                                  e.target.value,
                                );
                              }
                            }}
                            className="h-8 min-w-[200px] border-transparent bg-transparent hover:bg-muted/50 focus:bg-background focus:border-primary focus:ring-1 shadow-none px-2 text-muted-foreground transition-all"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Select
                            value={lead.funnelStage}
                            onValueChange={(val) => {
                              handleLocalChange(lead.id, "funnelStage", val);
                              handleSaveCell(lead.id, "funnelStage", val);
                            }}
                          >
                            <SelectTrigger className="h-8 border-transparent bg-transparent hover:bg-muted/50 focus:ring-1 shadow-none px-2 w-[140px] text-xs font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NOVO">NOVO</SelectItem>
                              <SelectItem value="CONTATO">CONTATO</SelectItem>
                              <SelectItem value="NEGOCIACAO">
                                NEGOCIAÇÃO
                              </SelectItem>
                              <SelectItem value="CADASTRO">CADASTRO</SelectItem>
                              <SelectItem value="FINALIZADO">
                                FINALIZADO
                              </SelectItem>
                              <SelectItem value="SEM_INTERESSE">
                                SEM INTERESSE
                              </SelectItem>
                              <SelectItem value="FORA_DE_PERFIL">
                                FORA DE PERFIL
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        <td className="px-2 py-1">
                          <Select
                            value={lead.tags?.[0] || ""}
                            onValueChange={(val) => {
                              handleLocalChange(lead.id, "tags", [val]);
                              handleSaveCell(lead.id, "tags", [val]);
                            }}
                          >
                            <SelectTrigger className="h-8 border-transparent bg-transparent hover:bg-muted/50 focus:ring-1 shadow-none px-2 w-[140px] text-xs font-semibold uppercase">
                              <SelectValue placeholder="SEM ETIQUETA" />
                            </SelectTrigger>
                            <SelectContent>
                              {(allowedTagsByStage[lead.funnelStage] || []).map(
                                (tag) => (
                                  <SelectItem
                                    key={tag}
                                    value={tag}
                                    className="uppercase text-xs font-medium"
                                  >
                                    {tag}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </td>

                        <td className="px-2 py-1 flex justify-end gap-1 items-center h-[40px]">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => openEditModal(lead)}
                            title="Abrir Modal Completo"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40"
                            onClick={() => handleDelete(lead.id)}
                            title="Excluir lead"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </div>

          {/* CONTROLES DE PAGINAÇÃO */}
          <div className="flex items-center justify-between px-4 py-3 border border-t-0 border-border bg-card rounded-b-md shadow-sm">
            <div className="text-sm text-muted-foreground">
              Mostrando página{" "}
              <span className="font-medium text-foreground">{currentPage}</span>{" "}
              de{" "}
              <span className="font-medium text-foreground">{totalPages}</span>{" "}
              ({totalLeads} leads totails)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="gap-1"
              >
                <ChevronLeft size={16} /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage >= totalPages || loading}
                className="gap-1"
              >
                Próxima <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
