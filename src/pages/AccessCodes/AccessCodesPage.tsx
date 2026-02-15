import { useState, useEffect } from 'react';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Key, Plus, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import { Card, Button, Input, Select, Badge, Modal } from '../../components/UI';
import { AccessCode, Property } from '../../types';
import { getAccessCodes, createAccessCode, deleteAccessCode } from '../../services/accessCodeService';
import { getProperties } from '../../services/propertyService';
import { parseDateOnly } from '../../utils/date';

export default function AccessCodesPage() {
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());
  
  // New code modal
  const [newCodeModal, setNewCodeModal] = useState(false);
  const [newCode, setNewCode] = useState({
    propertyId: '',
    code: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [saving, setSaving] = useState(false);
  
  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; accessCode: AccessCode | null }>({
    isOpen: false,
    accessCode: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [codesData, propertiesData] = await Promise.all([
        getAccessCodes(),
        getProperties(),
      ]);
      setAccessCodes(codesData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getPropertyName(propertyId: string) {
    const property = properties.find((p) => p.id === propertyId);
    return property?.name || 'Propriedade não encontrada';
  }

  function isCodeActive(accessCode: AccessCode): boolean {
    const today = startOfDay(new Date());
    const startDate = startOfDay(new Date(accessCode.startDate));
    const endDate = startOfDay(new Date(accessCode.endDate));
    
    return !isBefore(today, startDate) && !isAfter(today, endDate);
  }

  function isCodeExpired(accessCode: AccessCode): boolean {
    const today = startOfDay(new Date());
    const endDate = startOfDay(new Date(accessCode.endDate));
    return isAfter(today, endDate);
  }

  function getCodeStatus(accessCode: AccessCode): 'active' | 'expired' | 'future' {
    if (isCodeExpired(accessCode)) return 'expired';
    if (isCodeActive(accessCode)) return 'active';
    return 'future';
  }

  const filteredAccessCodes = accessCodes.filter((code) => {
    const matchesSearch =
      code.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.code.includes(searchTerm) ||
      getPropertyName(code.propertyId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProperty = !selectedProperty || code.propertyId === selectedProperty;
    const matchesStatus = !selectedStatus || getCodeStatus(code) === selectedStatus;
    return matchesSearch && matchesProperty && matchesStatus;
  });

  async function handleCreateCode() {
    if (!newCode.propertyId || !newCode.code || !newCode.startDate || !newCode.endDate) {
      return;
    }

    try {
      setSaving(true);
      await createAccessCode({
        propertyId: newCode.propertyId,
        code: newCode.code,
        description: newCode.description,
        startDate: parseDateOnly(newCode.startDate),
        endDate: parseDateOnly(newCode.endDate),
      });
      
      setNewCodeModal(false);
      setNewCode({
        propertyId: '',
        code: '',
        description: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
      });
      await loadData();
    } catch (error) {
      console.error('Error creating access code:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal.accessCode) return;

    try {
      await deleteAccessCode(deleteModal.accessCode.id);
      setAccessCodes(accessCodes.filter((c) => c.id !== deleteModal.accessCode!.id));
      setDeleteModal({ isOpen: false, accessCode: null });
    } catch (error) {
      console.error('Error deleting access code:', error);
    }
  }

  function toggleCodeVisibility(id: string) {
    const newVisible = new Set(visibleCodes);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleCodes(newVisible);
  }

  function maskCode(code: string): string {
    return '*'.repeat(code.length);
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
          <h1 className="text-2xl font-bold text-gray-800">Senhas de Acesso</h1>
          <p className="text-gray-500 mt-1">Gerencie as senhas de acesso das propriedades</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setNewCodeModal(true)}>
          Nova Senha
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Key className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Ativas</p>
              <p className="text-2xl font-bold text-gray-800">
                {accessCodes.filter((c) => getCodeStatus(c) === 'active').length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Key className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Vencidas</p>
              <p className="text-2xl font-bold text-gray-800">
                {accessCodes.filter((c) => getCodeStatus(c) === 'expired').length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Futuras</p>
              <p className="text-2xl font-bold text-gray-800">
                {accessCodes.filter((c) => getCodeStatus(c) === 'future').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por descrição, código ou propriedade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus:ring-0"
            />
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
            <Select
              options={[
                { value: '', label: 'Todas propriedades' },
                ...properties.map((p) => ({ value: p.id, label: p.name })),
              ]}
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full sm:w-48"
            />
            <Select
              options={[
                { value: '', label: 'Todos status' },
                { value: 'active', label: 'Ativa' },
                { value: 'expired', label: 'Vencida' },
                { value: 'future', label: 'Futura' },
              ]}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-40"
            />
          </div>
        </div>
      </Card>

      {/* List */}
      {filteredAccessCodes.length === 0 ? (
        <Card className="text-center py-12">
          <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhuma senha encontrada</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedProperty || selectedStatus
              ? 'Tente ajustar seus filtros'
              : 'Comece adicionando sua primeira senha de acesso'}
          </p>
          <Button onClick={() => setNewCodeModal(true)}>Adicionar Senha</Button>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Propriedade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Descrição</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Senha</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Validade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccessCodes.map((accessCode) => {
                  const status = getCodeStatus(accessCode);
                  return (
                    <tr key={accessCode.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">{getPropertyName(accessCode.propertyId)}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {accessCode.description || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {visibleCodes.has(accessCode.id) ? accessCode.code : maskCode(accessCode.code)}
                          </code>
                          <button
                            onClick={() => toggleCodeVisibility(accessCode.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title={visibleCodes.has(accessCode.id) ? 'Ocultar senha' : 'Mostrar senha'}
                          >
                            {visibleCodes.has(accessCode.id) ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <span className="text-sm">
                          {format(new Date(accessCode.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                          {' - '}
                          {format(new Date(accessCode.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            status === 'active' ? 'success' : status === 'expired' ? 'error' : 'info'
                          }
                        >
                          {status === 'active' ? 'Ativa' : status === 'expired' ? 'Vencida' : 'Futura'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, accessCode })}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir senha"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* New Code Modal */}
      <Modal
        isOpen={newCodeModal}
        onClose={() => setNewCodeModal(false)}
        title="Nova Senha de Acesso"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Propriedade *</label>
            <Select
              options={[
                { value: '', label: 'Selecione uma propriedade' },
                ...properties.map((p) => ({ value: p.id, label: p.name })),
              ]}
              value={newCode.propertyId}
              onChange={(e) => setNewCode({ ...newCode, propertyId: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha (até 10 dígitos) *</label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              placeholder="Ex: 1234"
              value={newCode.code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setNewCode({ ...newCode, code: value });
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <Input
              placeholder="Ex: Senha do portão, Senha do cofre..."
              value={newCode.description}
              onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início *</label>
              <Input
                type="date"
                value={newCode.startDate}
                onChange={(e) => setNewCode({ ...newCode, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim *</label>
              <Input
                type="date"
                value={newCode.endDate}
                onChange={(e) => setNewCode({ ...newCode, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={() => setNewCodeModal(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreateCode}
            disabled={saving || !newCode.propertyId || !newCode.code || !newCode.startDate || !newCode.endDate}
          >
            {saving ? 'Salvando...' : 'Criar Senha'}
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, accessCode: null })}
        title="Excluir Senha"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Tem certeza que deseja excluir esta senha de acesso? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, accessCode: null })}>
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
