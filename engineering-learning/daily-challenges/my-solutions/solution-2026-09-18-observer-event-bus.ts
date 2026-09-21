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
type EventHandler = (data: Order) => void;

interface IEventBus {
  subscribe(eventName: string, handler: EventHandler): void;
  unsubscribe(eventName: string, handler: EventHandler): void;
  publish(eventName: string, data: Order): void;
}
// ============================================================================
// Phase 3: The Concrete EventBus Class Implementation
// ============================================================================
class EventBus implements IEventBus {
  cachedEvents = new Map<string, EventHandler[]>();

  subscribe(eventName: string, handler: EventHandler): void {
    if (!this.cachedEvents.has(eventName)) {
      this.cachedEvents.set(eventName, [handler]);
    } else {
      this.cachedEvents.get(eventName)?.push(handler);
    }
  }
  unsubscribe(eventName: string, handler: EventHandler): void {
    if (!this.cachedEvents.has(eventName)) return;
    const handlers = this.cachedEvents.get(eventName);
    if (!handlers) return;
    this.cachedEvents.set(
      eventName,
      handlers.filter((h) => h !== handler),
    );
  }
  publish(eventName: string, order: Order) {
    if (this.cachedEvents.has(eventName)) {
      const handlers = this.cachedEvents.get(eventName);
      if (!handlers) return;
      for (const handler of handlers) {
        try {
          handler(order);
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
const whatsAppListener: EventHandler = (order) => {
  console.log("WhatsApp: " + order.customerName);
};

const stockListener: EventHandler = (order) => {
  console.log("Stock: " + order.customerName);
};

const faultyListener: EventHandler = (order) => {
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
  items: [{ productId: "P-1", name: "Crystal Vase", price: 1500 }],
};
eventBus.subscribe("order:placed", whatsAppListener);
eventBus.subscribe("order:placed", stockListener);
eventBus.subscribe("order:placed", faultyListener);
eventBus.publish("order:placed", sampleOrder);
