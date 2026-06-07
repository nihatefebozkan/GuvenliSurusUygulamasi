import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import AlarmBadge from '../components/AlarmBadge';
import { useAuth } from '../context/AuthContext';

export default function Alarms() {
  const { user } = useAuth();
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('');
  const [resolved, setResolved] = useState('');

  const fetchAlarms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (severity) params.append('severity', severity);
      if (resolved !== '') params.append('resolved', resolved);

      const res = await api.get(`/api/alarms?${params.toString()}`);
      setAlarms(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Alarmlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlarms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severity, resolved]);

  const handleResolve = async (id) => {
    try {
      await api.patch(`/api/alarms/${id}`);
      toast.success('Alarm çözüldü olarak işaretlendi');
      setAlarms((prev) =>
        prev.map((a) => (a._id === id ? { ...a, resolved: true } : a))
      );
    } catch (err) {
      toast.error(err.response?.data?.error || 'İşlem başarısız');
    }
  };

  const fmt = (t) => new Date(t).toLocaleString('tr-TR');

  return (
    <div className="page">
      <h1 className="page-title">Alarmlar</h1>

      <div className="filters">
        <select
          className="select-inline"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          <option value="">Tüm Şiddetler</option>
          <option value="critical">Kritik</option>
          <option value="high">Yüksek</option>
          <option value="medium">Orta</option>
          <option value="low">Düşük</option>
        </select>

        <select
          className="select-inline"
          value={resolved}
          onChange={(e) => setResolved(e.target.value)}
        >
          <option value="">Tüm Durumlar</option>
          <option value="false">Açık</option>
          <option value="true">Çözüldü</option>
        </select>
      </div>

      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : alarms.length === 0 ? (
        <div className="empty-msg">Veri bulunamadı</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Cihaz ID</th>
                <th>Alarm Türü</th>
                <th>Şiddet</th>
                <th>Değer</th>
                <th>Durum</th>
                {user?.role === 'admin' && <th>İşlem</th>}
              </tr>
            </thead>
            <tbody>
              {alarms.map((a) => (
                <tr key={a._id}>
                  <td>{fmt(a.timestamp)}</td>
                  <td>{a.deviceId}</td>
                  <td>{a.type}</td>
                  <td>
                    <AlarmBadge severity={a.severity} />
                  </td>
                  <td>{a.value}</td>
                  <td>
                    {a.resolved ? (
                      <span className="status-resolved">Çözüldü</span>
                    ) : (
                      <span className="status-open">Açık</span>
                    )}
                  </td>
                  {user?.role === 'admin' && (
                    <td>
                      {!a.resolved && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleResolve(a._id)}
                        >
                          Çözüldü İşaretle
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
