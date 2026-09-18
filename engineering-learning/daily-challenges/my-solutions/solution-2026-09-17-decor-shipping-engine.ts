/**
 * Challenge: Decor Store Shipping & Tracking Engine
 * Date: 2026-09-17
 * Author: Abdullah Mahmoud Fawzy (Abdo)
 * Mentor: Blue (بلو)
 *
 * MISSION:
 * Design and implement the shipping, adapter, carrier, and notification subsystem
 * from scratch based on the requirements in:
 * challenges/challenge-2026-09-17-decor-shipping-engine.md
 */

// ============================================================================
// Phase 1: Domain Entities, Value Objects & Types
// ============================================================================

// [GUIDE]: You started great here!
// Ask: What does an order and product look like in our shop?
export type Product = {
  name: string;
  weight: number; // in Kilograms
  price: number;
};

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: Product[];
  address: string; // single line address from customer
  paymentMethod: "COD" | "prepaid";
  codAmount?: number;
}

// [GUIDE]: What result does our domain expect back when shipping succeeds?
export interface ShipmentResult {
  // TODO: Add success, trackingCode, carrierName, estimatedDays, etc.
  success: boolean;
  awb: string;
  carrierName: string;
  estimatedDays: number;
  trackingCode: string;
}

// ============================================================================
// Phase 2: Unified Contracts & Interfaces (Internal Domain)
// ============================================================================

// [GUIDE]: This is the contract our OrderService will talk to.
// Notice: It should NOT mention Bosta or Aramex! It represents any shipping carrier.
export interface ShippingCarrier {
  // TODO: What method does any shipping company need?
  // Hint: shipOrder(order: Order): Promise<ShipmentResult>;
  shipOrder(order: Order): Promise<ShipmentResult>;
}

// ============================================================================
// Phase 3: Simulated External Vendor SDK (Bosta Shipping SDK)
// ============================================================================

// [GUIDE]: This is Bosta's private world.
// Notice: Bosta expects address as an object, and weight in grams!
export interface BostaAddress {
  city: string;
  district: string;
  street: string;
  buildingNumber: string;
}

export interface BostaPackageRequest {
  weightInGrams: number;
  receiverAddress: BostaAddress;
  codAmountInPiasters: number;
}

export class BostaSDK {
  async createDelivery(
    payload: BostaPackageRequest,
  ): Promise<{ awb: string; etaDays: number }> {
    console.log(
      "[BostaSDK] Processing delivery in grams:",
      payload.weightInGrams,
    );
    return {
      awb: `BST-${Date.now()}`,
      etaDays: 2,
    };
  }
}

// ============================================================================
// Phase 4: Adapters & Pattern Implementations
// ============================================================================
class BostaShippingAdapter implements ShippingCarrier {
  constructor(private bostaSdk: BostaSDK) {}
  async shipOrder(order: Order): Promise<ShipmentResult> {
    console.log("[bostaAdapter] Processing order:", order.id);
    const totalWeights = order.items.reduce(
      (acc, item) => acc + item.weight,
      0,
    );
    const totalWeightsInGrams = totalWeights * 1000;
    const [street, district, city, buildingNumber] = order.address
      .split(",")
      .map((item) => item.trim());
    const bostaAddress: BostaAddress = {
      city,
      district,
      street,
      buildingNumber,
    };
    const bostaRequest: BostaPackageRequest = {
      weightInGrams: totalWeightsInGrams,
      receiverAddress: bostaAddress,
      codAmountInPiasters: (order.codAmount || 0) * 100,
    };
    const result = await this.bostaSdk.createDelivery(bostaRequest);
    return {
      success: true,
      awb: result.awb,
      carrierName: "Bosta",
      estimatedDays: result.etaDays,
      trackingCode: result.awb,
    };
  }
}
// [GUIDE]:
// 1. The Adapter: BostaShippingAdapter implements ShippingCarrier.
//    - It receives BostaSDK.
//    - It calculates total weight of items (kg -> grams).
//    - It converts the single string address into BostaAddress.
//    - It calls bostaSDK.createDelivery().
//    - It returns our domain ShipmentResult.

// 2. The Carrier Swapping (Strategy / Registry):
//    - How will OrderService pick between Bosta and Aramex in the future?
class SwappingStrategy {
  private shippingMap = new Map<string, ShippingCarrier>();

  public registerCarrier(name: string, carrier: ShippingCarrier): void {
    this.shippingMap.set(name, carrier);
  }

  public getCarrier(name: string): ShippingCarrier {
    const carrier = this.shippingMap.get(name) as ShippingCarrier;
    if (!carrier) throw new Error(`${name} Shipping carrier not found`);
    return carrier;
  }
}
// ============================================================================
// Phase 5: Notification Service & Orchestration
// ============================================================================

// [GUIDE]:
// 1. Single Responsibility: WhatsAppNotificationService
export interface NotificationService {
  sendShipmentNotification(
    order: Order,
    shipmentResult: ShipmentResult,
  ): Promise<void>;
}
class WhatsAppNotificationService implements NotificationService {
  async sendShipmentNotification(order: Order, shipmentResult: ShipmentResult) {
    console.log(
      `[WhatsApp] Sending shipment notification for order ${order.id}`,
    );
    console.log(`[WhatsApp] Tracking code: ${shipmentResult.trackingCode}`);
    console.log(`[WhatsApp] Carrier: ${shipmentResult.carrierName}`);
    console.log(`[WhatsApp] Estimated days: ${shipmentResult.estimatedDays}`);
  }
}
// 2. The Orchestrator: FulfillmentService (coordinates shipping carrier + notification)

class FulfillmentService {
  constructor(
    private swappingStrategy: SwappingStrategy,
    private notificationService: WhatsAppNotificationService,
  ) {}
  async shipOrder(order: Order, carrier: string) {
    console.log(`[Fulfillment] Starting shipment for order ${order.id}`);
    const shipmentCarrier = this.swappingStrategy.getCarrier(carrier);
    const shipmentResult = await shipmentCarrier.shipOrder(order);
    this.notificationService
      .sendShipmentNotification(order, shipmentResult)
      .catch((err) => {
        console.log(
          `[Fulfillment] Error sending notification for order ${order.id}`,
          err,
        );
      });
    return shipmentResult;
  }
}
