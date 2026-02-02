import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Users
} from 'lucide-react';
import { Card, CardHeader, Badge } from '../../components/UI';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Property, Reservation, Transaction } from '../../types';
import { getProperties } from '../../services/propertyService';
import { getReservations } from '../../services/reservationService';
import { getTransactions } from '../../services/transactionService';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
}

function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{trend.value}%</span>
              <span className="text-gray-500">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [propertiesData, reservationsData, transactionsData] = await Promise.all([
          getProperties(),
          getReservations(),
          getTransactions()
        ]);
        setProperties(propertiesData);
        setReservations(reservationsData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Calculate stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const activeReservations = reservations.filter(r => 
    r.status === 'confirmed' || r.status === 'checked-in'
  );

  const upcomingReservations = reservations
    .filter(r => {
      const checkIn = new Date(r.checkIn);
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      return checkIn >= now && checkIn <= sevenDaysFromNow && (r.status === 'confirmed' || r.status === 'pending');
    })
    .slice(0, 5);

  // Mock chart data (in production, this would be calculated from real data)
  const chartData = [
    { month: 'Jan', receitas: 4000, despesas: 2400 },
    { month: 'Fev', receitas: 3000, despesas: 1398 },
    { month: 'Mar', receitas: 2000, despesas: 9800 },
    { month: 'Abr', receitas: 2780, despesas: 3908 },
    { month: 'Mai', receitas: 1890, despesas: 4800 },
    { month: 'Jun', receitas: 2390, despesas: 3800 },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
      pending: { label: 'Pendente', variant: 'warning' },
      confirmed: { label: 'Confirmada', variant: 'success' },
      'checked-in': { label: 'Check-in', variant: 'info' },
      'checked-out': { label: 'Check-out', variant: 'info' },
      cancelled: { label: 'Cancelada', variant: 'error' },
    };
    const config = statusConfig[status] || { label: status, variant: 'info' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5A5F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Bem-vindo de volta! Aqui está um resumo das suas propriedades.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Propriedades"
          value={properties.length}
          icon={Home}
          color="bg-[#FF5A5F]"
        />
        <StatCard
          title="Reservas Ativas"
          value={activeReservations.length}
          icon={Calendar}
          color="bg-[#00A699]"
        />
        <StatCard
          title="Receita Mensal"
          value={`R$ ${monthlyIncome.toLocaleString('pt-BR')}`}
          icon={DollarSign}
          trend={{ value: 12, isPositive: true }}
          color="bg-green-500"
        />
        <StatCard
          title="Despesas Mensais"
          value={`R$ ${monthlyExpenses.toLocaleString('pt-BR')}`}
          icon={TrendingUp}
          trend={{ value: 5, isPositive: false }}
          color="bg-orange-500"
        />
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Receitas vs Despesas"
            subtitle="Últimos 6 meses"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#767676" fontSize={12} />
                <YAxis stroke="#767676" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="receitas"
                  stackId="1"
                  stroke="#22C55E"
                  fill="#22C55E"
                  fillOpacity={0.3}
                  name="Receitas"
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  stackId="2"
                  stroke="#FF5A5F"
                  fill="#FF5A5F"
                  fillOpacity={0.3}
                  name="Despesas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Upcoming Reservations */}
        <Card>
          <CardHeader
            title="Próximas Reservas"
            action={
              <Link to="/reservations" className="text-sm text-[#FF5A5F] hover:underline">
                Ver todas
              </Link>
            }
          />
          {upcomingReservations.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma reserva próxima</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingReservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-[#FF5A5F]/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#FF5A5F]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{reservation.guestName}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(reservation.checkIn), "dd 'de' MMM", { locale: ptBR })}
                    </p>
                  </div>
                  {getStatusBadge(reservation.status)}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Properties List */}
      <Card>
        <CardHeader
          title="Suas Propriedades"
          subtitle={`${properties.length} propriedades cadastradas`}
          action={
            <Link to="/properties" className="text-sm text-[#FF5A5F] hover:underline">
              Gerenciar
            </Link>
          }
        />
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhuma propriedade cadastrada</h3>
            <p className="text-gray-500 mb-4">Comece adicionando sua primeira propriedade</p>
            <Link
              to="/properties/new"
              className="inline-flex items-center px-4 py-2 bg-[#FF5A5F] text-white rounded-lg hover:bg-[#E04850] transition-colors"
            >
              Adicionar Propriedade
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Cidade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Quartos</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {properties.slice(0, 5).map((property) => (
                  <tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{property.name}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{property.type}</td>
                    <td className="py-3 px-4 text-gray-600">{property.city}</td>
                    <td className="py-3 px-4 text-gray-600">{property.bedrooms}</td>
                    <td className="py-3 px-4">
                      <Badge variant={property.isActive ? 'success' : 'error'}>
                        {property.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
