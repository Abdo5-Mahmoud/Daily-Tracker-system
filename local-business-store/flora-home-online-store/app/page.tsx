import { ProductFunnel } from "@/components/product-funnel";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <ProductFunnel catalog={await getCatalog()} />;
}
