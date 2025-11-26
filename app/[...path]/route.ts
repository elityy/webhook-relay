// app/[...path]/route.ts
import { NextRequest } from "next/server";
import { resolveWebhookTarget } from "@/webhookRoutes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxy(request: NextRequest): Promise<Response> {
    const pathname = request.nextUrl.pathname; // e.g. "/golden-deal/notion-match-form"
    const target = resolveWebhookTarget(pathname);

    if (!target) {
        return new Response("Webhook route not configured", { status: 404 });
    }

    const method = request.method;

    // Clone headers and clean up hop-by-hop stuff
    const headers = new Headers(request.headers);
    headers.delete("connection");
    headers.delete("content-length");
    headers.delete("host");

    // Optional but nice: forward original host info
    headers.set("x-forwarded-host", request.headers.get("host") || "");
    headers.set("x-forwarded-proto", "https");

    let body: BodyInit | undefined = undefined;

    // Only read body for methods that normally have one
    if (method !== "GET" && method !== "HEAD") {
        const buf = await request.arrayBuffer();
        if (buf.byteLength > 0) {
            body = buf;
        }
    }

    try {
        const upstreamResponse = await fetch(target, {
            method,
            headers,
            body,
            // No duplex needed because we're not streaming, just sending a buffer
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
    } catch (err) {
        console.error("Error forwarding webhook to target:", err);
        return new Response("Upstream webhook target error", { status: 502 });
    }
}

export async function POST(request: NextRequest) {
    return proxy(request);
}

export async function GET(request: NextRequest) {
    return proxy(request);
}

export async function HEAD(request: NextRequest) {
    return proxy(request);
}