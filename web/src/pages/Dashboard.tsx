import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Moon, Sun, LogOut, Bell, Calendar as CalendarIcon, 
  CheckCircle2, AlertCircle, Clock, User
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { Calendar } from "../components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

// Dados fictícios de notificação para visualizarmos o layout
const notifications = [
  { id: 1, title: "Reunião com Cliente A", time: "10:00", type: "warning" },
  { id: 2, title: "Lead 'Gabriel' avançou", time: "11:30", type: "success" },
  { id: 3, title: "Atualizar planilha", time: "14:00", type: "info" },
  { id: 4, title: "Retorno pendente", time: "16:45", type: "warning" },
  { id: 5, title: "Novo cadastro", time: "17:00", type: "info" },
];

export function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/');
  }

  return (
    // MUDANÇA 1: h-screen e overflow-hidden para o layout não rolar a página inteira, apenas as áreas internas
    <div className="h-screen w-full flex bg-background text-foreground transition-colors duration-300 overflow-hidden">
      
      {/* --- BARRA LATERAL (NOTIFICAÇÕES) --- */}
      <aside className="w-80 border-r border-border bg-card/30 flex flex-col">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">Notificações</h2>
          <Badge variant="destructive" className="ml-auto">5</Badge>
        </div>

        {/* Lista de Notificações com Scroll */}
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

        {/* Botão/Rodapé da Sidebar que abre o Calendário */}
        <div className="p-4 border-t border-border">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2 justify-start h-12 text-md">
                <CalendarIcon size={18} />
                Ver Calendário Completo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Calendário de Agendamentos</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center p-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border shadow"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </aside>

      {/* --- ÁREA PRINCIPAL (HEADER + CONTEÚDO) --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header (Igual ao anterior, mas agora dentro da área principal) */}
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


            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Alternar Tema">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
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

        {/* Conteúdo Principal (Onde vai entrar o Kanban) */}
        <main className="flex-1 p-8 overflow-y-auto bg-background/50">
          
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">Gestão de Leads</h2>
              <p className="text-muted-foreground">Arraste os cards para atualizar o status</p>
            </div>

            {/* Placeholder para as colunas do Kanban (Próximo Passo) */}
            <div className="border-2 border-dashed border-border rounded-lg h-96 flex items-center justify-center text-muted-foreground bg-accent/20">
              Aqui entrarão as 5 colunas verticais e a horizontal de "Sem interesse"
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}