/**
 * @file src/app/api/operator/export/route.ts
 * @description Municipal CSV Reports Export API.
 * @purpose Generates downloadable CSV exports of all reservations, revenue breakdowns,
 * and EV charging session telemetry for municipal auditing and fiscal reporting.
 *
 * @connections
 * - Protected by getServerAuthSession() (role: operator only)
 * - Reads from /src/lib/db.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getAllReservations } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (session?.user?.role !== "operator") {
      return NextResponse.json(
        { success: false, error: "Access Forbidden: Operator credentials required." },
        { status: 403 }
      );
    }

    const bookings = getAllReservations();

    // Construct CSV Header and Rows
    const headers = [
      "Booking ID",
      "Created At",
      "Customer Name",
      "Customer Phone",
      "Facility Name",
      "Facility Type",
      "Vehicle Plate",
      "Start Time",
      "End Time",
      "Duration (Hours)",
      "Status",
      "Gate State",
      "Delivered Energy (kWh)",
      "Base Tariff (INR)",
      "Taxes (INR)",
      "Service Fee (INR)",
      "Total Paid (INR)",
      "Payment Method",
      "Transaction ID",
    ];

    const rows = bookings.map((b) => [
      `"${b.id}"`,
      `"${b.createdAt}"`,
      `"${b.customerName || "Customer"}"`,
      `"${b.customerPhone || "N/A"}"`,
      `"${b.spotName.replace(/"/g, '""')}"`,
      `"${b.spotType}"`,
      `"${b.vehicle.plateNumber}"`,
      `"${b.startTime}"`,
      `"${b.endTime}"`,
      b.durationHours,
      `"${b.status}"`,
      `"${b.gateState || "reserved"}"`,
      b.chargingSession?.kwhDelivered || 0,
      b.pricing.baseAmount,
      b.pricing.taxes,
      b.pricing.serviceFee,
      b.pricing.totalAmount,
      `"${b.paymentMethod}"`,
      `"${b.paymentId}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="spark_ev_grid_report_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/operator/export] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate CSV export" },
      { status: 500 }
    );
  }
}
