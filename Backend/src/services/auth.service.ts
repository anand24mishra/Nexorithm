import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { UserModel } from '../models/User.model';
import { AuthResponse, JwtPayload } from '../types';
import { AppError, ValidationError, AuthenticationError } from '../errors/AppError';

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiry: string;
  private readonly googleClient: OAuth2Client;
  private readonly googleClientId: string;

  constructor(jwtSecret: string, googleClientId: string, jwtExpiry = '7d') {
    this.jwtSecret = jwtSecret;
    this.jwtExpiry = jwtExpiry;
    this.googleClientId = googleClientId;
    // Initialize Google OAuth2 client for verifying ID tokens
    this.googleClient = new OAuth2Client(googleClientId);
  }

  // ─── Local Registration ──────────────────────────────────────────────────────
  async register(
    username: string,
    email: string,
    password: string
  ): Promise<AuthResponse> {
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field =
        existingUser.email === email ? 'email' : 'username';
      throw new ValidationError(`User with this ${field} already exists`);
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await UserModel.create({
      username,
      email,
      passwordHash,
      role: 'user',
    });

    const token = this.generateToken({
      userId: String(user._id),
      username: user.username || user.name || 'anonymous',
      role: user.role as 'user' | 'admin',
    });

    return {
      token,
      user: {
        id: String(user._id),
        username: user.username || user.name || 'anonymous',
        email: user.email,
      },
    };
  }

  // ─── Local Login ─────────────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await UserModel.findOne({ email });
    if (!user || !user.passwordHash) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AuthenticationError('Invalid email or password');
    }

    const token = this.generateToken({
      userId: String(user._id),
      username: user.username || user.name || 'anonymous',
      role: user.role as 'user' | 'admin',
    });

    return {
      token,
      user: {
        id: String(user._id),
        username: user.username || user.name || 'anonymous',
        email: user.email,
      },
    };
  }

  // ─── Google OAuth Login ──────────────────────────────────────────────────────
  // Verifies the Google ID token server-side, then finds or creates the user.
  async googleLogin(credential: string): Promise<AuthResponse> {
    // Step 1: Verify the Google ID token
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: this.googleClientId,
      });
      payload = ticket.getPayload();
    } catch (err) {
      throw new AuthenticationError('Invalid Google token');
    }

    if (!payload || !payload.email) {
      throw new AuthenticationError('Google token missing email');
    }

    // Step 2: Extract user info from verified token
    const { email, name, sub: googleId } = payload;

    // Step 3: Find existing user by email or create a new one
    let user = await UserModel.findOne({ email });

    if (!user) {
      // Generate a unique username from email prefix
      const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const uniqueSuffix = Math.floor(Math.random() * 100000);
      user = await UserModel.create({
        username: `${baseUsername}_${uniqueSuffix}`,
        email,
        name: name || '',
        googleId,
        provider: 'google',
        role: 'user',
      });
    } else if (!user.googleId) {
      // Link Google account to existing local user
      user.googleId = googleId;
      user.provider = 'google';
      if (name && !user.name) {
        user.name = name;
      }
      await user.save();
    }

    // Step 4: Generate JWT for our app
    const token = this.generateToken({
      userId: String(user._id),
      username: user.username || user.name || 'anonymous',
      role: user.role as 'user' | 'admin',
    });

    return {
      token,
      user: {
        id: String(user._id),
        username: user.username || user.name || 'anonymous',
        email: user.email,
      },
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  private generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiry,
    } as jwt.SignOptions);
  }
}
