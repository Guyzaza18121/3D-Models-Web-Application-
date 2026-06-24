import mqtt from 'mqtt/dist/mqtt.esm';

const BROKER = import.meta.env.VITE_MQTT_BROKER ?? '';
const TOPIC_PREFIX = import.meta.env.VITE_MQTT_TOPIC_PREFIX ?? 'fostec';

export const IS_MQTT = !!BROKER;

let client = null;
const listeners = new Map();

export async function connectMqtt() {
  if (!IS_MQTT) return null;
  if (client?.connected) return client;

  client = mqtt.connect(BROKER, {
    clientId: `fostec-web-${Math.random().toString(16).slice(2, 8)}`,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => {
    console.log('[MQTT] Connected to', BROKER);
    client.subscribe(`${TOPIC_PREFIX}/telemetry/+`, (err) => {
      if (err) console.error('[MQTT] Subscribe error:', err);
    });
  });

  client.on('message', (topic, payload) => {
    const data = JSON.parse(payload.toString());
    listeners.forEach((cb) => cb(topic, data));
  });

  client.on('error', (err) => console.error('[MQTT] Error:', err.message));
  client.on('close', () => console.log('[MQTT] Disconnected'));

  return client;
}

export function onMqttMessage(callback) {
  const id = Math.random().toString(36).slice(2);
  listeners.set(id, callback);
  return () => listeners.delete(id);
}

export function publishCommand(topicSuffix, payload) {
  if (!client?.connected) return;
  client.publish(`${TOPIC_PREFIX}/cmd/${topicSuffix}`, JSON.stringify(payload));
}

export function disconnectMqtt() {
  if (client) {
    client.end();
    client = null;
  }
}
