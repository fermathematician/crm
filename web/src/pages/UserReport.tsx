import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { Moon, Sun, LogOut, ArrowLeft, User, Phone, CheckCircle2, Target } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface UserMetrics {
  user: { name: string; email: string; role: string };
  totalLeads: number;
  totalInteractions: number;
  leadsByStage: { stage: string; count: number }[];
}

const stageColors: Record<string, string> = {
  'NOVO': '#64748b',       
  'CONTATO': '#3b82f6',    
  'NEGOCIACAO': '#f97316', 
  'CADASTRO': '#a855f7',   
  'FINALIZADO': '#16a34a', 
  'SEM_INTERESSE': '#52525b' 
};

// Nomes amigáveis para o gráfico
const stageNames: Record<string, string> = {
  'NOVO': 'Novos',
  'CONTATO': 'Contato',
  'NEGOCIACAO': 'Negociação',
  'CADASTRO': 'Cadastro',
  'FINALIZADO': 'Finalizados',
  'SEM_INTERESSE': 'Perdidos'
};

export function UserReport() {
  const { id } = useParams<{ id: string }>(); 
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserMetrics | null>(null);

  useEffect(() => {
    async function fetchUserMetrics() {
      const token = localStorage.getItem('token');
      if(!token) { navigate('/'); return; }

      try {
        const response = await fetch(`http://localhost:3000/auth/users/${id}/metrics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          console.error("Erro ao buscar métricas");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserMetrics();
  }, [id, navigate]);

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/');
  }

  const chartData = Object.keys(stageNames).map(key => {
    const found = data?.leadsByStage.find(item => item.stage === key);
    return {
      name: stageNames[key],
      quantidade: found ? found.count : 0,
      color: stageColors[key]
    };
  });

  const closedCount = data?.leadsByStage.find(s => s.stage === 'FINALIZADO')?.count || 0;
  const conversionRate = data?.totalLeads ? ((closedCount / data.totalLeads) * 100).toFixed(1) : "0.0";

  return (
    <div className="h-screen w-full flex bg-background text-foreground transition-colors duration-300 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="w-full p-6 border-b border-border flex justify-between items-center bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/reports')}>
                 <ArrowLeft size={16} /> Voltar para Equipe
             </Button>
             <h1 className="text-xl font-bold tracking-tight border-l border-border pl-4">
               Desempenho Individual
             </h1>
          </div>

          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={toggleTheme}>
               {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
             </Button>
             <Button variant="destructive" size="sm" onClick={handleLogout}>
               <LogOut size={16} className="mr-2" />
               Sair
             </Button>
          </div>
        </header>

        {/* CONTEÚDO */}
        <main className="flex-1 p-8 overflow-y-auto bg-background/50">
          {loading || !data ? (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              Carregando relatório do usuário...
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-8">
              
              <div className="flex items-center gap-4 p-6 bg-card border border-border rounded-xl shadow-sm">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <User size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{data.user.name}</h2>
                  <p className="text-muted-foreground">{data.user.email}</p>
                </div>
                <Badge variant={data.user.role === 'ADMIN' ? 'default' : 'secondary'} className="ml-auto text-sm">
                  {data.user.role}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 
                 <div className="p-6 rounded-xl border border-border bg-card flex flex-col justify-center shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                     <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Carteira de Leads</span>
                     <Target className="text-blue-500" size={20} />
                   </div>
                   <span className="text-4xl font-bold text-foreground">{data.totalLeads}</span>
                   <p className="text-xs text-muted-foreground mt-2">Leads atribuídos a este usuário</p>
                 </div>

                 <div className="p-6 rounded-xl border border-border bg-card flex flex-col justify-center shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                     <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Interações Feitas</span>
                     <Phone className="text-orange-500" size={20} />
                   </div>
                   <span className="text-4xl font-bold text-foreground">{data.totalInteractions}</span>
                   <p className="text-xs text-muted-foreground mt-2">Somas de notas, ligações e e-mails</p>
                 </div>

                 <div className="p-6 rounded-xl border border-border bg-card flex flex-col justify-center shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                     <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Taxa de Conversão</span>
                     <CheckCircle2 className="text-green-500" size={20} />
                   </div>
                   <span className="text-4xl font-bold text-green-500">{conversionRate}%</span>
                   <p className="text-xs text-muted-foreground mt-2">Baseado no total de contratos fechados</p>
                 </div>

              </div>

              <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
                <h3 className="text-lg font-bold mb-6">Distribuição de Leads no Funil</h3>
                
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#e5e7eb'} vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke={theme === 'dark' ? '#888' : '#6b7280'} 
                        tick={{ fill: theme === 'dark' ? '#a1a1aa' : '#4b5563', fontSize: 12 }}
                      />
                      <YAxis 
                        stroke={theme === 'dark' ? '#888' : '#6b7280'}
                        tick={{ fill: theme === 'dark' ? '#a1a1aa' : '#4b5563', fontSize: 12 }}
                        allowDecimals={false}
                      />
                     <Tooltip 
                        cursor={{ fill: theme === 'dark' ? '#27272a' : '#f3f4f6' }}
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
                          borderColor: theme === 'dark' ? '#3f3f46' : '#e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }} 
                        formatter={(value: any) => [`${value} Leads`, "Quantidade"]}
                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: theme === 'dark' ? '#d4d4d8' : '#374151' }}
                        itemStyle={{ color: theme === 'dark' ? '#e4e4e7' : '#1f2937' }}
                      />
                      <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </main>

      </div>
    </div>
  );
}