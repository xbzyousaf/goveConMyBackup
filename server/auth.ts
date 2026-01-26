import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class AuthService {
  private static readonly SALT_ROUNDS = 10;
  private static readonly TOKEN_EXPIRY_HOURS = 24;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateTokenExpiry(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + this.TOKEN_EXPIRY_HOURS);
    return expiry;
  }

  static isTokenExpired(expiry: Date | null): boolean {
    if (!expiry) return true;
    return new Date() > new Date(expiry);
  }
}
