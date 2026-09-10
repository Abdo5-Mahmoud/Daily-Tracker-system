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
async function hashPassword(password: string, salt: string): Promise<string> {
  return await Promise.resolve(`${password}_${salt}`);
}
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
  if (!rawBody || typeof rawBody !== "object") {
    throw new Error("Invalid Request Body", { cause: { statusCode: 400 } });
  }
  const body = rawBody as Partial<RegisterUserInput>;
  if (!body.email || !body.password) {
    throw new Error("Email and password are required", {
      cause: { statusCode: 400 },
    });
  }
  return body as RegisterUserInput;
}

// ==========================================
// 3. Layer 2: Password Security Hasher
// ==========================================
export class BcryptPasswordHasher implements PasswordHasher {
  salt = "random_salt_123";

  async hash(password: string): Promise<string> {
    const hashedPassword = hashPassword(password, this.salt);

    return hashedPassword;
  }
}

// ==========================================
// 4. Layer 3: User Repository (Data Access)
// ==========================================
export class InMemoryUserRepository implements UserRepository {
  private users: UserRecord[] = [];

  async findByEmail(email: string): Promise<UserRecord | null> {
    // TODO: Implement user search
    const user = this.users.find((u) => u.email === email);
    if (!user) {
      return null;
    }
    return user;
  }

  async create(data: {
    email: string;
    passwordHash: string;
  }): Promise<UserRecord> {
    // TODO: Implement user creation
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new Error("User already exists", { cause: { statusCode: 409 } });
    }
    const newUser: UserRecord = {
      id: crypto.randomUUID(),
      email: data.email,
      passwordHash: data.passwordHash,
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }
}

const memoryUsers = new InMemoryUserRepository();
// ==========================================
// 5. Layer 4: Notification (Email Service)
// ==========================================
export class NodemailerEmailService implements EmailService {
  async sendWelcomeEmail(toEmail: string): Promise<void> {
    // TODO: Implement email sending logic
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (!toEmail) {
      throw new Error("Email is required", { cause: { toEmail } });
    }
    console.log(`Welcome email sent to ${toEmail}`);
  }
}

// ==========================================
// 6. Layer 5: Business Orchestration Service
// ==========================================
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private hasher: PasswordHasher,
    private emailService: EmailService,
  ) {}

  async register(input: RegisterUserInput): Promise<UserRecord> {
    // TODO:
    // 1. Check duplicate email via userRepo

    const { email, password } = input;
    try {
      const existingUser = await this.userRepo.findByEmail(email);
      if (existingUser) {
        throw new Error("User already exists", {
          cause: { statusCode: 409 },
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
    }
    // 2. Hash password via hasher
    const hashedPassword = await this.hasher.hash(password);
    // 3. Persist user via userRepo
    const newUser = await this.userRepo.create({
      email,
      passwordHash: hashedPassword,
    });
    // 4. Dispatch welcome email with isolated error handling (do not fail registration if email fails!)
    after(async () => {
      try {
        this.emailService.sendWelcomeEmail(email);
      } catch (error) {
        if (error instanceof Error) {
          //TODO: log the error
          console.error("Error sending welcome email:", error);
        }
      }
    });
    // 5. Return created user
    return newUser;
  }
}

// ==========================================
// 7. Layer 6: Route Controller (POST Handler)
// ==========================================
export async function POST(req: Request): Promise<Response> {
  // TODO:
  // 1. Parse JSON body
  const data = await req.json();
  // create new instances of the services and repositories
  const hasher = new BcryptPasswordHasher();
  const emailService = new NodemailerEmailService();
  const userService = new UserService(memoryUsers, hasher, emailService);
  // 2. Validate input
  try {
    const input = validateRegisterInput(data);
    // 3. Delegate to UserService
    const newUser = await userService.register(input);
    return new Response(JSON.stringify(newUser), {
      status: 201,
    });
  } catch (error) {
    // 4. Return Response with status 201 on success, 400 on validation error, 409 on duplicate, 500 on unexpected error
    if (error instanceof Error) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: (error.cause as { statusCode: number })?.statusCode || 500,
      });
    }
  }
  throw new Error("Not implemented");
}
