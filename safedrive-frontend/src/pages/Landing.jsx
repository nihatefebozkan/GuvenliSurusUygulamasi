import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Logo from '../components/Logo';

const features = [
  {
    title: 'Gerçek Zamanlı Takip',
    desc: 'Filonuzdaki her aracın anlık konumunu, hızını ve durumunu canlı haritada izleyin.'
  },
  {
    title: 'Sürücü Davranış Analizi',
    desc: 'Ani fren, sert dönüş ve hızlanma gibi riskli davranışları otomatik tespit edin.'
  },
  {
    title: 'Anlık Alarm Bildirimleri',
    desc: 'Tehlikeli bir durum oluştuğunda saniyeler içinde bildirim alın, riski yönetin.'
  },
  {
    title: 'Filo Yönetim Paneli',
    desc: 'Tüm sürücülerinizi ve araçlarınızı tek bir panelden kolayca yönetin.'
  }
];

const stats = [
  { value: '%40', label: 'Daha az riskli sürüş' },
  { value: '7/24', label: 'Canlı izleme' },
  { value: '<2sn', label: 'Alarm gecikmesi' }
];

export default function Landing() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const scrollToContact = () => {
    document.getElementById('iletisim')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/applications', form);
      toast.success('Başvurunuz alındı! En kısa sürede dönüş yapacağız.');
      setForm({ companyName: '', contactName: '', email: '', phone: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Başvuru gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      {/* Üst menü */}
      <header className="landing-nav">
        <Logo size={30} />
        <div className="landing-nav-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/company-login')}>
            Şirket Girişi
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
            Yönetici Girişi
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">Lojistik filolar için akıllı takip</span>
          <h1 className="hero-title">
            Sürücülerinizin anlık durumunu <span className="hl">tek ekrandan</span> izleyin
          </h1>
          <p className="hero-sub">
            SafeDrive, lojistik şirketleri için geliştirilen bir sürücü davranış analizi ve
            filo takip platformudur. Araçlarınızın konumunu, hızını ve riskli sürüş
            davranışlarını gerçek zamanlı olarak izleyin, filonuzun güvenliğini artırın.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={scrollToContact}>
              Hemen Başvur
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/company-login')}>
              Şirket Girişi
            </button>
          </div>

          <div className="hero-stats">
            {stats.map((s) => (
              <div key={s.label} className="hero-stat">
                <div className="hero-stat-value">{s.value}</div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section className="features">
        <h2 className="features-title">Neler sunuyoruz?</h2>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-dot" />
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* İletişim / Başvuru */}
      <section className="contact" id="iletisim">
        <div className="contact-inner">
          <div className="contact-info">
            <h2>Filonuzu güvene alın</h2>
            <p>
              SafeDrive'ı şirketinizde kullanmak ister misiniz? Aşağıdaki formu doldurun,
              ekibimiz sizinle iletişime geçsin. Başvurunuz yöneticilerimize iletilecektir.
            </p>
            <ul className="contact-list">
              <li>Demosu ücretsiz</li>
              <li>Kurulum desteği</li>
              <li>Filonuza özel raporlama</li>
            </ul>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Şirket Adı *</label>
              <input
                className="input"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="Örn. Yıldız Lojistik"
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Yetkili Adı</label>
                <input
                  className="input"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="05xx xxx xx xx"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="sirket@ornek.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Mesajınız</label>
              <textarea
                className="input"
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Filonuz hakkında kısaca bilgi verin..."
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <Logo size={24} />
        <span>© {new Date().getFullYear()} SafeDrive — Filo Güvenlik Platformu</span>
      </footer>
    </div>
  );
}
