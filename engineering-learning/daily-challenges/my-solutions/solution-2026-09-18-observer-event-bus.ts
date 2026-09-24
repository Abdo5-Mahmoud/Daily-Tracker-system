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
type EventMap = Record<string, any>;
type EventHandler<T> = (data: T) => void;

interface IEventBus<T extends EventMap> {
  subscribe<K extends keyof T>(
    eventName: K,
    handler: EventHandler<T[K]>,
  ): () => void;
  unsubscribe<K extends keyof T>(
    eventName: K,
    handler: EventHandler<T[K]>,
  ): void;
  publish<K extends keyof T>(eventName: K, data: T[K]): void;
}

// ============================================================================
// Phase 3: The Concrete EventBus Class Implementation
// ============================================================================
class EventBus<T extends EventMap> implements IEventBus<T> {
  private listeners = new Map<keyof T, Set<EventHandler<any>>>();

  subscribe<K extends keyof T>(
    eventName: K,
    handler: EventHandler<T[K]>,
  ): () => void {
    const handlers = this.listeners.get(eventName);
    if (handlers) handlers.add(handler);
    else this.listeners.set(eventName, new Set([handler]));

    return () => this.unsubscribe(eventName, handler);
  }
  unsubscribe<K extends keyof T>(
    eventName: K,
    handler: EventHandler<T[K]>,
  ): void {
    const handlers = this.listeners.get(eventName);
    handlers?.delete(handler);
    if (handlers?.size === 0) this.listeners.delete(eventName);
  }
  publish<K extends keyof T>(eventName: K, data: T[K]) {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (err) {
          console.log(`[${String(eventName)}] handler failed:`, err);
        }
      }
    }
  }
}
// ============================================================================
// Phase 4: Independent Domain listeners (WhatsApp, Stock, Faulty Listener)
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

const shopEventBus = new EventBus<ShopEvents>();
const sampleOrder: Order = {
  orderId: "ORD-101",
  customerName: "Abdullah",
  customerPhone: 1012345678,
  totalAmount: 1500,
  items: [{ productId: "P-1", name: "Crystal Vase", price: 1500, count: 10 }],
};
shopEventBus.subscribe("order:placed", whatsAppListener);
shopEventBus.subscribe("stock:low", stockListener);
shopEventBus.subscribe("stock:low", faultyListener);
shopEventBus.publish("order:placed", sampleOrder);
shopEventBus.publish("stock:low", { productId: "P-1", remainingCount: 2 });
