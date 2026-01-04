"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Activity,
  Settings,
  LogOut,
  Search,
  Bell,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Menu,
  Check,
  Zap,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Toaster } from "sonner";

// Inicialização do cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Componente de Barra de Gráfico Simples
function ChartBar({ height, color, label }: { height: string; color: string; label: string }) {
  return (
    <div className="flex flex-col justify-end h-full w-full gap-2 group cursor-pointer items-center">
      <div className="relative w-full flex items-end justify-center h-full">
        <div
          className={cn("w-full max-w-[30px] rounded-t-md transition-all duration-300 group-hover:opacity-80 group-hover:scale-105", color)}
          style={{ height }}
        />
      </div>
      <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors">{label}</span>
    </div>
  );
}

export function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Visão Geral");
  const [salesAlerts, setSalesAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const router = useRouter();

  // Estado para armazenar usuários e status de carregamento
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estado para dados financeiros (Stripe/Supabase)
  const [financials, setFinancials] = useState({
    totalRevenue: 0,
    monthlyData: [] as any[],
    recentTransactions: [] as any[],
  });

  // Efeito para buscar dados da API ao carregar o componente
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        
        // Verificar sessão
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/");
          return;
        }

        // Buscar dados em paralelo: Usuários e Pagamentos (Stripe)
        const [usersResponse, paymentsResponse] = await Promise.all([
          supabase.from('users').select('*').order('created_at', { ascending: false }),
          supabase.from('payments').select('*').order('created_at', { ascending: false }) // Tabela sincronizada com Stripe
        ]);

        if (usersResponse.error) throw usersResponse.error;
        // Não lançamos erro de pagamentos para não quebrar o dashboard se a tabela ainda não existir
        if (paymentsResponse.error) console.warn("Tabela de pagamentos não encontrada ou erro ao buscar:", paymentsResponse.error);

        if (usersResponse.data) {
          const formattedUsers = usersResponse.data.map((user: any) => ({
            id: user.id,
            name: user.name || "Usuário",
            email: user.email,
            plan: user.plan || "Free",
            status: user.status || "Ativo",
            joined: user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : "Data N/A",
            avatar: (user.name || "U").substring(0, 2).toUpperCase(),
            amount: user.amount || "R$ 0,00"
          }));
          setUsers(formattedUsers);
        }

        if (paymentsResponse.data) {
          const payments = paymentsResponse.data;
          
          // Calcular Receita Total
          const total = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

          // Processar dados para o gráfico mensal (Ano atual)
          const currentYear = new Date().getFullYear();
          const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
          const monthlyAgg = new Array(12).fill(0);

          payments.forEach((p: any) => {
            const d = new Date(p.created_at);
            if (d.getFullYear() === currentYear) {
              monthlyAgg[d.getMonth()] += (Number(p.amount) || 0);
            }
          });

          const monthlyData = months.map((name, i) => ({ name, revenue: monthlyAgg[i] }));

          // Transações Recentes
          const recent = payments.slice(0, 5).map((p: any) => ({
            client: p.customer_name || "Cliente Desconhecido",
            date: new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
            amount: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount || 0),
            status: p.status === 'succeeded' ? 'Aprovado' : p.status
          }));

          setFinancials({ totalRevenue: total, monthlyData, recentTransactions: recent });
        }
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        toast.error("Erro ao carregar dados.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Desconectado com sucesso");
    router.push("/");
  };

  const handleNavClick = (label: string) => {
    setActiveTab(label);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white font-sans selection:bg-purple-500/30 flex overflow-hidden relative">
      <Toaster position="top-right" theme="dark" />
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col",
          !isSidebarOpen && "lg:w-[80px] -translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-20 flex items-center justify-center border-b border-white/10 px-6">
          <div className="flex items-center gap-3 font-bold text-xl tracking-tighter">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className={cn("transition-opacity duration-300", !isSidebarOpen && "lg:hidden")}>
              FitVerse<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Admin</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {[
            { icon: LayoutDashboard, label: "Visão Geral", active: true },
            { icon: Users, label: "Usuários" },
            { icon: CreditCard, label: "Financeiro" },
            { icon: Package, label: "Assinaturas" },
            { icon: Activity, label: "Analytics" },
            { icon: Settings, label: "Configurações" },
          ].map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={() => handleNavClick(item.label)}
              className={cn(
                "w-full justify-start gap-3 h-12 transition-all duration-200 rounded-xl",
                activeTab === item.label
                  ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-white/10 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
                !isSidebarOpen && "lg:justify-center lg:px-0"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.label && "text-purple-400")} />
              <span className={cn(!isSidebarOpen && "lg:hidden")}>{item.label}</span>
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Button variant="ghost" onClick={handleLogout} className={cn("w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-12 rounded-xl", !isSidebarOpen && "lg:justify-center")}>
            <LogOut className="w-5 h-5" />
            <span className={cn(!isSidebarOpen && "lg:hidden")}>Sair</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent relative z-10">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu className="w-6 h-6" />
            </Button>
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
              <Input
                placeholder="Buscar..."
                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:bg-black/40 focus:border-purple-500/50 transition-all w-72 rounded-full h-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white hover:bg-white/5 rounded-full" onClick={() => toast.info("Você não tem novas notificações")}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-red-500/50" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-white/10 hover:ring-purple-500/50 p-0 overflow-hidden">
                  <Avatar className="h-full w-full">
                    <AvatarImage src="/placeholder.svg" alt="Admin" />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-900/90 backdrop-blur-xl border-white/10 text-white shadow-2xl" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">Administrador</p>
                    <p className="text-xs text-gray-400">admin@fitverse.ai</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="cursor-pointer" onClick={() => toast.info("Visualizando perfil...")}>Perfil</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setActiveTab("Configurações")}>Configurações</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 cursor-pointer">Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

          {activeTab === "Visão Geral" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Receita", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financials.totalRevenue), change: "+20%", trend: "up", icon: CreditCard, color: "text-emerald-400", bg: "from-emerald-500/20" },
                  { title: "Usuários", value: users.length.toString(), change: "+180%", trend: "up", icon: Users, color: "text-blue-400", bg: "from-blue-500/20" },
                  { title: "Planos", value: "12k", change: "+19%", trend: "up", icon: Activity, color: "text-purple-400", bg: "from-purple-500/20" },
                  { title: "Churn", value: "2.4%", change: "-4.5%", trend: "down", icon: TrendingUp, color: "text-rose-400", bg: "from-rose-500/20" },
                ].map((stat, i) => (
                  <Card key={i} className="bg-white/5 backdrop-blur-md border-white/10 shadow-lg hover:bg-white/10 transition-all duration-300 group overflow-hidden relative">
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", stat.bg)} />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                      <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-200">{stat.title}</CardTitle>
                      <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}><stat.icon className="h-4 w-4" /></div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <span className={cn(stat.trend === "up" ? "text-emerald-400" : "text-rose-400", "flex items-center")}>
                          {stat.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {stat.change}
                        </span>
                        vs mês passado
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts & Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                <Card className="lg:col-span-4 bg-white/5 backdrop-blur-md border-white/10 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
                  <CardHeader>
                    <CardTitle className="text-white">Performance</CardTitle>
                    <CardDescription className="text-gray-400">Visão geral do faturamento.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full flex items-end justify-between gap-2 px-4 pt-8 pb-2">
                      {[45, 60, 55, 80, 65, 75, 90, 70, 85, 60, 95, 75].map((h, i) => (
                        <ChartBar key={i} height={`${h}%`} color="bg-gradient-to-t from-purple-600 to-blue-500" label={["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3 bg-white/5 backdrop-blur-md border-white/10 shadow-xl flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-white">Atividade</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-6">
                      {users.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between group p-3 rounded-xl hover:bg-white/5 cursor-pointer" onClick={() => toast.info(`Detalhes de ${item.name}`)}>
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border-2 border-white/10">
                              <AvatarFallback className="bg-gray-800 text-gray-300">{item.avatar}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-white">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.plan}</p>
                            </div>
                          </div>
                          <div className="text-sm font-bold text-emerald-400">{item.amount}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeTab === "Usuários" && (
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white text-xl">Gerenciamento de Usuários</CardTitle>
                  <CardDescription className="text-gray-400">Visualize e gerencie todos os membros da plataforma.</CardDescription>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="border-white/10 bg-black/20 text-gray-300 hover:bg-white/5 hover:text-white"
                    onClick={() => toast.success("Lista de usuários exportada com sucesso!")}
                  >
                    Exportar
                  </Button>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => toast.success("Modal de novo usuário aberto!")}
                  >
                    Novo Usuário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="text-gray-300">Usuário</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Plano</TableHead>
                        <TableHead className="text-gray-300">Entrou em</TableHead>
                        <TableHead className="text-right text-gray-300">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user, i) => (
                        <TableRow key={i} className="border-white/10 hover:bg-white/5 group">
                          <TableCell className="font-medium text-white">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-white/10">
                                <AvatarFallback className="bg-gradient-to-br from-gray-800 to-gray-900 text-xs text-gray-300">{user.avatar}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent",
                              user.status === "Ativo" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
                              user.status === "Inativo" && "bg-rose-500/20 text-rose-400 border-rose-500/20",
                              user.status === "Pendente" && "bg-yellow-500/20 text-yellow-400 border-yellow-500/20",
                            )}>
                              {user.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md w-fit text-xs", 
                              user.plan === "Premium" && "bg-purple-500/10 text-purple-400",
                              user.plan === "Pro" && "bg-blue-500/10 text-blue-400",
                              user.plan === "Free" && "bg-gray-500/10 text-gray-400"
                            )}>
                              <Activity className="w-3 h-3" /> {user.plan}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-400">{user.joined}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10">
                                  <Menu className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-gray-900/90 backdrop-blur-xl border-white/10 text-white">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem className="cursor-pointer hover:bg-white/10" onClick={() => toast.info(`Editando usuário ${user.name}`)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer hover:bg-white/10" onClick={() => toast.info(`Vendo detalhes de ${user.name}`)}>Ver Detalhes</DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem className="text-red-400 cursor-pointer hover:bg-red-500/10" onClick={() => toast.error(`Usuário ${user.name} removido`)}>Deletar</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "Financeiro" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-white/5 border-white/10 overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-white">Receita Total</CardTitle>
                    <CardDescription className="text-gray-400">Crescimento financeiro nos últimos 6 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={financials.monthlyData.length > 0 ? financials.monthlyData : [{ name: 'Sem dados', revenue: 0 }]}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="name" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">Resumo Mensal</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                     <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-400">Vendas Brutas</span>
                        <span className="text-white font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financials.totalRevenue)}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-400">Reembolsos</span>
                        <span className="text-red-400 font-bold">- R$ 0,00</span>
                     </div>
                     <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-purple-500/20">
                        <span className="text-purple-400">Lucro Líquido</span>
                        <span className="text-purple-400 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financials.totalRevenue)}</span>
                     </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/5 border-white/10">
                <CardHeader><CardTitle className="text-white">Transações Recentes</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="text-gray-300">Cliente</TableHead>
                        <TableHead className="text-gray-300">Data</TableHead>
                        <TableHead className="text-gray-300">Valor</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financials.recentTransactions.length > 0 ? financials.recentTransactions.map((t, i) => (
                        <TableRow key={i} className="border-white/10 hover:bg-white/5">
                          <TableCell className="text-white font-medium">{t.client}</TableCell>
                          <TableCell className="text-gray-400">{t.date}</TableCell>
                          <TableCell className="text-white">{t.amount}</TableCell>
                          <TableCell>
                            <span className={cn("px-2 py-0.5 rounded-full text-xs", 
                              t.status === "Aprovado" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"
                            )}>
                              {t.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500 py-4">Nenhuma transação encontrada</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "Assinaturas" && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Planos & Assinaturas</h2>
                    <p className="text-gray-400 mt-1">Gerencie os níveis de acesso e visualize os membros de cada plano.</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { 
                      title: "Free", 
                      price: "R$ 0,00", // Altere o preço exibido aqui
                      paymentLink: "", // Deixe vazio para planos gratuitos
                      period: "para sempre",
                      icon: Zap,
                      description: "Recursos essenciais para iniciantes.",
                      color: "text-gray-400",
                      accent: "bg-gray-500/10 border-gray-500/20",
                      glow: "shadow-gray-500/5",
                      features: ["Acesso à comunidade", "Treinos básicos", "Suporte por email"],
                    },
                    { 
                      title: "Pro", 
                      price: "R$ 19,90", // Altere o preço exibido aqui
                      paymentLink: "https://buy.stripe.com/SEU_LINK_AQUI_PRO", // Gere no Stripe. IMPORTANTE: Adicione metadado 'planName': 'Pro'
                      period: "/mês",
                      icon: Activity,
                      description: "Para quem leva o treino a sério.",
                      color: "text-blue-400",
                      accent: "bg-blue-500/10 border-blue-500/20",
                      glow: "shadow-blue-500/20",
                      popular: true,
                      features: ["Tudo do Free", "Planos personalizados", "Nutrição IA", "Sem anúncios"],
                    },
                    { 
                      title: "Premium", 
                      price: "R$ 29,90", // Altere o preço exibido aqui
                      paymentLink: "https://buy.stripe.com/SEU_LINK_AQUI_PREMIUM", // Gere no Stripe. IMPORTANTE: Adicione metadado 'planName': 'Premium'
                      period: "/mês",
                      icon: Crown,
                      description: "A experiência definitiva.",
                      color: "text-purple-400",
                      accent: "bg-purple-500/10 border-purple-500/20",
                      glow: "shadow-purple-500/20",
                      features: ["Tudo do Pro", "Personal Trainer dedicado", "Análise biométrica", "Acesso antecipado"],
                    },
                  ].map((plan, i) => {
                    const planUsers = users.filter(u => u.plan === plan.title);
                    return (
                    <Card key={i} className={cn(
                        "relative flex flex-col overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-black/40 backdrop-blur-xl", 
                        plan.accent, plan.glow
                    )}>
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg z-10">
                            MAIS POPULAR
                        </div>
                      )}
                      
                      <CardHeader className="pb-4 relative z-10">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-white/5 border border-white/5 shadow-inner", plan.color)}>
                            <plan.icon className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-white">{plan.title}</CardTitle>
                        <CardDescription className="text-gray-400 mt-1">{plan.description}</CardDescription>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className={cn("text-3xl font-bold", plan.color)}>{plan.price}</span>
                            <span className="text-sm text-gray-500">{plan.period}</span>
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1 relative z-10 space-y-6">
                        <div className="space-y-2">
                            {plan.features.map((feature, k) => (
                                <div key={k} className="flex items-center gap-2 text-sm text-gray-300">
                                    <Check className={cn("w-4 h-4", plan.color)} />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuários Recentes</h4>
                                <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{planUsers.length}</span>
                            </div>
                            <div className="space-y-3">
                                {planUsers.map((user, j) => (
                                    <div key={j} className="flex items-center gap-3 group/user cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors" onClick={() => toast.info(`Perfil de ${user.name}`)}>
                                        <Avatar className="h-8 w-8 border border-white/10 transition-transform group-hover/user:scale-105">
                                            <AvatarFallback className="bg-gray-800 text-gray-300 text-[10px]">{user.avatar}</AvatarFallback>
                                        </Avatar>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-medium text-gray-200 group-hover/user:text-white transition-colors truncate">{user.name}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                      </CardContent>
                      
                      <div className="p-6 pt-0 mt-auto relative z-10">
                        <Button className={cn("w-full transition-all h-10 font-medium", 
                            plan.popular ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20" : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                        )} onClick={() => plan.paymentLink ? window.open(plan.paymentLink, '_blank') : toast.info("Este plano é gratuito")}>
                            {plan.paymentLink ? "Assinar Agora" : "Plano Atual"}
                        </Button>
                      </div>
                      
                      {/* Decorative gradient blob */}
                      <div className={cn("absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[60px] opacity-20 pointer-events-none", plan.color.replace("text-", "bg-"))} />
                    </Card>
                    );
                  })}
               </div>
            </div>
          )}

          {activeTab === "Analytics" && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">Crescimento de Usuários (Semanal)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={[
                            { day: "Seg", users: 120 }, { day: "Ter", users: 150 }, { day: "Qua", users: 180 }, 
                            { day: "Qui", users: 220 }, { day: "Sex", users: 250 }, { day: "Sab", users: 300 }, { day: "Dom", users: 280 }
                         ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="day" stroke="#888" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                            <Bar dataKey="users" fill="#8884d8" radius={[4, 4, 0, 0]} />
                         </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">Dispositivos</CardTitle></CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={[{ name: 'Mobile', value: 400 }, { name: 'Desktop', value: 300 }, { name: 'Tablet', value: 300 }]} 
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value"
                          >
                             <Cell fill="#0088FE" />
                             <Cell fill="#00C49F" />
                             <Cell fill="#FFBB28" />
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
             </div>
          )}

          {activeTab === "Configurações" && (
            <Card className="bg-white/5 border-white/10 max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="text-white text-xl">Configurações da Plataforma</CardTitle>
                <CardDescription className="text-gray-400">Gerencie as configurações globais do sistema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-300">Nome da Plataforma</label>
                       <Input defaultValue="FitVerse AI" className="bg-black/20 border-white/10 text-white focus:border-purple-500" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-300">Email de Suporte</label>
                       <Input defaultValue="support@fitverse.ai" className="bg-black/20 border-white/10 text-white focus:border-purple-500" />
                    </div>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-white/10">
                    <h3 className="text-lg font-medium text-white">Notificações</h3>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                       <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">Alertas de Vendas</span>
                          <span className="text-xs text-gray-400">Receba notificações quando uma nova venda ocorrer.</span>
                       </div>
                       <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSalesAlerts(!salesAlerts)}
                          className={cn(salesAlerts ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20")}
                       >
                          {salesAlerts ? "Ativado" : "Desativado"}
                       </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                       <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">Relatórios Semanais</span>
                          <span className="text-xs text-gray-400">Receba um resumo semanal por email.</span>
                       </div>
                       <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setWeeklyReports(!weeklyReports)}
                          className={cn(weeklyReports ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20")}
                       >
                          {weeklyReports ? "Ativado" : "Desativado"}
                       </Button>
                    </div>
                 </div>

                 <div className="pt-6">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-12 text-lg shadow-lg shadow-purple-900/20" onClick={() => toast.success("Configurações salvas com sucesso!")}>
                       Salvar Alterações
                    </Button>
                 </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}