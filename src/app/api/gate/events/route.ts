/**
 * @file src/app/api/gate/events/route.ts
 * @description Server-Sent Events (SSE) Route Handler for real-time barrier open telemetry streams.
 * @purpose Streams "barrier.opened" and "barrier.closed" events to connected operator clients
 * without polling overhead.
 * @connections
 * - Reads event subscriptions from /src/lib/gate-adapter.ts
 * - Consumed by /src/app/operator/page.tsx
 */

import { NextRequest } from "next/server";
import { subscribeBarrierEvents } from "@/lib/gate-adapter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "streaming" })}\n\n`)
      );

      // Subscribe to real-time barrier opening triggers
      const unsubscribe = subscribeBarrierEvents((event) => {
        try {
          const payload = JSON.stringify(event);
          controller.enqueue(encoder.encode(`event: barrier.opened\ndata: ${payload}\n\n`));
        } catch (err) {
          // Closed stream
        }
      });

      // Keepalive ping every 15s to prevent cloud proxy disconnects
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive ping\n\n"));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        unsubscribe();
        clearInterval(pingInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
