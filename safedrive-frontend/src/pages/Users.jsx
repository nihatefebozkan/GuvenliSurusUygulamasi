import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // düzenlenen kullanıcı
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const [uRes, cRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/companies')
      ]);
      setUsers(uRes.data);
      setCompanies(cRes.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fmt = (t) => new Date(t).toLocaleDateString('tr-TR');

  const openEdit = (u) => {
    setEditing({
      _id: u._id,
      username: u.username,
      email: u.email,
      role: u.role,
      companyId: u.companyId?._id || u.companyId || ''
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { _id, ...body } = editing;
      await api.patch(`/api/users/${_id}`, body);
      toast.success('Kullanıcı güncellendi');
      setEditing(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`"${u.username}" kullanıcısı ve cihazları silinecek. Emin misiniz?`)) {
      return;
    }
    try {
      await api.delete(`/api/users/${u._id}`);
      toast.success('Kullanıcı silindi');
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Silinemedi');
    }
  };

  const companyName = (u) =>
    u.companyId && typeof u.companyId === 'object' ? u.companyId.name : '—';

  return (
    <div className="page">
      <h1 className="page-title">Kullanıcılar</h1>

      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : users.length === 0 ? (
        <div className="empty-msg">Veri bulunamadı</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kullanıcı Adı</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Şirket</th>
                <th>Kayıt Tarihi</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                  </td>
                  <td>{companyName(u)}</td>
                  <td>{fmt(u.createdAt)}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>
                      Düzenle
                    </button>
                    {u._id !== currentUser?.userId && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(u)}
                      >
                        Sil
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Düzenleme modalı */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Kullanıcıyı Düzenle</div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Kullanıcı Adı</label>
                <input
                  className="input"
                  value={editing.username}
                  onChange={(e) => setEditing({ ...editing, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  className="input"
                  type="email"
                  value={editing.email}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select
                  className="input"
                  value={editing.role}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                >
                  <option value="driver">Sürücü (driver)</option>
                  <option value="admin">Yönetici (admin)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Şirket</label>
                <select
                  className="input"
                  value={editing.companyId}
                  onChange={(e) => setEditing({ ...editing, companyId: e.target.value })}
                >
                  <option value="">— Şirket yok —</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
