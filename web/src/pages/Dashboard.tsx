import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

import { Button } from "../components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "../components/ui/card";

export function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/');
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      
      <header className="w-full p-6 border-b border-border flex justify-between items-center bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-tight text-primary">
          O.S <span className="text-foreground font-normal">Dashboard</span>
        </h1>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme} title="Alternar Tema">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          
          {/* Botão de Logout */}
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

      <main className="flex-1 p-8 container mx-auto">
        <div className="grid gap-6">
          
          <Card className="border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">Bem-vindo ao Sistema</CardTitle>
              <CardDescription>
                Painel de Controle de Inteligência Financeira
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Você está autenticado com sucesso. 
              </p>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}