import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import AlarmBadge from '../components/AlarmBadge';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { API_URL as SOCKET_URL } from '../config';

const ONLINE_MS = 60 * 1000; // 1 dakika içinde veri geldiyse çevrimiçi
const TR_CENTER = [39.0, 35.0];

// Duruma göre renkli araç işaretçisi (yeşil=çevrimiçi, gri=çevrimdışı)
const vehicleIcon = (online) =>
  L.divIcon({
    className: 'veh-marker',
    html: `<span class="veh-pin ${online ? 'on' : 'off'}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/>
      </svg>
    </span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16]
  });

export default function CompanyDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/company-login');
  };

  const [devices, setDevices] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [positions, setPositions] = useState({}); // deviceId -> {lat, lon, speed, timestamp}
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Socket handler'ında güncel cihaz id kümesini okuyabilmek için ref
  const deviceIdsRef = useRef(new Set());

  // Cihaz id -> cihaz bilgisi (sürücü adı vb.)
  const deviceMap = useMemo(() => {
    const m = {};
    devices.forEach((d) => {
      m[d._id] = d;
    });
    return m;
  }, [devices]);

  // Çevrimiçi/çevrimdışı hesabı için her 15 sn'de bir "now"u tazele
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  // İlk yükleme: cihazlar + alarmlar + her cihazın son konumu
  useEffect(() => {
    const load = async () => {
      try {
        const [devRes, alarmRes] = await Promise.all([
          api.get('/api/devices'),
          api.get('/api/alarms')
        ]);
        setDevices(devRes.data);
        setAlarms(alarmRes.data.slice(0, 10));
        deviceIdsRef.current = new Set(devRes.data.map((d) => d._id));

        // Her cihazın en son sensör verisini çek (konum için)
        const posEntries = await Promise.all(
          devRes.data.map(async (d) => {
            try {
              const r = await api.get(`/api/sensor-data?deviceId=${d._id}&limit=1`);
              const last = r.data[0];
              if (last && last.location && last.location.latitude != null) {
                return [
                  d._id,
                  {
                    lat: last.location.latitude,
                    lon: last.location.longitude,
                    speed: last.location.speed,
                    timestamp: last.timestamp
                  }
                ];
              }
            } catch (e) {
              /* yoksay */
            }
            return null;
          })
        );
        const posObj = {};
        posEntries.forEach((e) => {
          if (e) posObj[e[0]] = e[1];
        });
        setPositions(posObj);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Veriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Socket.io — gerçek zamanlı konum + alarm
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('newData', (data) => {
      if (!deviceIdsRef.current.has(data.deviceId)) return;
      if (data.location && data.location.latitude != null) {
        setPositions((prev) => ({
          ...prev,
          [data.deviceId]: {
            lat: data.location.latitude,
            lon: data.location.longitude,
            speed: data.location.speed,
            timestamp: data.timestamp
          }
        }));
      }
      setNow(Date.now());
    });

    socket.on('newAlarm', (alarm) => {
      if (!deviceIdsRef.current.has(alarm.deviceId)) return;
      setAlarms((prev) => [alarm, ...prev].slice(0, 10));
      toast.error(`Yeni alarm — ${alarm.type} (${alarm.severity})`, {
        duration: 5000,
        style: { borderLeft: '4px solid #e11d48', fontWeight: 500 }
      });
    });

    return () => socket.disconnect();
  }, []);

  const isOnline = (deviceId) => {
    const p = positions[deviceId];
    const dev = deviceMap[deviceId];
    const ts = p?.timestamp || dev?.lastSeen;
    return ts ? now - new Date(ts).getTime() < ONLINE_MS : false;
  };

  const driverName = (dev) =>
    dev?.owner && typeof dev.owner === 'object' ? dev.owner.username : '—';

  const lastAlarmOf = (deviceId) => alarms.find((a) => a.deviceId === deviceId);

  const fmt = (t) => (t ? new Date(t).toLocaleString('tr-TR') : '—');
  const fmtTime = (t) => (t ? new Date(t).toLocaleTimeString('tr-TR') : '—');

  if (loading) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
      </div>
    );
  }

  // Haritada gösterilecek konumlu cihazlar
  const markers = devices.filter((d) => positions[d._id]);
  const mapCenter = markers.length
    ? [positions[markers[0]._id].lat, positions[markers[0]._id].lon]
    : TR_CENTER;
  const onlineCount = devices.filter((d) => isOnline(d._id)).length;

  return (
    <div className="company-page">
      {/* Üst başlık */}
      <div className="company-header">
        <div className="company-header-left">
          <Logo size={30} withText={false} />
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>
              {user?.name || user?.username}
            </h1>
            <div style={{ color: 'var(--text-muted)' }}>
              Filo Takip Paneli · {devices.length} araç · {onlineCount} çevrimiçi
            </div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
          Çıkış
        </button>
      </div>

      {/* Araç listesi + Harita */}
      <div className="company-grid">
        {/* Sol: araç listesi */}
        <div className="card vehicle-list">
          <h2 className="section-title">Araçlar</h2>
          {devices.length === 0 ? (
            <div className="empty-msg">Kayıtlı araç yok</div>
          ) : (
            devices.map((d) => {
              const online = isOnline(d._id);
              const p = positions[d._id];
              return (
                <div key={d._id} className="vehicle-item">
                  <div className="vehicle-main">
                    <span className={`v-dot ${online ? 'on' : 'off'}`} />
                    <div>
                      <div className="v-name">{driverName(d)}</div>
                      <div className="v-sub">{d.deviceId}</div>
                    </div>
                  </div>
                  <div className="vehicle-meta">
                    <div className={online ? 'status-online' : 'status-offline'}>
                      {online ? 'Çevrimiçi' : 'Çevrimdışı'}
                    </div>
                    <div className="v-time">{fmtTime(p?.timestamp || d.lastSeen)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sağ: harita */}
        <div className="card map-card">
          <MapContainer center={mapCenter} zoom={markers.length ? 11 : 6} className="map">
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markers.map((d) => {
              const p = positions[d._id];
              const online = isOnline(d._id);
              const la = lastAlarmOf(d._id);
              return (
                <Marker key={d._id} position={[p.lat, p.lon]} icon={vehicleIcon(online)}>
                  <Popup>
                    <div style={{ minWidth: 160 }}>
                      <b>{driverName(d)}</b> ({d.deviceId})
                      <br />
                      Hız: <b>{p.speed ?? 0} km/s</b>
                      <br />
                      Son alarm: {la ? `${la.type} (${la.severity})` : 'yok'}
                      <br />
                      <span style={{ color: '#6b7280' }}>
                        Son görülme: {fmtTime(p.timestamp)}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Alt: son alarmlar */}
      <div style={{ marginTop: 18 }}>
        <h2 className="section-title">Son Alarmlar</h2>
        {alarms.length === 0 ? (
          <div className="empty-msg">Veri bulunamadı</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Zaman</th>
                  <th>Sürücü</th>
                  <th>Alarm Türü</th>
                  <th>Şiddet</th>
                  <th>Değer</th>
                </tr>
              </thead>
              <tbody>
                {alarms.map((a) => (
                  <tr key={a._id || a.timestamp}>
                    <td>{fmt(a.timestamp)}</td>
                    <td>{driverName(deviceMap[a.deviceId])}</td>
                    <td>{a.type}</td>
                    <td>
                      <AlarmBadge severity={a.severity} />
                    </td>
                    <td>{a.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
