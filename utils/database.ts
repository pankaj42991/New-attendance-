import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

const db = SQLite.openDatabase('attendance.db');

export interface AttendanceRecord {
  id?: number;
  timestamp: string;
  type: 'check-in' | 'check-out';
  shift: 'morning' | 'general' | 'afternoon' | 'night';
  latitude?: number;
  longitude?: number;
  isAutoDetected: boolean;
}

export interface WorkLog {
  id?: number;
  date: string;
  tasks: string;
  meetings: string;
  workHours: number;
  remarks: string;
}

export interface Leave {
  id?: number;
  startDate: string;
  endDate: string;
  type: 'full' | 'half';
  category: 'sick' | 'casual' | 'earned' | 'compensatory';
  status: 'pending' | 'approved' | 'rejected';
  remarks: string;
}

export interface Holiday {
  id?: number;
  date: string;
  name: string;
  type: 'national' | 'custom';
  isRecurring: boolean;
}

export const initDatabase = () => {
  db.transaction(tx => {
    // Attendance records
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        type TEXT NOT NULL,
        shift TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        isAutoDetected INTEGER DEFAULT 0
      )`
    );

    // Work logs
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS work_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        tasks TEXT,
        meetings TEXT,
        workHours REAL NOT NULL,
        remarks TEXT
      )`
    );

    // Leaves
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS leaves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        remarks TEXT
      )`
    );

    // Holidays
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        isRecurring INTEGER DEFAULT 0
      )`
    );

    // Settings
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL
      )`
    );
  });
};

// Attendance functions
export const saveAttendance = (record: AttendanceRecord): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO attendance (timestamp, type, shift, latitude, longitude, isAutoDetected)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          record.timestamp,
          record.type,
          record.shift,
          record.latitude,
          record.longitude,
          record.isAutoDetected ? 1 : 0,
        ],
        (_, result) => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getAttendanceRecords = (startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM attendance 
         WHERE timestamp BETWEEN ? AND ?
         ORDER BY timestamp DESC`,
        [startDate, endDate],
        (_, { rows: { _array } }) => resolve(_array),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

// Work log functions
export const saveWorkLog = (log: WorkLog): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO work_logs (date, tasks, meetings, workHours, remarks)
         VALUES (?, ?, ?, ?, ?)`,
        [log.date, log.tasks, log.meetings, log.workHours, log.remarks],
        (_, result) => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

// Leave management functions
export const submitLeave = (leave: Leave): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO leaves (startDate, endDate, type, category, status, remarks)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [leave.startDate, leave.endDate, leave.type, leave.category, leave.status, leave.remarks],
        (_, result) => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

// Holiday management functions
export const addHoliday = (holiday: Holiday): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO holidays (date, name, type, isRecurring)
         VALUES (?, ?, ?, ?)`,
        [holiday.date, holiday.name, holiday.type, holiday.isRecurring ? 1 : 0],
        (_, result) => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

// Backup functions
export const backupDatabase = async (): Promise<string> => {
  const dbPath = FileSystem.documentDirectory + 'SQLite/attendance.db';
  const backupPath = FileSystem.documentDirectory + 'backup.db';
  
  await FileSystem.copyAsync({
    from: dbPath,
    to: backupPath
  });
  
  return backupPath;
};

export const restoreDatabase = async (backupPath: string): Promise<void> => {
  const dbPath = FileSystem.documentDirectory + 'SQLite/attendance.db';
  
  await FileSystem.deleteAsync(dbPath, { idempotent: true });
  await FileSystem.copyAsync({
    from: backupPath,
    to: dbPath
  });
};