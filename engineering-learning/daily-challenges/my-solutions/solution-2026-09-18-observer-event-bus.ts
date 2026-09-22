/**
 * Challenge: Event-Driven Order Processing with Observer Pattern 📡⚡
 * Date: 2026-09-18
 * Author / Student: Abdullah Mahmoud Fawzy (Abdo)
 * Methodology: Tier 3 (Solo-Authored Implementation)
 *
 * Requirements Reference:
 * ../challenges/challenge-2026-09-18-observer-event-bus.md
 */

// ============================================================================
// Phase 1: Domain Entities & Event Payloads
// ============================================================================
type Product = {
  productId: string;
  name: string;
  price: number;
  count: number;
};
type Order = {
  orderId: string;
  customerName: string;
  customerPhone: number;
  totalAmount: number;
  items: Product[];
};

// ============================================================================
// Phase 2: EventBus Contract (Interfaces & Types)
// ============================================================================
type ShopEvents = {
  "order:placed": Order;
  "stock:low": { productId: string; remainingCount: number };
};
type EventHandler<T> = (data: T) => void;

type IEventBus = {
  subscribe<K extends keyof ShopEvents>(
    eventName: K,
    handler: EventHandler<ShopEvents[K]>,
  ): void;
  unsubscribe<K extends keyof ShopEvents>(
    eventName: K,
    handler: EventHandler<any>,
  ): void;
  publish<K extends keyof ShopEvents>(eventName: K, data: ShopEvents[K]): void;
};

// ============================================================================
// Phase 3: The Concrete EventBus Class Implementation
// ============================================================================
class EventBus implements IEventBus {
  cachedEvents = new Map<K extends keyof ShopEvents, Function[]>();

  subscribe<K extends keyof ShopEvents>(
    eventName: K,
    handler: EventHandler<ShopEvents[K]>,
  ): void {
    if (!this.cachedEvents.has(eventName)) {
      this.cachedEvents.set(eventName, [handler]);
    } else {
      this.cachedEvents.get(eventName)?.push(handler);
    }
  }
  unsubscribe<K extends keyof ShopEvents>(
    eventName: K,
    handler: EventHandler<ShopEvents[K]>,
  ): void {
    if (!this.cachedEvents.has(eventName)) return;
    const handlers = this.cachedEvents.get(eventName);
    if (!handlers) return;
    this.cachedEvents.set(
      eventName,
      handlers.filter((h) => h !== handler),
    );
  }
  publish<K extends keyof ShopEvents>(eventName: K, data: ShopEvents[K]) {
    if (this.cachedEvents.has(eventName)) {
      const handlers = this.cachedEvents.get(eventName);
      if (!handlers) return;
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (err) {
          console.log(`[${eventName}] handler failed:`, err);
        }
      }
    }
  }
}
// ============================================================================
// Phase 4: Independent Domain Listeners (WhatsApp, Stock, Faulty Listener)
// ============================================================================
const whatsAppListener: EventHandler<Order> = (order) => {
  console.log("WhatsApp: " + order.customerName);
};

const stockListener: EventHandler<{
  productId: string;
  remainingCount: number;
}> = ({ productId, remainingCount }) => {
  console.log(`Stock: ${productId} - ${remainingCount}`);
};

const faultyListener: EventHandler<{
  productId: string;
  remainingCount: number;
}> = (order) => {
  throw new Error("Faulty listener");
};
// ============================================================================
// Phase 5: Verification & Simulation (Run & Test Scenarios)
// ============================================================================

const eventBus = new EventBus();
const sampleOrder: Order = {
  orderId: "ORD-101",
  customerName: "Abdullah",
  customerPhone: 1012345678,
  totalAmount: 1500,
  items: [{ productId: "P-1", name: "Crystal Vase", price: 1500, count: 10 }],
};
eventBus.subscribe("order:placed", whatsAppListener);
eventBus.subscribe("stock:low", stockListener);
eventBus.subscribe("stock:low", faultyListener);
eventBus.publish("order:placed", sampleOrder);
eventBus.publish("stock:low", { productId: "P-1", remainingCount: 2 });
