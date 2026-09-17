/**
 * Challenge: Liskov Substitution Principle (LSP) - Safe Refund Processing
 * Date: 2026-09-13
 * Author: Abdullah Mahmoud (Abdo)
 *
 * MISSION:
 * Build your solution from scratch here:
 * 1. Define your own data models / interfaces for orders and refunds.
 * 2. Design segregated contracts (capabilities) so non-refundable gateways NEVER break consumers.
 * 3. Implement concrete classes (e.g. CreditCard, PayPal, CashOnDelivery).
 * 4. Implement a consumer (Refund worker or service) that contractually accepts ONLY refundable gateways.
 * 5. Demonstrate behavioral compatibility (substituting one gateway for another seamlessly).
 */

// Start coding your solution from scratch below:

interface RefundRequest {
  orderId: string;
  transactionId: string;
  amount: number;
  reason: string;
}

interface RefundResult {
  success: boolean;
  refundId: string;
  processedAt: Date;
  errorMessage?: string;
}

interface ChargeableGateway {
  readonly gateway: string;
  charge(amount: number): Promise<{
    success: boolean;
    transactionId: string;
  }>;
}

interface RefundableGateway {
  readonly gateway: string;
  refund(request: RefundRequest): Promise<RefundResult>;
}

class CreditCardGateway implements ChargeableGateway, RefundableGateway {
  readonly gateway: string = "CreditCard";
  charge(amount: number): Promise<{ success: boolean; transactionId: string }> {
    return Promise.resolve({ success: true, transactionId: "1" });
  }
  refund(request: RefundRequest): Promise<RefundResult> {
    return Promise.resolve({
      success: true,
      refundId: "1",
      processedAt: new Date(),
    });
  }
}

class PayPalGatway implements ChargeableGateway, RefundableGateway {
  readonly gateway: string = "PayPal";
  charge(amount: number): Promise<{ success: boolean; transactionId: string }> {
    return Promise.resolve({ success: true, transactionId: "1" });
  }
  refund(request: RefundRequest): Promise<RefundResult> {
    return Promise.resolve({
      success: true,
      refundId: "1",
      processedAt: new Date(),
    });
  }
}

class CahshOnDeliveryGateway implements ChargeableGateway {
  readonly gateway: string = "CahshOnDelivery";
  charge(amount: number): Promise<{ success: boolean; transactionId: string }> {
    return Promise.resolve({ success: true, transactionId: "1" });
  }
}

class RefundBatchWorker {
  async processRefunds(
    gateway: RefundableGateway,
    requests: RefundRequest[],
  ): Promise<RefundResult[]> {
    const results: RefundResult[] = [];
    for (const req of requests) {
      const result = await gateway.refund(req);
      results.push(result);
    }
    return results;
  }
}

const worker = new RefundBatchWorker();
worker.processRefunds(new CreditCardGateway(), [
  {
    orderId: "1",
    transactionId: "1",
    amount: 100,
    reason: "refund",
  },
]);
worker.processRefunds(new PayPalGatway(), [
  {
    orderId: "1",
    transactionId: "1",
    amount: 100,
    reason: "refund",
  },
]);
// as we see type script thrown an error because we seperate the capabilities
// expect-error - Compile-time proof: CashOnDelivery is not refundable
worker.processRefunds(new CahshOnDeliveryGateway(), [
  {
    orderId: "1",
    transactionId: "1",
    amount: 100,
    reason: "refund",
  },
]);
