import React, { useState } from 'react';
import { Moon, Sun, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Link } from 'react-router-dom';

// Importações do shadcn
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";

export function Login() {
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json'
        },
        body: JSON.stringify({email, password}) 
      });

      const data = await response.json();

      if(!response.ok) {
        alert(data.message);
        return;
      }

      console.log("TOKEN: ", data.token);
      localStorage.setItem("token", data.token);

      alert("Login realizado com sucesso!");
    } catch(error) {
      console.error(error);
      alert("Erro ao conectar com o servidor");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      
      <header className="w-full p-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          O.S <span className="text-foreground font-normal">Inteligência Financeira</span>
        </h1>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          title="Alternar Tema"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl shadow-black/50 border-border py-8">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold text-foreground">Bem-vindo</CardTitle>
            <CardDescription className="text-muted-foreground">
              Faça login para acessar o sistema
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="Seu email de acesso"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 py-6 bg-background focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 py-6 bg-background focus-visible:ring-primary"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-primary"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full text-lg font-bold py-6 mt-1 bg-primary text-primary-foreground hover:bg-primary-hover"
              >
                ENTRAR
              </Button>

            </form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <div className="text-sm text-muted-foreground">
              Não possui uma conta?{" "}
              <Link to="/register" className="text-primary hover:text-primary-hover font-medium hover:underline">
                Faça sua conta
              </Link>
            </div>
          </CardFooter>
        </Card>

      </main>
    </div>
  );
}