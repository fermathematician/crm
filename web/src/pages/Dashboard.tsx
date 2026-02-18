import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';

import { 
  Moon, Sun, LogOut, Bell, Calendar as CalendarIcon, 
  CheckCircle2, AlertCircle, Clock, User, GripVertical, Check, List, ChevronLeft, ChevronRight, ArrowLeft, ExternalLink
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../components/ui/dialog";

type LeadTag = 'frio' | 'morno' | 'quente' | 'a contactar' | 'sem resposta' | 'promessa' | 'parcial' | 'completa' | 'aprovado' | 'recusado' | 'sem interesse' | 'novo';

interface ApiLead {
  id: string;
  companyName: string;
  funnelStage: 'NOVO' | 'CONTATO' | 'NEGOCIACAO' | 'CADASTRO' | 'FINALIZADO' | 'SEM_INTERESSE';
  tags: string[];
  phone: string | null;
  visitDate: string | null; 
}

const reverseStageMap: Record<string, string> = {
  'novos': 'NOVO',
  'contato': 'CONTATO',
  'negociacao': 'NEGOCIACAO',
  'cadastro': 'CADASTRO',
  'finalizado': 'FINALIZADO',
  'arquivo': 'SEM_INTERESSE'
};

const tagColors: Record<LeadTag, string> = {
  'novo': 'bg-slate-500 border-slate-600',
  'a contactar': 'bg-blue-500 border-blue-600',
  'sem resposta': 'bg-gray-400 border-gray-500',
  'frio': 'bg-cyan-500 border-cyan-600',
  'morno': 'bg-orange-400 border-orange-500',
  'quente': 'bg-red-500 border-red-600',
  'promessa': 'bg-purple-500 border-purple-600',
  'parcial': 'bg-yellow-400 border-yellow-500',
  'completa': 'bg-emerald-500 border-emerald-600',
  'aprovado': 'bg-green-600 border-green-700',
  'recusado': 'bg-rose-600 border-rose-700',
  'sem interesse': 'bg-zinc-600 border-zinc-700',
};

const columnDefaultTags: Record<string, LeadTag> = {
  'novos': 'novo',
  'contato': 'a contactar',
  'negociacao': 'frio',
  'cadastro': 'promessa',
  'finalizado': 'aprovado',
  'arquivo': 'sem interesse'
};

const columnAllowedTags: Record<string, LeadTag[]> = {
  'novos': ['novo'],
  'contato': ['a contactar', 'sem resposta'],
  'negociacao': ['frio', 'morno', 'quente'],
  'cadastro': ['promessa', 'parcial', 'completa'],
  'finalizado': ['aprovado', 'recusado'],
  'arquivo': ['sem interesse']
};

interface Lead {
  id: string;
  name: string;
  tag: LeadTag;
  visitDate?: string | null; 
}

interface Column {
  id: string;
  title: string;
  leads: Lead[];
}

const emptyBoard: Record<string, Column> = {
  'novos': { id: 'novos', title: 'Novos / Entrada', leads: [] },
  'contato': { id: 'contato', title: 'Contato', leads: [] },
  'negociacao': { id: 'negociacao', title: 'Em Negociação', leads: [] },
  'cadastro': { id: 'cadastro', title: 'Cadastro', leads: [] },
  'finalizado': { id: 'finalizado', title: 'Finalizado', leads: [] },
  'arquivo': { id: 'arquivo', title: 'Sem Interesse', leads: [] }
};

interface Notification {
  id: string;
  title: string;
  time: string;
  type: 'warning' | 'success' | 'info';
  leadId?: string; 
}

function formatDisplayDate(dateString: string) {
  if (!dateString) return '';
  const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  const parts = datePart.split('-');
  
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

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [columns, setColumns] = useState(emptyBoard);
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingTag, setEditingTag] = useState<LeadTag | null>(null);
  const [editingVisitDate, setEditingVisitDate] = useState<string>(''); 
  const [dateError, setDateError] = useState<string | null>(null); 

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDateView, setSelectedDateView] = useState<string | null>(null); 
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [userProfile, setUserProfile] = useState<{ name: string, role: string }>({
    name: "Carregando...",
    role: "USER"
  });

  function updateTodayNotifications(boardData: Record<string, Column>) {
    const todayStr = getTodayString();
    const todayVisits: Notification[] = [];

    for (const colId in boardData) {
      boardData[colId].leads.forEach((lead) => {
        if (lead.visitDate && lead.visitDate.startsWith(todayStr)) {
          todayVisits.push({
            id: lead.id,
            title: `Visita Agendada: ${lead.name}`,
            time: "Hoje", 
            type: "warning",
            leadId: lead.id
          });
        }
      });
    }

    setNotifications(todayVisits);
  }

  function handleNotificationClick(leadId?: string) {
    if (!leadId) return;
    
    for (const colId in columns) {
      const foundLead = columns[colId].leads.find(l => l.id === leadId);
      if (foundLead) {
        setSelectedLead(foundLead);
        return;
      }
    }
  }

  async function updateLeadOnServer(leadId: string, data: { funnelStage?: string, tags?: string[], visitDate?: string | null }) {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`http://localhost:3000/auth/leads/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lead_id: leadId,
          ...data
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar no servidor');
      }
    } catch (err) {
      console.error("Erro ao salvar no banco:", err);
    }
  }

  useEffect(() => {
    async function fetchLeads() {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/'); 
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/auth/leads', { 
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          handleLogout();
          return;
        }

        const data: ApiLead[] = await response.json(); 
        
        const newBoard = JSON.parse(JSON.stringify(emptyBoard)); 
        const stageMap: Record<string, string> = {
          'NOVO': 'novos',
          'CONTATO': 'contato',
          'NEGOCIACAO': 'negociacao',
          'CADASTRO': 'cadastro',
          'FINALIZADO': 'finalizado',
          'SEM_INTERESSE': 'arquivo'
        };

        data.forEach((apiLead) => {
          const columnId = stageMap[apiLead.funnelStage] || 'novos';
          const tag = (apiLead.tags[0] as LeadTag) || columnDefaultTags[columnId];

          const lead: Lead = {
            id: apiLead.id,
            name: apiLead.companyName,
            tag: tag,
            visitDate: apiLead.visitDate 
          };

          if (newBoard[columnId]) {
            newBoard[columnId].leads.push(lead);
          }
        });

        setColumns(newBoard);
        updateTodayNotifications(newBoard); 

      } catch (error) {
        console.error("Erro ao buscar leads:", error);
      }
    }

    fetchLeads();
    
  }, [navigate]);

  useEffect(() => {
    if (selectedLead) {
      setEditingTag(selectedLead.tag);
      setDateError(null); 
      
      if (selectedLead.visitDate) {
        const datePart = selectedLead.visitDate.split('T')[0];
        const [year, month, day] = datePart.split('-');
        setEditingVisitDate(`${day}/${month}/${year}`);
      } else {
        setEditingVisitDate('');
      }
    }
  }, [selectedLead]);

  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem('token');

      if(!token) {
        navigate('/');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/auth/me', {
          method: 'GET',
          headers: {
            'Authorization' : `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          handleLogout();
          return;
        }

        const userData = await response.json();
        setUserProfile({
          name: userData.name,
          role: userData.role
        });
      }catch (error){
        console.error("Erro ao carregar perfil: ", error);
      }
    }

    fetchProfile();
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/');
  }

  function getLeadColumnId(leadId: string | undefined): string | null {
    if (!leadId) return null;
    for (const colId in columns) {
      if (columns[colId].leads.some(l => l.id === leadId)) {
        return colId;
      }
    }
    return null;
  }

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const sourceItems = [...sourceCol.leads];
    const destItems = source.droppableId === destination.droppableId ? sourceItems : [...destCol.leads];

    const [removed] = sourceItems.splice(source.index, 1);
    
    if (source.droppableId !== destination.droppableId) {
      const defaultTag = columnDefaultTags[destination.droppableId];
      removed.tag = defaultTag || removed.tag;

      updateLeadOnServer(draggableId, { 
        funnelStage: reverseStageMap[destination.droppableId],
        tags: [removed.tag]
      });
    }

    destItems.splice(destination.index, 0, removed);
    
    const newBoard = {
      ...columns,
      [source.droppableId]: { ...sourceCol, leads: sourceItems },
      [destination.droppableId]: { ...destCol, leads: destItems }
    };
    
    setColumns(newBoard);
    updateTodayNotifications(newBoard); 
  }

  function handleSaveLead() {
    if (!selectedLead || !editingTag) return;

    if (editingVisitDate && editingVisitDate.length > 0) {
      if (editingVisitDate.length < 10) {
        setDateError("Por favor, digite uma data completa no formato DD/MM/AAAA.");
        return; 
      }

      const [dayStr, monthStr, yearStr] = editingVisitDate.split('/');
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);

      if (
        month < 1 || month > 12 || 
        day < 1 || day > 31 ||
        year < 2000 
      ) {
        setDateError("Data inválida. Verifique o dia e o mês.");
        return; 
      }
      
      const daysInMonth = new Date(year, month, 0).getDate();
      if (day > daysInMonth) {
         setDateError(`Data inválida. O mês ${month} só tem ${daysInMonth} dias.`);
         return;
      }
    }

    let formattedDateForBackend = null;
    if (editingVisitDate && editingVisitDate.length === 10) {
      const [day, month, year] = editingVisitDate.split('/');
      formattedDateForBackend = `${year}-${month}-${day}`;
    }

    const newColumns = { ...columns };
    for (const colId in newColumns) {
      const column = newColumns[colId];
      const leadIndex = column.leads.findIndex(l => l.id === selectedLead.id);

      if (leadIndex !== -1) {
        newColumns[colId].leads[leadIndex] = {
          ...newColumns[colId].leads[leadIndex],
          tag: editingTag,
          visitDate: formattedDateForBackend 
        };
        break; 
      }
    }

    updateLeadOnServer(selectedLead.id, { 
      tags: [editingTag],
      visitDate: formattedDateForBackend 
    });

    setColumns(newColumns);
    updateTodayNotifications(newColumns); 
    setSelectedLead(null);
  }

  function getVisitsForDate(dateStr: string): Lead[] {
    const visits: Lead[] = [];
    for (const colId in columns) {
      columns[colId].leads.forEach(lead => {
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
      days.push(<div key={`empty-${i}`} className="h-20 border border-border/30 bg-muted/20"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const visits = getVisitsForDate(dateStr);

      days.push(
        <div 
          key={dateStr} 
          onClick={() => setSelectedDateView(dateStr)}
          className={`h-20 border border-border/50 p-1 flex flex-col gap-1 cursor-pointer transition-colors hover:bg-accent/30 relative
            ${isToday ? 'bg-primary/5 border-primary/30' : 'bg-card'}
          `}
        >
          <span className={`text-xs font-medium ml-1 ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
            {day}
          </span>
          
          <div className="flex flex-col gap-1 overflow-hidden px-1">
            {visits.slice(0, 3).map((v, i) => (
               <div key={i} className="w-full h-1.5 bg-blue-500 rounded-full" title={v.name}></div>
            ))}
            {visits.length > 3 && (
               <span className="text-[9px] text-muted-foreground leading-none font-bold">+ {visits.length - 3}</span>
            )}
          </div>
        </div>
      );
    }

    return days;
  }

  const currentLeadColumnId = getLeadColumnId(selectedLead?.id);
  const availableTags = currentLeadColumnId ? columnAllowedTags[currentLeadColumnId] : [];
  
  const showVisitDate = currentLeadColumnId && ['negociacao', 'cadastro', 'finalizado'].includes(currentLeadColumnId);

  return (
    <div className="h-screen w-full flex bg-background text-foreground transition-colors duration-300 overflow-hidden">
      
      <aside className="w-80 border-r border-border bg-card/30 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">Notificações</h2>
          {notifications.length > 0 && (
            <Badge variant="destructive" className="ml-auto">{notifications.length}</Badge>
          )}
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            
            {notifications.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground p-4 bg-card rounded-lg border border-dashed border-border mt-4">
                Nenhuma visita agendada para hoje.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => handleNotificationClick(notif.leadId)}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer shadow-sm"
                >
                  {notif.type === 'warning' && <AlertCircle size={18} className="text-orange-500 mt-1" />}
                  {notif.type === 'success' && <CheckCircle2 size={18} className="text-green-500 mt-1" />}
                  {notif.type === 'info' && <Clock size={18} className="text-blue-500 mt-1" />}
                  <div className="flex-1">
                    <p className="text-sm font-bold leading-none text-foreground">{notif.title}</p>
                    <p className="text-[11px] font-medium text-muted-foreground mt-1.5 uppercase tracking-wider">{notif.time}</p>
                  </div>
                </div>
              ))
            )}
            
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-border flex flex-col gap-3">
          <Button 
            variant="ghost" 
            className="w-full gap-2 justify-start h-12 text-md border border-dashed border-border hover:bg-accent hover:border-solid"
            onClick={() => navigate('/leads-list')}
          >
            <List size={18} />
            Gerenciar Leads
          </Button>

          <Dialog open={isCalendarOpen} onOpenChange={(open) => {
             setIsCalendarOpen(open);
             if(!open) setSelectedDateView(null); 
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2 justify-start h-12 text-md">
                <CalendarIcon size={18} />
                Ver Calendário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              
              {!selectedDateView ? (
                <>
                  <DialogHeader className="flex flex-row items-center justify-between mb-4">
                    <DialogTitle className="text-xl">
                       {currentMonthDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())}
                    </DialogTitle>
                    <div className="flex gap-2">
                       <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                          <ChevronLeft size={16} />
                       </Button>
                       <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
                          <ChevronRight size={16} />
                       </Button>
                    </div>
                  </DialogHeader>
                  
                  <div className="w-full">
                    <div className="grid grid-cols-7 gap-0 mb-1">
                       {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                          <div key={d} className="text-center text-xs font-bold text-muted-foreground uppercase">{d}</div>
                       ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0 rounded-md overflow-hidden border border-border/50">
                       {renderCalendarGrid()}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <DialogHeader className="flex flex-row items-center gap-4 mb-4">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDateView(null)}>
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
                           getVisitsForDate(selectedDateView).map(lead => (
                              <Card 
                                key={lead.id} 
                                className="border-l-4 border-l-blue-500 shadow-sm cursor-pointer hover:bg-accent/30"
                                onClick={() => {
                                  setIsCalendarOpen(false);
                                  setSelectedLead(lead);
                                }}
                              >
                                 <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                       <h4 className="font-bold text-lg">{lead.name}</h4>
                                       <p className="text-sm text-muted-foreground">Em: {reverseStageMap[getLeadColumnId(lead.id) || ''] || 'Desconhecido'}</p>
                                    </div>
                                    <Badge variant="outline" className="uppercase text-[10px]">{lead.tag}</Badge>
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
        
        <header className="w-full p-6 border-b border-border flex justify-between items-center bg-card/50 backdrop-blur-sm">
          <h1 className="text-xl font-bold tracking-tight text-primary">
            O.S <span className="text-foreground font-normal">Dashboard</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-accent/20 border border-border/50 mr-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <User size={18} />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-sm font-semibold leading-none">{userProfile.name}</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  {userProfile.role}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button variant="destructive" onClick={handleLogout} className="gap-2 font-bold shadow-sm">
              <LogOut size={18} />
              SAIR
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-hidden flex flex-col bg-background/50">
          
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col h-full gap-4">
              
              <div className="flex-1 grid grid-cols-5 gap-4 min-h-0">
                {['novos', 'contato', 'negociacao', 'cadastro', 'finalizado'].map((colId) => {
                  const column = columns[colId];
                  return (
                    <div key={colId} className="flex flex-col h-full rounded-xl border border-border bg-card/40 overflow-hidden">
                      <div className="p-3 border-b border-border bg-accent/30 flex justify-between items-center">
                        <h3 className="font-bold text-sm uppercase tracking-wider">{column.title}</h3>
                        <Badge variant="secondary" className="text-xs">{column.leads.length}</Badge>
                      </div>

                      <Droppable droppableId={colId}>
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`flex-1 p-2 space-y-2 overflow-y-auto transition-colors ${
                              snapshot.isDraggingOver ? 'bg-accent/20' : ''
                            }`}
                          >
                            {column.leads.map((lead, index) => (
                              <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                {(provided, snapshot) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onDoubleClick={() => setSelectedLead(lead)}
                                    className={`
                                      cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4
                                      ${tagColors[lead.tag] || 'border-l-gray-500'} 
                                      ${snapshot.isDragging ? 'opacity-90 scale-105 shadow-xl rotate-2' : ''}
                                    `}
                                  >
                                    <CardContent className="p-3">
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="font-semibold text-sm line-clamp-1">{lead.name}</span>
                                        <GripVertical size={14} className="text-muted-foreground/50 shrink-0" />
                                      </div>
                                      
                                      <div className="flex justify-between items-end mt-2">
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 font-normal uppercase">
                                          {lead.tag}
                                        </Badge>
                                        
                                        {lead.visitDate && (
                                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 px-2 py-0.5 rounded-md shadow-sm">
                                            <CalendarIcon size={12} strokeWidth={2.5} />
                                            {formatDisplayDate(lead.visitDate)}
                                          </div>
                                        )}
                                      </div>
                                      
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>

              <div className="h-32 rounded-xl border border-border border-dashed bg-card/20 flex flex-col shrink-0">
                 <div className="p-2 px-4 border-b border-border/50 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-muted-foreground">Sem Interesse / Fora de Perfil</span>
                 </div>
                 
                 <Droppable droppableId="arquivo" direction="horizontal">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 p-2 flex gap-4 overflow-x-auto items-center ${
                          snapshot.isDraggingOver ? 'bg-red-500/10' : ''
                        }`}
                      >
                        {columns['arquivo'].leads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="w-48 bg-background border border-border rounded-md p-3 shadow-sm flex flex-col gap-1 opacity-70 hover:opacity-100"
                              >
                                <span className="font-bold text-xs truncate">{lead.name}</span>
                                <Badge variant="secondary" className="text-[10px] w-fit">{lead.tag}</Badge>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                 </Droppable>
              </div>

            </div>
          </DragDropContext>

        </main>
      </div>

      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedLead?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Alterar Etiqueta</h4>
              
              {availableTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setEditingTag(tag)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-bold uppercase border-2 transition-all flex items-center gap-2
                        ${tagColors[tag].split(' ')[0]} text-white
                        ${editingTag === tag ? 'ring-2 ring-offset-2 ring-primary border-transparent scale-105' : 'border-transparent opacity-70 hover:opacity-100'}
                      `}
                    >
                      {tag}
                      {editingTag === tag && <Check size={12} strokeWidth={4} />}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma etiqueta disponível para esta coluna.</p>
              )}
            </div>

            {showVisitDate && (
              <div className="space-y-3 pt-2 border-t border-border/50">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Agendar Visita</h4>
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
                       className={`flex h-10 w-full rounded-md border bg-card px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${dateError ? 'border-red-500 focus-visible:ring-red-500' : 'border-input'}`}
                     />
                   </div>
                   {editingVisitDate && (
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={() => {
                         setEditingVisitDate('');
                         setDateError(null);
                       }} 
                       className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                     >
                        Remover
                     </Button>
                   )}
                </div>
                {dateError && (
                  <p className="text-xs text-red-500 font-medium mt-1 ml-1">{dateError}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2 pt-2 border-t border-border/50">
              <Button 
                 variant="outline" 
                 className="w-full gap-2 justify-start h-12 text-md bg-accent/20 hover:bg-accent/40"
                 onClick={() => {
                    setSelectedLead(null); 
                    setIsDetailsModalOpen(true); 
                 }}
              >
                <ExternalLink size={18} className="text-primary" />
                Ver Histórico e Detalhes Completos
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
               <Button variant="ghost" onClick={() => setSelectedLead(null)}>Cancelar</Button>
               <Button onClick={handleSaveLead} className="bg-primary hover:bg-primary/90">
                 Salvar Alterações
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
           <DialogHeader>
             <DialogTitle>Detalhes Completos do Lead</DialogTitle>
           </DialogHeader>
           <div className="flex-1 flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg mt-4">
              (Em breve) Tela de detalhes e linha do tempo de contatos...
           </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}