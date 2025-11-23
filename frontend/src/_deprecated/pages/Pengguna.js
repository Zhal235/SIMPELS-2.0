import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Table from '../components/Table';
import { useAuthStore } from '../stores/useAuthStore';
import { listUsers, updateUser, deleteUser, createUser } from '../api/users';
import { listRoles, createRole, updateRole, deleteRole } from '../api/roles';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
export default function Pengguna() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const currentUser = useAuthStore((s) => s.user);
    // edit modal
    const [showEdit, setShowEdit] = useState(false);
    const [editing, setEditing] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [newPassword, setNewPassword] = useState('');
    // delete confirm
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(null);
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const payload = await listUsers();
                if (payload?.success)
                    setRows(payload.data || []);
            }
            catch (e) {
                console.error('Failed to fetch users', e);
            }
        };
        load();
    }, []);
    async function reload() {
        try {
            setLoading(true);
            const payload = await listUsers();
            if (payload?.success)
                setRows(payload.data || []);
        }
        catch (e) {
            console.error('Failed to fetch users', e);
            toast.error('Gagal memuat pengguna');
        }
        finally {
            setLoading(false);
        }
    }
    async function handleSave() {
        if (!editing)
            return;
        try {
            const payload = { role: newRole };
            if (newPassword && newPassword.trim().length > 0)
                payload.password = newPassword;
            const res = await updateUser(editing.id, payload);
            if (res.success) {
                toast.success('Perubahan user tersimpan');
                setShowEdit(false);
                setEditing(null);
                await reload();
            }
            else {
                toast.error(res.message || 'Gagal menyimpan perubahan');
            }
        }
        catch (e) {
            console.error(e);
            toast.error(e?.response?.data?.message || 'Gagal menyimpan perubahan');
        }
    }
    async function handleDeleteConfirm() {
        if (!deleting)
            return;
        try {
            const res = await deleteUser(deleting.id);
            if (res.success) {
                toast.success('User dihapus');
                setShowDelete(false);
                setDeleting(null);
                await reload();
            }
            else {
                toast.error(res.message || 'Gagal menghapus user');
            }
        }
        catch (e) {
            console.error(e);
            toast.error(e?.response?.data?.message || 'Gagal menghapus user');
        }
    }
    // create user
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('user');
    async function handleCreateUser() {
        try {
            const payload = { name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole };
            const res = await createUser(payload);
            if (res.success) {
                toast.success('User dibuat');
                setShowCreateUser(false);
                setNewUserName('');
                setNewUserEmail('');
                setNewUserPassword('');
                await reload();
            }
        }
        catch (e) {
            console.error(e);
            toast.error(e?.response?.data?.message || 'Gagal membuat user');
        }
    }
    // Roles management
    const [rolesList, setRolesList] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRoleObj, setEditingRoleObj] = useState(null);
    const [roleName, setRoleName] = useState('');
    const [roleMenus, setRoleMenus] = useState([]);
    const availableMenus = [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'kesantrian.santri', label: 'Kesantrian • Data Santri' },
        { key: 'keuangan.pembayaran', label: 'Keuangan • Pembayaran Santri' },
        { key: 'dompet.dompet-santri', label: 'Dompet • Dompet Santri' },
        { key: 'dompet.manage', label: 'Dompet • Manage (Edit/Delete transaksi)' },
        { key: 'dompet.rfid', label: 'Dompet • RFID' },
        { key: 'dompet.history', label: 'Dompet • History' },
        { key: 'dompet.withdrawals', label: 'Dompet • Penarikan (ePOS)' },
        { key: 'pengguna', label: 'Pengguna' },
        { key: 'pengaturan', label: 'Pengaturan' },
    ];
    async function loadRoles() {
        try {
            setRolesLoading(true);
            const res = await listRoles();
            if (res?.success)
                setRolesList(res.data || []);
        }
        catch (e) {
            console.error(e);
            toast.error('Gagal memuat roles');
        }
        finally {
            setRolesLoading(false);
        }
    }
    useEffect(() => { loadRoles(); }, []);
    function openCreateRole() {
        setEditingRoleObj(null);
        setRoleName('');
        setRoleMenus([]);
        setShowRoleModal(true);
    }
    function openEditRole(role) {
        setEditingRoleObj(role);
        setRoleName(role.name);
        setRoleMenus(role.menus ?? []);
        setShowRoleModal(true);
    }
    async function saveRole() {
        if (!roleName.trim()) {
            toast.error('Nama role harus diisi');
            return;
        }
        try {
            if (editingRoleObj) {
                const res = await updateRole(editingRoleObj.id, { name: roleName, menus: roleMenus });
                if (res.success) {
                    toast.success('Role diperbarui');
                    setShowRoleModal(false);
                    await loadRoles();
                }
            }
            else {
                const res = await createRole({ name: roleName, menus: roleMenus });
                if (res.success) {
                    toast.success('Role dibuat');
                    setShowRoleModal(false);
                    await loadRoles();
                }
            }
        }
        catch (e) {
            console.error(e);
            toast.error(e?.response?.data?.message || 'Gagal menyimpan role');
        }
    }
    async function removeRole(role) {
        if (!confirm(`Hapus role ${role.name}?`))
            return;
        try {
            const res = await deleteRole(role.id);
            if (res.success) {
                toast.success('Role dihapus');
                await loadRoles();
            }
        }
        catch (e) {
            console.error(e);
            toast.error(e?.response?.data?.message || 'Gagal menghapus role');
        }
    }
    const columns = [
        { key: 'name', header: 'Nama' },
        { key: 'role', header: 'Role' },
        { key: 'email', header: 'Email' },
    ];
    // add actions column for admins
    if (currentUser?.role === 'admin') {
        columns.push({ key: 'actions', header: 'Aksi', render: (_v, r) => (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "px-3 py-1 rounded bg-yellow-500 text-white text-sm", onClick: () => { setEditing(r); setNewRole(r.role); setNewPassword(''); setShowEdit(true); }, children: "Edit" }), _jsx("button", { className: "px-3 py-1 rounded bg-red-600 text-white text-sm", onClick: () => { setDeleting(r); setShowDelete(true); }, children: "Hapus" })] })) });
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Pengguna" }), _jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("div", {}), currentUser?.role === 'admin' && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { className: "btn", onClick: () => setShowCreateUser(true), children: "Tambah User" }), _jsx("button", { className: "btn btn-primary", onClick: openCreateRole, children: "Tambah Role" })] }))] }), _jsx(Card, { children: _jsx(Table, { columns: columns, data: rows, loading: loading }) }), _jsx(Modal, { open: showCreateUser, title: "Tambah User", onClose: () => setShowCreateUser(false), footer: (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: () => setShowCreateUser(false), children: "Batal" }), _jsx("button", { className: "btn btn-primary", onClick: handleCreateUser, children: "Buat User" })] })), children: _jsxs("div", { className: "grid gap-3", children: [_jsx("label", { className: "block text-sm", children: "Nama" }), _jsx("input", { className: "rounded border px-3 py-2", value: newUserName, onChange: (e) => setNewUserName(e.target.value) }), _jsx("label", { className: "block text-sm", children: "Email" }), _jsx("input", { className: "rounded border px-3 py-2", value: newUserEmail, onChange: (e) => setNewUserEmail(e.target.value) }), _jsx("label", { className: "block text-sm", children: "Password" }), _jsx("input", { type: "password", className: "rounded border px-3 py-2", value: newUserPassword, onChange: (e) => setNewUserPassword(e.target.value) }), _jsx("label", { className: "block text-sm", children: "Role" }), _jsx("select", { value: newUserRole, onChange: (e) => setNewUserRole(e.target.value), className: "rounded border px-3 py-2", children: rolesList.map(r => _jsx("option", { value: r.slug, children: r.name }, r.id)) })] }) }), currentUser?.role === 'admin' && (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold mt-6", children: "Kelola Role" }), _jsx("div", { children: _jsx("button", { className: "btn btn-primary", onClick: openCreateRole, children: "Tambah Role" }) })] }), _jsx(Card, { children: _jsx(Table, { columns: [{ key: 'name', header: 'Nama' }, { key: 'menus', header: 'Menus', render: (_v, r) => (r.menus?.length ? r.menus.join(', ') : '-') }, { key: 'actions', header: 'Aksi', render: (_v, r) => (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "btn btn-sm", onClick: () => openEditRole(r), children: "Edit" }), _jsx("button", { className: "btn btn-danger btn-sm", onClick: () => removeRole(r), children: "Hapus" })] })) }], data: rolesList, loading: rolesLoading }) }), _jsx(Modal, { open: showRoleModal, title: editingRoleObj ? `Edit Role: ${editingRoleObj.name}` : 'Tambah Role', onClose: () => setShowRoleModal(false), footer: (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: () => setShowRoleModal(false), children: "Batal" }), _jsx("button", { className: "btn btn-primary", onClick: saveRole, children: "Simpan" })] })), children: _jsxs("div", { className: "grid gap-3", children: [_jsx("label", { className: "block text-sm", children: "Nama Role" }), _jsx("input", { type: "text", value: roleName, onChange: (e) => setRoleName(e.target.value), className: "rounded border px-3 py-2" }), _jsx("label", { className: "block text-sm", children: "Izin Menu" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: availableMenus.map(m => (_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: roleMenus.includes(m.key), onChange: (e) => setRoleMenus(prev => e.target.checked ? [...prev, m.key] : prev.filter(k => k !== m.key)) }), _jsx("span", { className: "text-sm", children: m.label })] }, m.key))) })] }) })] })), _jsx(Modal, { open: showEdit, title: `Edit Pengguna: ${editing?.name || ''}`, onClose: () => setShowEdit(false), footer: (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: () => setShowEdit(false), children: "Batal" }), _jsx("button", { className: "btn btn-primary", onClick: handleSave, children: "Simpan" })] })), children: _jsxs("div", { className: "grid gap-3", children: [_jsx("label", { className: "block text-sm", children: "Role" }), _jsxs("select", { value: newRole, onChange: (e) => setNewRole(e.target.value), className: "rounded border px-3 py-2", children: [_jsx("option", { value: "user", children: "user" }), _jsx("option", { value: "admin", children: "admin" })] }), _jsx("label", { className: "block text-sm", children: "Password baru (kosongkan kalau tidak ingin mengganti)" }), _jsx("input", { type: "password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), className: "rounded border px-3 py-2" })] }) }), _jsx(Modal, { open: showDelete, title: `Hapus User: ${deleting?.name || ''}`, onClose: () => setShowDelete(false), footer: (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: () => setShowDelete(false), children: "Batal" }), _jsx("button", { className: "btn btn-danger", onClick: handleDeleteConfirm, children: "Konfirmasi Hapus" })] })), children: _jsxs("div", { children: ["Anda yakin ingin menghapus user ", _jsx("strong", { children: deleting?.email }), "? Aksi ini tidak bisa di-undo."] }) })] }));
}
