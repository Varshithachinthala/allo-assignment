"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

type Reservation = {
  id: string;
  quantity: number;
  status: string;
  expiresAt: string;
  inventory: {
    product: {
      name: string;
      price: number;
      description: string;
    };
    warehouse: {
      name: string;
      location: string;
    };
  };
};

export default function ReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"confirmed" | "released" | null>(null);

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setLoading(false);
          return;
        }
        setReservation(data);
        const secondsLeft = Math.floor(
          (new Date(data.expiresAt).getTime() - Date.now()) / 1000
        );
        setTimeLeft(Math.max(0, secondsLeft));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  async function handleConfirm() {
    setActionLoading(true);
    setError(null);
    const res = await fetch(`/api/reservations/${id}/confirm`, {
      method: "POST",
    });
    const data = await res.json();
    if (res.status === 410) {
      setError("Reservation has expired. Your hold has been released.");
      setActionLoading(false);
      return;
    }
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setActionLoading(false);
      return;
    }
    setDone("confirmed");
    setActionLoading(false);
  }

  async function handleCancel() {
    setActionLoading(true);
    setError(null);
    const res = await fetch(`/api/reservations/${id}/release`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setActionLoading(false);
      return;
    }
    setDone("released");
    setActionLoading(false);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpired = timeLeft === 0 && reservation?.status === "pending";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading reservation...</p>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 text-lg">Reservation not found.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-blue-600 underline"
          >
            Back to products
          </button>
        </div>
      </div>
    );
  }

  if (done === "confirmed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center max-w-md">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h2>
          <p className="text-gray-500 mb-6">
            Your purchase of{" "}
            <strong>{reservation.inventory.product.name}</strong> is confirmed.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (done === "released") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center max-w-md">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Reservation Cancelled
          </h2>
          <p className="text-gray-500 mb-6">
            Your hold has been released. The item is available again.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => router.push("/")}
          className="text-blue-600 text-sm mb-6 hover:underline"
        >
          ← Back to products
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Complete Your Purchase
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Your item is reserved. Complete payment before the timer runs out.
          </p>

          <div
            className={`rounded-lg p-4 mb-6 text-center ${
              isExpired
                ? "bg-red-50 border border-red-200"
                : timeLeft <= 60
                ? "bg-orange-50 border border-orange-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            {isExpired ? (
              <p className="text-red-700 font-semibold">
                Reservation expired — your hold has been released
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-1">Time remaining</p>
                <p
                  className={`text-4xl font-mono font-bold ${
                    timeLeft <= 60 ? "text-orange-600" : "text-blue-600"
                  }`}
                >
                  {String(minutes).padStart(2, "0")}:
                  {String(seconds).padStart(2, "0")}
                </p>
              </>
            )}
          </div>

          <div className="border border-gray-100 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 text-lg">
              {reservation.inventory.product.name}
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              {reservation.inventory.product.description}
            </p>
            <div className="flex justify-between items-center mt-3">
              <div>
                <p className="text-sm text-gray-500">
                  {reservation.inventory.warehouse.name}
                </p>
                <p className="text-xs text-gray-400">
                  {reservation.inventory.warehouse.location}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  Quantity: {reservation.quantity}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  ₹
                  {(
                    reservation.inventory.product.price * reservation.quantity
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {!isExpired && (
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Processing..." : "Confirm Purchase"}
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          )}

          {isExpired && (
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Browse Products Again
            </button>
          )}
        </div>
      </div>
    </main>
  );
}