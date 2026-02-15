import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Card, CardHeader, Button, Input, Select } from '../../components/UI';
import { createTransaction } from '../../services/transactionService';
import { getProperties } from '../../services/propertyService';
import { Property, TransactionType, ExpenseCategory, IncomeCategory } from '../../types';
import { formatDateOnly, parseDateOnly } from '../../utils/date';

const transactionSchema = z.object({
  propertyId: z.string().min(1, 'Selecione uma propriedade'),
  type: z.enum(['income', 'expense'] as const),
  category: z.string().min(1, 'Selecione uma categoria'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  description: z.string().min(2, 'Descrição deve ter pelo menos 2 caracteres'),
  date: z.string().min(1, 'Data é obrigatória'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const expenseCategories: { value: ExpenseCategory; label: string }[] = [
  { value: 'cleaning', label: 'Limpeza' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'utilities', label: 'Utilidades (água, luz, etc.)' },
  { value: 'supplies', label: 'Suprimentos' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'insurance', label: 'Seguro' },
  { value: 'taxes', label: 'Impostos' },
  { value: 'other', label: 'Outros' },
];

const incomeCategories: { value: IncomeCategory; label: string }[] = [
  { value: 'reservation', label: 'Reserva' },
  { value: 'cleaning_fee', label: 'Taxa de Limpeza' },
  { value: 'extra_service', label: 'Serviço Extra' },
  { value: 'other', label: 'Outros' },
];

export default function TransactionFormPage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      date: formatDateOnly(new Date()),
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    async function fetchProperties() {
      try {
        const data = await getProperties();
        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    }
    fetchProperties();
  }, []);

  async function onSubmit(data: TransactionFormData) {
    try {
      setIsLoading(true);
      await createTransaction({
        ...data,
        category: data.category as ExpenseCategory | IncomeCategory,
        date: parseDateOnly(data.date),
      });
      navigate('/finances');
    } catch (error) {
      console.error('Error creating transaction:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const categories = selectedType === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/finances')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nova Transação</h1>
          <p className="text-gray-500 mt-1">Registre uma receita ou despesa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader title="Detalhes da Transação" />
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipo"
                options={[
                  { value: 'expense', label: 'Despesa' },
                  { value: 'income', label: 'Receita' },
                ]}
                error={errors.type?.message}
                {...register('type')}
              />
              <Select
                label="Categoria"
                options={categories}
                placeholder="Selecione uma categoria"
                error={errors.category?.message}
                {...register('category')}
              />
            </div>

            <Select
              label="Propriedade"
              options={properties.map((p) => ({ value: p.id, label: p.name }))}
              placeholder="Selecione uma propriedade"
              error={errors.propertyId?.message}
              {...register('propertyId')}
            />

            <Input
              label="Descrição"
              placeholder="Descreva a transação"
              error={errors.description?.message}
              {...register('description')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Valor (R$)"
                type="number"
                min={0}
                step={0.01}
                error={errors.amount?.message}
                {...register('amount', { valueAsNumber: true })}
              />
              <Input
                label="Data"
                type="date"
                error={errors.date?.message}
                {...register('date')}
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/finances')}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Salvar Transação
          </Button>
        </div>
      </form>
    </div>
  );
}
