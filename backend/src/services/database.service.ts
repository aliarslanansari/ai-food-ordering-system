import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database service for managing SQLite connection and initialization
 */
export class DatabaseService {
  private db: Database.Database;
  private static instance: DatabaseService;

  private constructor(dbPath: string) {
    // Resolve to absolute path
    const absolutePath = path.isAbsolute(dbPath)
      ? dbPath
      : path.resolve(process.cwd(), dbPath);

    // Ensure directory exists
    const dataDir = path.dirname(absolutePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log(`Creating database at: ${absolutePath}`);

    // Initialize database
    this.db = new Database(absolutePath, {
      verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
    });

    // Enable foreign keys
    this.db.pragma("foreign_keys = ON");

    // Initialize schema
    this.initialize();

    console.log(`✅ Database initialized: ${absolutePath}`);
  }

  /**
   * Get singleton instance
   * IMPORTANT: The path only matters on FIRST call
   */
  public static getInstance(dbPath?: string): DatabaseService {
    if (!DatabaseService.instance) {
      const defaultPath = "./app.db"; // Default to app.db in current directory
      DatabaseService.instance = new DatabaseService(dbPath || defaultPath);
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize database schema
   */
  private initialize(): void {
    try {
      // Read and execute schema file
      const schemaPath = path.join(__dirname, "..", "db", "schema.sql");

      console.log({ schemaPath });

      if (fs.existsSync(schemaPath) && fs.statSync(schemaPath).size > 0) {
        console.log(`Loading schema from: ${schemaPath}`);
        const schema = fs.readFileSync(schemaPath, "utf-8");
        this.db.exec(schema);
        console.log("✅ Database schema initialized from file");
        return;
      }

      console.log(
        "Schema file not found or empty, creating tables manually...",
      );
      this.createTablesManually();
    } catch (error) {
      console.error("❌ Failed to initialize database schema:", error);
      console.log("Falling back to manual table creation...");
      this.createTablesManually();
    }
  }

  /**
   * Fallback: Create tables manually if schema.sql not found
   */
  private createTablesManually(): void {
    const statements = [
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        last_message_at INTEGER NOT NULL,
        metadata TEXT DEFAULT '{}'
      )`,
      `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        intent TEXT,
        filters TEXT,
        results TEXT,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS session_context (
        session_id TEXT PRIMARY KEY,
        last_mentioned_items TEXT DEFAULT '[]',
        last_search_query TEXT,
        preferences TEXT DEFAULT '{}',
        cart_id TEXT,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS carts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY,
        cart_id TEXT NOT NULL,
        food_id TEXT NOT NULL,
        food_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
        price REAL NOT NULL,
        added_at INTEGER NOT NULL,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, timestamp)`,
      `CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id)`,
    ];

    statements.forEach((stmt, index) => {
      try {
        this.db.exec(stmt);
      } catch (error) {
        console.error(`Error executing statement ${index + 1}:`, error);
        throw error;
      }
    });

    console.log("✅ Tables created manually");
  }

  /**
   * Get database instance
   */
  public getDb(): Database.Database {
    return this.db;
  }

  /**
   * Close database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      console.log("✅ Database connection closed");
    }
  }

  /**
   * Clean up old sessions (older than specified days)
   */
  public cleanupOldSessions(daysOld: number = 7): number {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const result = this.db
      .prepare("DELETE FROM sessions WHERE last_message_at < ?")
      .run(cutoffTime);
    return result.changes;
  }

  /**
   * Get database statistics
   */
  public getStats(): {
    sessions: number;
    messages: number;
    carts: number;
    cartItems: number;
  } {
    const sessions = this.db
      .prepare("SELECT COUNT(*) as count FROM sessions")
      .get() as { count: number };

    const messages = this.db
      .prepare("SELECT COUNT(*) as count FROM messages")
      .get() as { count: number };

    const carts = this.db
      .prepare("SELECT COUNT(*) as count FROM carts")
      .get() as { count: number };

    const cartItems = this.db
      .prepare("SELECT COUNT(*) as count FROM cart_items")
      .get() as { count: number };

    return {
      sessions: sessions.count,
      messages: messages.count,
      carts: carts.count,
      cartItems: cartItems.count,
    };
  }

  /**
   * Run database migrations (for future use)
   */
  public runMigrations(migrationsDir: string): void {
    if (!fs.existsSync(migrationsDir)) {
      console.warn(`⚠️  Migrations directory not found: ${migrationsDir}`);
      return;
    }

    const migrations = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    migrations.forEach((migration) => {
      const migrationPath = path.join(migrationsDir, migration);
      const sql = fs.readFileSync(migrationPath, "utf-8");
      try {
        this.db.exec(sql);
        console.log(`✅ Migration applied: ${migration}`);
      } catch (error) {
        console.error(`❌ Migration failed: ${migration}`, error);
        throw error;
      }
    });
  }
}

// Export singleton instance getter
export const getDatabase = () => DatabaseService.getInstance();
