// ──────────────────────────────────────────────────────────────────────────────
// MongoDB Document Shape Definitions
// These JSDoc typedefs mirror the Mongoose schemas that will live on the backend.
// Frontend components should use these types for prop-validation reference.
// Field names marked [WS] are also sent over WebSocket on live update.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} CompressorDoc
 * @property {string}  _id
 * @property {string}  brand
 * @property {string}  model
 * @property {string}  name
 * @property {string}  type          - 'Screw' | 'VFD Screw' | 'Reciprocating' | 'Centrifugal'
 * @property {number}  kw            - rated power kW
 * @property {number}  flow          - rated flow m³/min
 * @property {number}  maxPressure   - bar
 * @property {number}  voltage       - V
 * @property {string}  clr           - hex display colour
 * @property {string}  note
 * @property {string}  status        [WS] 'RUNNING' | 'STANDBY' | 'FAULT'
 * @property {number}  load          [WS] 0–100 %
 * @property {number}  curr          [WS] A
 * @property {number}  temp          [WS] °C
 * @property {number}  press         [WS] bar
 * @property {number}  seq           - sequence order (1-based)
 * @property {boolean} lead
 * @property {number}  hrs           - total accumulated service hours
 * @property {string}  fault         - last fault message
 * @property {Date}    createdAt
 * @property {Date}    updatedAt
 */

/**
 * @typedef {Object} SensorDoc
 * @property {string}  _id
 * @property {string}  name
 * @property {string}  type         - 'Pressure' | 'Flow' | 'Temperature' | 'Humidity' |
 *                                    'Dew Point' | 'Vibration' | 'Current' | 'Voltage' |
 *                                    'Power' | 'Level' | 'Speed' | 'Custom'
 * @property {string}  location
 * @property {string}  unit
 * @property {number}  value        [WS] latest reading
 * @property {number}  min
 * @property {number}  max
 * @property {boolean} ok           [WS] in-range flag
 * @property {string}  clr          - hex display colour
 * @property {Date}    updatedAt
 */

/**
 * @typedef {Object} SensorReadingDoc   — time-series collection (1-min TTL index optional)
 * @property {string}  _id
 * @property {string}  sensorId     - ref: SensorDoc._id
 * @property {number}  value
 * @property {Date}    ts
 */

/**
 * @typedef {Object} AlarmDoc
 * @property {string}  _id
 * @property {string}  code         - unique alarm code e.g. 'LOW_P', 'FLT_c1'
 * @property {string}  msg
 * @property {string}  level        - 'CRITICAL' | 'FAULT' | 'WARNING' | 'INFO'
 * @property {boolean} acked
 * @property {string}  ackedBy      - username
 * @property {Date}    ackedAt
 * @property {Date}    createdAt
 */

/**
 * @typedef {Object} LogDoc
 * @property {string}  _id
 * @property {string}  type         - 'SEQ' | 'CTRL' | 'ALARM' | 'AUTH' | 'CFG' | 'SYS'
 * @property {string}  msg
 * @property {string}  who          - username or 'SYSTEM'
 * @property {Date}    createdAt
 */

/**
 * @typedef {Object} UserDoc
 * @property {string}      _id
 * @property {string}      un        - username (unique index)
 * @property {string}      pwHash    - bcrypt hash — NEVER store plaintext
 * @property {string}      name
 * @property {string}      role      - 'ADMIN' | 'ENGINEER' | 'OPERATOR' | 'VIEWER'
 * @property {boolean}     on        - account active flag
 * @property {string|null} avatar    - base64 data-URL or CDN URL
 * @property {Date}        lastLogin
 * @property {Date}        createdAt
 * @property {Date}        updatedAt
 */

/**
 * @typedef {Object} AirDryerDoc
 * @property {string}  _id
 * @property {string}  name
 * @property {string}  status       [WS] 'RUNNING' | 'STANDBY' | 'FAULT'
 * @property {number}  temp         [WS] °C
 * @property {number}  maxTemp      - °C alarm threshold
 * @property {number}  voltage      - V
 * @property {number}  flow         [WS] m³/min
 * @property {string}  clr
 * @property {Date}    updatedAt
 */

/**
 * @typedef {Object} SystemSettingsDoc   — singleton document (id: 'system')
 * @property {string}  _id
 * @property {number}  sp           - setpoint pressure bar
 * @property {number}  db           - deadband bar
 * @property {number}  demand       - base demand simulation m³/min
 * @property {string}  seqMode      - 'AUTO' | 'MANUAL'
 * @property {number}  pidKp
 * @property {number}  pidKi
 * @property {number}  pidKd
 * @property {Date}    updatedAt
 */

/**
 * @typedef {Object} EnergyReadingDoc   — time-series collection
 * @property {string}  _id
 * @property {number}  kw           - instantaneous power kW
 * @property {number}  kwh          - cumulative energy kWh (session)
 * @property {number}  flow         - total flow m³/min
 * @property {Date}    ts
 */
