import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import SensorChart from '../components/SensorChart';
import { API_URL as SOCKET_URL } from '../config';

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [sensorData, setSensorData] = useState([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [lastDataTime, setLastDataTime] = useState(null);
  const [loading, setLoading] = useState(true);

  // selectedDevice'i socket handler içinde güncel okuyabilmek için ref
  const selectedRef = useRef('');
  useEffect(() => {
    selectedRef.current = selectedDevice;
  }, [selectedDevice]);

  // İlk yükleme: cihazlar + çözülmemiş alarm sayısı
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [devRes, alarmRes] = await Promise.all([
          api.get('/api/devices'),
          api.get('/api/alarms?resolved=false')
        ]);
        setDevices(devRes.data);
        setUnresolvedCount(alarmRes.data.length);
        if (devRes.data.length > 0) {
          setSelectedDevice(devRes.data[0]._id);
        }
      } catch (err) {
        toast.error(err.response?.data?.error || 'Veriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  // Seçilen cihazın son 50 verisini çek
  useEffect(() => {
    if (!selectedDevice) {
      setSensorData([]);
      return;
    }
    const loadSensor = async () => {
      try {
        const res = await api.get(
          `/api/sensor-data?deviceId=${selectedDevice}&limit=50`
        );
        setSensorData(res.data);
        if (res.data.length > 0) {
          setLastDataTime(res.data[0].timestamp);
        }
      } catch (err) {
        toast.error(err.response?.data?.error || 'Sensör verisi yüklenemedi');
      }
    };
    loadSensor();
  }, [selectedDevice]);

  // Socket.io bağlantısı
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('newData', (data) => {
      setLastDataTime(data.timestamp);
      // Yalnızca seçili cihazın verisi grafiğe eklensin
      if (data.deviceId === selectedRef.current) {
        setSensorData((prev) => [data, ...prev].slice(0, 50));
      }
    });

    socket.on('newAlarm', (alarm) => {
      setUnresolvedCount((c) => c + 1);
      toast.error(`Yeni alarm — ${alarm.type} (${alarm.severity})`, {
        duration: 5000,
        style: {
          borderLeft: '4px solid #e11d48',
          fontWeight: 500
        }
      });
    });

    return () => socket.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
      </div>
    );
  }

  const fmtLast = lastDataTime
    ? new Date(lastDataTime).toLocaleString('tr-TR')
    : '—';

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>

      <div className="stat-grid">
        <StatCard title="Aktif Cihazlar" value={devices.length} color="#1a56db" />
        <StatCard
          title="Çözülmemiş Alarmlar"
          value={unresolvedCount}
          color="#dc2626"
        />
        <StatCard title="Son Veri Zamanı" value={fmtLast} color="#16a34a" />
      </div>

      <div className="card">
        <div className="toolbar">
          <h2 style={{ fontSize: 18 }}>İvme Grafiği (Canlı)</h2>
          <select
            className="select-inline"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            {devices.length === 0 && <option value="">Cihaz yok</option>}
            {devices.map((d) => (
              <option key={d._id} value={d._id}>
                {d.deviceId}
              </option>
            ))}
          </select>
        </div>
        <SensorChart data={sensorData} />
      </div>
    </div>
  );
}
