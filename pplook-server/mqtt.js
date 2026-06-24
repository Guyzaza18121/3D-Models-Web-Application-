import mqtt from 'mqtt';

const BROKER = process.env.MQTT_BROKER;
const TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || 'fostec';

let client = null;

export function connectMqtt() {
  if (!BROKER) {
    console.log('[MQTT] No MQTT_BROKER set — skipping MQTT connection');
    return null;
  }

  client = mqtt.connect(BROKER, {
    clientId: `fostec-api-${Math.random().toString(16).slice(2, 8)}`,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => {
    console.log(`[MQTT] Connected to ${BROKER}`);
    client.subscribe(`${TOPIC_PREFIX}/telemetry/+`, (err) => {
      if (err) console.error('[MQTT] Subscribe error:', err);
    });
  });

  client.on('message', (topic, payload) => {
    const data = JSON.parse(payload.toString());
    console.log(`[MQTT] ${topic}:`, data);
    // TODO: persist telemetry to MongoDB if needed
  });

  client.on('error', (err) => console.error('[MQTT] Error:', err.message));
  client.on('close', () => console.log('[MQTT] Disconnected'));

  return client;
}

export function publishCommand(topicSuffix, payload) {
  if (!client?.connected) {
    console.warn('[MQTT] Not connected — command dropped:', topicSuffix, payload);
    return false;
  }
  client.publish(`${TOPIC_PREFIX}/cmd/${topicSuffix}`, JSON.stringify(payload));
  return true;
}

export function getMqttClient() {
  return client;
}
