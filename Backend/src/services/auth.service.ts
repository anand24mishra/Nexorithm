import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.model';
import { AuthResponse, JwtPayload } from '../types';
import { AppError, ValidationError, AuthenticationError } from '../errors/AppError';

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiry: string;

  constructor(jwtSecret: string, jwtExpiry = '7d') {
    this.jwtSecret = jwtSecret;
    this.jwtExpiry = jwtExpiry;
  }

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
      username: user.username,
      role: user.role as 'user' | 'admin',
    });

    return {
      token,
      user: {
        id: String(user._id),
        username: user.username,
        email: user.email,
      },
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AuthenticationError('Invalid email or password');
    }

    const token = this.generateToken({
      userId: String(user._id),
      username: user.username,
      role: user.role as 'user' | 'admin',
    });

    return {
      token,
      user: {
        id: String(user._id),
        username: user.username,
        email: user.email,
      },
    };
  }

  private generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiry,
    } as jwt.SignOptions);
  }
}
