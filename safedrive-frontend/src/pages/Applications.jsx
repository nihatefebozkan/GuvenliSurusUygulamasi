import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/api/applications');
      setApplications(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Başvurular yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleReviewed = async (id) => {
    try {
      await api.patch(`/api/applications/${id}`);
      toast.success('Başvuru incelendi olarak işaretlendi');
      setApplications((prev) =>
        prev.map((a) => (a._id === id ? { ...a, reviewed: true } : a))
      );
    } catch (err) {
      toast.error(err.response?.data?.error || 'İşlem başarısız');
    }
  };

  const fmt = (t) => new Date(t).toLocaleString('tr-TR');

  const pendingCount = applications.filter((a) => !a.reviewed).length;

  return (
    <div className="page">
      <h1 className="page-title">
        Başvurular
        {pendingCount > 0 && (
          <span className="badge badge-critical" style={{ marginLeft: 12, verticalAlign: 'middle' }}>
            {pendingCount} yeni
          </span>
        )}
      </h1>

      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-msg">Henüz başvuru yok</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Şirket</th>
                <th>Yetkili</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Mesaj</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a._id}>
                  <td>{fmt(a.createdAt)}</td>
                  <td><b>{a.companyName}</b></td>
                  <td>{a.contactName || '—'}</td>
                  <td>{a.email}</td>
                  <td>{a.phone || '—'}</td>
                  <td style={{ maxWidth: 220 }}>{a.message || '—'}</td>
                  <td>
                    {a.reviewed ? (
                      <span className="status-resolved">İncelendi</span>
                    ) : (
                      <span className="status-open">Yeni</span>
                    )}
                  </td>
                  <td>
                    {!a.reviewed && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleReviewed(a._id)}
                      >
                        İncelendi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
