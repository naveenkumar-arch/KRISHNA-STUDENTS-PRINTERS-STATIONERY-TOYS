import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      totpVerified: boolean;
      isSuspended: boolean;
      needsTotpSetup?: boolean;
      needsTotpVerify?: boolean;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: string;
    totpVerified: boolean;
    isSuspended: boolean;
    needsTotpSetup?: boolean;
    needsTotpVerify?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    totpVerified: boolean;
    isSuspended: boolean;
    needsTotpSetup?: boolean;
    needsTotpVerify?: boolean;
  }
}
