import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardHeader, Button, Input, Select } from '../../components/UI';
import { createReservation, getReservationById, updateReservation } from '../../services/reservationService';
import { getProperties } from '../../services/propertyService';
import { Property, ReservationSource, ReservationStatus } from '../../types';

const reservationSchema = z.object({
  propertyId: z.string().min(1, 'Selecione uma propriedade'),
  guestName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  guestEmail: z.string().email('Email inválido'),
  guestPhone: z.string().min(8, 'Telefone inválido'),
  checkIn: z.string().min(1, 'Data de check-in é obrigatória'),
  checkOut: z.string().min(1, 'Data de check-out é obrigatória'),
  numberOfGuests: z.number().min(1, 'Número de hóspedes deve ser pelo menos 1'),
  totalAmount: z.number().min(0, 'Valor total inválido'),
  cleaningFee: z.number().min(0, 'Taxa de limpeza inválida'),
  platformFee: z.number().min(0, 'Taxa da plataforma inválida'),
  source: z.enum(['airbnb', 'booking', 'vrbo', 'direct', 'other'] as const),
  status: z.enum(['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'] as const),
  notes: z.string().optional(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

const sourceOptions: { value: ReservationSource; label: string }[] = [
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'booking', label: 'Booking.com' },
  { value: 'vrbo', label: 'VRBO' },
  { value: 'direct', label: 'Reserva Direta' },
  { value: 'other', label: 'Outro' },
];

const statusOptions: { value: ReservationStatus; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'checked-in', label: 'Check-in Realizado' },
  { value: 'checked-out', label: 'Check-out Realizado' },
  { value: 'cancelled', label: 'Cancelada' },
];

export default function ReservationFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      numberOfGuests: 1,
      totalAmount: 0,
      cleaningFee: 0,
      platformFee: 0,
      source: 'direct',
      status: 'pending',
    },
  });

  const selectedPropertyId = watch('propertyId');

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

  useEffect(() => {
    async function fetchReservation() {
      if (!id) return;
      
      try {
        setIsLoadingData(true);
        const reservation = await getReservationById(id);
        
        if (reservation) {
          reset({
            propertyId: reservation.propertyId,
            guestName: reservation.guestName,
            guestEmail: reservation.guestEmail,
            guestPhone: reservation.guestPhone,
            checkIn: format(new Date(reservation.checkIn), 'yyyy-MM-dd'),
            checkOut: format(new Date(reservation.checkOut), 'yyyy-MM-dd'),
            numberOfGuests: reservation.numberOfGuests,
            totalAmount: reservation.totalAmount,
            cleaningFee: reservation.cleaningFee,
            platformFee: reservation.platformFee,
            source: reservation.source,
            status: reservation.status,
            notes: reservation.notes || '',
          });
        }
      } catch (error) {
        console.error('Error fetching reservation:', error);
      } finally {
        setIsLoadingData(false);
      }
    }
    
    fetchReservation();
  }, [id, reset]);

  useEffect(() => {
    // Só atualiza a taxa de limpeza automaticamente no modo de criação
    if (selectedPropertyId && !isEditMode) {
      const property = properties.find((p) => p.id === selectedPropertyId);
      if (property) {
        setValue('cleaningFee', property.cleaningFee || 0);
      }
    }
  }, [selectedPropertyId, properties, setValue, isEditMode]);

  async function onSubmit(data: ReservationFormData) {
    try {
      setIsLoading(true);
      
      if (isEditMode && id) {
        await updateReservation(id, {
          propertyId: data.propertyId,
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone,
          checkIn: new Date(data.checkIn),
          checkOut: new Date(data.checkOut),
          numberOfGuests: data.numberOfGuests,
          totalAmount: data.totalAmount,
          cleaningFee: data.cleaningFee,
          platformFee: data.platformFee,
          source: data.source,
          status: data.status,
          notes: data.notes || '',
        });
      } else {
        await createReservation({
          ...data,
          checkIn: new Date(data.checkIn),
          checkOut: new Date(data.checkOut),
          notes: data.notes || '',
        });
      }
      
      navigate('/reservations');
    } catch (error) {
      console.error('Error saving reservation:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5A5F]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/reservations')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Editar Reserva' : 'Nova Reserva'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditMode ? 'Atualize os dados da reserva' : 'Adicione uma nova reserva manualmente'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Property Selection */}
        <Card>
          <CardHeader title="Propriedade" />
          <Select
            label="Selecione a Propriedade"
            options={properties.map((p) => ({ value: p.id, label: p.name }))}
            placeholder="Escolha uma propriedade"
            error={errors.propertyId?.message}
            {...register('propertyId')}
          />
        </Card>

        {/* Guest Info */}
        <Card>
          <CardHeader title="Informações do Hóspede" />
          <div className="space-y-4">
            <Input
              label="Nome Completo"
              placeholder="Nome do hóspede"
              error={errors.guestName?.message}
              {...register('guestName')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="email@exemplo.com"
                error={errors.guestEmail?.message}
                {...register('guestEmail')}
              />
              <Input
                label="Telefone"
                type="tel"
                placeholder="(00) 00000-0000"
                error={errors.guestPhone?.message}
                {...register('guestPhone')}
              />
            </div>

            <Input
              label="Número de Hóspedes"
              type="number"
              min={1}
              error={errors.numberOfGuests?.message}
              {...register('numberOfGuests', { valueAsNumber: true })}
            />
          </div>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader title="Datas da Reserva" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data de Check-in"
              type="date"
              error={errors.checkIn?.message}
              {...register('checkIn')}
            />
            <Input
              label="Data de Check-out"
              type="date"
              error={errors.checkOut?.message}
              {...register('checkOut')}
            />
          </div>
        </Card>

        {/* Financial */}
        <Card>
          <CardHeader title="Valores" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Valor Total (R$)"
              type="number"
              min={0}
              step={0.01}
              error={errors.totalAmount?.message}
              {...register('totalAmount', { valueAsNumber: true })}
            />
            <Input
              label="Taxa de Limpeza (R$)"
              type="number"
              min={0}
              step={0.01}
              error={errors.cleaningFee?.message}
              {...register('cleaningFee', { valueAsNumber: true })}
            />
            <Input
              label="Taxa da Plataforma (R$)"
              type="number"
              min={0}
              step={0.01}
              error={errors.platformFee?.message}
              {...register('platformFee', { valueAsNumber: true })}
            />
          </div>
        </Card>

        {/* Status and Source */}
        <Card>
          <CardHeader title="Status e Origem" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Origem da Reserva"
              options={sourceOptions}
              error={errors.source?.message}
              {...register('source')}
            />
            <Select
              label="Status"
              options={statusOptions}
              error={errors.status?.message}
              {...register('status')}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent resize-none"
              rows={3}
              placeholder="Observações sobre a reserva..."
              {...register('notes')}
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/reservations')}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditMode ? 'Atualizar Reserva' : 'Salvar Reserva'}
          </Button>
        </div>
      </form>
    </div>
  );
}
