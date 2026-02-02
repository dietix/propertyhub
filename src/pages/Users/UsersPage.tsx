import { useEffect, useState } from 'react';
import { Card, CardHeader, Badge, Button, Modal, Select } from '../../components/UI';
import { User, UserRole } from '../../types';
import { supabase } from '../../config/supabase';
import { Users, Shield, Mail } from 'lucide-react';
import { format } from 'date-fns';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  });
  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersData = (data || []).map((doc) => ({
        id: doc.id,
        email: doc.email,
        displayName: doc.display_name,
        role: doc.role as UserRole,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRole() {
    if (!editModal.user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: selectedRole })
        .eq('id', editModal.user.id);

      if (error) throw error;

      setUsers(users.map((u) => (u.id === editModal.user!.id ? { ...u, role: selectedRole } : u)));
      setEditModal({ isOpen: false, user: null });
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const roleConfig: Record<UserRole, { label: string; variant: 'success' | 'warning' | 'info' }> = {
      admin: { label: 'Administrador', variant: 'success' },
      manager: { label: 'Gerente', variant: 'warning' },
      viewer: { label: 'Visualizador', variant: 'info' },
    };
    const config = roleConfig[role];
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
        <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
        <p className="text-gray-500 mt-1">Gerencie os usuários e permissões do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FF5A5F]/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-[#FF5A5F]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Usuários</p>
              <p className="text-2xl font-bold text-gray-800">{users.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Administradores</p>
              <p className="text-2xl font-bold text-gray-800">
                {users.filter((u) => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Gerentes</p>
              <p className="text-2xl font-bold text-gray-800">
                {users.filter((u) => u.role === 'manager').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Usuário</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Função</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Criado em</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {user.displayName?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">{user.displayName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                  </td>
                  <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRole(user.role);
                        setEditModal({ isOpen: true, user });
                      }}
                    >
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Role Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, user: null })}
        title="Editar Função"
        size="sm"
      >
        <p className="text-gray-600 mb-4">
          Altere a função do usuário <strong>{editModal.user?.displayName}</strong>
        </p>
        <Select
          label="Função"
          options={[
            { value: 'viewer', label: 'Visualizador' },
            { value: 'manager', label: 'Gerente' },
            { value: 'admin', label: 'Administrador' },
          ]}
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
        />
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={() => setEditModal({ isOpen: false, user: null })}>
            Cancelar
          </Button>
          <Button onClick={handleUpdateRole}>Salvar</Button>
        </div>
      </Modal>
    </div>
  );
}
