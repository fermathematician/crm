import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { Moon, Sun, LogOut, ArrowLeft, User, BarChart3, Users, Eye } from 'lucide-react';
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select"; 

// Nova interface para o tipo de Usuário
interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created: string;
}

export function Reports() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState<{ name: string, role: string }>({
    name: "Carregando...",
    role: "USER"
  });

  const [usersList, setUsersList] = useState<ApiUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Estado para as métricas do topo
  const [metrics, setMetrics] = useState({ totalLeads: 0, closedLeads: 0, negotiationLeads: 0 });

  useEffect(() => {
    async function fetchProfileAndUsers() {
      const token = localStorage.getItem('token');
      if(!token) { navigate('/'); return; }

      try {
        // 1. Puxa o Perfil
        const profileRes = await fetch('http://localhost:3000/auth/me', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (profileRes.status === 401) { handleLogout(); return; }

        const userData = await profileRes.json();
        
        if (userData.role !== 'ADMIN') {
          navigate('/dashboard');
          return;
        }
        setUserProfile({ name: userData.name, role: userData.role });

        // 2. Se for Admin, puxa a lista de usuários
        const usersRes = await fetch('http://localhost:3000/auth/users', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsersList(usersData);
        }

        // 3. Puxa as Métricas Globais da Empresa
        const metricsRes = await fetch('http://localhost:3000/auth/metrics/global', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
        }

      } catch (error){ 
        console.error("Erro ao carregar dados: ", error); 
      } finally {
        setLoadingUsers(false);
      }
    }

    fetchProfileAndUsers();
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/');
  }

  // Função para alterar o cargo no banco de dados e atualizar a tela
  async function handleRoleChange(userId: string, newRole: string) {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3000/auth/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        // Atualiza a tabela na tela sem precisar recarregar
        setUsersList(usersList.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
      } else {
        alert("Erro ao alterar cargo do usuário.");
      }
    } catch (error) {
      console.error("Erro ao atualizar cargo:", error);
    }
  }

  return (
    <div className="h-screen w-full flex bg-background text-foreground transition-colors duration-300 overflow-hidden">
      
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="w-full p-6 border-b border-border flex justify-between items-center bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/dashboard')}>
                 <ArrowLeft size={16} /> Voltar ao DashBoard
             </Button>
             <h1 className="text-xl font-bold tracking-tight border-l border-border pl-4">Painel Gerencial</h1>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-accent/20 border border-border/50 mr-2 hidden md:flex">
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
             
             <Button variant="destructive" size="sm" onClick={handleLogout}>
               <LogOut size={16} className="mr-2" />
               Sair
             </Button>
          </div>
        </header>

        {/* CONTEÚDO DA PÁGINA */}
        <main className="flex-1 p-8 overflow-y-auto bg-background/50">
          <div className="max-w-6xl mx-auto space-y-8">
            
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <BarChart3 size={28} className="text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Visão Geral da Empresa</h2>
                <p className="text-muted-foreground text-sm mt-1">Métricas gerais e desempenho de toda a equipe.</p>
              </div>
            </div>

            {/* Template de Gráficos Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="h-40 rounded-xl border border-border bg-card flex flex-col items-center justify-center text-muted-foreground shadow-sm hover:border-primary/50 transition-colors">
                 <span className="text-3xl font-bold text-foreground mb-2">{metrics.totalLeads}</span>
                 <span className="text-sm uppercase tracking-wider">Total de Leads</span>
               </div>
               
               <div className="h-40 rounded-xl border border-border bg-card flex flex-col items-center justify-center text-muted-foreground shadow-sm hover:border-primary/50 transition-colors">
                 <span className="text-3xl font-bold text-green-500 mb-2">{metrics.closedLeads}</span>
                 <span className="text-sm uppercase tracking-wider">Contratos Fechados</span>
               </div>
               
               <div className="h-40 rounded-xl border border-border bg-card flex flex-col items-center justify-center text-muted-foreground shadow-sm hover:border-primary/50 transition-colors">
                 <span className="text-3xl font-bold text-blue-500 mb-2">{metrics.negotiationLeads}</span>
                 <span className="text-sm uppercase tracking-wider">Em Negociação</span>
               </div>
            </div>

            {/* SECÃO DA EQUIPE (TABELA) */}
            <div className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Users size={24} className="text-primary" />
                <h3 className="text-xl font-bold">Gestão da Equipe</h3>
              </div>

              <div className="rounded-md border border-border bg-card overflow-hidden shadow-sm max-h-[400px] flex flex-col">
                 <ScrollArea className="flex-1">
                   <table className="w-full text-sm text-left whitespace-nowrap">
                     <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border sticky top-0 backdrop-blur-sm z-10">
                       <tr>
                         <th className="px-6 py-4 font-medium">Nome do Colaborador</th>
                         <th className="px-6 py-4 font-medium">E-mail</th>
                         <th className="px-6 py-4 font-medium w-48">Cargo / Nível</th>
                         <th className="px-6 py-4 text-right font-medium">Ações</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-border">
                       {loadingUsers ? (
                         <tr>
                           <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                             Carregando equipe...
                           </td>
                         </tr>
                       ) : usersList.length === 0 ? (
                         <tr>
                           <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                             Nenhum usuário encontrado.
                           </td>
                         </tr>
                       ) : (
                         usersList.map((user) => (
                           <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                             <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-3">
                               <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground">
                                 <User size={14} />
                               </div>
                               {user.name}
                             </td>
                             <td className="px-6 py-4 text-muted-foreground">
                                {user.email}
                             </td>
                             <td className="px-6 py-4">
                               <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value)}>
                                  <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Selecione o cargo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="SALES">Vendedor (SALES)</SelectItem>
                                      <SelectItem value="ADMIN">Administrador (ADMIN)</SelectItem>
                                  </SelectContent>
                               </Select>
                             </td>
                             <td className="px-6 py-4 text-right">
                               <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-2"
                                  onClick={() => navigate(`/reports/user/${user.id}`)}
                               >
                                  <Eye size={14} />
                                  Ver Desempenho
                               </Button>
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
        </main>

      </div>
    </div>
  );
}