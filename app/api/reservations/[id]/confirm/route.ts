import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const updated = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        throw new Error("NOT_FOUND");
      }

      if (reservation.status !== "pending") {
        throw new Error("ALREADY_PROCESSED");
      }

      if (new Date() > reservation.expiresAt) {
        // Auto-release expired reservation
        await tx.reservation.update({
          where: { id },
          data: { status: "released" },
        });
        await tx.inventory.update({
          where: { id: reservation.inventoryId },
          data: { reserved: { decrement: reservation.quantity } },
        });
        throw new Error("EXPIRED");
      }

      // Confirm: decrement totalStock permanently, free reserved
      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: {
          totalStock: { decrement: reservation.quantity },
          reserved: { decrement: reservation.quantity },
        },
      });

      return tx.reservation.update({
        where: { id },
        data: { status: "confirmed" },
        include: {
          inventory: {
            include: { product: true, warehouse: true },
          },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === "EXPIRED") {
      return NextResponse.json(
        { error: "Reservation has expired" },
        { status: 410 }
      );
    }
    if (error.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }
    if (error.message === "ALREADY_PROCESSED") {
      return NextResponse.json(
        { error: "Reservation already confirmed or released" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to confirm reservation" },
      { status: 500 }
    );
  }
}