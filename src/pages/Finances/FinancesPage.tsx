import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, Filter, Trash2, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardHeader, Button, Input, Badge, Select, Modal } from '../../components/UI';
import { Transaction, TransactionType, Property } from '../../types';
import { getTransactions, deleteTransaction } from '../../services/transactionService';
import { getProperties } from '../../services/propertyService';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

const EXPENSE_COLORS = ['#FF5A5F', '#FF8B8E', '#FFB8BA', '#FFD4D5', '#00A699', '#4ECDC4'];
const INCOME_COLORS = ['#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0'];

export default function FinancesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; transaction: Transaction | null }>({
    isOpen: false,
    transaction: null,
  });
  
  // Filtros de data - mês atual como padrão
  const [startDate, setStartDate] = useState(() => {
    return format(startOfMonth(new Date()), 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = useState(() => {
    return format(endOfMonth(new Date()), 'yyyy-MM-dd');
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [transactionsData, propertiesData] = await Promise.all([
        getTransactions(),
        getProperties(),
      ]);
      setTransactions(transactionsData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || transaction.type === selectedType;
    const matchesProperty = !selectedProperty || transaction.propertyId === selectedProperty;
    
    // Filtro de data
    const transactionDate = new Date(transaction.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const matchesDate = isWithinInterval(transactionDate, { start, end });
    
    return matchesSearch && matchesType && matchesProperty && matchesDate;
  });

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpenses;

  // Prepare chart data
  const expensesByCategory = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      const existing = acc.find((item) => item.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[]);

  const incomeByCategory = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => {
      const existing = acc.find((item) => item.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[]);

  const getPropertyName = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    return property?.name || 'Propriedade não encontrada';
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      cleaning: 'Limpeza',
      maintenance: 'Manutenção',
      utilities: 'Utilidades',
      supplies: 'Suprimentos',
      marketing: 'Marketing',
      insurance: 'Seguro',
      taxes: 'Impostos',
      other: 'Outros',
      reservation: 'Reserva',
      cleaning_fee: 'Taxa de Limpeza',
      extra_service: 'Serviço Extra',
    };
    return categories[category] || category;
  };

  async function handleDelete() {
    if (!deleteModal.transaction) return;

    try {
      await deleteTransaction(deleteModal.transaction.id);
      setTransactions(transactions.filter((t) => t.id !== deleteModal.transaction!.id));
      setDeleteModal({ isOpen: false, transaction: null });
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
          <p className="text-gray-500 mt-1">Gerencie receitas e despesas</p>
        </div>
        <Link to="/finances/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>Nova Transação</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Receitas</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {totalIncome.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Despesas</p>
              <p className="text-2xl font-bold text-red-600">
                R$ {totalExpenses.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-6 h-6 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Lucro Líquido</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {netProfit.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Despesas por Categoria" />
          {expensesByCategory.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${getCategoryLabel(name || '')} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {expensesByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                    labelFormatter={(label) => getCategoryLabel(String(label))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Nenhuma despesa registrada
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Receitas por Categoria" />
          {incomeByCategory.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${getCategoryLabel(name || '')} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {incomeByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                    labelFormatter={(label) => getCategoryLabel(String(label))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Nenhuma receita registrada
            </div>
          )}
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus:ring-0"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
              <span className="text-gray-400">até</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Select
              options={[
                { value: '', label: 'Todos tipos' },
                { value: 'income', label: 'Receitas' },
                { value: 'expense', label: 'Despesas' },
              ]}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-40"
            />
            <Select
              options={[
                { value: '', label: 'Todas propriedades' },
                ...properties.map((p) => ({ value: p.id, label: p.name })),
              ]}
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-48"
            />
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card className="text-center py-12">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhuma transação encontrada</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedType || selectedProperty
              ? 'Tente ajustar seus filtros'
              : 'Comece adicionando sua primeira transação'}
          </p>
          <Link to="/finances/new">
            <Button>Adicionar Transação</Button>
          </Link>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Descrição</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Propriedade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Categoria</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tipo</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Valor</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">
                      {format(new Date(transaction.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{transaction.description}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {getPropertyName(transaction.propertyId)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {getCategoryLabel(transaction.category)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={transaction.type === 'income' ? 'success' : 'error'}>
                        {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, transaction })}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir transação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, transaction: null })}
        title="Excluir Transação"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, transaction: null })}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
