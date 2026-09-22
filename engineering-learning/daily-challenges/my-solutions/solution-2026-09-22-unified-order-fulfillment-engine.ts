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
  subscripe<K extends keyof Events, T = Events[K]>(
    eventName: K,
    handler: EventHandler<T>,
  ): void;
  unSubscripe<K extends keyof Events, T = Events[K]>(
    eventName: K,
    handler: EventHandler<T>,
  ): void;
  publish<K extends keyof Events, T = Events[K]>(eventName: K, data: T): void;
}

class EventBus implements IEventBus {
  private cashedHandlers = new Map<
    keyof Events,
    Array<EventHandler<Events[keyof Events]>>
  >();
  subscripe<K extends keyof Events, T = Events[K]>(
    eventName: K,
    handler: EventHandler<T>,
  ): void {
    console.log(`[EventBus]: Subscripe Handler to event ${eventName}`);
    if (!this.cashedHandlers.has(eventName)) {
      this.cashedHandlers.set(eventName, []);
    }
    const handlers = this.cashedHandlers.get(eventName) || [];
    handlers.push(handler as EventHandler<Events[K]>);
  }

  unSubscripe<K extends keyof Events, T = Events[K]>(
    eventName: K,
    handler: EventHandler<T>,
  ): void {
    console.log(`[EventBus]: UnSubscripe Handler to event ${eventName}`);
    if (!this.cashedHandlers.has(eventName)) {
      return;
    }
    const handlers = this.cashedHandlers.get(eventName) || [];
    const filteredHandlers = handlers.filter((h) => h !== handler);
    this.cashedHandlers.set(eventName, filteredHandlers);
  }
  publish<K extends keyof Events, T = Events[K]>(eventName: K, data: T): void {
    console.log(`[EventBus]: Publish event ${eventName}`);
    if (!this.cashedHandlers.has(eventName)) {
      return;
    }
    const handlers = this.cashedHandlers.get(eventName) || [];
    for (const handler of handlers) {
      try {
        handler(data as Events[K]);
      } catch (error) {
        console.error(
          `[EventBus]: Error in handler for event ${eventName}`,
          error,
        );
      }
    }
  }
}
// class EventBus

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
// using the external library SDK
class BostaSDKClient {
  shipOrder(bostaSDK: BostaSDK): ShipmentResult {
    console.log(`[BostaSDK]: Shipping order ${bostaSDK.id} via Bosta`);
    return {
      orderId: bostaSDK.id,
      customerPhone: bostaSDK.customerPhone,
      carrierName: "Bosta",
      trackingCode: "BOSTA-" + Math.random().toString(36).substr(2, 9),
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
    const bostaData: BostaSDK = {
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      weightInGrams: order.products.reduce(
        (acc, product) => acc + product.weightInGrams,
        0,
      ),
      address: {
        city: order.address.split(",")[0],
        district: order.address.split(",")[1],
        street: order.address.split(",")[2],
        buildingNumber: order.address.split(",")[3],
      },
    };
    // Usign the external library and sending the SDK
    const shippedOrderResult = this.bostaSDK.shipOrder(bostaData);
    return shippedOrderResult;
  }
}

// ============================================================================
// Phase 4: Carrier Strategy (Registry for Carrier Swapping)
// ============================================================================
class CarrierStrategy {
  private cashedCarriers = new Map<string, ShippingCarrier>();
  register(name: string, carrier: ShippingCarrier): void {
    this.cashedCarriers.set(name, carrier);
    console.log(`[CarrierStrategy]: Registered carrier ${name}`);
  }
  get(name: string): ShippingCarrier {
    const carrier = this.cashedCarriers.get(name);
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
shopEventsBus.subscripe("order:shipped", (data) => {
  console.log(
    `[WhatsApp Listener]: Sending shipment notification to ${data.customerPhone}`,
  );
});
shopEventsBus.subscripe("order:shipped", (data) => {
  console.log(
    `[Accounting Listener]: Recording shipment cost for order ${data.orderId}`,
  );
});
shopEventsBus.subscripe("order:shipped", (data) => {
  console.log(
    `[Faulty Listener]: This will throw an error to test fault isolation`,
  );
  throw new Error("Failed to record shipment cost");
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
