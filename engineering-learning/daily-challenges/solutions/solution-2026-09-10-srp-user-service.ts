/**
 * Daily Challenge: Single Responsibility Principle (SRP)
 * Date: 2026-09-10
 * Author: Abdullah Mahmoud (Abdo)
 *
 * Instructions:
 * Implement the 4 decoupled layers below to prove mastery of SRP and Clean Architecture.
 * Ensure the email notification failure does not break the HTTP 201 Created response.
 */

// ==========================================
// 1. Interfaces & Types
// ==========================================
export interface RegisterUserInput {
  email: string;
  password: string;
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  create(data: { email: string; passwordHash: string }): Promise<UserRecord>;
}

export interface EmailService {
  sendWelcomeEmail(toEmail: string): Promise<void>;
}

// ==========================================
// 2. Layer 1: Input Validation
// ==========================================
export function validateRegisterInput(rawBody: unknown): RegisterUserInput {
  // TODO: Implement validation (check email format and password min length)
  throw new Error("Not implemented");
}

// ==========================================
// 3. Layer 2: Password Security Hasher
// ==========================================
export class BcryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    // TODO: Implement mock or real hashing logic
    throw new Error("Not implemented");
  }
}

// ==========================================
// 4. Layer 3: User Repository (Data Access)
// ==========================================
export class InMemoryUserRepository implements UserRepository {
  private users: UserRecord[] = [];

  async findByEmail(email: string): Promise<UserRecord | null> {
    // TODO: Implement user search
    throw new Error("Not implemented");
  }

  async create(data: { email: string; passwordHash: string }): Promise<UserRecord> {
    // TODO: Implement user creation
    throw new Error("Not implemented");
  }
}

// ==========================================
// 5. Layer 4: Notification (Email Service)
// ==========================================
export class NodemailerEmailService implements EmailService {
  async sendWelcomeEmail(toEmail: string): Promise<void> {
    // TODO: Implement email sending logic
    throw new Error("Not implemented");
  }
}

// ==========================================
// 6. Layer 5: Business Orchestration Service
// ==========================================
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private hasher: PasswordHasher,
    private emailService: EmailService
  ) {}

  async register(input: RegisterUserInput): Promise<UserRecord> {
    // TODO:
    // 1. Check duplicate email via userRepo
    // 2. Hash password via hasher
    // 3. Persist user via userRepo
    // 4. Dispatch welcome email with isolated error handling (do not fail registration if email fails!)
    // 5. Return created user
    throw new Error("Not implemented");
  }
}

// ==========================================
// 7. Layer 6: Route Controller (POST Handler)
// ==========================================
export async function POST(req: Request): Promise<Response> {
  // TODO:
  // 1. Parse JSON body
  // 2. Validate input
  // 3. Delegate to UserService
  // 4. Return Response with status 201 on success, 400 on validation error, 409 on duplicate, 500 on unexpected error
  throw new Error("Not implemented");
}
