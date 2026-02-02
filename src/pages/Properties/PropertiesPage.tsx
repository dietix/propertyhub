import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Home, MapPin, Bed, Bath, Users, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Card, Button, Input, Badge, Modal } from '../../components/UI';
import { Property } from '../../types';
import { getProperties, deleteProperty } from '../../services/propertyService';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; property: Property | null }>({
    isOpen: false,
    property: null,
  });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    const filtered = properties.filter(
      (property) =>
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProperties(filtered);
  }, [searchTerm, properties]);

  async function fetchProperties() {
    try {
      const data = await getProperties();
      setProperties(data);
      setFilteredProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal.property) return;

    try {
      await deleteProperty(deleteModal.property.id);
      setProperties(properties.filter((p) => p.id !== deleteModal.property!.id));
      setDeleteModal({ isOpen: false, property: null });
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  }

  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      apartment: 'Apartamento',
      house: 'Casa',
      studio: 'Studio',
      villa: 'Villa',
      cabin: 'Cabana',
      other: 'Outro',
    };
    return types[type] || type;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Propriedades</h1>
          <p className="text-gray-500 mt-1">Gerencie suas propriedades</p>
        </div>
        <Link to="/properties/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>Nova Propriedade</Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar por nome, cidade ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 focus:ring-0"
          />
        </div>
      </Card>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <Card className="text-center py-12">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            {searchTerm ? 'Nenhuma propriedade encontrada' : 'Nenhuma propriedade cadastrada'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Tente ajustar sua busca' : 'Comece adicionando sua primeira propriedade'}
          </p>
          {!searchTerm && (
            <Link to="/properties/new">
              <Button>Adicionar Propriedade</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Card key={property.id} padding="none" className="overflow-hidden">
              {/* Property Image */}
              <div className="relative h-48 bg-gray-200">
                {property.images && property.images[0] ? (
                  <img
                    src={property.images[0]}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant={property.isActive ? 'success' : 'error'}>
                    {property.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>

              {/* Property Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{property.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {property.city}, {property.state}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === property.id ? null : property.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    {activeMenu === property.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <Link
                          to={`/properties/${property.id}/edit`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </Link>
                        <button
                          onClick={() => {
                            setDeleteModal({ isOpen: true, property });
                            setActiveMenu(null);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    {property.bedrooms} quartos
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    {property.bathrooms} banheiros
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {property.maxGuests} hóspedes
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Tipo</p>
                    <p className="text-sm font-medium text-gray-700">{getPropertyTypeLabel(property.type)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Diária base</p>
                    <p className="text-lg font-bold text-[#FF5A5F]">
                      R$ {property.basePrice?.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, property: null })}
        title="Excluir Propriedade"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Tem certeza que deseja excluir a propriedade <strong>{deleteModal.property?.name}</strong>? 
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, property: null })}>
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
