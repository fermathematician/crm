import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Moon, Sun, LogOut, Plus, Pencil, Trash2, Search, ArrowLeft, Filter, Phone, Building2, 
  Mail, MapPin, FileText
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select"; 

interface ApiLead {
  id: string;
  companyName: string;
  cnpj: string | null;
  cnae: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  funnelStage: 'NOVO' | 'CONTATO' | 'NEGOCIACAO' | 'CADASTRO' | 'FINALIZADO' | 'SEM_INTERESSE';
  tags: string[];
}

// --- FUNÇÕES DE MÁSCARA ---
const maskCNPJ = (value: string) => {
  value = value.replace(/\D/g, ""); // Remove tudo o que não é dígito
  if (value.length > 14) value = value.slice(0, 14); // Limita a 14 dígitos
  if (value.length > 2) value = `${value.slice(0,2)}.${value.slice(2)}`;
  if (value.length > 6) value = `${value.slice(0,6)}.${value.slice(6)}`;
  if (value.length > 10) value = `${value.slice(0,10)}/${value.slice(10)}`;
  if (value.length > 15) value = `${value.slice(0,15)}-${value.slice(15)}`;
  return value;
};

const maskPhone = (value: string) => {
  value = value.replace(/\D/g, ""); // Remove tudo o que não é dígito
  if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos
  if (value.length > 2) value = `(${value.slice(0,2)}) ${value.slice(2)}`;
  if (value.length > 9) value = `${value.slice(0,10)}-${value.slice(10)}`;
  return value;
};

const maskCNAE = (value: string) => {
  value = value.replace(/\D/g, ""); // Remove tudo o que não é dígito
  if (value.length > 7) value = value.slice(0, 7); // Limita a 7 dígitos
  if (value.length > 4) value = `${value.slice(0,4)}-${value.slice(4)}`;
  if (value.length > 6) value = `${value.slice(0,6)}/${value.slice(6)}`;
  return value;
};

export function LeadsList() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Estados de Dados
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('ALL');

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<ApiLead | null>(null);

  // Estado do Formulário
  const [formData, setFormData] = useState({ 
    companyName: '', 
    cnpj: '',
    cnae: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    address: '',
    funnelStage: 'NOVO' 
  });

  async function fetchLeads() {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    try {
      const response = await fetch('http://localhost:3000/auth/leads', { 
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) { 
        localStorage.removeItem('token');
        navigate('/'); 
        return; 
      }

      const data = await response.json();
      setLeads(data);
    } catch (error) { 
      console.error("Erro ao buscar leads:", error); 
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLeads(); }, []);

  // --- DELETAR LEAD (DELETE) ---
  async function handleDelete(id: string) {
    if(!confirm("Tem certeza que deseja excluir este lead permanentemente?")) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3000/auth/leads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setLeads(leads.filter(lead => lead.id !== id)); 
      } else {
        alert("Erro ao excluir lead");
      }
    } catch (error) { 
      console.error("Erro ao deletar:", error); 
    }
  }

  async function handleSave() {
    const token = localStorage.getItem('token');
    
    const isEditing = !!editingLead;
    const url = isEditing 
      ? `http://localhost:3000/auth/leads/update` 
      : `http://localhost:3000/auth/leads`; 
    
    const method = isEditing ? 'PUT' : 'POST';
    
    const body = isEditing 
      ? { lead_id: editingLead.id, ...formData }
      : { ...formData, tags: ['novo'] };

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchLeads(); 
      } else {
        alert("Erro ao salvar lead");
      }
    } catch (error) { 
      console.error("Erro ao salvar:", error); 
    }
  }

  // --- FUNÇÕES AUXILIARES DO MODAL ---
  function openNewModal() {
    setEditingLead(null);
    setFormData({ 
      companyName: '', 
      cnpj: '', 
      cnae: '', 
      phone: '', 
      email: '', 
      city: '', 
      state: '', 
      address: '', 
      funnelStage: 'NOVO' 
    });
    setIsModalOpen(true);
  }

  function openEditModal(lead: ApiLead) {
    setEditingLead(lead);
    setFormData({ 
      companyName: lead.companyName, 
      cnpj: lead.cnpj || '',
      cnae: lead.cnae || '',
      phone: lead.phone || '',
      email: lead.email || '',
      city: lead.city || '',
      state: lead.state || '',
      address: lead.address || '',
      funnelStage: lead.funnelStage
    });
    setIsModalOpen(true);
  }

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = 
      lead.companyName.toLowerCase().includes(searchLower) || 
      (lead.phone && lead.phone.includes(searchLower)) ||
      (lead.cnpj && lead.cnpj.includes(searchLower));
    
    const matchesStage = filterStage === 'ALL' || lead.funnelStage === filterStage;

    return matchesSearch && matchesStage;
  });

  return (
    <div className="h-screen w-full flex bg-background text-foreground transition-colors duration-300 overflow-hidden">
      
      {/* --- ÁREA PRINCIPAL --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="w-full p-6 border-b border-border flex justify-between items-center bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/dashboard')}>
                 <ArrowLeft size={16} /> Voltar ao DashBoard
             </Button>
             <h1 className="text-xl font-bold tracking-tight border-l border-border pl-4">Lista de Leads</h1>
          </div>

          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={toggleTheme}>
               {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
             </Button>
             <Button variant="destructive" size="sm" onClick={() => { localStorage.removeItem('token'); navigate('/'); }}>
               <LogOut size={16} className="mr-2" />
               Sair
             </Button>
          </div>
        </header>

        {/* CONTEÚDO */}
        <main className="flex-1 p-8 overflow-hidden flex flex-col bg-background/50">
           
           {/* BARRA DE FERRAMENTAS */}
           <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              
              <div className="flex gap-2 w-full md:w-auto flex-1">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar empresa, CNPJ ou telefone..." 
                    className="pl-8 bg-card border-border"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="relative w-full md:w-56">
                    <Filter className="absolute left-2 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                    <Select value={filterStage} onValueChange={setFilterStage}>
                        <SelectTrigger className="pl-9 h-10 w-full bg-card border-border">
                            <SelectValue placeholder="Filtrar por etapa" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todas as Etapas</SelectItem>
                            <SelectItem value="NOVO">Novos</SelectItem>
                            <SelectItem value="CONTATO">Em Contato</SelectItem>
                            <SelectItem value="NEGOCIACAO">Negociação</SelectItem>
                            <SelectItem value="CADASTRO">Cadastro</SelectItem>
                            <SelectItem value="FINALIZADO">Finalizados</SelectItem>
                            <SelectItem value="SEM_INTERESSE">Sem Interesse</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>

              {/* MODAL */}
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button onClick={openNewModal} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap shadow-sm">
                        <Plus size={18} /> Novo Lead
                    </Button>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                           {editingLead ? <Pencil size={18} /> : <Plus size={18} />}
                           {editingLead ? 'Editar Lead' : 'Criar Novo Lead'}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        {/* Linha 1: Razão Social */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Razão Social *</Label>
                            <div className="relative">
                               <Building2 className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                               <Input 
                                  id="name" className="pl-8" placeholder="Nome da Empresa"
                                  value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})}
                               />
                            </div>
                        </div>
                        
                        {/* Linha 2: CNPJ e CNAE (COM MÁSCARA) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="cnpj">CNPJ</Label>
                                <div className="relative">
                                   <FileText className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                   <Input 
                                      id="cnpj" className="pl-8" placeholder="00.000.000/0000-00"
                                      value={formData.cnpj} 
                                      onChange={e => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}
                                   />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cnae">CNAE</Label>
                                <Input 
                                   id="cnae" placeholder="Ex: 6204-0/00"
                                   value={formData.cnae} 
                                   onChange={e => setFormData({...formData, cnae: maskCNAE(e.target.value)})}
                                />
                            </div>
                        </div>

                        {/* Linha 3: Telefone e Email (TELEFONE COM MÁSCARA) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                                <div className="relative">
                                   <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                   <Input 
                                      id="phone" className="pl-8" placeholder="(XX) 99999-9999"
                                      value={formData.phone} 
                                      onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})}
                                   />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                   <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                   <Input 
                                      id="email" type="email" className="pl-8" placeholder="contato@empresa.com"
                                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                   />
                                </div>
                            </div>
                        </div>

                        {/* Linha 4: Cidade e UF */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="city">Cidade</Label>
                                <Input 
                                   id="city" placeholder="Sua Cidade"
                                   value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="state">UF</Label>
                                <Input 
                                   id="state" placeholder="EX: SP" maxLength={2}
                                   value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})}
                                />
                            </div>
                        </div>

                        {/* Linha 5: Endereço */}
                        <div className="grid gap-2 border-b border-border pb-4">
                            <Label htmlFor="address">Endereço</Label>
                            <div className="relative">
                               <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                               <Input 
                                  id="address" className="pl-8" placeholder="Rua, Número, Bairro"
                                  value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                               />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave}>Salvar Lead</Button>
                    </DialogFooter>
                </DialogContent>
              </Dialog>
           </div>

           {/* TABELA DE DADOS */}
           <div className="rounded-md border border-border bg-card overflow-x-auto flex-1 shadow-sm">
             <ScrollArea className="h-full">
               <table className="w-full text-sm text-left whitespace-nowrap">
                 <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border sticky top-0 backdrop-blur-sm z-10">
                   <tr>
                     <th className="px-4 py-3 font-medium">Razão Social</th>
                     <th className="px-4 py-3 font-medium">CNPJ</th>
                     <th className="px-4 py-3 font-medium">CNAE</th>
                     <th className="px-4 py-3 font-medium">Telefone</th>
                     <th className="px-4 py-3 font-medium">Email</th>
                     <th className="px-4 py-3 font-medium">Cidade</th>
                     <th className="px-4 py-3 font-medium">UF</th>
                     <th className="px-4 py-3 font-medium">Endereço</th>
                     <th className="px-4 py-3 font-medium">Etapa</th>
                     <th className="px-4 py-3 text-right font-medium">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                   {loading ? (
                     <tr>
                       <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground">
                         Carregando leads...
                       </td>
                     </tr>
                   ) : filteredLeads.length === 0 ? (
                     <tr>
                       <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground">
                         Nenhum lead encontrado com estes filtros.
                       </td>
                     </tr>
                   ) : (
                     filteredLeads.map((lead) => (
                       <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                         <td className="px-4 py-4 font-medium text-foreground">
                            {lead.companyName}
                         </td>
                         <td className="px-4 py-4 text-muted-foreground">
                            {lead.cnpj || '-'}
                         </td>
                         <td className="px-4 py-4 text-muted-foreground">
                            {lead.cnae || '-'}
                         </td>
                         <td className="px-4 py-4 text-muted-foreground">
                            {lead.phone || '-'}
                         </td>
                         <td className="px-4 py-4 text-muted-foreground">
                            {lead.email || '-'}
                         </td>
                         <td className="px-4 py-4 text-muted-foreground">
                            {lead.city || '-'}
                         </td>
                         <td className="px-4 py-4 text-muted-foreground">
                            {lead.state || '-'}
                         </td>
                         <td className="px-4 py-4 text-muted-foreground truncate max-w-[150px]" title={lead.address || ''}>
                            {lead.address || '-'}
                         </td>
                         <td className="px-4 py-4">
                           <Badge variant={
                             lead.funnelStage === 'FINALIZADO' ? 'default' : 
                             lead.funnelStage === 'SEM_INTERESSE' ? 'secondary' : 'outline'
                           }>
                             {lead.funnelStage}
                           </Badge>
                         </td>
                         
                         <td className="px-4 py-4 flex justify-end gap-2">
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/40"
                              onClick={() => openEditModal(lead)}
                           >
                              <Pencil size={16} />
                           </Button>
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/40"
                              onClick={() => handleDelete(lead.id)}
                           >
                              <Trash2 size={16} />
                           </Button>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </ScrollArea>
           </div>

        </main>
      </div>
    </div>
  );
}