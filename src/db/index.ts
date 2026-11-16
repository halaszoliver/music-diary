import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { relations } from '@/db/relations'

export const db = drizzle({
  client: new Pool({ connectionString: process.env.DATABASE_URL }),
  relations,
})
