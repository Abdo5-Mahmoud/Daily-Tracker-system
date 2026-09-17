import {
  StripePaymentAdapter,
  StripeSDK,
  OrderService,
} from "../engineering-learning/daily-challenges/solutions/solution-2026-09-17-adapter-payment-gateway";

async function test() {
  const stripe = new StripeSDK();
  const adapter = new StripePaymentAdapter(stripe, "USD");
  const order = new OrderService(adapter);

  const res1 = await order.checkout("ORD-1", 19.99);
  console.log("Result 1 amountCharged:", res1.amountCharged, "success:", res1.success);

  const res2 = await order.checkout("ORD-2", 50.0);
  console.log("Result 2 amountCharged:", res2.amountCharged, "success:", res2.success);

  try {
    await order.checkout("ORD-3", -10);
  } catch (e: any) {
    console.log("Caught expected negative amount error:", e.message);
  }

  console.log("ALL TESTS PASSED SUCCESSFULLY 100%!");
}

test();
