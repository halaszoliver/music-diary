import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { relations } from '@/db/relations'
import * as schema from '@/db/schemas/auth'

const db = drizzle({
  client: new Pool({ connectionString: process.env.DATABASE_URL }),
  relations,
})

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  baseURL: 'http://localhost:3000/',
  emailAndPassword: { enabled: true }, //TODO email verification
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
})
