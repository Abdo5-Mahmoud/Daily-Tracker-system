/**
 * Daily Challenge: Open/Closed Principle (OCP) - Extensible Payment Gateway
 * Date: 2026-09-11
 *
 * MISSION:
 * Build an extensible payment system where new payment providers can be added
 * without modifying existing classes or the checkout service.
 */

// 1. Data Models & Domain Interfaces
export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: "EGP" | "USD";
  customerEmail: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  provider: string;
  timestamp: Date;
  errorMessage?: string;
}

// 2. The Strategy Contract (The Abstraction)
export interface PaymentStrategy {
  readonly providerKey: string;
  processPayment(order: PaymentOrder): Promise<PaymentResult>;
}

// ============================================================================
// STEP 1: Implement Concrete Strategies
// (CreditCardProcessor, FawryProcessor, VodafoneCashProcessor)
// ============================================================================

export class CreditCardProcessor implements PaymentStrategy {
  readonly providerKey = "credit_card";

  async processPayment(order: PaymentOrder): Promise<PaymentResult> {
    // Simulate credit card processing logic
    return {
      success: true,
      transactionId: `tx_cc_${Date.now()}`,
      provider: this.providerKey,
      timestamp: new Date(),
    };
  }
}

export class FawryProcessor implements PaymentStrategy {
  readonly providerKey = "fawry";

  async processPayment(order: PaymentOrder): Promise<PaymentResult> {
    // Simulate Fawry reference code generation
    return {
      success: true,
      transactionId: `tx_fawry_${Date.now()}`,
      provider: this.providerKey,
      timestamp: new Date(),
    };
  }
}

export class VodafoneCashProcessor implements PaymentStrategy {
  readonly providerKey = "vodafone_cash";

  async processPayment(order: PaymentOrder): Promise<PaymentResult> {
    // Simulate Vodafone Cash wallet prompt
    return {
      success: true,
      transactionId: `tx_vfc_${Date.now()}`,
      provider: this.providerKey,
      timestamp: new Date(),
    };
  }
}

// ============================================================================
// STEP 2: The Extensible Registry (The OCP Engine)
// Stores strategies and resolves them dynamically.
// ============================================================================

export class PaymentRegistry {
  private strategies = new Map<string, PaymentStrategy>();

  public register(strategy: PaymentStrategy): void {
    // TODO (Abdo): Register the strategy using its providerKey
  }

  public get(providerKey: string): PaymentStrategy {
    // TODO (Abdo): Retrieve the strategy.
    // Edge case guard: If not found, throw an explicit Error!
    throw new Error("Not implemented yet");
  }
}

// ============================================================================
// STEP 3: The Orchestrator (CheckoutService)
// Depends purely on the abstraction and the registry.
// ZERO knowledge of specific providers!
// ============================================================================

export class CheckoutService {
  constructor(private registry: PaymentRegistry) {}

  public async checkout(
    order: PaymentOrder,
    paymentMethod: string
  ): Promise<PaymentResult> {
    // TODO (Abdo):
    // 1. Resolve strategy from registry
    // 2. Execute processPayment
    // 3. Return result
    throw new Error("Not implemented yet");
  }
}

// ============================================================================
// STEP 4: The OCP Verification (Extension without Modification)
// Add Instapay purely by extension!
// ============================================================================

export class InstapayProcessor implements PaymentStrategy {
  readonly providerKey = "instapay";

  async processPayment(order: PaymentOrder): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `tx_insta_${Date.now()}`,
      provider: this.providerKey,
      timestamp: new Date(),
    };
  }
}
