/**
 * Daily Challenge: Liskov Substitution Principle (LSP) - Safe Refund Processing
 * Date: 2026-09-13
 *
 * MISSION:
 * Refactor a fragile payment system that threw runtime errors when substituting
 * non-refundable payment gateways into a strictly typed, LSP-compliant architecture.
 */

// ============================================================================
// 1. Data Models
// ============================================================================

export interface RefundRequest {
  orderId: string;
  transactionId: string;
  amount: number;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  processedAt: Date;
  errorMessage?: string;
}

// ============================================================================
// 2. Segregated Behavioral Contracts (LSP Foundation)
// ============================================================================

export interface ChargeableGateway {
  readonly gatewayName: string;
  charge(amount: number): Promise<{ success: boolean; transactionId: string }>;
}

export interface RefundableGateway {
  readonly gatewayName: string;
  refund(request: RefundRequest): Promise<RefundResult>;
}

// ============================================================================
// 3. Concrete Implementations
// ============================================================================

export class CreditCardGateway implements ChargeableGateway, RefundableGateway {
  readonly gatewayName = "CreditCard";

  async charge(amount: number): Promise<{ success: boolean; transactionId: string }> {
    return { success: true, transactionId: `cc_tx_${Date.now()}` };
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    return {
      success: true,
      refundId: `cc_ref_${Date.now()}`,
      processedAt: new Date(),
    };
  }
}

export class PayPalGateway implements ChargeableGateway, RefundableGateway {
  readonly gatewayName = "PayPal";

  async charge(amount: number): Promise<{ success: boolean; transactionId: string }> {
    return { success: true, transactionId: `pp_tx_${Date.now()}` };
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    return {
      success: true,
      refundId: `pp_ref_${Date.now()}`,
      processedAt: new Date(),
    };
  }
}

// This gateway CANNOT be refunded online.
// Notice it does NOT implement RefundableGateway!
// No throwing "Not implemented", no fake methods.
export class CashOnDeliveryGateway implements ChargeableGateway {
  readonly gatewayName = "CashOnDelivery";

  async charge(amount: number): Promise<{ success: boolean; transactionId: string }> {
    return { success: true, transactionId: `cod_tx_${Date.now()}` };
  }
}

// ============================================================================
// 4. The Safe Consumer (LSP in Action)
// ============================================================================

export class RefundBatchWorker {
  /**
   * Processes refunds for a batch of requests.
   * Notice: It accepts ONLY a RefundableGateway!
   * Any subtype of RefundableGateway can be safely substituted here
   * without ANY risk of runtime failure.
   */
  async processRefunds(
    gateway: RefundableGateway,
    requests: RefundRequest[]
  ): Promise<RefundResult[]> {
    const results: RefundResult[] = [];

    for (const req of requests) {
      const result = await gateway.refund(req);
      results.push(result);
    }

    return results;
  }
}

// ============================================================================
// 5. Verification Demo (Abdo can run and test)
// ============================================================================

async function runLspVerification() {
  const worker = new RefundBatchWorker();
  const requests: RefundRequest[] = [
    { orderId: "ORD-1", transactionId: "tx-1", amount: 150, reason: "Defective item" },
    { orderId: "ORD-2", transactionId: "tx-2", amount: 300, reason: "Customer return" },
  ];

  // 1. Substitute CreditCardGateway
  const ccResults = await worker.processRefunds(new CreditCardGateway(), requests);
  console.log("CreditCard refunds:", ccResults);

  // 2. Substitute PayPalGateway seamlessly (LSP proof: 100% interchangeable!)
  const ppResults = await worker.processRefunds(new PayPalGateway(), requests);
  console.log("PayPal refunds:", ppResults);

  // 3. Compile-time guard verification:
  // The line below should throw a TypeScript compilation error if uncommented:
  // worker.processRefunds(new CashOnDeliveryGateway(), requests);
  // (Argument of type 'CashOnDeliveryGateway' is not assignable to parameter of type 'RefundableGateway')
}

// Run verification if executed directly
if (process.env.NODE_ENV !== "test") {
  runLspVerification().catch(console.error);
}
