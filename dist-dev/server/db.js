import { createPool } from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";
const pool = createPool({
  host: "localhost",
  user: "root",
  password: "Mugonat#99",
  database: "deposits",
  port: 3306
});
const db = drizzle(pool, { schema, mode: "default" });
export {
  db,
  pool
};
