import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";

import {
  Moon,
  Sun,
  LogOut,
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  GripVertical,
  Check,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Phone,
  Mail,
  AlignLeft,
  CalendarDays,
  History,
  MapPin,
  Building2,
  Plus,
  Pencil,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";

import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

type LeadTag =
  | "frio"
  | "morno"
  | "quente"
  | "a contactar"
  | "sem resposta"
  | "promessa"
  | "parcial"
  | "completa"
  | "aprovado"
  | "recusado"
  | "sem interesse"
  | "fora de perfil"
  | "novo";

interface ApiContact {
  id: string;
  type: "EMAIL" | "CALL" | "MEETING" | "NOTE" | "REMINDER" | "SYSTEM_CHANGE";
  date: string;
  description: string; //estava description e quebrava quando recebia um descriptionri´ption
  leadId?: string;
  userId?: string;
}

interface ApiLead {
  id: string;
  companyName: string;
  funnelStage:
    | "NOVO"
    | "CONTATO"
    | "NEGOCIACAO"
    | "CADASTRO"
    | "FINALIZADO"
    | "SEM_INTERESSE"
    | "FORA_DE_PERFIL";
  tags: string[];
  phone: string | null;
  visitDate: string | null;
  cnpj?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  cnae?: string | null;
  contacts?: ApiContact[];
}

const reverseStageMap: Record<string, string> = {
  novos: "NOVO",
  contato: "CONTATO",
  negociacao: "NEGOCIACAO",
  cadastro: "CADASTRO",
  finalizado: "FINALIZADO",
  arquivo: "SEM_INTERESSE",
  fora_de_perfil: "FORA_DE_PERFIL",
};

const tagColors: Record<LeadTag, string> = {
  novo: "bg-slate-500 border-slate-600",
  "a contactar": "bg-blue-500 border-blue-600",
  "sem resposta": "bg-gray-400 border-gray-500",
  frio: "bg-cyan-500 border-cyan-600",
  morno: "bg-orange-400 border-orange-500",
  quente: "bg-red-500 border-red-600",
  promessa: "bg-purple-500 border-purple-600",
  parcial: "bg-yellow-400 border-yellow-500",
  completa: "bg-emerald-500 border-emerald-600",
  aprovado: "bg-green-600 border-green-700",
  recusado: "bg-rose-600 border-rose-700",
  "sem interesse": "bg-zinc-600 border-zinc-700",
  "fora de perfil": "bg-zinc-600 border-zinc-700",
};

const columnDefaultTags: Record<string, LeadTag> = {
  novos: "novo",
  contato: "a contactar",
  negociacao: "frio",
  cadastro: "promessa",
  finalizado: "aprovado",
  arquivo: "sem interesse",
  fora_de_perfil: "fora de perfil",
};

const columnAllowedTags: Record<string, LeadTag[]> = {
  novos: ["novo"],
  contato: ["a contactar", "sem resposta"],
  negociacao: ["frio", "morno", "quente"],
  cadastro: ["promessa", "parcial", "completa"],
  finalizado: ["aprovado", "recusado"],
  arquivo: ["sem interesse"],
  fora_de_perfil: ["fora de perfil"],
};

interface Lead {
  id: string;
  name: string;
  tag: LeadTag;
  visitDate?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  cnae?: string | null;
  contacts?: ApiContact[];
}

interface Column {
  id: string;
  title: string;
  leads: Lead[];
}

const emptyBoard: Record<string, Column> = {
  novos: { id: "novos", title: "Novos / Entrada", leads: [] },
  contato: { id: "contato", title: "Contato", leads: [] },
  negociacao: { id: "negociacao", title: "Em Negociação", leads: [] },
  cadastro: { id: "cadastro", title: "Cadastro", leads: [] },
  finalizado: { id: "finalizado", title: "Finalizado", leads: [] },
  arquivo: { id: "arquivo", title: "Sem Interesse", leads: [] },
  fora_de_perfil: { id: "fora_de_perfil", title: "Fora de Perfil", leads: [] },
};

interface Notification {
  id: string;
  title: string;
  time: string;
  type: "warning" | "success" | "info" | "reminder";
  leadId?: string;
}

function formatDisplayDate(dateString: string) {
  if (!dateString) return "";
  const datePart = dateString.includes("T")
    ? dateString.split("T")[0]
    : dateString;
  const parts = datePart.split("-");

  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateString;
}

const maskDate = (value: string) => {
  value = value.replace(/\D/g, "");
  if (value.length > 8) value = value.slice(0, 8);
  if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
  if (value.length > 5) value = `${value.slice(0, 5)}/${value.slice(5)}`;
  return value;
};

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

function getTodayDDMMYYYY() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [columns, setColumns] = useState(emptyBoard);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSmallModalOpen, setIsSmallModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditFormModalOpen, setIsEditFormModalOpen] = useState(false);

  const [editingTag, setEditingTag] = useState<LeadTag | null>(null);
  const [editingVisitDate, setEditingVisitDate] = useState<string>("");
  const [dateError, setDateError] = useState<string | null>(null);

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

  const [activeTab, setActiveTab] = useState("history");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string[]>([]);

  function toggleHistoryExpand(id: string) {
    setExpandedHistory((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  const [columnPages, setColumnPages] = useState<Record<string, number>>({
    novos: 1,
    contato: 1,
    negociacao: 1,
    cadastro: 1,
    finalizado: 1,
    arquivo: 1,
  });
  const [columnHasMore, setColumnHasMore] = useState<Record<string, boolean>>({
    novos: true,
    contato: true,
    negociacao: true,
    cadastro: true,
    finalizado: true,
    arquivo: true,
  });
  const [noteText, setNoteText] = useState("");
  const [noteDate, setNoteDate] = useState(getTodayDDMMYYYY());
  const [reminderText, setReminderText] = useState("");
  const [reminderDate, setReminderDate] = useState(getTodayDDMMYYYY());

  const [leadCalendarMonth, setLeadCalendarMonth] = useState(new Date());

  const [leadContacts, setLeadContacts] = useState<ApiContact[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDateView, setSelectedDateView] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [userProfile, setUserProfile] = useState<{
    name: string;
    role: string;
  }>({
    name: "Carregando...",
    role: "USER",
  });

  const isFutureDate = (dateString: string) => {
    if (dateString.length !== 10) return false;
    const [day, month, year] = dateString.split("/");
    const selectedDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today;
  };

  function updateTodayNotifications(boardData: Record<string, Column>) {
    const todayStr = getTodayString();
    const todayNotifications: Notification[] = [];

    for (const colId in boardData) {
      boardData[colId].leads.forEach((lead) => {
        if (lead.visitDate && lead.visitDate.startsWith(todayStr)) {
          todayNotifications.push({
            id: `visit-${lead.id}`,
            title: `Visita Agendada: ${lead.name}`,
            time: "Hoje",
            type: "warning",
            leadId: lead.id,
          });
        }

        if (lead.contacts) {
          lead.contacts.forEach((contact) => {
            if (
              contact.type === "REMINDER" &&
              contact.date.startsWith(todayStr)
            ) {
              todayNotifications.push({
                id: `rem-${contact.id}`,
                title: `Lembrete: ${lead.name}`,
                time: "Hoje",
                type: "reminder",
                leadId: lead.id,
              });
            }
          });
        }
      });
    }

    setNotifications(todayNotifications);
  }

  async function createHistoryLog(
    leadId: string,
    type: string,
    description: string,
    didChangeFunnel: boolean = false,
  ) {
    const token = localStorage.getItem("token");
    const dateStr = getTodayString();
    try {
      await fetch(`http://localhost:3000/auth/leads/${leadId}/contacts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          date: dateStr,
          description,
          didChangeFunnel,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveInteraction() {
    const isReminder = activeTab === "reminder";
    const textToSave = isReminder ? reminderText : noteText;
    const dateToSave = isReminder ? reminderDate : noteDate;

    if (!selectedLead || !textToSave || dateToSave.length < 10) return;

    const [d, m, y] = dateToSave.split("/");
    const formattedDate = `${y}-${m}-${d}`;
    const interactionType = isReminder ? "REMINDER" : "CALL";

    const newContact: ApiContact = {
      id: Date.now().toString(),
      type: interactionType,
      date: formattedDate,
      description: textToSave,
    };

    setLeadContacts((prev) => [newContact, ...prev]);

    const newColumns = { ...columns };
    const colId = getLeadColumnId(selectedLead.id);
    if (colId) {
      const leadIndex = newColumns[colId].leads.findIndex(
        (l) => l.id === selectedLead.id,
      );
      if (leadIndex !== -1) {
        const leadToUpdate = newColumns[colId].leads[leadIndex];
        leadToUpdate.contacts = [newContact, ...(leadToUpdate.contacts || [])];
      }
    }
    setColumns(newColumns);
    updateTodayNotifications(newColumns);

    if (isReminder) setReminderText("");
    else setNoteText("");
    setActiveTab("history");

    const token = localStorage.getItem("token");
    try {
      await fetch(
        `http://localhost:3000/auth/leads/${selectedLead.id}/contacts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: interactionType,
            date: formattedDate,
            description: textToSave,
          }),
        },
      );
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSendEmail() {
    if (!selectedLead || !emailSubject || !emailBody) {
      alert("Preencha o assunto e a mensagem antes de enviar.");
      return;
    }

    setIsSendingEmail(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `http://localhost:3000/auth/leads/${selectedLead.id}/email`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subject: emailSubject, body: emailBody }),
        },
      );

      if (response.ok) {
        const result = await response.json();

        if (result.contact) {
          setLeadContacts((prev) => [result.contact, ...(prev || [])]);
        }

        setEmailSubject("");
        setEmailBody("");
        setActiveTab("history");
      } else {
        const err = await response.json();
        alert(err.error || "Erro ao enviar e-mail.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao tentar enviar e-mail.");
    } finally {
      setIsSendingEmail(false);
    }
  }

  function handleNotificationClick(leadId?: string) {
    if (!leadId) return;
    for (const colId in columns) {
      const foundLead = columns[colId].leads.find((l) => l.id === leadId);
      if (foundLead) {
        setSelectedLead(foundLead);
        setIsSmallModalOpen(true);
        return;
      }
    }
  }

  async function updateLeadOnServer(
    leadId: string,
    data: { funnelStage?: string; tags?: string[]; visitDate?: string | null },
  ) {
    const token = localStorage.getItem("token");
    try {
      await fetch(`http://localhost:3000/auth/leads/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lead_id: leadId, ...data }),
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchColumnLeads(
    columnId: string,
    stageName: string,
    page: number,
  ) {
    const token = localStorage.getItem("token");
    if (!token) return [];

    try {
      const response = await fetch(
        `http://localhost:3000/auth/leads?stage=${stageName}&limit=50&page=${page}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) return [];

      const responseData = await response.json();
      const leadsArray: ApiLead[] = responseData.leads || responseData;

      setColumnHasMore((prev) => ({
        ...prev,
        [columnId]: leadsArray.length === 50,
      }));

      return leadsArray.map((apiLead) => {
        const tag = (apiLead.tags[0] as LeadTag) || columnDefaultTags[columnId];
        return {
          id: apiLead.id,
          name: apiLead.companyName,
          tag: tag,
          visitDate: apiLead.visitDate,
          phone: apiLead.phone,
          cnpj: apiLead.cnpj,
          email: apiLead.email,
          address: apiLead.address,
          city: apiLead.city,
          state: apiLead.state,
          cnae: apiLead.cnae,
          contacts: apiLead.contacts
            ? apiLead.contacts.map((c: any) => ({
                id: c.id,
                type: c.type,
                date: c.date ? c.date.toString().split("T")[0] : "",
                description: c.description || c.observation || "",
              }))
            : [],
        };
      });
    } catch (error) {
      console.error(`Erro ao buscar leads da coluna ${columnId}:`, error);
      return [];
    }
  }

  useEffect(() => {
    async function loadInitialBoard() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const newBoard = JSON.parse(JSON.stringify(emptyBoard));

      await Promise.all(
        Object.entries(reverseStageMap).map(async ([colId, stageName]) => {
          const leads = await fetchColumnLeads(colId, stageName, 1);
          if (newBoard[colId]) {
            newBoard[colId].leads = leads;
          }
        }),
      );

      setColumns(newBoard);
      updateTodayNotifications(newBoard);
    }

    loadInitialBoard();
  }, [navigate]);
  useEffect(() => {
    if (selectedLead) {
      setEditingTag(selectedLead.tag);
      setDateError(null);

      if (selectedLead.visitDate) {
        const datePart = selectedLead.visitDate.split("T")[0];
        const [year, month, day] = datePart.split("-");
        setEditingVisitDate(`${day}/${month}/${year}`);
      } else {
        setEditingVisitDate("");
      }

      setLeadContacts(selectedLead.contacts || []);
    }
  }, [selectedLead]);

  async function loadMoreLeads(colId: string) {
    const nextPage = columnPages[colId] + 1;
    const stageName = reverseStageMap[colId];

    if (!stageName) return;

    const newLeads = await fetchColumnLeads(colId, stageName, nextPage);

    if (newLeads.length > 0) {
      setColumns((prev) => {
        const updatedBoard = { ...prev };

        const existingLeadIds = new Set(
          updatedBoard[colId].leads.map((l) => l.id),
        );
        const uniqueNewLeads = newLeads.filter(
          (lead) => !existingLeadIds.has(lead.id),
        );

        updatedBoard[colId].leads = [
          ...updatedBoard[colId].leads,
          ...uniqueNewLeads,
        ];
        return updatedBoard;
      });
      setColumnPages((prev) => ({ ...prev, [colId]: nextPage }));
    }
  }

  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/auth/me", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          handleLogout();
          return;
        }

        const userData = await response.json();
        setUserProfile({ name: userData.name, role: userData.role });
      } catch (error) {
        console.error("Erro ao carregar perfil: ", error);
      }
    }

    fetchProfile();
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  function getLeadColumnId(leadId: string | undefined): string | null {
    if (!leadId) return null;
    for (const colId in columns) {
      if (columns[colId].leads.some((l) => l.id === leadId)) {
        return colId;
      }
    }
    return null;
  }

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    console.log("=== EVENTO DE ARRASTO ===");
    console.log("ID do Lead:", draggableId);
    console.log("Origem:", source.droppableId);
    console.log("Destino:", destination?.droppableId || "FORA DE UMA COLUNA");
    if (!destination) {
      console.warn("O card foi solto fora de qualquer área de drop!");
      return;
    }
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const sourceItems = [...sourceCol.leads];
    const destItems =
      source.droppableId === destination.droppableId
        ? sourceItems
        : [...destCol.leads];

    const [removed] = sourceItems.splice(source.index, 1);

    if (source.droppableId !== destination.droppableId) {
      const defaultTag = columnDefaultTags[destination.droppableId];
      removed.tag = defaultTag || removed.tag;

      updateLeadOnServer(draggableId, {
        funnelStage: reverseStageMap[destination.droppableId],
        tags: [removed.tag],
      });

      const description = `Funil alterado: ${sourceCol.title} ➔ ${destCol.title}`;
      createHistoryLog(draggableId, "SYSTEM_CHANGE", description, true);
      const newLocalContact: ApiContact = {
        id: Date.now().toString(),
        type: "SYSTEM_CHANGE",
        date: getTodayString(),
        description,
      };
      removed.contacts = [newLocalContact, ...(removed.contacts || [])];
    }

    destItems.splice(destination.index, 0, removed);

    const newBoard = {
      ...columns,
      [source.droppableId]: { ...sourceCol, leads: sourceItems },
      [destination.droppableId]: { ...destCol, leads: destItems },
    };

    setColumns(newBoard);
    updateTodayNotifications(newBoard);
  }

  function handleSaveLead() {
    if (!selectedLead || !editingTag) return;

    if (editingVisitDate && editingVisitDate.length > 0) {
      if (editingVisitDate.length < 10) {
        setDateError(
          "Por favor, digite uma data completa no formato DD/MM/AAAA.",
        );
        return;
      }

      const [dayStr, monthStr, yearStr] = editingVisitDate.split("/");
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);

      if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000) {
        setDateError("Data inválida. Verifique o dia e o mês.");
        return;
      }

      const daysInMonth = new Date(year, month, 0).getDate();
      if (day > daysInMonth) {
        setDateError(
          `Data inválida. O mês ${month} só tem ${daysInMonth} dias.`,
        );
        return;
      }
    }

    let formattedDateForBackend = null;
    if (editingVisitDate && editingVisitDate.length === 10) {
      const [day, month, year] = editingVisitDate.split("/");
      formattedDateForBackend = `${year}-${month}-${day}`;
    }

    const newColumns = { ...columns };
    for (const colId in newColumns) {
      const column = newColumns[colId];
      const leadIndex = column.leads.findIndex((l) => l.id === selectedLead.id);

      if (leadIndex !== -1) {
        const oldLead = newColumns[colId].leads[leadIndex];

        if (oldLead.tag !== editingTag) {
          const description = `Etiqueta alterada: [${oldLead.tag}] ➔ [${editingTag}]`;
          createHistoryLog(
            selectedLead.id,
            "SYSTEM_CHANGE",
            description,
            false,
          );
          const newLocalContact: ApiContact = {
            id: Date.now().toString(),
            type: "SYSTEM_CHANGE",
            date: getTodayString(),
            description,
          };
          oldLead.contacts = [newLocalContact, ...(oldLead.contacts || [])];
        }

        if (
          formattedDateForBackend &&
          oldLead.visitDate !== formattedDateForBackend
        ) {
          const description = `Visita agendada para: ${editingVisitDate}`;
          createHistoryLog(selectedLead.id, "MEETING", description, false);
          const newLocalContact: ApiContact = {
            id: (Date.now() + 1).toString(),
            type: "MEETING",
            date: getTodayString(),
            description,
          };
          oldLead.contacts = [newLocalContact, ...(oldLead.contacts || [])];
        }

        newColumns[colId].leads[leadIndex] = {
          ...oldLead,
          tag: editingTag,
          visitDate: formattedDateForBackend,
        };
        break;
      }
    }

    updateLeadOnServer(selectedLead.id, {
      tags: [editingTag],
      visitDate: formattedDateForBackend,
    });

    setColumns(newColumns);
    updateTodayNotifications(newColumns);
    setIsSmallModalOpen(false);
  }

  async function handleSaveEditForm() {
    if (!selectedLead) return;
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:3000/auth/leads/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lead_id: selectedLead.id, ...formData }),
      });

      if (response.ok) {
        const updatedColumns = { ...columns };
        const colId = getLeadColumnId(selectedLead.id);
        if (colId) {
          const leadIndex = updatedColumns[colId].leads.findIndex(
            (l) => l.id === selectedLead.id,
          );
          if (leadIndex !== -1) {
            updatedColumns[colId].leads[leadIndex] = {
              ...updatedColumns[colId].leads[leadIndex],
              name: formData.companyName,
              cnpj: formData.cnpj,
              cnae: formData.cnae,
              phone: formData.phone,
              email: formData.email,
              city: formData.city,
              state: formData.state,
              address: formData.address,
            };
            setColumns(updatedColumns);
            setSelectedLead(updatedColumns[colId].leads[leadIndex]);
          }
        }
        setIsEditFormModalOpen(false);
        setIsDetailsModalOpen(true);
      } else {
        alert("Erro ao salvar lead");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  }

  function openEditForm() {
    if (!selectedLead) return;
    setFormData({
      companyName: selectedLead.name,
      cnpj: selectedLead.cnpj || "",
      cnae: selectedLead.cnae || "",
      phone: selectedLead.phone || "",
      email: selectedLead.email || "",
      city: selectedLead.city || "",
      state: selectedLead.state || "",
      address: selectedLead.address || "",
      funnelStage:
        (reverseStageMap[getLeadColumnId(selectedLead.id) || ""] as any) ||
        "NOVO",
    });
    setIsDetailsModalOpen(false);
    setIsEditFormModalOpen(true);
  }

  function getVisitsForDate(dateStr: string): Lead[] {
    const visits: Lead[] = [];
    for (const colId in columns) {
      columns[colId].leads.forEach((lead) => {
        if (lead.visitDate && lead.visitDate.startsWith(dateStr)) {
          visits.push(lead);
        }
      });
    }
    return visits;
  }

  function changeMonth(offset: number) {
    const newDate = new Date(currentMonthDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonthDate(newDate);
  }

  function renderCalendarGrid() {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    const todayStr = getTodayString();

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="h-20 border border-border/30 bg-muted/20"
        ></div>,
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isToday = dateStr === todayStr;
      const visits = getVisitsForDate(dateStr);

      days.push(
        <div
          key={dateStr}
          onClick={() => setSelectedDateView(dateStr)}
          className={`h-20 border border-border/50 p-1 flex flex-col gap-1 cursor-pointer transition-colors hover:bg-accent/30 relative
            ${isToday ? "bg-primary/5 border-primary/30" : "bg-card"}
          `}
        >
          <span
            className={`text-xs font-medium ml-1 ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}
          >
            {day}
          </span>

          <div className="flex flex-col gap-1 overflow-hidden px-1">
            {visits.slice(0, 3).map((v, i) => (
              <div
                key={i}
                className="w-full h-1.5 bg-blue-500 rounded-full"
                title={v.name}
              ></div>
            ))}
            {visits.length > 3 && (
              <span className="text-[9px] text-muted-foreground leading-none font-bold">
                + {visits.length - 3}
              </span>
            )}
          </div>
        </div>,
      );
    }

    return days;
  }

  function renderLeadCalendarGrid() {
    const year = leadCalendarMonth.getFullYear();
    const month = leadCalendarMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="h-16 border border-border/30 bg-muted/10"
        ></div>,
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const displayDateStr = `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;

      const contactsToday = leadContacts.filter(
        (c) => c.date === dateStr && c.type !== "SYSTEM_CHANGE",
      );

      days.push(
        <div
          key={dateStr}
          onClick={() => {
            if (isFutureDate(displayDateStr)) {
              setReminderDate(displayDateStr);
              setActiveTab("reminder");
            } else {
              setNoteDate(displayDateStr);
              setActiveTab("note");
            }
          }}
          className="h-16 border border-border/50 p-1 flex flex-col gap-1 bg-card hover:bg-accent/20 cursor-pointer transition-colors relative group"
        >
          <span className="text-xs font-medium text-muted-foreground ml-1">
            {day}
          </span>

          <div className="flex gap-1 px-1 flex-wrap">
            {contactsToday.map((c, i) => (
              <div
                key={i}
                title={c.description}
                className={`w-2 h-2 rounded-full ${
                  c.type === "EMAIL"
                    ? "bg-blue-500"
                    : c.type === "CALL"
                      ? "bg-green-500"
                      : c.type === "MEETING"
                        ? "bg-orange-500"
                        : c.type === "REMINDER"
                          ? "bg-purple-500"
                          : "bg-gray-500"
                }`}
              />
            ))}
          </div>

          <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Plus size={16} className="text-primary" />
          </div>
        </div>,
      );
    }
    return days;
  }

  const currentLeadColumnId = getLeadColumnId(selectedLead?.id);
  const availableTags = currentLeadColumnId
    ? columnAllowedTags[currentLeadColumnId]
    : [];

  const showVisitDate =
    currentLeadColumnId &&
    ["negociacao", "cadastro", "finalizado"].includes(currentLeadColumnId);

  // Variável utilitária para o histórico filtrado
  const visibleContacts = leadContacts.filter(
    (c) => c.type !== "SYSTEM_CHANGE",
  );

  const verticalCols = [
    "novos",
    "contato",
    "negociacao",
    "cadastro",
    "finalizado",
  ];
  const horizontalCols = ["arquivo", "fora_de_perfil"];

  //Inserindo funcao pra padronizar colunas
  const renderLeadCard = (lead: Lead, index: number, isHorizontal: boolean) => (
    <Draggable key={lead.id} draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onDoubleClick={() => {
            setSelectedLead(lead);
            setIsSmallModalOpen(true);
          }}
          className={
            isHorizontal
              ? "w-40 h-fit shrink-0 bg-background border border-border rounded-md p-1 shadow-sm flex flex-col gap-0 opacity-70 hover:opacity-100 cursor-pointer"
              : // ADICIONEI: bg-card, p-3, rounded-md e border para dar formato de card na vertical
                `w-full h-fit box-border bg-card border border-border rounded-md p-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4 ${tagColors[lead.tag] || "border-l-gray-500"} ${snapshot.isDragging ? "opacity-90 scale-105 shadow-xl rotate-2 z-50" : ""}`
          }
        >
          <div className="flex justify-between items-start mb-2">
            <span className="font-semibold text-sm line-clamp-1">
              {lead.name}
            </span>
            {!isHorizontal && (
              <GripVertical
                size={14}
                className="text-muted-foreground/50 shrink-0"
              />
            )}
          </div>
          <div className="flex justify-between items-end mt-2">
            <Badge
              variant="outline"
              className="text-[10px] px-1 py-0 h-5 font-normal uppercase"
            >
              {lead.tag}
            </Badge>
            {!isHorizontal && lead.visitDate && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 px-2 py-0.5 rounded-md shadow-sm">
                <CalendarIcon size={12} strokeWidth={2.5} />
                {formatDisplayDate(lead.visitDate)}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );

  const renderColumn = (colId: string, isHorizontal: boolean) => {
    const column = columns[colId];
    if (!column) return null;

    return (
      <div
        key={colId}
        className={`flex flex-col h-full rounded-xl border border-border bg-card/40 ${
          isHorizontal ? "h-29 border-dashed w-full" : ""
        }`}
      >
        {/*Cabeçalho*/}
        <div className="p-2 border-b border-border bg-accent/30 flex justify-between items-center">
          <h3 className="font-bold text-sm uppercase tracking-wider">
            {column.title}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {column.leads.length}
          </Badge>
        </div>

        {/*Area de arrastar*/}
        <Droppable
          droppableId={colId}
          direction={isHorizontal ? "horizontal" : "vertical"}
        >
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`flex-1 flex p-1 ${
                isHorizontal
                  ? "flex-row gap-4 items-center min-h-0 overflow-x-auto"
                  : // REMOVI o items-stretch e deixei o gap-3 para separar os cards
                    "flex-col gap-3 overflow-y-auto overflow-x-hidden min-h-[150px]"
              }`}
            >
              {column.leads.map((lead, index) =>
                renderLeadCard(lead, index, isHorizontal),
              )}
              {provided.placeholder}
              {/* Botao de carregar mais*/}
              {!isHorizontal && columnHasMore[colId] && (
                <div className="pt-2 pb-1 flex justify-center w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full border border-dashed border-border"
                    onClick={() => loadMoreLeads(colId)}
                  >
                    Carregar mais...
                  </Button>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex bg-background text-foreground transition-colors duration-300 overflow-hidden">
      {/* --- SIDEBAR NOTIFICAÇÕES (AJUSTADA COM SCROLL CORRETO) --- */}
      <aside className="w-80 border-r border-border bg-card/30 flex flex-col hidden md:flex h-full">
        <div className="p-6 border-b border-border flex items-center gap-2 shrink-0">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">Notificações</h2>
          {notifications.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {notifications.length}
            </Badge>
          )}
        </div>

        {/* O container interno precisa ter flex-1 e overflow-hidden para o Radix ScrollArea funcionar */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-4 py-2">
            <div className="space-y-4 pb-4 pt-2">
              {notifications.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground p-4 bg-card rounded-lg border border-dashed border-border mt-4">
                  Nenhuma visita ou lembrete para hoje.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.leadId)}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer shadow-sm"
                  >
                    {notif.type === "warning" && (
                      <AlertCircle size={18} className="text-orange-500 mt-1" />
                    )}
                    {notif.type === "success" && (
                      <CheckCircle2 size={18} className="text-green-500 mt-1" />
                    )}
                    {notif.type === "info" && (
                      <Clock size={18} className="text-blue-500 mt-1" />
                    )}
                    {notif.type === "reminder" && (
                      <Bell size={18} className="text-purple-500 mt-1" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-bold leading-none text-foreground">
                        {notif.title}
                      </p>
                      <p className="text-[11px] font-medium text-muted-foreground mt-1.5 uppercase tracking-wider">
                        {notif.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="p-4 border-t border-border flex flex-col gap-3 shrink-0">
          <Button
            variant="ghost"
            className="w-full gap-2 justify-start h-12 text-md border border-dashed border-border hover:bg-accent hover:border-solid"
            onClick={() => navigate("/leads-list")}
          >
            <List size={18} />
            Gerenciar Leads
          </Button>

          {userProfile.role === "ADMIN" && (
            <Button
              variant="ghost"
              className="w-full gap-2 justify-start h-12 text-md border border-dashed border-border hover:bg-accent hover:border-solid"
              onClick={() => navigate("/reports")}
            >
              <FileText size={18} />
              Relatórios
            </Button>
          )}

          <Dialog
            open={isCalendarOpen}
            onOpenChange={(open) => {
              setIsCalendarOpen(open);
              if (!open) setSelectedDateView(null);
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full gap-2 justify-start h-12 text-md"
              >
                <CalendarIcon size={18} />
                Ver Calendário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              {!selectedDateView ? (
                <>
                  <DialogHeader className="flex flex-row items-center justify-between mb-4">
                    <DialogTitle className="text-xl">
                      {currentMonthDate
                        .toLocaleString("pt-BR", {
                          month: "long",
                          year: "numeric",
                        })
                        .replace(/^\w/, (c) => c.toUpperCase())}
                    </DialogTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => changeMonth(-1)}
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => changeMonth(1)}
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </DialogHeader>

                  <div className="w-full">
                    <div className="grid grid-cols-7 gap-0 mb-1">
                      {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                        (d) => (
                          <div
                            key={d}
                            className="text-center text-xs font-bold text-muted-foreground uppercase"
                          >
                            {d}
                          </div>
                        ),
                      )}
                    </div>
                    <div className="grid grid-cols-7 gap-0 rounded-md overflow-hidden border border-border/50">
                      {renderCalendarGrid()}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <DialogHeader className="flex flex-row items-center gap-4 mb-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedDateView(null)}
                    >
                      <ArrowLeft size={18} />
                    </Button>
                    <DialogTitle className="text-xl">
                      Visitas do dia {formatDisplayDate(selectedDateView)}
                    </DialogTitle>
                  </DialogHeader>

                  <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-3 p-1">
                      {getVisitsForDate(selectedDateView).length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                          Nenhuma visita agendada para este dia.
                        </div>
                      ) : (
                        getVisitsForDate(selectedDateView).map((lead) => (
                          <Card
                            key={lead.id}
                            className="border-l-4 border-l-blue-500 shadow-sm cursor-pointer hover:bg-accent/30"
                            onClick={() => {
                              setIsCalendarOpen(false);
                              setSelectedLead(lead);
                              setIsSmallModalOpen(true);
                            }}
                          >
                            <CardContent className="p-4 flex justify-between items-center">
                              <div>
                                <h4 className="font-bold text-lg">
                                  {lead.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Em:{" "}
                                  {reverseStageMap[
                                    getLeadColumnId(lead.id) || ""
                                  ] || "descriptiononhecido"}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="uppercase text-[10px]"
                              >
                                {lead.tag}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="w-full p-4 px-6 border-b border-border flex justify-between items-center bg-card/50 backdrop-blur-sm">
          <h1 className="text-xl font-bold tracking-tight text-primary w-1/4">
            O.S.{" "}
            <span className="text-foreground font-normal">
              Inteligência FInanceira
            </span>
          </h1>

          <div className="flex items-center gap-4 w-1/4 justify-end ml-auto">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-accent/20 border border-border/50 mr-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <User size={18} />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-sm font-semibold leading-none">
                  {userProfile.name}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  {userProfile.role}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="gap-2 font-bold shadow-sm"
            >
              <LogOut size={18} />
              SAIR
            </Button>
          </div>
        </header>
        {/*Começa aqui as colunas*/}
        <main className="flex-1 p-6 flex flex-col bg-background/50 overflow-hidden">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col gap-4 h-full">
              {/*Verticais*/}
              <div className="flex-1 grid grid-cols-5 gap-1 min-h-0">
                {verticalCols.map((id) => renderColumn(id, false))}
              </div>
              {/*Horizontais*/}
              <div className="grid grid-cols-2 gap-4 shrink-0 mt-auto pb-2">
                {horizontalCols.map((id) => renderColumn(id, true))}
              </div>
            </div>
          </DragDropContext>
        </main>
      </div>

      <Dialog open={isSmallModalOpen} onOpenChange={setIsSmallModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedLead?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Alterar Etiqueta
              </h4>

              {availableTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setEditingTag(tag)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-bold uppercase border-2 transition-all flex items-center gap-2
                        ${tagColors[tag].split(" ")[0]} text-white
                        ${editingTag === tag ? "ring-2 ring-offset-2 ring-primary border-transparent scale-105" : "border-transparent opacity-70 hover:opacity-100"}
                      `}
                    >
                      {tag}
                      {editingTag === tag && (
                        <Check size={12} strokeWidth={4} />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma etiqueta disponível para esta coluna.
                </p>
              )}
            </div>

            {showVisitDate && (
              <div className="space-y-3 pt-2 border-t border-border/50">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Agendar Visita
                </h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                      value={editingVisitDate}
                      onChange={(e) => {
                        setEditingVisitDate(maskDate(e.target.value));
                        if (dateError) setDateError(null);
                      }}
                      className={`flex h-10 w-full rounded-md border bg-card px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${dateError ? "border-red-500 focus-visible:ring-red-500" : "border-input"}`}
                    />
                  </div>
                  {editingVisitDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingVisitDate("");
                        setDateError(null);
                      }}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      Remover
                    </Button>
                  )}
                </div>
                {dateError && (
                  <p className="text-xs text-red-500 font-medium mt-1 ml-1">
                    {dateError}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-border/50">
              <Button
                variant="outline"
                className="w-full gap-2 justify-start h-12 text-md bg-accent/20 hover:bg-accent/40"
                onClick={() => {
                  setIsSmallModalOpen(false);
                  setIsDetailsModalOpen(true);
                }}
              >
                <ExternalLink size={18} className="text-primary" />
                Ver Histórico e Detalhes Completos
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsSmallModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveLead}
                className="bg-primary hover:bg-primary/90"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-4 border-b border-border flex-row items-center justify-between shrink-0">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="text-primary" />
                {selectedLead?.name || "Nome da Empresa"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <Badge variant="outline">
                  {selectedLead?.tag || "SEM ETIQUETA"}
                </Badge>
                <span>
                  Em:{" "}
                  <span className="font-semibold">
                    {selectedLead
                      ? reverseStageMap[getLeadColumnId(selectedLead.id) || ""]
                      : "descriptiononhecido"}
                  </span>
                </span>
              </p>
            </div>
          </DialogHeader>

          <div className="flex flex-1 min-h-0 bg-muted/10">
            <div className="w-[35%] border-r border-border p-6 overflow-y-auto bg-card">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">
                Ficha Cadastral
              </h3>

              <div className="space-y-5">
                <div>
                  <Label className="text-xs text-muted-foreground">CNPJ</Label>
                  <p className="text-sm font-medium">
                    {selectedLead?.cnpj || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Telefone
                  </Label>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Phone size={14} className="text-muted-foreground" />{" "}
                    {selectedLead?.phone || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    E-mail
                  </Label>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Mail size={14} className="text-muted-foreground" />{" "}
                    {selectedLead?.email || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Endereço
                  </Label>
                  <p className="text-sm font-medium flex items-start gap-2 mt-1">
                    <MapPin
                      size={14}
                      className="text-muted-foreground mt-0.5 shrink-0"
                    />
                    {selectedLead?.address ? (
                      <span>
                        {selectedLead.address}
                        <br />
                        {selectedLead.city || ""}
                        {selectedLead.city && selectedLead.state ? ", " : ""}
                        {selectedLead.state || ""}
                      </span>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-6 gap-2"
                onClick={openEditForm}
              >
                <Pencil size={16} /> Editar Cadastro
              </Button>
            </div>

            {/* CONTEÚDO DAS TABS COM SCROLLARRUMADO */}
            <div className="flex-1 flex flex-col min-w-0 bg-background">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="px-6 pt-4 border-b border-border shrink-0">
                  <TabsList className="grid w-full grid-cols-5 bg-muted/50 h-12">
                    <TabsTrigger value="history" className="gap-2">
                      <History size={16} /> Histórico
                    </TabsTrigger>
                    <TabsTrigger value="email" className="gap-2">
                      <Mail size={16} /> E-mail
                    </TabsTrigger>
                    <TabsTrigger value="note" className="gap-2">
                      <Phone size={16} /> Ligação
                    </TabsTrigger>
                    <TabsTrigger value="reminder" className="gap-2">
                      <Bell size={16} /> Lembrete
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="gap-2">
                      <CalendarDays size={16} /> Agenda
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Wrap do ScrollArea com overflow-hidden para forçar o tamanho exato da flex box pai */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full w-full">
                    <div className="p-6">
                      <TabsContent value="history" className="m-0 space-y-4">
                        {visibleContacts.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg bg-muted/20">
                            <History
                              size={32}
                              className="text-muted-foreground/50 mb-3"
                            />
                            <p className="text-sm font-medium text-foreground/80">
                              Nenhum histórico registrado.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Interações, ligações e lembretes aparecerão aqui.
                            </p>
                          </div>
                        ) : (
                          visibleContacts.map((contact) => {
                            const isEmail = contact.type === "EMAIL";
                            const isExpanded = expandedHistory.includes(
                              contact.id,
                            );

                            let subjectTitle = "Sem Assunto";
                            let emailBody = contact.description;

                            if (
                              isEmail &&
                              contact.description.includes("Assunto:")
                            ) {
                              const parts =
                                contact.description.split("\n\nMensagem:\n");
                              if (parts.length === 2) {
                                subjectTitle = parts[0].replace(
                                  "Assunto: ",
                                  "",
                                );
                                emailBody = parts[1];
                              }
                            }

                            return (
                              <div
                                key={contact.id}
                                className="flex gap-4 p-4 border border-border rounded-lg bg-card"
                              >
                                <div
                                  className={`mt-1 p-2 rounded-full h-fit shrink-0
                                     ${
                                       contact.type === "EMAIL"
                                         ? "bg-blue-100 text-blue-600"
                                         : contact.type === "CALL" ||
                                             contact.type === "NOTE"
                                           ? "bg-green-100 text-green-600"
                                           : contact.type === "REMINDER"
                                             ? "bg-purple-100 text-purple-600"
                                             : "bg-orange-100 text-orange-600"
                                     }`}
                                >
                                  {contact.type === "EMAIL" ? (
                                    <Mail size={18} />
                                  ) : contact.type === "CALL" ||
                                    contact.type === "NOTE" ? (
                                    <Phone size={18} />
                                  ) : contact.type === "REMINDER" ? (
                                    <Bell size={18} />
                                  ) : (
                                    <CalendarIcon size={18} />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm">
                                      {contact.type === "EMAIL"
                                        ? "E-mail Enviado"
                                        : contact.type === "CALL" ||
                                            contact.type === "NOTE"
                                          ? "Registro de Ligação"
                                          : contact.type === "REMINDER"
                                            ? "Lembrete Agendado"
                                            : "Visita Agendada"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      • {formatDisplayDate(contact.date)}
                                    </span>
                                  </div>

                                  {isEmail ? (
                                    <div className="mt-2 border border-border rounded-md overflow-hidden">
                                      <div
                                        className="bg-muted/30 p-2 px-3 text-sm font-semibold cursor-pointer flex justify-between items-center hover:bg-muted/50 transition-colors"
                                        onClick={() =>
                                          toggleHistoryExpand(contact.id)
                                        }
                                      >
                                        <span className="truncate flex-1">
                                          Assunto: {subjectTitle}
                                        </span>
                                        {isExpanded ? (
                                          <ChevronDown
                                            size={16}
                                            className="text-muted-foreground shrink-0"
                                          />
                                        ) : (
                                          <ChevronRight
                                            size={16}
                                            className="text-muted-foreground shrink-0"
                                          />
                                        )}
                                      </div>

                                      {isExpanded && (
                                        <div className="p-3 text-sm text-foreground/80 bg-background border-t border-border whitespace-pre-wrap">
                                          {emailBody}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-foreground/80 whitespace-pre-wrap mt-1">
                                      {contact.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </TabsContent>

                      <TabsContent
                        value="email"
                        className="m-0 flex flex-col h-full space-y-4"
                      >
                        <div className="space-y-2">
                          <Label>Assunto</Label>
                          <Input
                            placeholder="Assunto do e-mail"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2 flex-1 flex flex-col">
                          <Label>Mensagem</Label>
                          <Textarea
                            className="flex-1 min-h-[200px] resize-none"
                            placeholder="Digite a mensagem aqui..."
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            className="gap-2"
                            onClick={handleSendEmail}
                            disabled={
                              isSendingEmail || !emailSubject || !emailBody
                            }
                          >
                            <Mail size={16} />
                            {isSendingEmail ? "Enviando..." : "Enviar E-mail"}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="note" className="m-0 space-y-4">
                        <div className="space-y-2">
                          <Label>Data da Ligação / Interação</Label>
                          <div className="relative w-1/3">
                            <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              type="text"
                              placeholder="DD/MM/AAAA"
                              className="pl-9"
                              value={noteDate}
                              onChange={(e) =>
                                setNoteDate(maskDate(e.target.value))
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Detalhes da interação</Label>
                          <Textarea
                            className="min-h-[150px] resize-none"
                            placeholder="Ex: Liguei para o cliente, conversamos sobre a proposta e ele pediu para retornar amanhã..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            onClick={handleSaveInteraction}
                            className="gap-2 text-white bg-green-600 hover:bg-green-700"
                          >
                            <AlignLeft size={16} /> Salvar Observação
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="reminder" className="m-0 space-y-4">
                        <div className="space-y-2">
                          <Label>Data do Lembrete</Label>
                          <div className="relative w-1/3">
                            <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              type="text"
                              placeholder="DD/MM/AAAA"
                              className="pl-9"
                              value={reminderDate}
                              onChange={(e) =>
                                setReminderDate(maskDate(e.target.value))
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>O que você precisa fazer?</Label>
                          <Textarea
                            className="min-h-[150px] resize-none"
                            placeholder="Ex: Ligar para cobrar a assinatura do contrato..."
                            value={reminderText}
                            onChange={(e) => setReminderText(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            onClick={handleSaveInteraction}
                            className="gap-2 text-white bg-purple-600 hover:bg-purple-700"
                          >
                            <Bell size={16} /> Agendar Lembrete
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="calendar" className="m-0">
                        <div className="flex items-center justify-between mb-4 bg-muted/30 p-2 rounded-lg border border-border">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const d = new Date(leadCalendarMonth);
                              d.setMonth(d.getMonth() - 1);
                              setLeadCalendarMonth(d);
                            }}
                          >
                            <ChevronLeft size={16} />
                          </Button>

                          <h3 className="font-bold text-sm uppercase tracking-wider">
                            {leadCalendarMonth.toLocaleString("pt-BR", {
                              month: "long",
                              year: "numeric",
                            })}
                          </h3>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const d = new Date(leadCalendarMonth);
                              d.setMonth(d.getMonth() + 1);
                              setLeadCalendarMonth(d);
                            }}
                          >
                            <ChevronRight size={16} />
                          </Button>
                        </div>

                        <div className="w-full">
                          <div className="grid grid-cols-7 gap-0 mb-1">
                            {[
                              "Dom",
                              "Seg",
                              "Ter",
                              "Qua",
                              "Qui",
                              "Sex",
                              "Sáb",
                            ].map((d) => (
                              <div
                                key={d}
                                className="text-center text-[10px] font-bold text-muted-foreground uppercase"
                              >
                                {d}
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-0 rounded-md overflow-hidden border border-border/50">
                            {renderLeadCalendarGrid()}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground justify-center">
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>{" "}
                            E-mail
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>{" "}
                            Ligação/Nota
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>{" "}
                            Visita
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>{" "}
                            Lembrete
                          </span>
                        </div>
                      </TabsContent>
                    </div>
                  </ScrollArea>
                </div>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditFormModalOpen}
        onOpenChange={(open) => {
          setIsEditFormModalOpen(open);
          if (!open) setIsDetailsModalOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil size={18} /> Editar Cadastro
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Razão Social *</Label>
              <div className="relative">
                <Building2 className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-name"
                  className="pl-8"
                  placeholder="Nome da Empresa"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-cnpj">CNPJ</Label>
                <div className="relative">
                  <FileText className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-cnpj"
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
                <Label htmlFor="edit-cnae">CNAE</Label>
                <Input
                  id="edit-cnae"
                  placeholder="Ex: 6204-0/00"
                  value={formData.cnae}
                  onChange={(e) =>
                    setFormData({ ...formData, cnae: maskCNAE(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Telefone / WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-phone"
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
                <Label htmlFor="edit-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-email"
                    type="email"
                    className="pl-8"
                    placeholder="contato@empresa.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-city">Cidade</Label>
                <Input
                  id="edit-city"
                  placeholder="Sua Cidade"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-state">UF</Label>
                <Input
                  id="edit-state"
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
              <Label htmlFor="edit-address">Endereço</Label>
              <div className="relative">
                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-address"
                  className="pl-8"
                  placeholder="Rua, Número, Bairro"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditFormModalOpen(false);
                setIsDetailsModalOpen(true);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEditForm}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
