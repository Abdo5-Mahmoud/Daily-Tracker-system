/**
 * Challenge: Structural Design Patterns - The Adapter Pattern
 * Date: 2026-09-17
 * Author: Abdullah Mahmoud Fawzy (Abdo)
 *
 * MISSION:
 * Connect an incompatible third-party payment SDK (StripeSDK) to our core
 * e-commerce engine (OrderService) without modifying existing contracts.
 */

// ============================================================================
// 1. Existing Domain Contracts & Domain Models (DO NOT MODIFY)
// ============================================================================

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amountCharged: number;
  currency: string;
  processedAt: Date;
  errorMessage?: string;
}

export interface PaymentGateway {
  pay(amount: number): Promise<PaymentResult>;
}

export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "PaymentGatewayError";
  }
}

// ============================================================================
// 2. Existing Core Domain Service (DO NOT MODIFY)
// ============================================================================

export class OrderService {
  constructor(private readonly paymentGateway: PaymentGateway) {}

  async checkout(orderId: string, amount: number): Promise<PaymentResult> {
    console.log(
      `[OrderService] Initiating checkout for Order ${orderId} with amount: $${amount.toFixed(2)}`,
    );
    const result = await this.paymentGateway.pay(amount);

    if (!result.success) {
      console.error(
        `[OrderService] Checkout failed for Order ${orderId}: ${result.errorMessage}`,
      );
    } else {
      console.log(
        `[OrderService] Checkout SUCCESS for Order ${orderId}! Tx: ${result.transactionId}`,
      );
    }

    return result;
  }
}

// ============================================================================
// 3. External Third-Party Vendor SDK (Simulated npm package - DO NOT MODIFY)
// ============================================================================

export interface StripeChargeResponse {
  id: string;
  amount_cents: number;
  currency: string;
  status: "succeeded" | "failed";
  created: number;
}

export class StripeAPIError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "StripeAPIError";
  }
}

export class StripeSDK {
  async makePayment(
    amountInCents: number,
    currency: string,
  ): Promise<StripeChargeResponse> {
    // Vendor validation rules:
    if (!Number.isInteger(amountInCents) || amountInCents <= 0) {
      throw new StripeAPIError(
        "invalid_amount",
        `Amount must be a positive integer in cents. Received: ${amountInCents}`,
      );
    }

    if (!currency || currency.length !== 3) {
      throw new StripeAPIError(
        "invalid_currency",
        `Currency must be a 3-letter ISO code. Received: ${currency}`,
      );
    }

    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Simulated vendor response
    return {
      id: `ch_stripe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount_cents: amountInCents,
      currency: currency.toUpperCase(),
      status: "succeeded",
      created: Math.floor(Date.now() / 1000),
    };
  }
}

// ============================================================================
// 4. YOUR IMPLEMENTATION ZONE (Abdo's Code)
// ============================================================================

/**
 * Task: Implement StripePaymentAdapter.
 *
 * Requirements:
 * 1. Must implement the PaymentGateway interface.
 * 2. Injects StripeSDK and an optional/default currency into constructor.
 * 3. Converts decimal amount to integer cents safely (e.g. 19.99 -> 1999).
 * 4. Catches vendor StripeAPIError and converts it to domain PaymentResult or domain PaymentGatewayError.
 * 5. Returns a properly formatted PaymentResult.
 */
export class StripePaymentAdapter implements PaymentGateway {
  // TODO (Abdo): Add constructor, private properties, and necessary fields here.
  constructor(
    private readonly stripeSdk: StripeSDK,
    private readonly currency?: string,
  ) {}
  async pay(amount: number): Promise<PaymentResult> {
    // TODO (Abdo): Implement the adapter logic here:
    // 1. Validation (positive amount)
    if (amount <= 0) {
      throw new PaymentGatewayError("Amount must be positive.", {
        amount,
      });
    }
    // 2. Unit conversion (dollars to cents)
    const amountInCents = Math.round(amount * 100);
    // 3. Call adaptee (this.stripeSDK.makePayment(...))
    try {
      const result = await this.stripeSdk.makePayment(
        amountInCents,
        this.currency || "USD",
      );
      // 4. Transform StripeChargeResponse into PaymentResult
      return {
        success: true,
        transactionId: result.id,
        amountCharged: result.amount_cents / 100,
        currency: result.currency,
        processedAt: new Date(result.created * 1000),
      };
    } catch (error) {
      // 5. Error handling for StripeAPIError
      if (error instanceof StripeAPIError) {
        throw new PaymentGatewayError(error.message, error);
      }
      throw new PaymentGatewayError("Failed to process payment", error);
    }
  }
}

// ============================================================================
// 5. Verification Runner (Uncomment to test when implemented)
// ============================================================================

/*
async function runVerification() {
  console.log("=== Testing StripePaymentAdapter with OrderService ===\n");

  const stripeSdk = new StripeSDK();
  const adapter = new StripePaymentAdapter(stripeSdk, "USD");
  const orderService = new OrderService(adapter);

  // Test Case 1: Standard transaction ($19.99)
  const order1 = await orderService.checkout("ORD-1001", 19.99);
  console.log("Test 1 Result:", order1);

  // Test Case 2: Round dollar transaction ($50.00)
  const order2 = await orderService.checkout("ORD-1002", 50.00);
  console.log("Test 2 Result:", order2);

  // Test Case 3: Invalid amount (0 or negative)
  try {
    await orderService.checkout("ORD-1003", -5.00);
  } catch (err) {
    console.log("Test 3 Caught expected error:", err);
  }
}

runVerification();
*/
