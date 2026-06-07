import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const FIVE_MIN = 5 * 60 * 1000;
const EMPTY = { deviceId: '', model: '', platform: 'android', owner: '', companyId: '' };

export default function Devices() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [devices, setDevices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // modal: { mode: 'create' | 'edit', data }
  const [modal, setModal] = useState(null);

  const fetchAll = async () => {
    try {
      const reqs = [api.get('/api/devices')];
      if (isAdmin) {
        reqs.push(api.get('/api/companies'), api.get('/api/users'));
      }
      const [devRes, cRes, uRes] = await Promise.all(reqs);
      setDevices(devRes.data);
      if (isAdmin) {
        setCompanies(cRes.data);
        setDrivers(uRes.data.filter((u) => u.role === 'driver'));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cihazlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOnline = (lastSeen) =>
    lastSeen ? Date.now() - new Date(lastSeen).getTime() < FIVE_MIN : false;
  const fmt = (t) => (t ? new Date(t).toLocaleString('tr-TR') : '—');
  const ownerName = (o) => (o && typeof o === 'object' ? o.username : '—');
  const companyName = (c) => (c && typeof c === 'object' ? c.name : '—');

  const openCreate = () => setModal({ mode: 'create', data: { ...EMPTY } });
  const openEdit = (d) =>
    setModal({
      mode: 'edit',
      data: {
        _id: d._id,
        deviceId: d.deviceId,
        model: d.model || '',
        platform: d.platform || 'android',
        owner: d.owner?._id || d.owner || '',
        companyId: d.companyId?._id || d.companyId || ''
      }
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { _id, ...body } = modal.data;
      if (modal.mode === 'create') {
        await api.post('/api/devices', body);
        toast.success('Cihaz eklendi');
      } else {
        await api.patch(`/api/devices/${_id}`, body);
        toast.success('Cihaz güncellendi');
      }
      setModal(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (d) => {
    if (!window.confirm(`"${d.deviceId}" cihazı ve tüm verileri silinecek. Emin misiniz?`)) {
      return;
    }
    try {
      await api.delete(`/api/devices/${d._id}`);
      toast.success('Cihaz silindi');
      setDevices((prev) => prev.filter((x) => x._id !== d._id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Silinemedi');
    }
  };

  const set = (k, v) => setModal((m) => ({ ...m, data: { ...m.data, [k]: v } }));

  return (
    <div className="page">
      <div className="toolbar">
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          Cihazlar
        </h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            + Yeni Cihaz Ekle
          </button>
        )}
      </div>

      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : devices.length === 0 ? (
        <div className="empty-msg">Veri bulunamadı</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cihaz ID</th>
                <th>Sahip</th>
                <th>Şirket</th>
                <th>Platform</th>
                <th>Son Görülme</th>
                <th>Durum</th>
                {isAdmin && <th>İşlem</th>}
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d._id}>
                  <td>{d.deviceId}</td>
                  <td>{ownerName(d.owner)}</td>
                  <td>{companyName(d.companyId)}</td>
                  <td>{d.platform || '—'}</td>
                  <td>{fmt(d.lastSeen)}</td>
                  <td>
                    {isOnline(d.lastSeen) ? (
                      <span className="status-online">Çevrimiçi</span>
                    ) : (
                      <span className="status-offline">Çevrimdışı</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(d)}>
                        Düzenle
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d)}>
                        Sil
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              {modal.mode === 'create' ? 'Yeni Cihaz Ekle' : 'Cihazı Düzenle'}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Cihaz ID</label>
                <input
                  className="input"
                  value={modal.data.deviceId}
                  onChange={(e) => set('deviceId', e.target.value)}
                  placeholder="telefon-001"
                  required
                />
              </div>
              <div className="form-group">
                <label>Model</label>
                <input
                  className="input"
                  value={modal.data.model}
                  onChange={(e) => set('model', e.target.value)}
                  placeholder="Pixel 7"
                />
              </div>
              <div className="form-group">
                <label>Platform</label>
                <select
                  className="input"
                  value={modal.data.platform}
                  onChange={(e) => set('platform', e.target.value)}
                >
                  <option value="android">android</option>
                  <option value="ios">ios</option>
                  <option value="web">web</option>
                </select>
              </div>
              <div className="form-group">
                <label>Sahip (Sürücü)</label>
                <select
                  className="input"
                  value={modal.data.owner}
                  onChange={(e) => set('owner', e.target.value)}
                  required
                >
                  <option value="">— Sürücü seçin —</option>
                  {drivers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Şirket</label>
                <select
                  className="input"
                  value={modal.data.companyId}
                  onChange={(e) => set('companyId', e.target.value)}
                  required
                >
                  <option value="">— Şirket seçin —</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>
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
