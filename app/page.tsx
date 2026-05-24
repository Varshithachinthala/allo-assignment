"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
type Warehouse = { inventoryId: string; warehouseId: string; warehouseName: string; location: string; totalStock: number; reserved: number; available: number; };
type Product = { id: string; name: string; description: string; price: number; warehouses: Warehouse[]; };
export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then((d) => { setProducts(d); setLoading(false); });
  }, []);
  async function handleReserve(inventoryId: string, warehouseName: string) {
    setReserving(inventoryId); setError(null);
    try {
      const res = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inventoryId, quantity: 1 }) });
      const data = await res.json();
      if (res.status === 409) { setError("Not enough stock at " + warehouseName); setReserving(null); return; }
      if (!res.ok) { setError(data.error || "Error"); setReserving(null); return; }
      router.push("/reservation/" + data.id);
    } catch { setError("Network error"); setReserving(null); }
  }
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500 text-lg">Loading products...</p></div>;
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Allo Store</h1>
        <p className="text-gray-500 mb-8">Reserve items for 10 minutes while you complete checkout</p>
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
                  <p className="text-gray-500 text-sm mt-1">{product.description}</p>
                </div>
                <span className="text-xl font-bold text-gray-900">Rs.{product.price.toLocaleString()}</span>
              </div>
              <div className="space-y-3">
                {product.warehouses.map((wh) => (
                  <div key={wh.inventoryId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{wh.warehouseName}</p>
                      <p className="text-xs text-gray-500">{wh.location}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${wh.available === 0 ? "bg-red-100 text-red-700" : wh.available <= 3 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                          {wh.available === 0 ? "Out of stock" : `${wh.available} available`}
                        </span>
                        {wh.reserved > 0 && <span className="text-xs text-gray-400">({wh.reserved} reserved)</span>}
                      </div>
                    </div>
                    <button onClick={() => handleReserve(wh.inventoryId, wh.warehouseName)} disabled={wh.available === 0 || reserving === wh.inventoryId}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${wh.available === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : reserving === wh.inventoryId ? "bg-blue-400 text-white cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                      {reserving === wh.inventoryId ? "Reserving..." : "Reserve"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}