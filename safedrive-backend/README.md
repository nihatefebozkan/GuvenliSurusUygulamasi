# SafeDrive Backend

Güvenli Sürüş ve Sürücü Davranış Analizi Platformu için backend sistemi.
Akıllı telefonlardan gelen ivmeölçer, jiroskop ve GPS verilerini alır, kaydeder,
anomali (ani fren, sert dönüş, ani hızlanma, sarsıntı) tespit eder ve web paneline
Socket.io ile gerçek zamanlı iletir.

## Teknoloji Yığını

- Node.js & Express.js
- MongoDB (Mongoose)
- JWT (kimlik doğrulama)
- bcrypt (şifre hashleme)
- Socket.io (gerçek zamanlı iletişim)
- express-validator, cors, dotenv

## Kurulum

1. Bağımlılıkları yükleyin:

   ```bash
   npm install
   ```

2. `.env` dosyasını oluşturun (`.env.example` dosyasını kopyalayabilirsiniz) ve
   değerleri doldurun:

   ```
   MONGO_URI=mongodb://localhost:27017/safedrive
   JWT_SECRET=cok_gizli_bir_anahtar
   PORT=5000
   ```

3. Geliştirme modunda başlatın:

   ```bash
   npm run dev
   ```

   Üretim için:

   ```bash
   npm start
   ```

## API Endpoint'leri

### Kimlik Doğrulama

| Method | Endpoint         | Açıklama                                   |
| ------ | ---------------- | ------------------------------------------ |
| POST   | `/auth/register` | Kayıt ol. body: username, email, password, role |
| POST   | `/auth/login`    | Giriş yap. body: email, password           |

### Sensör Verisi (JWT korumalı)

| Method | Endpoint            | Açıklama                                                              |
| ------ | ------------------- | -------------------------------------------------------------------- |
| POST   | `/api/sensor-data`  | Sensör verisi kaydet, anomali tespit et, Socket.io event yayınla     |
| GET    | `/api/sensor-data`  | Veri listele. query: deviceId (zorunlu), limit, startDate, endDate   |

### Alarmlar (JWT korumalı)

| Method | Endpoint            | Açıklama                                                       |
| ------ | ------------------- | ------------------------------------------------------------- |
| GET    | `/api/alarms`       | Alarm listele. query: deviceId, severity, resolved           |
| PATCH  | `/api/alarms/:id`   | Alarmı çözüldü olarak işaretle (yalnız admin)                 |

### Cihazlar (JWT korumalı)

| Method | Endpoint          | Açıklama                                              |
| ------ | ----------------- | ---------------------------------------------------- |
| GET    | `/api/devices`    | Cihazları listele (admin tümü, driver kendininkiler) |
| POST   | `/api/devices`    | Yeni cihaz kaydet                                    |

### Kullanıcılar

| Method | Endpoint        | Açıklama                                  |
| ------ | --------------- | ----------------------------------------- |
| GET    | `/api/users`    | Tüm kullanıcıları listele (yalnız admin)  |

## Kimlik Doğrulama

Korumalı endpoint'lere istek atarken header'a token ekleyin:

```
Authorization: Bearer <token>
```

## Socket.io Eventleri

İstemci sunucuya bağlandığında aşağıdaki eventleri dinleyebilir:

- `newData` — yeni sensör verisi kaydedildiğinde yayınlanır.
- `newAlarm` — bir anomali tespit edilip alarm oluşturulduğunda yayınlanır.

## Anomali Kuralları

| Tür                  | Koşul                                  | Severity  |
| -------------------- | -------------------------------------- | --------- |
| HARD_BRAKE           | accelerometer.x < -8                   | critical  |
| RAPID_ACCELERATION   | accelerometer.x > 10                   | high      |
| SHARP_TURN           | gyroscope.gamma > 150 veya < -150      | high      |
| VIBRATION            | son 5 kaydın accelerometer.x std > 4   | medium    |
