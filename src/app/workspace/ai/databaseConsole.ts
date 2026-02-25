/**
 * databaseConsole.ts
 *
 * In-browser SQL database console powered by sql.js (SQLite compiled to WebAssembly).
 * Provides a full SQLite environment running entirely in the browser with
 * localStorage persistence, CSV/SQL export, query history, and formatted output.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QueryResult = {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTimeMs: number;
  type: "select" | "insert" | "update" | "delete" | "create" | "drop" | "other";
};

export type TableInfo = {
  name: string;
  columns: {
    name: string;
    type: string;
    notnull: boolean;
    pk: boolean;
    dflt_value: string | null;
  }[];
  rowCount: number;
};

export type DatabaseState = {
  tables: TableInfo[];
  totalRows: number;
  sizeBytes: number;
};

export type QueryHistoryEntry = {
  query: string;
  timestamp: string;
  success: boolean;
  rowCount?: number;
  error?: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DB_STORAGE_KEY = "f9_db_";
const HISTORY_STORAGE_KEY = "f9_db_history_";
const MAX_HISTORY_ENTRIES = 200;

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Classify a SQL statement into one of the known categories.
 */
export function classifyQuery(
  sql: string
): QueryResult["type"] {
  const trimmed = sql.trim().toUpperCase();

  if (trimmed.startsWith("SELECT") || trimmed.startsWith("PRAGMA") || trimmed.startsWith("EXPLAIN")) {
    return "select";
  }
  if (trimmed.startsWith("INSERT") || trimmed.startsWith("REPLACE")) {
    return "insert";
  }
  if (trimmed.startsWith("UPDATE")) {
    return "update";
  }
  if (trimmed.startsWith("DELETE")) {
    return "delete";
  }
  if (trimmed.startsWith("CREATE")) {
    return "create";
  }
  if (trimmed.startsWith("DROP")) {
    return "drop";
  }
  if (trimmed.startsWith("ALTER")) {
    return "other";
  }
  return "other";
}

/**
 * Format a QueryResult as a human-readable ASCII table suitable for terminal
 * or monospace display.
 *
 * Example output:
 * ```
 * +----+--------+-----+
 * | id | name   | age |
 * +----+--------+-----+
 * |  1 | Alice  |  30 |
 * |  2 | Bob    |  25 |
 * +----+--------+-----+
 * 2 rows returned (1.23 ms)
 * ```
 */
export function formatQueryResult(result: QueryResult): string {
  if (result.columns.length === 0) {
    const label =
      result.type === "select"
        ? "No results."
        : `Query OK (${result.type}). Rows affected: ${result.rowCount}.`;
    return `${label} (${result.executionTimeMs.toFixed(2)} ms)`;
  }

  // Determine column widths --------------------------------------------------
  const widths: number[] = result.columns.map((col) => col.length);

  for (const row of result.rows) {
    for (let i = 0; i < row.length; i++) {
      const cellStr = formatCell(row[i]);
      if (cellStr.length > widths[i]) {
        widths[i] = cellStr.length;
      }
    }
  }

  // Build separator line -----------------------------------------------------
  const separator =
    "+" + widths.map((w) => "-".repeat(w + 2)).join("+") + "+";

  // Build header -------------------------------------------------------------
  const header =
    "|" +
    result.columns
      .map((col, i) => ` ${col.padEnd(widths[i])} `)
      .join("|") +
    "|";

  // Build rows ---------------------------------------------------------------
  const rowLines = result.rows.map(
    (row) =>
      "|" +
      row
        .map((cell, i) => {
          const cellStr = formatCell(cell);
          const isNumber = typeof cell === "number";
          return isNumber
            ? ` ${cellStr.padStart(widths[i])} `
            : ` ${cellStr.padEnd(widths[i])} `;
        })
        .join("|") +
      "|"
  );

  const footer = `${result.rowCount} row${result.rowCount !== 1 ? "s" : ""} returned (${result.executionTimeMs.toFixed(2)} ms)`;

  return [separator, header, separator, ...rowLines, separator, footer].join(
    "\n"
  );
}

/** Stringify a cell value for display. */
function formatCell(value: any): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "string") return value;
  if (value instanceof Uint8Array) return `[BLOB ${value.length}B]`;
  return String(value);
}

/**
 * Return a collection of useful sample / starter queries that users can
 * try in the console.
 */
export function getSampleQueries(): { label: string; query: string }[] {
  return [
    {
      label: "Create users table",
      query: `CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  age INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);`,
    },
    {
      label: "Create products table",
      query: `CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  category TEXT,
  stock INTEGER DEFAULT 0
);`,
    },
    {
      label: "Create orders table with foreign keys",
      query: `CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  total REAL,
  ordered_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);`,
    },
    {
      label: "Insert sample users",
      query: `INSERT INTO users (name, email, age) VALUES
  ('Alice', 'alice@example.com', 30),
  ('Bob', 'bob@example.com', 25),
  ('Charlie', 'charlie@example.com', 35),
  ('Diana', 'diana@example.com', 28),
  ('Eve', 'eve@example.com', 22);`,
    },
    {
      label: "Insert sample products",
      query: `INSERT INTO products (name, price, category, stock) VALUES
  ('Laptop', 999.99, 'Electronics', 50),
  ('Headphones', 79.99, 'Electronics', 200),
  ('Notebook', 4.99, 'Stationery', 500),
  ('Backpack', 49.99, 'Accessories', 150),
  ('Coffee Mug', 12.99, 'Kitchen', 300);`,
    },
    {
      label: "Insert sample orders",
      query: `INSERT INTO orders (user_id, product_id, quantity, total) VALUES
  (1, 1, 1, 999.99),
  (1, 2, 2, 159.98),
  (2, 3, 10, 49.90),
  (3, 4, 1, 49.99),
  (4, 1, 1, 999.99),
  (5, 5, 3, 38.97);`,
    },
    {
      label: "SELECT with JOIN",
      query: `SELECT
  u.name AS customer,
  p.name AS product,
  o.quantity,
  o.total
FROM orders o
JOIN users u ON u.id = o.user_id
JOIN products p ON p.id = o.product_id
ORDER BY o.total DESC;`,
    },
    {
      label: "Aggregate: total spent per user",
      query: `SELECT
  u.name,
  COUNT(o.id) AS order_count,
  ROUND(SUM(o.total), 2) AS total_spent
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id
ORDER BY total_spent DESC;`,
    },
    {
      label: "Aggregate: revenue by category",
      query: `SELECT
  p.category,
  SUM(o.quantity) AS units_sold,
  ROUND(SUM(o.total), 2) AS revenue
FROM orders o
JOIN products p ON p.id = o.product_id
GROUP BY p.category
ORDER BY revenue DESC;`,
    },
    {
      label: "Subquery: users who spent above average",
      query: `SELECT name, total_spent
FROM (
  SELECT u.name, ROUND(SUM(o.total), 2) AS total_spent
  FROM users u
  JOIN orders o ON o.user_id = u.id
  GROUP BY u.id
) sub
WHERE total_spent > (
  SELECT AVG(total) FROM orders
)
ORDER BY total_spent DESC;`,
    },
    {
      label: "UPDATE with condition",
      query: `UPDATE products
SET price = price * 0.9
WHERE stock > 100;`,
    },
    {
      label: "DELETE with subquery",
      query: `DELETE FROM orders
WHERE user_id IN (
  SELECT id FROM users WHERE age < 23
);`,
    },
    {
      label: "Show all tables",
      query: `SELECT name FROM sqlite_master
WHERE type = 'table'
ORDER BY name;`,
    },
    {
      label: "Table schema (PRAGMA)",
      query: `PRAGMA table_info('users');`,
    },
  ];
}

// ---------------------------------------------------------------------------
// BrowserDatabase
// ---------------------------------------------------------------------------

export class BrowserDatabase {
  private db: any; // sql.js Database instance
  private initialized: boolean;
  private history: QueryHistoryEntry[];

  constructor() {
    this.db = null;
    this.initialized = false;
    this.history = [];
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /**
   * Initialise the sql.js WASM engine and create an in-memory SQLite database.
   * Must be called (and awaited) before any other method.
   */
  async init(): Promise<void> {
    if (this.initialized && this.db) return;

    try {
      // Dynamic import so that sql.js is only loaded when needed and does
      // not break SSR / Node environments at module-evaluation time.
      const initSqlJs = (await import("sql.js")).default;

      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });

      this.db = new SQL.Database();
      this.initialized = true;
    } catch (err: any) {
      this.initialized = false;
      throw new Error(
        `Failed to initialise sql.js: ${err?.message ?? String(err)}`
      );
    }
  }

  /** Whether the database is ready to accept queries. */
  isReady(): boolean {
    return this.initialized && this.db !== null;
  }

  // -------------------------------------------------------------------------
  // Query execution
  // -------------------------------------------------------------------------

  /**
   * Execute an arbitrary SQL string.  Multiple statements separated by `;`
   * are supported — the result of the *last* statement is returned.
   */
  execute(sql: string): QueryResult {
    this.assertReady();

    const queryType = classifyQuery(sql);
    const start = performance.now();

    try {
      const stmtResults: any[] = this.db.exec(sql);
      const elapsed = performance.now() - start;

      // db.exec returns an array of { columns, values } for each statement
      // that produced output.  For DML (INSERT/UPDATE/DELETE) the array may
      // be empty.
      if (stmtResults.length === 0) {
        // No result-set — return change count via getRowsModified()
        const changes: number = this.db.getRowsModified();
        const result: QueryResult = {
          columns: [],
          rows: [],
          rowCount: changes,
          executionTimeMs: elapsed,
          type: queryType,
        };
        this.addHistory(sql, true, changes);
        return result;
      }

      // Return the last result-set
      const last = stmtResults[stmtResults.length - 1];
      const result: QueryResult = {
        columns: last.columns as string[],
        rows: last.values as any[][],
        rowCount: (last.values as any[][]).length,
        executionTimeMs: elapsed,
        type: queryType,
      };
      this.addHistory(sql, true, result.rowCount);
      return result;
    } catch (err: any) {
      const elapsed = performance.now() - start;
      const message = err?.message ?? String(err);
      this.addHistory(sql, false, undefined, message);
      throw new Error(`SQL Error: ${message} (${elapsed.toFixed(2)} ms)`);
    }
  }

  // -------------------------------------------------------------------------
  // Introspection
  // -------------------------------------------------------------------------

  /** Return metadata for every user table in the database. */
  getTables(): TableInfo[] {
    this.assertReady();

    try {
      const tablesResult = this.db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );

      if (tablesResult.length === 0) return [];

      const tableNames: string[] = tablesResult[0].values.map(
        (row: any[]) => row[0] as string
      );

      return tableNames.map((name) => this.buildTableInfo(name));
    } catch {
      return [];
    }
  }

  /** Build a full state summary of the database. */
  getState(): DatabaseState {
    this.assertReady();

    const tables = this.getTables();
    const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);

    let sizeBytes = 0;
    try {
      const data: Uint8Array = this.db.export();
      sizeBytes = data.length;
    } catch {
      // ignore — size is best-effort
    }

    return { tables, totalRows, sizeBytes };
  }

  // -------------------------------------------------------------------------
  // Import / Export
  // -------------------------------------------------------------------------

  /**
   * Export the entire database as a series of SQL statements (CREATE TABLE +
   * INSERT).
   */
  exportSQL(): string {
    this.assertReady();

    const tables = this.getTables();
    const parts: string[] = [];

    for (const table of tables) {
      // Get the original CREATE TABLE statement
      try {
        const ddl = this.db.exec(
          `SELECT sql FROM sqlite_master WHERE type='table' AND name='${escapeSingleQuotes(table.name)}'`
        );
        if (ddl.length > 0 && ddl[0].values.length > 0) {
          parts.push((ddl[0].values[0][0] as string) + ";");
        }
      } catch {
        // skip
      }

      // Get all rows
      try {
        const rows = this.db.exec(`SELECT * FROM "${escapeDoubleQuotes(table.name)}"`);
        if (rows.length > 0 && rows[0].values.length > 0) {
          const columns = rows[0].columns as string[];
          const colList = columns.map((c: string) => `"${escapeDoubleQuotes(c)}"`).join(", ");

          for (const row of rows[0].values) {
            const values = (row as any[])
              .map((v: any) => {
                if (v === null) return "NULL";
                if (typeof v === "number") return String(v);
                if (typeof v === "string")
                  return `'${escapeSingleQuotes(v)}'`;
                return `'${String(v)}'`;
              })
              .join(", ");
            parts.push(
              `INSERT INTO "${escapeDoubleQuotes(table.name)}" (${colList}) VALUES (${values});`
            );
          }
        }
      } catch {
        // skip table data on error
      }

      parts.push(""); // blank line between tables
    }

    return parts.join("\n");
  }

  /** Export a single table as CSV (RFC 4180). */
  exportCSV(tableName: string): string {
    this.assertReady();

    try {
      const result = this.db.exec(
        `SELECT * FROM "${escapeDoubleQuotes(tableName)}"`
      );
      if (result.length === 0) return "";

      const columns: string[] = result[0].columns;
      const rows: any[][] = result[0].values;

      const csvRows: string[] = [];
      csvRows.push(columns.map(csvEscape).join(","));

      for (const row of rows) {
        csvRows.push(row.map((v: any) => csvEscape(formatCell(v))).join(","));
      }

      return csvRows.join("\n");
    } catch (err: any) {
      throw new Error(
        `Failed to export table "${tableName}" as CSV: ${err?.message ?? String(err)}`
      );
    }
  }

  /** Import a SQL dump (multiple statements). */
  importSQL(sql: string): { success: boolean; error?: string } {
    this.assertReady();

    try {
      this.db.run(sql);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message ?? String(err),
      };
    }
  }

  // -------------------------------------------------------------------------
  // Reset / Close
  // -------------------------------------------------------------------------

  /** Drop every user table, effectively resetting the database. */
  reset(): void {
    this.assertReady();

    const tables = this.getTables();
    for (const table of tables) {
      try {
        this.db.run(`DROP TABLE IF EXISTS "${escapeDoubleQuotes(table.name)}"`);
      } catch {
        // best-effort
      }
    }
  }

  /** Close the database and free WASM memory. */
  close(): void {
    try {
      if (this.db) {
        this.db.close();
      }
    } catch {
      // ignore
    } finally {
      this.db = null;
      this.initialized = false;
    }
  }

  // -------------------------------------------------------------------------
  // Convenience query helpers
  // -------------------------------------------------------------------------

  /**
   * Retrieve rows from a table with optional pagination.
   */
  getTableData(
    tableName: string,
    limit: number = 100,
    offset: number = 0
  ): QueryResult {
    const sql = `SELECT * FROM "${escapeDoubleQuotes(tableName)}" LIMIT ${limit} OFFSET ${offset}`;
    return this.execute(sql);
  }

  /** Return schema information for a single table, or null if it doesn't exist. */
  getTableSchema(tableName: string): TableInfo | null {
    this.assertReady();

    try {
      const check = this.db.exec(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='${escapeSingleQuotes(tableName)}'`
      );
      if (check.length === 0 || check[0].values.length === 0) return null;

      return this.buildTableInfo(tableName);
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Persistence (localStorage)
  // -------------------------------------------------------------------------

  /**
   * Persist the current database to localStorage as a base64-encoded SQLite
   * binary file.
   */
  saveToStorage(projectId: string): void {
    this.assertReady();

    try {
      const data: Uint8Array = this.db.export();
      const binary = uint8ArrayToBase64(data);
      const key = DB_STORAGE_KEY + projectId;

      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, binary);
      }

      // Also persist query history
      this.saveHistory(projectId);
    } catch (err: any) {
      throw new Error(
        `Failed to save database to storage: ${err?.message ?? String(err)}`
      );
    }
  }

  /**
   * Load a previously saved database from localStorage.  Returns true if a
   * saved database was found and loaded, false otherwise.
   */
  loadFromStorage(projectId: string): boolean {
    this.assertReady();

    try {
      const key = DB_STORAGE_KEY + projectId;

      if (typeof localStorage === "undefined") return false;

      const binary = localStorage.getItem(key);
      if (!binary) return false;

      const data = base64ToUint8Array(binary);

      // Close existing database and open from binary
      this.db.close();

      // Re-import sql.js constructor is not available here so we use the
      // low-level approach: create a new Database from the buffer.
      // sql.js Database constructor accepts a Uint8Array.
      const SqlJs = (this.db as any).constructor;
      // Fallback: if constructor trick doesn't work, we stashed the SQL
      // namespace during init.  We'll use a simpler approach — sql.js
      // Database instances expose their constructor via __proto__.
      // The safest path is to simply re-use the exec-based import approach:
      // close, recreate, import.
      // Actually sql.js databases can be created from a Uint8Array via their
      // constructor.  Since we don't have a reference to the SQL namespace,
      // we'll use the db instance's constructor which is SQL.Database.
      const DB = Object.getPrototypeOf(this.db).constructor;
      this.db = new DB(data);

      // Load history
      this.loadHistory(projectId);

      return true;
    } catch (err: any) {
      // If loading fails the database remains in whatever state it was in.
      // Re-init a fresh database.
      try {
        const DB = Object.getPrototypeOf(this.db).constructor;
        this.db = new DB();
      } catch {
        // If even this fails, mark as uninitialised.
        this.initialized = false;
      }
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // Query history
  // -------------------------------------------------------------------------

  /** Return a copy of the query history. */
  getHistory(): QueryHistoryEntry[] {
    return [...this.history];
  }

  /** Clear the in-memory query history. */
  clearHistory(): void {
    this.history = [];
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private assertReady(): void {
    if (!this.initialized || !this.db) {
      throw new Error(
        "Database is not initialised. Call init() first."
      );
    }
  }

  private buildTableInfo(name: string): TableInfo {
    let columns: TableInfo["columns"] = [];
    let rowCount = 0;

    try {
      const pragma = this.db.exec(`PRAGMA table_info("${escapeDoubleQuotes(name)}")`);
      if (pragma.length > 0) {
        columns = pragma[0].values.map((row: any[]) => ({
          name: row[1] as string,
          type: (row[2] as string) || "TEXT",
          notnull: row[3] === 1,
          pk: row[5] !== 0,
          dflt_value: row[4] as string | null,
        }));
      }
    } catch {
      // leave columns empty
    }

    try {
      const countResult = this.db.exec(
        `SELECT COUNT(*) FROM "${escapeDoubleQuotes(name)}"`
      );
      if (countResult.length > 0 && countResult[0].values.length > 0) {
        rowCount = countResult[0].values[0][0] as number;
      }
    } catch {
      // leave rowCount as 0
    }

    return { name, columns, rowCount };
  }

  private addHistory(
    query: string,
    success: boolean,
    rowCount?: number,
    error?: string
  ): void {
    this.history.push({
      query,
      timestamp: new Date().toISOString(),
      success,
      rowCount,
      error,
    });

    // Keep history bounded
    if (this.history.length > MAX_HISTORY_ENTRIES) {
      this.history = this.history.slice(-MAX_HISTORY_ENTRIES);
    }
  }

  private saveHistory(projectId: string): void {
    try {
      if (typeof localStorage === "undefined") return;
      const key = HISTORY_STORAGE_KEY + projectId;
      localStorage.setItem(key, JSON.stringify(this.history));
    } catch {
      // best-effort
    }
  }

  private loadHistory(projectId: string): void {
    try {
      if (typeof localStorage === "undefined") return;
      const key = HISTORY_STORAGE_KEY + projectId;
      const raw = localStorage.getItem(key);
      if (raw) {
        this.history = JSON.parse(raw) as QueryHistoryEntry[];
      }
    } catch {
      this.history = [];
    }
  }
}

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

function escapeSingleQuotes(s: string): string {
  return s.replace(/'/g, "''");
}

function escapeDoubleQuotes(s: string): string {
  return s.replace(/"/g, '""');
}

/** Escape a value for inclusion in a CSV field (RFC 4180). */
function csvEscape(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Convert a Uint8Array to a base64 string. */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  // Works in both browser and Node 16+ environments.
  if (typeof btoa === "function") {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  // Node.js fallback
  return Buffer.from(bytes).toString("base64");
}

/** Convert a base64 string back to a Uint8Array. */
function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  // Node.js fallback
  return new Uint8Array(Buffer.from(base64, "base64"));
}
