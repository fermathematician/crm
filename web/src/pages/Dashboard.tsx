import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';

import { 
  Moon, Sun, LogOut, Bell, Calendar as CalendarIcon, 
  CheckCircle2, AlertCircle, Clock, User, GripVertical, Check 
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { Calendar } from "../components/ui/calendar";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../components/ui/dialog";

type LeadTag = 'frio' | 'morno' | 'quente' | 'a contactar' | 'sem resposta' | 'promessa' | 'parcial' | 'completa' | 'aprovado' | 'recusado' | 'sem interesse' | 'novo';

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
}

interface Column {
  id: string;
  title: string;
  leads: Lead[];
}

const initialBoard: Record<string, Column> = {
  'novos': {
    id: 'novos', title: 'Novos / Entrada',
    leads: [
      { id: '1', name: 'Ricardo Oliveira', tag: 'novo' },
    ]
  },
  'contato': {
    id: 'contato', title: 'Contato',
    leads: [
      { id: '2', name: 'Ana Silva', tag: 'a contactar' },
      { id: '3', name: 'João Santos', tag: 'sem resposta' },
    ]
  },
  'negociacao': {
    id: 'negociacao', title: 'Em Negociação',
    leads: [
      { id: '4', name: 'Empresa XYZ', tag: 'morno' },
      { id: '5', name: 'Carlos Ferreira', tag: 'quente' },
    ]
  },
  'cadastro': {
    id: 'cadastro', title: 'Cadastro',
    leads: [
      { id: '6', name: 'Juliana Costa', tag: 'parcial' },
    ]
  },
  'finalizado': {
    id: 'finalizado', title: 'Finalizado',
    leads: [
      { id: '7', name: 'Roberto Lima', tag: 'aprovado' },
    ]
  },
  'arquivo': {
    id: 'arquivo', title: 'Sem Interesse / Fora de Perfil',
    leads: [
      { id: '8', name: 'Lead Antigo', tag: 'sem interesse' },
    ]
  }
};

const notifications = [
  { id: 1, title: "Reunião com Cliente A", time: "10:00", type: "warning" },
  { id: 2, title: "Lead 'Gabriel' avançou", time: "11:30", type: "success" },
  { id: 3, title: "Novo cadastro", time: "17:00", type: "info" },
];

export function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const [columns, setColumns] = useState(initialBoard);
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingTag, setEditingTag] = useState<LeadTag | null>(null);

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/');
  }

  useEffect(() => {
    if (selectedLead) {
      setEditingTag(selectedLead.tag);
    }
  }, [selectedLead]);

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
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    
    const sourceItems = [...sourceCol.leads];
    const destItems = source.droppableId === destination.droppableId ? sourceItems : [...destCol.leads];

    const [removed] = sourceItems.splice(source.index, 1);
    
    if (source.droppableId !== destination.droppableId) {
      const defaultTag = columnDefaultTags[destination.droppableId];
      if (defaultTag) {
        removed.tag = defaultTag;
      }
    }

    destItems.splice(destination.index, 0, removed);

    setColumns({
      ...columns,
      [source.droppableId]: { ...sourceCol, leads: sourceItems },
      [destination.droppableId]: { ...destCol, leads: destItems }
    });
  }

  function handleSaveLead() {
    if (!selectedLead || !editingTag) return;

    const newColumns = { ...columns };
    for (const colId in newColumns) {
      const column = newColumns[colId];
      const leadIndex = column.leads.findIndex(l => l.id === selectedLead.id);

      if (leadIndex !== -1) {
        newColumns[colId].leads[leadIndex] = {
          ...newColumns[colId].leads[leadIndex],
          tag: editingTag
        };
        break; 
      }
    }

    setColumns(newColumns);
    setSelectedLead(null);
  }

  const currentLeadColumnId = getLeadColumnId(selectedLead?.id);
  const availableTags = currentLeadColumnId ? columnAllowedTags[currentLeadColumnId] : [];

  return (
    <div className="h-screen w-full flex bg-background text-foreground transition-colors duration-300 overflow-hidden">
      
      <aside className="w-80 border-r border-border bg-card/30 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">Notificações</h2>
          <Badge variant="destructive" className="ml-auto">3</Badge>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div key={notif.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                {notif.type === 'warning' && <AlertCircle size={18} className="text-yellow-500 mt-1" />}
                {notif.type === 'success' && <CheckCircle2 size={18} className="text-green-500 mt-1" />}
                {notif.type === 'info' && <Clock size={18} className="text-blue-500 mt-1" />}
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none">{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">Hoje, às {notif.time}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-border">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2 justify-start h-12 text-md">
                <CalendarIcon size={18} />
                Ver Calendário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Agendamentos</DialogTitle></DialogHeader>
              <div className="flex justify-center p-4">
                <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border shadow" />
              </div>
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
                <span className="text-sm font-semibold leading-none">Fernando Vieira</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Admin</span>
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
                                        <GripVertical size={14} className="text-muted-foreground/50" />
                                      </div>
                                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 font-normal uppercase">
                                        {lead.tag}
                                      </Badge>
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
            
            <div className="space-y-2 bg-accent/20 p-4 rounded-lg">
              <h4 className="font-bold text-sm">Histórico de Contato</h4>
              <p className="text-sm text-muted-foreground">Nenhum registro de contato recente.</p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
               <Button variant="outline" onClick={() => setSelectedLead(null)}>Cancelar</Button>
               <Button onClick={handleSaveLead} className="bg-primary hover:bg-primary/90">
                 Salvar Alterações
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}