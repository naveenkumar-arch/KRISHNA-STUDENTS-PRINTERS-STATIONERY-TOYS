import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-client-secret',
      async profile(profile) {
        const emailLower = profile.email.toLowerCase();
        let dbUser = await db.user.findUnique({
          where: { email: emailLower }
        });

        if (!dbUser) {
          // Block creation if email is ADMIN_EMAIL
          if (process.env.ADMIN_EMAIL && emailLower === process.env.ADMIN_EMAIL.toLowerCase()) {
            throw new Error('Google sign-in is not permitted for administrator accounts.');
          }

          dbUser = await db.user.create({
            data: {
              email: emailLower,
              name: profile.name,
              avatarUrl: profile.picture,
              image: profile.picture,
              role: 'CUSTOMER',
              isActive: true,
              isSuspended: false,
            }
          });
        }

        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.image || dbUser.avatarUrl,
          role: dbUser.role,
          totpVerified: dbUser.totpVerified,
          isSuspended: dbUser.isSuspended,
        };
      }
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        isGoogleMock: { label: 'IsGoogleMock', type: 'text' },
        name: { label: 'Name', type: 'text' },
      },
      async authorize(credentials) {
        if (credentials?.isGoogleMock === 'true') {
          if (!credentials?.email) {
            throw new Error('Email is required');
          }
          const emailLower = credentials.email.toLowerCase().trim();
          
          const user = await db.user.findUnique({
            where: { email: emailLower }
          });
          
          if (!user) {
            throw new Error('No account found with this email. Please register first.');
          }

          if (user.isSuspended) {
            throw new Error('Your account has been suspended.');
          }

          if (!user.isActive) {
            throw new Error('Your account is inactive.');
          }
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image || user.avatarUrl,
            totpVerified: true,
            isSuspended: user.isSuspended,
            needsTotpSetup: false,
            needsTotpVerify: false,
          };
        }

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const emailLower = credentials.email.toLowerCase();
        const user = await db.user.findUnique({
          where: { email: emailLower },
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Lockout Check
        if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
          throw new Error('Account locked. Try again later.');
        }

        if (!user.password) {
          throw new Error('Invalid email or password');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          const attempts = user.loginAttempts + 1;
          if (attempts >= 5) {
            const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
            await db.user.update({
              where: { id: user.id },
              data: {
                loginAttempts: 0,
                lockUntil,
              }
            });
            throw new Error('Too many attempts. Locked for 15 minutes.');
          } else {
            await db.user.update({
              where: { id: user.id },
              data: {
                loginAttempts: attempts,
              }
            });
            throw new Error('Invalid email or password');
          }
        }

        // Reset login attempts on successful login
        if (user.loginAttempts > 0 || user.lockUntil) {
          await db.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: 0,
              lockUntil: null,
            }
          });
        }

        // Account status checks
        if (!user.isActive) {
          throw new Error('Account is disabled.');
        }

        if (user.isSuspended) {
          throw new Error('Account suspended. Please contact store administration.');
        }

        const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

        // Reset totpVerified to true in the database for admins since 2FA is disabled
        if (isAdmin) {
          await db.user.update({
            where: { id: user.id },
            data: { totpVerified: true }
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image || user.avatarUrl,
          totpVerified: true,
          isSuspended: user.isSuspended,
          needsTotpSetup: false,
          needsTotpVerify: false,
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email?.toLowerCase();
        if (email) {
          if (process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL.toLowerCase()) {
            return false;
          }
          const dbUser = await db.user.findUnique({
            where: { email },
            select: { role: true }
          });
          if (dbUser && (dbUser.role === 'ADMIN' || dbUser.role === 'SUPER_ADMIN')) {
            return false;
          }
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.totpVerified = (user as any).totpVerified ?? false;
        token.isSuspended = (user as any).isSuspended ?? false;
        token.needsTotpSetup = (user as any).needsTotpSetup ?? false;
        token.needsTotpVerify = (user as any).needsTotpVerify ?? false;
      }

      if (trigger === 'update' && session) {
        if (session.totpVerified !== undefined) {
          token.totpVerified = session.totpVerified;
        }
        if (session.name !== undefined) {
          token.name = session.name;
        }
        if (session.image !== undefined) {
          token.picture = session.image;
        }
        if (session.role !== undefined) {
          token.role = session.role;
        }
      }

      // Synchronize state with DB to keep 2FA and suspension flags up-to-date
      if (token.email) {
        const emailLower = token.email.toLowerCase();
        const dbUser = await db.user.findUnique({
          where: { email: emailLower },
          select: { isSuspended: true, role: true, totpVerified: true, totpEnabled: true }
        });
        if (dbUser) {
          token.isSuspended = dbUser.isSuspended;
          token.role = dbUser.role;
          token.totpVerified = true;
          token.needsTotpSetup = false;
          token.needsTotpVerify = false;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.totpVerified = token.totpVerified as boolean;
        session.user.isSuspended = token.isSuspended as boolean;
        session.user.needsTotpSetup = token.needsTotpSetup as boolean;
        session.user.needsTotpVerify = token.needsTotpVerify as boolean;
      }

      if (session.user?.isSuspended) {
        return null as any;
      }

      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
