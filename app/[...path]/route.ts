// app/[...path]/route.ts
import { NextRequest } from "next/server";
import { resolveWebhookTarget } from "@/webhookRoutes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxy(request: NextRequest): Promise<Response> {
    // e.g. "/golden-deal/notion-match-form"
    const pathname = request.nextUrl.pathname;

    const target = resolveWebhookTarget(pathname);

    // If there is no mapping for this path → 404
    if (!target) {
        return new Response("Webhook route not configured", { status: 404 });
    }

    const method = request.method;
    const headers = new Headers(request.headers);

    // Remove hop-by-hop headers
    headers.delete("connection");
    headers.delete("content-length");

    const bodyAllowed = method !== "GET" && method !== "HEAD";

    const upstreamResponse = await fetch(target, {
        method,
        headers,
        body: bodyAllowed ? request.body : undefined,
        redirect: "manual",
    });

    const respHeaders = new Headers(upstreamResponse.headers);
    respHeaders.delete("connection");
    respHeaders.delete("content-length");

    return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: respHeaders,
    });
}

// Webhooks are usually POST, but GET is handy for quick checks.

export async function POST(request: NextRequest) {
    return proxy(request);
}

export async function GET(request: NextRequest) {
    return proxy(request);
}

export async function HEAD(request: NextRequest) {
    return proxy(request);
}