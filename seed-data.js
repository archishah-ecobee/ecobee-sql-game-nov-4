// ---------------------------------------------------------------------------
// SEED_SQL: the entire "case file" database, as plain SQL text.
// Loaded as a <script> tag (not fetch()) so it works even when index.html
// is opened directly from disk (file://), with no local server required.
//
// Every table is fully denormalized on purpose: house_address and the
// person's name live directly on every security-event row. There are no
// foreign keys and the game never requires a JOIN.
// ---------------------------------------------------------------------------
const SEED_SQL = `
CREATE TABLE residents (
  id INTEGER PRIMARY KEY,
  name TEXT,
  role TEXT,
  house_address TEXT,
  bedroom TEXT
);

CREATE TABLE suspects (
  id INTEGER PRIMARY KEY,
  name TEXT,
  relationship TEXT,
  has_access_code TEXT,
  alibi TEXT,
  house_address TEXT,
  usually_carries TEXT,
  notes TEXT
);

CREATE TABLE devices (
  id INTEGER PRIMARY KEY,
  device_name TEXT,
  device_type TEXT,
  house_address TEXT,
  location TEXT,
  installed_date TEXT
);

CREATE TABLE door_sensors (
  id INTEGER PRIMARY KEY,
  house_address TEXT,
  person_name TEXT,
  device_name TEXT,
  door_name TEXT,
  event_type TEXT,
  event_time TEXT
);

CREATE TABLE motion_events (
  id INTEGER PRIMARY KEY,
  house_address TEXT,
  person_name TEXT,
  device_name TEXT,
  location TEXT,
  event_time TEXT,
  confidence TEXT
);

CREATE TABLE camera_logs (
  id INTEGER PRIMARY KEY,
  house_address TEXT,
  person_name TEXT,
  device_name TEXT,
  location TEXT,
  event_time TEXT,
  detected_object TEXT,
  item_seen TEXT,
  notes TEXT
);

CREATE TABLE thermostat_events (
  id INTEGER PRIMARY KEY,
  house_address TEXT,
  device_name TEXT,
  location TEXT,
  event_time TEXT,
  event_type TEXT,
  detail TEXT
);

CREATE TABLE access_logs (
  id INTEGER PRIMARY KEY,
  house_address TEXT,
  person_name TEXT,
  event_time TEXT,
  action TEXT,
  method TEXT
);

-- -----------------------------------------------------------------------
-- RESIDENTS: the Morgan family, who live at 14 Maple Street
-- -----------------------------------------------------------------------
INSERT INTO residents (id, name, role, house_address, bedroom) VALUES
  (1, 'Dana Morgan', 'Parent', '14 Maple Street', 'Master Bedroom'),
  (2, 'Chris Morgan', 'Parent', '14 Maple Street', 'Master Bedroom'),
  (3, 'Emery Morgan', 'Teenager', '14 Maple Street', 'Upstairs Bedroom'),
  (4, 'Finley Morgan', 'Kid', '14 Maple Street', 'Kids Room');

-- -----------------------------------------------------------------------
-- SUSPECTS: people who could plausibly have gotten in
-- -----------------------------------------------------------------------
INSERT INTO suspects (id, name, relationship, has_access_code, alibi, house_address, usually_carries, notes) VALUES
  (1, 'Riley Chen', 'Dog walker', 'Yes',
      'Says she was at her cousins birthday party across town all night.',
      NULL, 'Dog-leash bag',
      'Has a keypad code to let herself in during the day to walk the Morgans dog, Biscuit. Usually wears a grey hoodie.'),
  (2, 'Jordan Patel', 'Next-door neighbor', 'Yes (spare key)',
      'Says he was home all night.',
      '12 Maple Street', 'Garden gloves',
      'Holds a spare key to the Morgans house for emergencies. Spends most evenings gardening.'),
  (3, 'Sam Okafor', 'Cousin, staying as a house guest this week', 'No',
      'Says he stayed in the guest room all night.',
      '14 Maple Street', 'Phone charger',
      'Sleeping on the pull-out couch in the Guest Room all week. No access code of his own.'),
  (4, 'Alex Rivera', 'Classmate of Emery Morgan - had a falling out 2 months ago', 'No',
      'Says he was home all night, grounded, with no car.',
      '9 Birch Lane', 'Backpack',
      'Upset about the falling out with Emery and has posted angry messages online. No key, no code, no known way inside.');

-- -----------------------------------------------------------------------
-- DEVICES: the Ecobee smart home kit installed on the street
-- -----------------------------------------------------------------------
INSERT INTO devices (id, device_name, device_type, house_address, location, installed_date) VALUES
  (1,  'Ecobee SmartCamera - Backyard',   'Camera',          '14 Maple Street', 'Backyard',       '2025-03-10'),
  (2,  'Ecobee SmartCamera - Kitchen',    'Camera',          '14 Maple Street', 'Kitchen',        '2025-03-10'),
  (3,  'Ecobee SmartSensor - Front Door', 'Door Sensor',     '14 Maple Street', 'Front Door',     '2025-03-10'),
  (4,  'Ecobee SmartSensor - Back Door',  'Door Sensor',     '14 Maple Street', 'Back Door',      '2025-03-10'),
  (5,  'Ecobee SmartSensor - Garage Door','Door Sensor',     '14 Maple Street', 'Garage Door',    '2025-03-10'),
  (6,  'Ecobee SmartSensor - Hallway',    'Motion Sensor',   '14 Maple Street', 'Hallway',        '2025-03-10'),
  (7,  'Ecobee SmartSensor - Side Yard',  'Motion Sensor',   '14 Maple Street', 'Side Yard',      '2025-03-10'),
  (8,  'Ecobee Smart Thermostat',         'Thermostat',      '14 Maple Street', 'Living Room',    '2025-02-01'),
  (9,  'Ecobee Security Keypad',          'Security Keypad', '14 Maple Street', 'Front Entryway', '2025-03-10'),
  (10, 'Ecobee SmartSensor - Guest Room', 'Motion Sensor',   '14 Maple Street', 'Guest Room',     '2025-03-10'),
  (11, 'Ecobee SmartSensor - Kitchen',    'Motion Sensor',   '14 Maple Street', 'Kitchen',        '2025-03-10'),
  (12, 'Ecobee SmartSensor - Front Door', 'Door Sensor',     '12 Maple Street', 'Front Door',     '2025-04-01'),
  (13, 'Ecobee SmartSensor - Back Door',  'Door Sensor',     '12 Maple Street', 'Back Door',      '2025-04-01'),
  (14, 'Ecobee SmartSensor - Bedroom',    'Motion Sensor',   '12 Maple Street', 'Bedroom',        '2025-04-01'),
  (15, 'Ecobee SmartSensor - Living Room','Motion Sensor',   '12 Maple Street', 'Living Room',    '2025-04-01'),
  (16, 'Ecobee Security Keypad',          'Security Keypad', '12 Maple Street', 'Front Entryway', '2025-04-01'),
  (17, 'Ecobee SmartCamera - Living Room','Camera',          '12 Maple Street', 'Living Room',    '2025-04-01'),
  (18, 'Ecobee SmartSensor - Front Door', 'Door Sensor',     '9 Birch Lane',    'Front Door',     '2025-05-15'),
  (19, 'Ecobee SmartSensor - Back Door',  'Door Sensor',     '9 Birch Lane',    'Back Door',      '2025-05-15'),
  (20, 'Ecobee SmartSensor - Bedroom',    'Motion Sensor',   '9 Birch Lane',    'Bedroom',        '2025-05-15'),
  (21, 'Ecobee SmartCamera - Backyard',   'Camera',          '9 Birch Lane',    'Backyard',       '2025-05-15');

-- -----------------------------------------------------------------------
-- DOOR SENSORS (overnight, Nov 3 into Nov 4) -- all houses on the street
-- -----------------------------------------------------------------------
INSERT INTO door_sensors (id, house_address, person_name, device_name, door_name, event_type, event_time) VALUES
  (1,  '14 Maple Street', 'Dana Morgan', 'Ecobee SmartSensor - Front Door',  'Front Door',  'Locked',   '2026-11-03 22:01:00'),
  (2,  '14 Maple Street', 'Dana Morgan', 'Ecobee SmartSensor - Back Door',   'Back Door',   'Locked',   '2026-11-03 22:02:00'),
  (3,  '14 Maple Street', 'Dana Morgan', 'Ecobee SmartSensor - Garage Door', 'Garage Door', 'Locked',   '2026-11-03 22:03:00'),
  (4,  '14 Maple Street', 'Unknown',     'Ecobee SmartSensor - Back Door',   'Back Door',   'Unlocked', '2026-11-04 02:14:00'),
  (5,  '14 Maple Street', 'Unknown',     'Ecobee SmartSensor - Back Door',   'Back Door',   'Opened',   '2026-11-04 02:14:30'),
  (6,  '14 Maple Street', 'Dana Morgan', 'Ecobee SmartSensor - Front Door',  'Front Door',  'Unlocked', '2026-11-04 06:50:00'),
  (7,  '12 Maple Street', 'Jordan Patel','Ecobee SmartSensor - Front Door',  'Front Door',  'Locked',   '2026-11-03 21:50:00'),
  (8,  '12 Maple Street', 'Jordan Patel','Ecobee SmartSensor - Back Door',   'Back Door',   'Locked',   '2026-11-03 21:51:00'),
  (9,  '12 Maple Street', 'Jordan Patel','Ecobee SmartSensor - Front Door',  'Front Door',  'Unlocked', '2026-11-04 07:10:00'),
  (10, '9 Birch Lane',    'Alex Rivera', 'Ecobee SmartSensor - Front Door',  'Front Door',  'Locked',   '2026-11-03 21:30:00'),
  (11, '9 Birch Lane',    'Alex Rivera', 'Ecobee SmartSensor - Back Door',   'Back Door',   'Locked',   '2026-11-03 21:31:00'),
  (12, '9 Birch Lane',    'Alex Rivera', 'Ecobee SmartSensor - Front Door',  'Front Door',  'Unlocked', '2026-11-04 06:45:00'),
  (13, '16 Maple Street', 'Priya Nair',  'Ecobee SmartSensor - Front Door',  'Front Door',  'Locked',   '2026-11-03 21:45:00'),
  (14, '16 Maple Street', 'Priya Nair',  'Ecobee SmartSensor - Back Door',   'Back Door',   'Locked',   '2026-11-03 21:46:00'),
  (15, '16 Maple Street', 'Priya Nair',  'Ecobee SmartSensor - Front Door',  'Front Door',  'Unlocked', '2026-11-04 07:00:00'),
  (16, '21 Birch Lane',   'Marcus Webb', 'Ecobee SmartSensor - Front Door',  'Front Door',  'Locked',   '2026-11-03 22:15:00'),
  (17, '21 Birch Lane',   'Marcus Webb', 'Ecobee SmartSensor - Back Door',   'Back Door',   'Locked',   '2026-11-03 22:16:00'),
  (18, '21 Birch Lane',   'Marcus Webb', 'Ecobee SmartSensor - Front Door',  'Front Door',  'Unlocked', '2026-11-04 06:50:00'),
  (19, '7 Oak Court',     'Sofia Delgado','Ecobee SmartSensor - Front Door', 'Front Door',  'Locked',   '2026-11-03 21:55:00'),
  (20, '7 Oak Court',     'Sofia Delgado','Ecobee SmartSensor - Garage Door','Garage Door', 'Locked',   '2026-11-03 21:56:00'),
  (21, '7 Oak Court',     'Sofia Delgado','Ecobee SmartSensor - Front Door', 'Front Door',  'Unlocked', '2026-11-04 07:10:00');

-- -----------------------------------------------------------------------
-- MOTION EVENTS (overnight, Nov 3 into Nov 4) -- all houses on the street
-- -----------------------------------------------------------------------
INSERT INTO motion_events (id, house_address, person_name, device_name, location, event_time, confidence) VALUES
  (1,  '14 Maple Street', 'Dana Morgan', 'Ecobee SmartSensor - Hallway',     'Hallway',     '2026-11-03 23:40:00', 'High'),
  (2,  '14 Maple Street', 'Sam Okafor',  'Ecobee SmartSensor - Guest Room',  'Guest Room',  '2026-11-04 00:15:00', 'High'),
  (3,  '14 Maple Street', 'Sam Okafor',  'Ecobee SmartSensor - Guest Room',  'Guest Room',  '2026-11-04 01:05:00', 'High'),
  (4,  '14 Maple Street', 'Unknown',     'Ecobee SmartCamera - Backyard',   'Backyard',    '2026-11-04 01:50:00', 'Low'),
  (5,  '14 Maple Street', 'Unknown',     'Ecobee SmartSensor - Side Yard',  'Side Yard',   '2026-11-04 02:08:00', 'High'),
  (6,  '14 Maple Street', 'Unknown',     'Ecobee SmartSensor - Kitchen',    'Kitchen',     '2026-11-04 02:15:00', 'High'),
  (7,  '14 Maple Street', 'Unknown',     'Ecobee SmartSensor - Hallway',    'Hallway',     '2026-11-04 02:20:00', 'High'),
  (8,  '14 Maple Street', 'Sam Okafor',  'Ecobee SmartSensor - Guest Room', 'Guest Room',  '2026-11-04 02:21:00', 'High'),
  (9,  '12 Maple Street', 'Jordan Patel','Ecobee SmartSensor - Living Room','Living Room', '2026-11-03 23:15:00', 'High'),
  (10, '12 Maple Street', 'Jordan Patel','Ecobee SmartSensor - Bedroom',    'Bedroom',     '2026-11-03 23:50:00', 'High'),
  (11, '12 Maple Street', 'Jordan Patel','Ecobee SmartSensor - Bedroom',    'Bedroom',     '2026-11-04 02:14:00', 'High'),
  (12, '12 Maple Street', 'Jordan Patel','Ecobee SmartSensor - Bedroom',    'Bedroom',     '2026-11-04 06:30:00', 'High'),
  (13, '9 Birch Lane',    'Alex Rivera', 'Ecobee SmartSensor - Bedroom',    'Bedroom',     '2026-11-03 22:45:00', 'High'),
  (14, '9 Birch Lane',    'Alex Rivera', 'Ecobee SmartSensor - Bedroom',    'Bedroom',     '2026-11-03 23:30:00', 'High'),
  (15, '9 Birch Lane',    'Alex Rivera', 'Ecobee SmartSensor - Bedroom',    'Bedroom',     '2026-11-04 02:17:00', 'High'),
  (16, '9 Birch Lane',    'Alex Rivera', 'Ecobee SmartSensor - Bedroom',    'Bedroom',     '2026-11-04 06:40:00', 'High'),
  (17, '16 Maple Street', 'Priya Nair',   'Ecobee SmartSensor - Bedroom',   'Bedroom',     '2026-11-03 22:30:00', 'High'),
  (18, '16 Maple Street', 'Priya Nair',   'Ecobee SmartSensor - Bathroom',  'Bathroom',    '2026-11-04 01:10:00', 'High'),
  (19, '16 Maple Street', 'Priya Nair',   'Ecobee SmartSensor - Bedroom',   'Bedroom',     '2026-11-04 06:55:00', 'High'),
  (20, '21 Birch Lane',   'Marcus Webb',  'Ecobee SmartSensor - Living Room','Living Room','2026-11-03 23:05:00', 'High'),
  (21, '21 Birch Lane',   'Marcus Webb',  'Ecobee SmartSensor - Kitchen',   'Kitchen',     '2026-11-04 00:40:00', 'High'),
  (22, '21 Birch Lane',   'Marcus Webb',  'Ecobee SmartSensor - Bedroom',   'Bedroom',     '2026-11-04 07:05:00', 'High'),
  (23, '7 Oak Court',     'Sofia Delgado','Ecobee SmartSensor - Bedroom',   'Bedroom',     '2026-11-03 22:50:00', 'High'),
  (24, '7 Oak Court',     'Sofia Delgado','Ecobee SmartSensor - Hallway',   'Hallway',     '2026-11-04 03:20:00', 'High'),
  (25, '7 Oak Court',     'Sofia Delgado','Ecobee SmartSensor - Bedroom',   'Bedroom',     '2026-11-04 06:45:00', 'High');

-- -----------------------------------------------------------------------
-- CAMERA LOGS -- all houses on the street
-- -----------------------------------------------------------------------
INSERT INTO camera_logs (id, house_address, person_name, device_name, location, event_time, detected_object, item_seen, notes) VALUES
  (1, '14 Maple Street', 'N/A',         'Ecobee SmartCamera - Kitchen',     'Kitchen',     '2026-11-03 19:30:00', 'Pet',     NULL,
      'The familys dog, Biscuit, drinking water. Normal evening activity.'),
  (2, '14 Maple Street', 'N/A',         'Ecobee SmartCamera - Backyard',    'Backyard',    '2026-11-04 01:51:00', 'Raccoon', NULL,
      'Small animal rummaging through the trash bins. Knocked over a lid.'),
  (3, '14 Maple Street', 'Unknown',     'Ecobee SmartCamera - Backyard',    'Backyard',    '2026-11-04 02:09:00', 'Person',  'Dog-leash bag',
      'Person briefly visible walking along the side of the house toward the back door.'),
  (4, '14 Maple Street', 'Unknown',     'Ecobee SmartCamera - Kitchen',     'Kitchen',     '2026-11-04 02:16:00', 'Person',  'Dog-leash bag',
      'Person in a grey hoodie, going through the kitchen drawers.'),
  (5, '12 Maple Street', 'Jordan Patel','Ecobee SmartCamera - Living Room', 'Living Room', '2026-11-03 23:20:00', 'Person',  NULL,
      'Jordan watching TV before bed. Normal evening.'),
  (6, '9 Birch Lane',    'N/A',         'Ecobee SmartCamera - Backyard',    'Backyard',    '2026-11-03 22:50:00', 'Pet',     NULL,
      'Neighborhood cat prowling through the yard.'),
  (7, '16 Maple Street', 'Priya Nair',  'Ecobee SmartCamera - Kitchen',     'Kitchen',     '2026-11-03 20:15:00', 'Person',  NULL,
      'Priya making tea before bed. Normal evening.'),
  (8, '21 Birch Lane',   'Marcus Webb', 'Ecobee SmartCamera - Backyard',    'Backyard',    '2026-11-03 21:40:00', 'Pet',     NULL,
      'The Webbs dog, Max, out for his evening business.');

-- -----------------------------------------------------------------------
-- THERMOSTAT EVENTS (14 Maple Street only)
-- -----------------------------------------------------------------------
INSERT INTO thermostat_events (id, house_address, device_name, location, event_time, event_type, detail) VALUES
  (1, '14 Maple Street', 'Ecobee Smart Thermostat', 'Living Room', '2026-11-03 22:05:00', 'Mode Change',     'Set to Home/Sleep schedule for the night'),
  (2, '14 Maple Street', 'Ecobee Smart Thermostat', 'Living Room', '2026-11-04 02:15:00', 'Temperature Log', '68 degrees F, no change requested'),
  (3, '14 Maple Street', 'Ecobee Smart Thermostat', 'Living Room', '2026-11-04 07:00:00', 'Mode Change',     'Set to Home/Day schedule for the morning');

-- -----------------------------------------------------------------------
-- ACCESS LOGS (security system arm/disarm) -- always a real name, never a bare code
-- Note: Alex Rivera has ZERO rows here, anywhere -- no access code on record.
-- -----------------------------------------------------------------------
INSERT INTO access_logs (id, house_address, person_name, event_time, action, method) VALUES
  (1, '14 Maple Street', 'Dana Morgan', '2026-11-03 22:10:00', 'Armed',    'Keypad'),
  (2, '14 Maple Street', 'Riley Chen',  '2026-11-04 02:10:00', 'Disarmed', 'Keypad'),
  (3, '14 Maple Street', 'Dana Morgan', '2026-11-04 06:45:00', 'Disarmed', 'App'),
  (4, '12 Maple Street', 'Jordan Patel','2026-11-03 22:00:00', 'Armed',    'Keypad'),
  (5, '12 Maple Street', 'Jordan Patel','2026-11-04 07:00:00', 'Disarmed', 'Keypad'),
  (6, '16 Maple Street', 'Priya Nair',   '2026-11-03 21:50:00', 'Armed',    'Keypad'),
  (7, '16 Maple Street', 'Priya Nair',   '2026-11-04 07:05:00', 'Disarmed', 'Keypad'),
  (8, '21 Birch Lane',   'Marcus Webb',  '2026-11-03 22:20:00', 'Armed',    'Keypad'),
  (9, '21 Birch Lane',   'Marcus Webb',  '2026-11-04 06:55:00', 'Disarmed', 'App'),
  (10, '7 Oak Court',    'Sofia Delgado','2026-11-03 22:00:00', 'Armed',    'Keypad'),
  (11, '7 Oak Court',    'Sofia Delgado','2026-11-04 07:15:00', 'Disarmed', 'Keypad');
`;
