/**
 * Evening Mental Challenge: Class Design & Naming Intuition
 * Date: 2026-09-10
 * Author: Abdullah Mahmoud (Abdo)
 *
 * Instructions:
 * Write your thought process in comments, then write the interfaces
 * and class skeletons for each exercise below.
 * Don't worry about complete implementation logic—focus on:
 * 1. Single Responsibility of each actor.
 * 2. Intuitive, professional naming conventions.
 * 3. Clean input/output contracts.
 */

// ============================================================================
// 🧩 Exercise 1: The E-Commerce Discount Engine
// ============================================================================

// 1. Write the shared discount interface here:
// export interface ...

// هنا حسبتها على اساس ان هاحد السعر بس مش المنتجات لو المنتجات فهنعمل لووب عليها ونطلع التوتال لو مش موجود ولو موجود هنستخدمه عل طول
interface DiscountStrategy {
  calculateDiscount(price: number): number;
}

// 2. Write the 3 concrete class skeletons:
// export class PercentageDiscount ...
export class PercentageDiscount implements DiscountStrategy {
  readonly discount = 0.1; // 10%
  calculateDiscount(price: number) {
    return price - this.discount * price;
  }
}

// export class FixedAmountDiscount ...
export class FixedAmountDiscount implements DiscountStrategy {
  readonly discount: number = 50;
  calculateDiscount(price: number): number {
    return price - this.discount;
  }
}
// export class BuyOneGetOneDiscount ...
export class BuyOneGetOneDiscount implements DiscountStrategy {
  calculateDiscount(price: number): number {
    return price / 2;
  }
}
// 3. Write the orchestrator service class:
// export class CheckoutService (or DiscountService) ...

export class CheckoutService {
  constructor(private strategy: DiscountStrategy) {}
  public applyDiscount(price: number): number {
    return this.strategy.calculateDiscount(price);
  }
}
// ============================================================================
// 🧩 Exercise 2: The Multi-Channel Notification Dispatcher
// ============================================================================

// 1. Write the shared notification interface here:
// export interface NotificationProvider ...
export interface NotificationProvider {
  sendNotification(message: string): void;
}
// 2. Write the concrete provider classes:
// export class EmailNotificationProvider ...
export class EmailNotificationProvider implements NotificationProvider {
  sendNotification(message: string): void {
    console.log(`Email has been sent: ${message}`);
  }
}
// export class SmsNotificationProvider ...
export class SmsNotificationProvider implements NotificationProvider {
  sendNotification(message: string): void {
    console.log(`Sms has been sent: ${message}`);
  }
}
// 3. Write the dispatcher/orchestrator class:
// export class NotificationDispatcher (or OrderNotificationService) ...
// هنا ليه عملنا لووب لانك قولت هتبعت مسدج email and sms وبعد شهر هنبعت wathsapp and pushNotification
// وبم ان اللوجيك واحد حسب الكونتراكت واحنا عارفين الريترن من ال abstract action already known so i can use for loop

export class OrderNotificationService {
  constructor(private providers: NotificationProvider[]) {}
  sendNotification(message: string) {
    this.providers.forEach((provider) => provider.sendNotification(message));
  }
}
// ============================================================================
// 🧩 Exercise 3: The Profile Avatar Upload Pipeline
// ============================================================================

// 1. Validator:
export interface ImageFile {
  filename: string;
  mimetype: string;
  size: number;
  buffer: ArrayBuffer;
}
export interface ImageValidator {
  validate(file: ImageFile): boolean;
}

// 2. Compressor/Processor:
export interface ImageProcessor {
  compress(buffer: ArrayBuffer): Promise<ArrayBuffer>;
}

// 3. Cloud Storage Uploader:
export interface StorageUploader {
  upload(buffer: ArrayBuffer, filename: string): Promise<string>;
}

// 4. Data Access (User Repository):
export interface UserRepository {
  save(userId: string, avatarUrl: string): Promise<void>;
}

// 5. The Main Orchestrator Service:
export class AvatarUploadService {
  constructor(
    private validator: ImageValidator,
    private processor: ImageProcessor,
    private uploader: StorageUploader,
    private repo: UserRepository,
  ) {}
  async upload(file: ImageFile, userId: string) {
    if (!this.validator.validate(file))
      throw new Error("Image validation failed");

    const compressedImageBuffer = await this.processor.compress(file.buffer);
    const avatarUrl = await this.uploader.upload(
      compressedImageBuffer,
      file.filename,
    );
    await this.repo.save(userId, avatarUrl);

    return avatarUrl;
  }
}
