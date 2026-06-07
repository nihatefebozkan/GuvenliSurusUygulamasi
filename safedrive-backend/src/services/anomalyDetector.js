const SensorData = require('../models/SensorData');

// Standart sapma hesaplama (popülasyon standart sapması)
const standardDeviation = (values) => {
  if (!values.length) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

/**
 * Verilen sensör verisini analiz eder ve bir anomali tespit ederse
 * { type, severity, value } objesi, aksi halde null döner.
 * @param {Object} sensorData - Kaydedilmiş SensorData dökümanı
 */
const detectAnomaly = async (sensorData) => {
  const accel = sensorData.accelerometer || {};
  const gyro = sensorData.gyroscope || {};

  // Ani fren
  if (typeof accel.x === 'number' && accel.x < -8) {
    return {
      type: 'HARD_BRAKE',
      severity: 'critical',
      value: accel.x
    };
  }

  // Ani hızlanma
  if (typeof accel.x === 'number' && accel.x > 10) {
    return {
      type: 'RAPID_ACCELERATION',
      severity: 'high',
      value: accel.x
    };
  }

  // Sert dönüş
  if (typeof gyro.gamma === 'number' && (gyro.gamma > 150 || gyro.gamma < -150)) {
    return {
      type: 'SHARP_TURN',
      severity: 'high',
      value: gyro.gamma
    };
  }

  // Sarsıntı: son 5 kaydın accelerometer.x standart sapması > 4
  const recent = await SensorData.find({ deviceId: sensorData.deviceId })
    .sort({ timestamp: -1 })
    .limit(5)
    .lean();

  const xValues = recent
    .map((r) => r.accelerometer && r.accelerometer.x)
    .filter((x) => typeof x === 'number');

  if (xValues.length >= 2) {
    const stdDev = standardDeviation(xValues);
    if (stdDev > 4) {
      return {
        type: 'VIBRATION',
        severity: 'medium',
        value: stdDev
      };
    }
  }

  return null;
};

module.exports = detectAnomaly;
