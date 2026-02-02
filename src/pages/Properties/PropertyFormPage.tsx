import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Card, CardHeader, Button, Input, Select } from '../../components/UI';
import { createProperty } from '../../services/propertyService';
import { PropertyType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const propertySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  country: z.string().min(2, 'País é obrigatório'),
  zipCode: z.string().min(5, 'CEP é obrigatório'),
  type: z.enum(['apartment', 'house', 'studio', 'villa', 'cabin', 'other'] as const),
  bedrooms: z.number().min(0, 'Número de quartos inválido'),
  bathrooms: z.number().min(0, 'Número de banheiros inválido'),
  maxGuests: z.number().min(1, 'Número de hóspedes deve ser pelo menos 1'),
  basePrice: z.number().min(0, 'Preço base inválido'),
  cleaningFee: z.number().min(0, 'Taxa de limpeza inválida'),
  description: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartamento' },
  { value: 'house', label: 'Casa' },
  { value: 'studio', label: 'Studio' },
  { value: 'villa', label: 'Villa' },
  { value: 'cabin', label: 'Cabana' },
  { value: 'other', label: 'Outro' },
];

const defaultAmenities = [
  'Wi-Fi',
  'Ar condicionado',
  'TV',
  'Cozinha',
  'Máquina de lavar',
  'Piscina',
  'Estacionamento',
  'Churrasqueira',
  'Vista para o mar',
  'Varanda',
];

export default function PropertyFormPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      country: 'Brasil',
      type: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      basePrice: 0,
      cleaningFee: 0,
    },
  });

  async function onSubmit(data: PropertyFormData) {
    try {
      setIsLoading(true);
      await createProperty({
        ...data,
        description: data.description || '',
        amenities,
        images: [],
        isActive: true,
        ownerId: currentUser?.id || '',
      });
      navigate('/properties');
    } catch (error) {
      console.error('Error creating property:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleAmenity(amenity: string) {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  }

  function addCustomAmenity() {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity('');
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/properties')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nova Propriedade</h1>
          <p className="text-gray-500 mt-1">Adicione uma nova propriedade ao sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader title="Informações Básicas" />
          <div className="space-y-4">
            <Input
              label="Nome da Propriedade"
              placeholder="Ex: Apartamento Vista Mar"
              error={errors.name?.message}
              {...register('name')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipo de Propriedade"
                options={propertyTypes}
                error={errors.type?.message}
                {...register('type')}
              />
              <Input
                label="Capacidade Máxima de Hóspedes"
                type="number"
                min={1}
                error={errors.maxGuests?.message}
                {...register('maxGuests', { valueAsNumber: true })}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Quartos"
                type="number"
                min={0}
                error={errors.bedrooms?.message}
                {...register('bedrooms', { valueAsNumber: true })}
              />
              <Input
                label="Banheiros"
                type="number"
                min={0}
                error={errors.bathrooms?.message}
                {...register('bathrooms', { valueAsNumber: true })}
              />
              <Input
                label="Diária Base (R$)"
                type="number"
                min={0}
                step={0.01}
                error={errors.basePrice?.message}
                {...register('basePrice', { valueAsNumber: true })}
              />
              <Input
                label="Taxa de Limpeza (R$)"
                type="number"
                min={0}
                step={0.01}
                error={errors.cleaningFee?.message}
                {...register('cleaningFee', { valueAsNumber: true })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent resize-none"
                rows={4}
                placeholder="Descreva sua propriedade..."
                {...register('description')}
              />
            </div>
          </div>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader title="Endereço" />
          <div className="space-y-4">
            <Input
              label="Endereço Completo"
              placeholder="Rua, número, complemento"
              error={errors.address?.message}
              {...register('address')}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Cidade"
                placeholder="Ex: São Paulo"
                error={errors.city?.message}
                {...register('city')}
              />
              <Input
                label="Estado"
                placeholder="Ex: SP"
                error={errors.state?.message}
                {...register('state')}
              />
              <Input
                label="CEP"
                placeholder="00000-000"
                error={errors.zipCode?.message}
                {...register('zipCode')}
              />
            </div>

            <Input
              label="País"
              placeholder="Brasil"
              error={errors.country?.message}
              {...register('country')}
            />
          </div>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader title="Comodidades" subtitle="Selecione as comodidades disponíveis" />
          <div className="flex flex-wrap gap-2 mb-4">
            {defaultAmenities.map((amenity) => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  amenities.includes(amenity)
                    ? 'bg-[#FF5A5F] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>

          {/* Custom amenities */}
          {amenities.filter((a) => !defaultAmenities.includes(a)).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {amenities
                .filter((a) => !defaultAmenities.includes(a))
                .map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-[#00A699] text-white"
                  >
                    {amenity}
                    <button
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className="hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Adicionar comodidade personalizada"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
            />
            <Button type="button" variant="outline" onClick={addCustomAmenity}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/properties')}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Salvar Propriedade
          </Button>
        </div>
      </form>
    </div>
  );
}
