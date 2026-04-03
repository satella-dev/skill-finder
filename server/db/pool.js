import pg from "pg";
import { PG_URL } from "../config.js";

export const pool = new pg.Pool({ connectionString: PG_URL, max: 10 });
