import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, Filter, ChevronLeft, ChevronRight, Trash2, Lock, X, Eye, User, Mail, Phone, Users, DollarSign, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, addMonths, subMonths, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardHeader, Button, Input, Badge, Select, Modal } from '../../components/UI';
import { Reservation, Property, ReservationStatus, ReservationSource, DateBlock } from '../../types';
import { getReservations, updateReservationStatus, deleteReservation } from '../../services/reservationService';
import { getProperties } from '../../services/propertyService';
import { getDateBlocks, createDateBlock, deleteDateBlock } from '../../services/dateBlockService';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [dateBlocks, setDateBlocks] = useState<DateBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; reservation: Reservation | null }>({
    isOpen: false,
    reservation: null,
  });
  const [viewModal, setViewModal] = useState<{ isOpen: boolean; reservation: Reservation | null }>({
    isOpen: false,
    reservation: null,
  });
  const [blockModal, setBlockModal] = useState<{ isOpen: boolean; dateBlock: DateBlock | null }>({
    isOpen: false,
    dateBlock: null,
  });
  const [newBlockModal, setNewBlockModal] = useState(false);
  const [newBlock, setNewBlock] = useState({
    propertyId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  
  // Filtros de data - mês atual como padrão
  const [startDateFilter, setStartDateFilter] = useState(() => {
    return format(startOfMonth(new Date()), 'yyyy-MM-dd');
  });
  const [endDateFilter, setEndDateFilter] = useState(() => {
    return format(endOfMonth(new Date()), 'yyyy-MM-dd');
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [reservationsData, propertiesData, dateBlocksData] = await Promise.all([
        getReservations(),
        getProperties(),
        getDateBlocks(),
      ]);
      setReservations(reservationsData);
      setProperties(propertiesData);
      setDateBlocks(dateBlocksData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.guestEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProperty = !selectedProperty || reservation.propertyId === selectedProperty;
    const matchesStatus = !selectedStatus || reservation.status === selectedStatus;
    
    // Filtro de data
    const checkIn = new Date(reservation.checkIn);
    const start = new Date(startDateFilter);
    const end = new Date(endDateFilter);
    end.setHours(23, 59, 59, 999);
    const matchesDate = checkIn >= start && checkIn <= end;
    
    return matchesSearch && matchesProperty && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: ReservationStatus) => {
    const statusConfig: Record<ReservationStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
      pending: { label: 'Pendente', variant: 'warning' },
      confirmed: { label: 'Confirmada', variant: 'success' },
      'checked-in': { label: 'Check-in', variant: 'info' },
      'checked-out': { label: 'Check-out', variant: 'info' },
      cancelled: { label: 'Cancelada', variant: 'error' },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSourceBadge = (source: ReservationSource) => {
    const sourceConfig: Record<ReservationSource, { label: string; color: string }> = {
      airbnb: { label: 'Airbnb', color: 'bg-[#FF5A5F]' },
      booking: { label: 'Booking', color: 'bg-blue-600' },
      vrbo: { label: 'VRBO', color: 'bg-purple-600' },
      direct: { label: 'Direto', color: 'bg-green-600' },
      other: { label: 'Outro', color: 'bg-gray-600' },
    };
    const config = sourceConfig[source];
    return (
      <span className={`px-2 py-0.5 text-xs font-medium text-white rounded ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    return property?.name || 'Propriedade não encontrada';
  };

  async function handleStatusChange(reservationId: string, newStatus: ReservationStatus) {
    try {
      await updateReservationStatus(reservationId, newStatus);
      setReservations(
        reservations.map((r) =>
          r.id === reservationId ? { ...r, status: newStatus } : r
        )
      );
    } catch (error) {
      console.error('Error updating reservation status:', error);
    }
  }

  async function handleDelete() {
    if (!deleteModal.reservation) return;

    try {
      await deleteReservation(deleteModal.reservation.id);
      setReservations(reservations.filter((r) => r.id !== deleteModal.reservation!.id));
      setDeleteModal({ isOpen: false, reservation: null });
    } catch (error) {
      console.error('Error deleting reservation:', error);
    }
  }

  async function handleCreateBlock() {
    if (!newBlock.propertyId || !newBlock.startDate || !newBlock.endDate) return;

    try {
      const id = await createDateBlock({
        propertyId: newBlock.propertyId,
        startDate: new Date(newBlock.startDate),
        endDate: new Date(newBlock.endDate),
        reason: newBlock.reason,
      });
      
      const newDateBlock: DateBlock = {
        id,
        propertyId: newBlock.propertyId,
        startDate: new Date(newBlock.startDate),
        endDate: new Date(newBlock.endDate),
        reason: newBlock.reason,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setDateBlocks([...dateBlocks, newDateBlock]);
      setNewBlockModal(false);
      setNewBlock({ propertyId: '', startDate: '', endDate: '', reason: '' });
    } catch (error) {
      console.error('Error creating date block:', error);
    }
  }

  async function handleDeleteBlock() {
    if (!blockModal.dateBlock) return;

    try {
      await deleteDateBlock(blockModal.dateBlock.id);
      setDateBlocks(dateBlocks.filter((b) => b.id !== blockModal.dateBlock!.id));
      setBlockModal({ isOpen: false, dateBlock: null });
    } catch (error) {
      console.error('Error deleting date block:', error);
    }
  }

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getReservationsForDay = (day: Date) => {
    return filteredReservations.filter((reservation) => {
      const checkIn = new Date(reservation.checkIn);
      const checkOut = new Date(reservation.checkOut);
      return isWithinInterval(day, { start: checkIn, end: checkOut }) || 
             isSameDay(day, checkIn) || 
             isSameDay(day, checkOut);
    });
  };

  const getBlocksForDay = (day: Date) => {
    return dateBlocks.filter((block) => {
      const start = new Date(block.startDate);
      const end = new Date(block.endDate);
      return isWithinInterval(day, { start, end }) || 
             isSameDay(day, start) || 
             isSameDay(day, end);
    });
  };

  const isDayBlocked = (day: Date) => {
    return getBlocksForDay(day).length > 0;
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
          <h1 className="text-2xl font-bold text-gray-800">Reservas</h1>
          <p className="text-gray-500 mt-1">Gerencie todas as reservas</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-600'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-white shadow text-gray-800' : 'text-gray-600'
              }`}
            >
              Calendário
            </button>
          </div>
          <Button 
            variant="outline" 
            leftIcon={<Lock className="w-4 h-4" />}
            onClick={() => setNewBlockModal(true)}
            className="text-sm"
          >
            <span className="hidden sm:inline">Bloquear Datas</span>
            <span className="sm:hidden">Bloquear</span>
          </Button>
          <Link to="/reservations/new">
            <Button leftIcon={<Plus className="w-4 h-4" />} className="text-sm">
              <span className="hidden sm:inline">Nova Reserva</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por hóspede ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus:ring-0"
            />
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <Input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full sm:w-36"
                />
              </div>
              <span className="text-gray-400 hidden sm:inline">até</span>
              <Input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-full sm:w-36"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
                  { value: 'pending', label: 'Pendente' },
                  { value: 'confirmed', label: 'Confirmada' },
                  { value: 'checked-in', label: 'Check-in' },
                  { value: 'checked-out', label: 'Check-out' },
                  { value: 'cancelled', label: 'Cancelada' },
                ]}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {filteredReservations.length === 0 ? (
            <Card className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhuma reserva encontrada</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedProperty || selectedStatus
                  ? 'Tente ajustar seus filtros'
                  : 'Comece adicionando sua primeira reserva'}
              </p>
              <Link to="/reservations/new">
                <Button>Adicionar Reserva</Button>
              </Link>
            </Card>
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Hóspede</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Propriedade</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check-in</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check-out</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Origem</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((reservation) => (
                      <tr key={reservation.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-800">{reservation.guestName}</p>
                          <p className="text-sm text-gray-500">{reservation.guestEmail}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {getPropertyName(reservation.propertyId)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {format(new Date(reservation.checkIn), 'dd/MM/yyyy')}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {format(new Date(reservation.checkOut), 'dd/MM/yyyy')}
                        </td>
                        <td className="py-3 px-4">{getSourceBadge(reservation.source)}</td>
                        <td className="py-3 px-4">{getStatusBadge(reservation.status)}</td>
                        <td className="py-3 px-4 font-medium text-gray-800">
                          R$ {reservation.totalAmount.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setViewModal({ isOpen: true, reservation })}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <Select
                              options={[
                                { value: 'pending', label: 'Pendente' },
                                { value: 'confirmed', label: 'Confirmada' },
                                { value: 'checked-in', label: 'Check-in' },
                                { value: 'checked-out', label: 'Check-out' },
                                { value: 'cancelled', label: 'Cancelada' },
                              ]}
                              value={reservation.status}
                              onChange={(e) => handleStatusChange(reservation.id, e.target.value as ReservationStatus)}
                              className="w-32 text-sm"
                            />
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, reservation })}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir reserva"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            {daysInMonth.map((day, idx) => {
              const dayReservations = getReservationsForDay(day);
              const dayBlocks = getBlocksForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              const isBlocked = dayBlocks.length > 0;

              return (
                <div
                  key={idx}
                  className={`min-h-16 sm:min-h-24 p-0.5 sm:p-1 border border-gray-100 rounded-lg ${
                    !isCurrentMonth ? 'bg-gray-50' : ''
                  } ${isToday ? 'ring-2 ring-[#FF5A5F]' : ''} ${isBlocked ? 'bg-gray-200' : ''}`}
                >
                  <div className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${isToday ? 'text-[#FF5A5F]' : 'text-gray-600'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 hidden sm:block">
                    {dayBlocks.slice(0, 1).map((block) => (
                      <div
                        key={block.id}
                        className="text-xs p-1 bg-gray-600 text-white rounded truncate cursor-pointer flex items-center gap-1"
                        title={`Bloqueado: ${block.reason || 'Sem motivo'}`}
                        onClick={() => setBlockModal({ isOpen: true, dateBlock: block })}
                      >
                        <Lock className="w-3 h-3" />
                        {block.reason || 'Bloqueado'}
                      </div>
                    ))}
                    {dayReservations.slice(0, isBlocked ? 1 : 2).map((reservation) => (
                      <div
                        key={reservation.id}
                        className="text-xs p-1 bg-[#FF5A5F]/10 text-[#FF5A5F] rounded truncate"
                        title={reservation.guestName}
                      >
                        {reservation.guestName}
                      </div>
                    ))}
                    {(dayReservations.length + dayBlocks.length) > 2 && (
                      <div className="text-xs text-gray-500">+{dayReservations.length + dayBlocks.length - 2} mais</div>
                    )}
                  </div>
                  {/* Mobile indicator */}
                  {(dayReservations.length > 0 || dayBlocks.length > 0) && (
                    <div className="sm:hidden flex gap-0.5 flex-wrap">
                      {dayBlocks.length > 0 && (
                        <div className="w-1.5 h-1.5 bg-gray-600 rounded-full" title="Bloqueado" />
                      )}
                      {dayReservations.slice(0, 3).map((r) => (
                        <div key={r.id} className="w-1.5 h-1.5 bg-[#FF5A5F] rounded-full" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* View Reservation Modal */}
      <Modal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, reservation: null })}
        title="Detalhes da Reserva"
        size="lg"
      >
        {viewModal.reservation && (
          <div className="space-y-6">
            {/* Header com status e origem */}
            <div className="flex flex-wrap items-center gap-3">
              {getStatusBadge(viewModal.reservation.status)}
              {getSourceBadge(viewModal.reservation.source)}
            </div>

            {/* Informações do Hóspede */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Informações do Hóspede</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FF5A5F]/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-[#FF5A5F]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nome</p>
                    <p className="font-medium text-gray-800">{viewModal.reservation.guestName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{viewModal.reservation.guestEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Telefone</p>
                    <p className="font-medium text-gray-800">{viewModal.reservation.guestPhone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hóspedes</p>
                    <p className="font-medium text-gray-800">{viewModal.reservation.numberOfGuests} pessoa(s)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações da Reserva */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Detalhes da Estadia</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Propriedade</p>
                  <p className="font-medium text-gray-800">{getPropertyName(viewModal.reservation.propertyId)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Check-in</p>
                  <p className="font-medium text-gray-800">
                    {format(new Date(viewModal.reservation.checkIn), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Check-out</p>
                  <p className="font-medium text-gray-800">
                    {format(new Date(viewModal.reservation.checkOut), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="sm:col-span-3">
                  <p className="text-xs text-gray-500">Duração</p>
                  <p className="font-medium text-gray-800">
                    {differenceInDays(new Date(viewModal.reservation.checkOut), new Date(viewModal.reservation.checkIn))} noite(s)
                  </p>
                </div>
              </div>
            </div>

            {/* Informações Financeiras */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Valores</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Valor da estadia</span>
                  <span className="font-medium text-gray-800">
                    R$ {(viewModal.reservation.totalAmount - viewModal.reservation.cleaningFee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taxa de limpeza</span>
                  <span className="font-medium text-gray-800">
                    R$ {viewModal.reservation.cleaningFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taxa da plataforma</span>
                  <span className="font-medium text-red-600">
                    - R$ {viewModal.reservation.platformFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Total</span>
                  <span className="font-bold text-lg text-green-600">
                    R$ {viewModal.reservation.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Observações */}
            {viewModal.reservation.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Observações</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{viewModal.reservation.notes}</p>
              </div>
            )}

            {/* Data de criação */}
            <div className="text-xs text-gray-400 text-right">
              Reserva criada em {format(new Date(viewModal.reservation.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </div>
        )}
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={() => setViewModal({ isOpen: false, reservation: null })}>
            Fechar
          </Button>
          <Link to={`/reservations/${viewModal.reservation?.id}/edit`}>
            <Button>Editar Reserva</Button>
          </Link>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, reservation: null })}
        title="Excluir Reserva"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Tem certeza que deseja excluir a reserva de <strong>{deleteModal.reservation?.guestName}</strong>? 
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, reservation: null })}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </Modal>

      {/* New Block Modal */}
      <Modal
        isOpen={newBlockModal}
        onClose={() => setNewBlockModal(false)}
        title="Bloquear Datas"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Propriedade"
            options={[
              { value: '', label: 'Selecione uma propriedade' },
              ...properties.map((p) => ({ value: p.id, label: p.name })),
            ]}
            value={newBlock.propertyId}
            onChange={(e) => setNewBlock({ ...newBlock, propertyId: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data Início"
              type="date"
              value={newBlock.startDate}
              onChange={(e) => setNewBlock({ ...newBlock, startDate: e.target.value })}
            />
            <Input
              label="Data Fim"
              type="date"
              value={newBlock.endDate}
              onChange={(e) => setNewBlock({ ...newBlock, endDate: e.target.value })}
            />
          </div>
          <Input
            label="Motivo (opcional)"
            value={newBlock.reason}
            onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
            placeholder="Ex: Manutenção, Uso pessoal..."
          />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={() => setNewBlockModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateBlock} disabled={!newBlock.propertyId || !newBlock.startDate || !newBlock.endDate}>
            Bloquear
          </Button>
        </div>
      </Modal>

      {/* Delete Block Modal */}
      <Modal
        isOpen={blockModal.isOpen}
        onClose={() => setBlockModal({ isOpen: false, dateBlock: null })}
        title="Detalhes do Bloqueio"
        size="sm"
      >
        {blockModal.dateBlock && (
          <div className="space-y-3 mb-6">
            <p className="text-gray-600">
              <strong>Propriedade:</strong> {getPropertyName(blockModal.dateBlock.propertyId)}
            </p>
            <p className="text-gray-600">
              <strong>Período:</strong> {format(new Date(blockModal.dateBlock.startDate), 'dd/MM/yyyy')} até {format(new Date(blockModal.dateBlock.endDate), 'dd/MM/yyyy')}
            </p>
            {blockModal.dateBlock.reason && (
              <p className="text-gray-600">
                <strong>Motivo:</strong> {blockModal.dateBlock.reason}
              </p>
            )}
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setBlockModal({ isOpen: false, dateBlock: null })}>
            Fechar
          </Button>
          <Button variant="danger" onClick={handleDeleteBlock}>
            Remover Bloqueio
          </Button>
        </div>
      </Modal>
    </div>
  );
}
