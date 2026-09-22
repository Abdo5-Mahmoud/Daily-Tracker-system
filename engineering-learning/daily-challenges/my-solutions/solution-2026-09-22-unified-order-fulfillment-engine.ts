/**
 * Challenge: Unified Order Fulfillment Engine 🚚⚡📡
 * Date: 2026-09-22
 * Author / Student: Abdullah Mahmoud Fawzy (Abdo)
 * Methodology: Tier 3 (Solo-Authored Implementation)
 *
 * Requirements Reference:
 * ../challenges/challenge-2026-09-22-unified-order-fulfillment-engine.md
 */

// ============================================================================
// Phase 1: Domain Entities, Models & Events Dictionary
// ============================================================================
interface Product {
  id: string;
  name: string;
  weightInGrams: number;
  description: string;
  price: number;
}
interface Order {
  id: string;
  products: Product[];
  customerName: string;
  customerPhone: string;
  address: string;
}

interface ShipmentResult {
  orderId: string;
  customerPhone: string;
  carrierName: string;
  trackingCode: string;
  etaDays: number;
}

type Events = {
  "order:shipped": ShipmentResult;
};

// ============================================================================
// Phase 2: Generic Type-Safe EventBus with Fault Isolation
// ============================================================================
type EventHandler<T> = (data: T) => void;

interface IEventBus {
  subscribe<K extends keyof Events, T = Events[K]>(
    eventName: K,
    handler: EventHandler<T>,
  ): void;
  unsubscribe<K extends keyof Events, T = Events[K]>(
    eventName: K,
    handler: EventHandler<T>,
  ): void;
  publish<K extends keyof Events, T = Events[K]>(eventName: K, data: T): void;
}

class EventBus implements IEventBus {
  private cachedHandlers = new Map<
    keyof Events,
    Array<EventHandler<Events[keyof Events]>>
  >();

  subscribe<K extends keyof Events, T = Events[K]>(
    eventName: K,
    handler: EventHandler<T>,
  ): void {
    console.log(`[EventBus]: Subscribed handler to event ${eventName}`);
    if (!this.cachedHandlers.has(eventName)) {
      this.cachedHandlers.set(eventName, []);
    }
    const handlers = this.cachedHandlers.get(eventName) || [];
    handlers.push(handler as EventHandler<Events[K]>);
  }

  unsubscribe<K extends keyof Events, T = Events[K]>(
    eventName: K,
    handler: EventHandler<T>,
  ): void {
    console.log(`[EventBus]: Unsubscribed handler from event ${eventName}`);
    if (!this.cachedHandlers.has(eventName)) {
      return;
    }
    const handlers = this.cachedHandlers.get(eventName) || [];
    const filteredHandlers = handlers.filter((h) => h !== handler);
    this.cachedHandlers.set(eventName, filteredHandlers);
  }

  publish<K extends keyof Events, T = Events[K]>(eventName: K, data: T): void {
    console.log(`[EventBus]: Publish event ${eventName}`);
    if (!this.cachedHandlers.has(eventName)) {
      return;
    }
    const handlers = this.cachedHandlers.get(eventName) || [];
    for (const handler of handlers) {
      try {
        handler(data as Events[K]);
      } catch (error) {
        console.error(
          `[EventBus]: Error in handler for event ${eventName}:`,
          error,
        );
      }
    }
  }
}

// ============================================================================
// Phase 3: Simulated Vendor SDK & Adapter Pattern (Bosta)
// ============================================================================
interface BostaSDK {
  id: string;
  customerName: string;
  customerPhone: string;
  weightInGrams: number;
  address: {
    city: string;
    district: string;
    street: string;
    buildingNumber: string;
  };
}

interface ShippingCarrier {
  shipOrder(order: Order): ShipmentResult;
}

class BostaSDKClient {
  shipOrder(bostaSDK: BostaSDK): ShipmentResult {
    console.log(`[BostaSDK]: Shipping order ${bostaSDK.id} via Bosta`);
    return {
      orderId: bostaSDK.id,
      customerPhone: bostaSDK.customerPhone,
      carrierName: "Bosta",
      trackingCode: "BOSTA-" + Math.random().toString(36).substring(2, 11).toUpperCase(),
      etaDays: 3,
    };
  }
}

class BostaShippingAdapter implements ShippingCarrier {
  private bostaSDK: BostaSDKClient;

  constructor(bostaSDK: BostaSDKClient) {
    this.bostaSDK = bostaSDK;
  }

  shipOrder(order: Order): ShipmentResult {
    const addressParts = order.address.split(",").map((part) => part.trim());

    const bostaData: BostaSDK = {
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      weightInGrams: order.products.reduce(
        (acc, product) => acc + product.weightInGrams,
        0,
      ),
      address: {
        city: addressParts[0] || "Cairo",
        district: addressParts[1] || "Default District",
        street: addressParts[2] || "Default Street",
        buildingNumber: addressParts[3] || "1",
      },
    };

    return this.bostaSDK.shipOrder(bostaData);
  }
}

// ============================================================================
// Phase 4: Carrier Strategy (Registry for Carrier Swapping)
// ============================================================================
class CarrierStrategy {
  private cachedCarriers = new Map<string, ShippingCarrier>();

  register(name: string, carrier: ShippingCarrier): void {
    this.cachedCarriers.set(name, carrier);
    console.log(`[CarrierStrategy]: Registered carrier ${name}`);
  }

  get(name: string): ShippingCarrier {
    const carrier = this.cachedCarriers.get(name);
    if (!carrier) {
      throw new Error(`[CarrierStrategy]: Carrier ${name} not found`);
    }
    return carrier;
  }
}

// ============================================================================
// Phase 5: The Orchestrator (FulfillmentEngine)
// ============================================================================
class FulfillmentEngine {
  private carrierStrategy: CarrierStrategy;
  private eventBus: EventBus;

  constructor(carrierStrategy: CarrierStrategy, eventBus: EventBus) {
    this.carrierStrategy = carrierStrategy;
    this.eventBus = eventBus;
  }

  fulfill(order: Order, carrierName: string): void {
    console.log(
      `[FulfillmentEngine]: Fulfilling order ${order.id} via ${carrierName}`,
    );
    const carrier = this.carrierStrategy.get(carrierName);
    const shippedOrderResult = carrier.shipOrder(order);
    this.eventBus.publish("order:shipped", shippedOrderResult);
  }
}

// ============================================================================
// Phase 6: Verification & Complete Simulation Flow
// ============================================================================
const shopEventsBus = new EventBus();
const bostaSDKClient = new BostaSDKClient();
const bostaShippingAdapter = new BostaShippingAdapter(bostaSDKClient);
const carrierStrategy = new CarrierStrategy();

carrierStrategy.register("Bosta", bostaShippingAdapter);
const fulfillmentEngine = new FulfillmentEngine(carrierStrategy, shopEventsBus);

shopEventsBus.subscribe("order:shipped", (data) => {
  console.log(
    `[WhatsApp Listener]: Sending shipment notification to ${data.customerPhone}`,
  );
});

shopEventsBus.subscribe("order:shipped", (data) => {
  console.log(
    `[Accounting Listener]: Recording shipment cost for order ${data.orderId}`,
  );
});

shopEventsBus.subscribe("order:shipped", (data) => {
  console.log(
    `[Faulty Listener]: Testing fault isolation with intentional exception`,
  );
  throw new Error("Simulated failure in audit log listener");
});

const sampleOrder: Order = {
  id: "ORD-123",
  customerName: "Ahmed Ali",
  customerPhone: "+201061090171",
  address: "Cairo, Nasr City, 123rd St, Building 42, Apartment 5",
  products: [
    {
      id: "P-001",
      name: "Coffee Table",
      weightInGrams: 10000,
      price: 1500,
      description: "Wooden coffee table",
    },
    {
      id: "P-002",
      name: "Vase",
      weightInGrams: 500,
      price: 200,
      description: "Ceramic vase",
    },
  ],
};

fulfillmentEngine.fulfill(sampleOrder, "Bosta");

