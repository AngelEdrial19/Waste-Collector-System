import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export const db = new Database('waste_collector.db');
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
 password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','driver','resident')),
 phone TEXT DEFAULT '', available INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS households (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, household_name TEXT NOT NULL,
 address TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL, photo_url TEXT DEFAULT '',
 FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS schedules (
 id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, area TEXT NOT NULL,
 collection_date TEXT NOT NULL, start_time TEXT NOT NULL, notes TEXT DEFAULT '',
 status TEXT DEFAULT 'published', created_by INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS assignments (
 id INTEGER PRIMARY KEY AUTOINCREMENT, schedule_id INTEGER NOT NULL, driver_id INTEGER NOT NULL,
 status TEXT DEFAULT 'assigned', started_at TEXT, completed_at TEXT,
 UNIQUE(schedule_id, driver_id)
);
CREATE TABLE IF NOT EXISTS pickups (
 id INTEGER PRIMARY KEY AUTOINCREMENT, schedule_id INTEGER NOT NULL, household_id INTEGER NOT NULL,
 driver_id INTEGER NOT NULL, status TEXT NOT NULL, note TEXT DEFAULT '',
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(schedule_id, household_id)
);
CREATE TABLE IF NOT EXISTS notifications (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL,
 message TEXT NOT NULL, type TEXT DEFAULT 'info', read INTEGER DEFAULT 0,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS messages (
 id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id INTEGER NOT NULL, receiver_id INTEGER NOT NULL,
 message TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);
const count=db.prepare('SELECT COUNT(*) n FROM users').get().n;
if (!count) {
 const add=db.prepare('INSERT INTO users(name,email,password,role,phone,available) VALUES(?,?,?,?,?,?)');
 const seed=[
 ['Municipal Admin','admin@wastecollector.local','Admin123!','admin','09170000001',1],
 ['Driver One','driver1@wastecollector.local','Driver123!','driver','09170000002',1],
 ['Driver Two','driver2@wastecollector.local','Driver123!','driver','09170000003',1],
 ['Juan Dela Cruz','resident@wastecollector.local','Resident123!','resident','09170000004',1]
 ];
 for(const u of seed) add.run(u[0],u[1],bcrypt.hashSync(u[2],10),u[3],u[4],u[5]);
 const resident=db.prepare("SELECT id FROM users WHERE role='resident'").get().id;
 db.prepare('INSERT INTO households(user_id,household_name,address,latitude,longitude,photo_url) VALUES(?,?,?,?,?,?)')
 .run(resident,'Dela Cruz Household','Poblacion, Saint Bernard, Southern Leyte',10.2838,125.1832,'');
 const admin=db.prepare("SELECT id FROM users WHERE role='admin'").get().id;
 db.prepare('INSERT INTO schedules(title,area,collection_date,start_time,notes,created_by) VALUES(?,?,?,?,?,?)')
 .run('Municipal Waste Collection','Poblacion','2026-11-03','07:00','Please segregate biodegradable and residual waste.',admin);
}
