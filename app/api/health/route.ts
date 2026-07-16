import {
  NextResponse,
} from "next/server";

import {
  getControlState,
} from "@/lib/dromocob-control";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

export async function GET() {
  const startedAt =
    Date.now();

  const state =
    await getControlState();

  return NextResponse.json(
    {
      ok: true,

      service:
        process.env
          .NEXT_PUBLIC_SITE_NAME ||
        "Uğurbey Spot",

      controlStatus:
        state.status,

      controlCommandId:
        state.commandId,

      environment:
        process.env.NODE_ENV,

      timestamp:
        new Date()
          .toISOString(),

      responseMs:
        Date.now() -
        startedAt,
    },
    {
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    }
  );
}