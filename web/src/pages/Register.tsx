import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { Moon, Sun, User, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "../components/ui/card";

export function Register() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Novos estados para o cadastro
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleRegister (e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json'
        },
        body: JSON.stringify({name, email, password}) 
      });

      const data = await response.json();

      if(!response.ok) {
        alert(data.message);
        return;
      }

      // Sucesso
      alert("Cadastro realizado com sucesso!");
      navigate('/');

    } catch(error) {
      console.error(error);
      alert("Erro ao conectar com o servidor");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <header className="w-full p-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          O.S <span className="text-foreground font-normal">Inteligência Financeira</span>
        </h1>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl shadow-black/50 border-border py-8">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold text-foreground">Crie sua conta</CardTitle>
            <CardDescription className="text-muted-foreground">
              Preencha os dados abaixo para começar
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister}>
              <div className="space-y-4">
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="name" 
                      placeholder="Digite seu nome completo"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="pl-10 py-6 bg-background focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="email" type="email" placeholder="seu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
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
                      placeholder="Digite uma senha"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10 pr-10 py-6 bg-background focus-visible:ring-primary"
                    />
                    <Button
                      type="button" variant="ghost" size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Digite a senha novamente"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 py-6 bg-background focus-visible:ring-primary"
                    />
                    <Button
                      type="button" variant="ghost" size="icon"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-primary"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

              </div>

              <Button type="submit" className="w-full text-lg font-bold py-6 mt-10 bg-primary text-primary-foreground hover:bg-primary-hover">
                CRIAR CONTA
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <div className="text-sm text-muted-foreground">
              Já possui uma conta?{" "}
              <Link to="/" className="text-primary hover:text-primary-hover font-medium hover:underline">
                Fazer login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}