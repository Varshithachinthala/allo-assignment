import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        inventory: {
          include: {
            product: true,
            warehouse: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reservations);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inventoryId, quantity } = body;

    if (!inventoryId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "inventoryId and quantity are required" },
        { status: 400 }
      );
    }

    // Check stock first
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
    });

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    const available = inventory.totalStock - inventory.reserved;

    if (available < quantity) {
      return NextResponse.json(
        { error: "Not enough stock available" },
        { status: 409 }
      );
    }

    // Atomic update — only succeeds if available stock is still enough
    // The where clause acts as our concurrency guard
    const updated = await prisma.inventory.updateMany({
      where: {
        id: inventoryId,
        totalStock: {
          gte: inventory.reserved + quantity,
        },
      },
      data: {
        reserved: { increment: quantity },
      },
    });

    // If count is 0, another request grabbed the last unit
    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Not enough stock available" },
        { status: 409 }
      );
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const reservation = await prisma.reservation.create({
      data: {
        inventoryId,
        quantity,
        status: "pending",
        expiresAt,
      },
      include: {
        inventory: {
          include: {
            product: true,
            warehouse: true,
          },
        },
      },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}