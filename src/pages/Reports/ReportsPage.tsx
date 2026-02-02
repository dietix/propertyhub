import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardHeader, Select, Badge } from '../../components/UI';
import { Property, Reservation, Transaction } from '../../types';
import { getProperties } from '../../services/propertyService';
import { getReservations } from '../../services/reservationService';
import { getTransactions } from '../../services/transactionService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { BarChart3, TrendingUp, Home, Calendar, DollarSign, Percent } from 'lucide-react';

export default function ReportsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('6');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [propertiesData, reservationsData, transactionsData] = await Promise.all([
        getProperties(),
        getReservations(),
        getTransactions(),
      ]);
      setProperties(propertiesData);
      setReservations(reservationsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter data based on selections
  const filteredReservations = reservations.filter((r) => 
    !selectedProperty || r.propertyId === selectedProperty
  );

  const filteredTransactions = transactions.filter((t) =>
    !selectedProperty || t.propertyId === selectedProperty
  );

  // Calculate period months
  const monthsCount = parseInt(selectedPeriod);
  const endDate = new Date();
  const startDate = subMonths(endDate, monthsCount - 1);
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  // Calculate monthly revenue data
  const monthlyData = months.map((month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const monthReservations = filteredReservations.filter((r) => {
      const checkIn = new Date(r.checkIn);
      return checkIn >= monthStart && checkIn <= monthEnd;
    });

    const monthTransactions = filteredTransactions.filter((t) => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    });

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: format(month, 'MMM', { locale: ptBR }),
      receitas: income,
      despesas: expenses,
      lucro: income - expenses,
      reservas: monthReservations.length,
    };
  });

  // Calculate occupancy rate
  const calculateOccupancyRate = () => {
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const propertiesCount = selectedProperty ? 1 : properties.length;
    const totalAvailableDays = totalDays * propertiesCount;

    const occupiedDays = filteredReservations
      .filter((r) => r.status !== 'cancelled')
      .reduce((sum, r) => {
        const checkIn = new Date(r.checkIn);
        const checkOut = new Date(r.checkOut);
        return sum + differenceInDays(checkOut, checkIn);
      }, 0);

    return totalAvailableDays > 0 ? Math.round((occupiedDays / totalAvailableDays) * 100) : 0;
  };

  // Calculate property performance
  const propertyPerformance = properties.map((property) => {
    const propertyReservations = reservations.filter((r) => r.propertyId === property.id && r.status !== 'cancelled');
    const propertyTransactions = transactions.filter((t) => t.propertyId === property.id);

    const income = propertyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = propertyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalNights = propertyReservations.reduce((sum, r) => {
      return sum + differenceInDays(new Date(r.checkOut), new Date(r.checkIn));
    }, 0);

    return {
      id: property.id,
      name: property.name,
      reservations: propertyReservations.length,
      income,
      expenses,
      profit: income - expenses,
      avgNightly: totalNights > 0 ? Math.round(income / totalNights) : 0,
    };
  }).sort((a, b) => b.profit - a.profit);

  // Summary stats
  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReservations = filteredReservations.filter((r) => r.status !== 'cancelled').length;
  const occupancyRate = calculateOccupancyRate();

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
          <p className="text-gray-500 mt-1">Análise de desempenho das propriedades</p>
        </div>
        <div className="flex gap-3">
          <Select
            options={[
              { value: '', label: 'Todas propriedades' },
              ...properties.map((p) => ({ value: p.id, label: p.name })),
            ]}
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="w-48"
          />
          <Select
            options={[
              { value: '3', label: 'Últimos 3 meses' },
              { value: '6', label: 'Últimos 6 meses' },
              { value: '12', label: 'Últimos 12 meses' },
            ]}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Receita Total</p>
              <p className="text-xl font-bold text-gray-800">
                R$ {totalIncome.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Despesa Total</p>
              <p className="text-xl font-bold text-gray-800">
                R$ {totalExpenses.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Reservas</p>
              <p className="text-xl font-bold text-gray-800">{totalReservations}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Taxa de Ocupação</p>
              <p className="text-xl font-bold text-gray-800">{occupancyRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader title="Receitas vs Despesas" subtitle="Evolução mensal" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#767676" fontSize={12} />
                <YAxis stroke="#767676" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="#FF5A5F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Profit Chart */}
        <Card>
          <CardHeader title="Lucro Líquido" subtitle="Evolução mensal" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#767676" fontSize={12} />
                <YAxis stroke="#767676" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="lucro"
                  name="Lucro"
                  stroke="#00A699"
                  strokeWidth={2}
                  dot={{ fill: '#00A699' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Property Performance Table */}
      <Card>
        <CardHeader
          title="Desempenho por Propriedade"
          subtitle="Ranking baseado no lucro líquido"
        />
        {propertyPerformance.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma propriedade cadastrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">#</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Propriedade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Reservas</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Receita</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Despesas</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Lucro</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Diária Média</th>
                </tr>
              </thead>
              <tbody>
                {propertyPerformance.map((property, index) => (
                  <tr key={property.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Badge variant={index === 0 ? 'success' : index === 1 ? 'info' : 'default'}>
                        {index + 1}º
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">{property.name}</td>
                    <td className="py-3 px-4 text-gray-600">{property.reservations}</td>
                    <td className="py-3 px-4 text-right text-green-600">
                      R$ {property.income.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600">
                      R$ {property.expenses.toLocaleString('pt-BR')}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${property.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {property.profit.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      R$ {property.avgNightly.toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reservations by Month Chart */}
      <Card>
        <CardHeader title="Reservas por Mês" subtitle="Quantidade de reservas" />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
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
              <Bar dataKey="reservas" name="Reservas" fill="#FF5A5F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
