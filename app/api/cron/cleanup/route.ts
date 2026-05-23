import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const expiredReservations = await prisma.reservation.findMany({
      where: { status: "pending", expiresAt: { lt: new Date() } },
    });
    for (const reservation of expiredReservations) {
      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({ where: { id: reservation.id }, data: { status: "released" } });
        await tx.inventory.update({ where: { id: reservation.inventoryId }, data: { reserved: { decrement: reservation.quantity } } });
      });
    }
    return NextResponse.json({ released: expiredReservations.length });
  } catch (error) {
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}