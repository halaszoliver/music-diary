import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { db } from '@/db'
import * as schema from '@/db/schemas/auth'

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
  user: {
    additionalFields: {
      lastfmUsername: { type: 'string', required: false, input: false },
    },
  },
})
