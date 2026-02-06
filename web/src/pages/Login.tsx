import React, { useState } from 'react';
import { Moon, Sun, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

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
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark">
      
      <header className="w-full p-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          O.S <span className="text-text-main-light dark:text-text-main-dark font-normal">Inteligência Financeira</span>
        </h1>

        <button 
          onClick={toggleTheme}
          className="p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Alternar Tema"
        >
          {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        
        <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark p-10 rounded-2xl shadow-2xl border border-border-light dark:border-border-dark transition-all duration-300">
          
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-3">Bem-vindo</h2>
            <p className="text-base text-text-muted-light dark:text-text-muted-dark">
              Faça login para acessar o sistema
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            
            <div className="space-y-2">
              <label className="text-base font-medium ml-1">Email</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark">
                  <User size={20} /> {/* Ícone maior */}
                </div>
                <input 
                  type="email" 
                  placeholder="Seu email de acesso"
                  value={email}
                  onChange={ (e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-base rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary transition-colors placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-base font-medium ml-1">Senha</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark">
                  <Lock size={20} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Sua senha"
                  value={password}
                  onChange={ (e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 text-base rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary transition-colors placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover text-white text-lg font-bold py-3 rounded-xl transition-all duration-200 mt-8 shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]"
            >
              ENTRAR
            </button>

          </form>

          <div className="mt-8 text-center text-base">
            <span className="text-text-muted-light dark:text-text-muted-dark">Não possui uma conta? </span>
            <a href="#" className="text-primary hover:text-primary-hover font-semibold hover:underline">
              Fale com o suporte
            </a>
          </div>

        </div>
      </main>
    </div>
  );
}