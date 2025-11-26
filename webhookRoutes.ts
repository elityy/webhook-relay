// webhookRoutes.ts

export type WebhookRouteMap = Record<string, string>;

/**
 * Parses WEBHOOK_ROUTES env var into a map.
 *
 * Example:
 * WEBHOOK_ROUTES='{
 *   "golden-deal/notion-match-form": "https://myapp.com/api/notion-webhook",
 *   "stripe/webhook": "https://myapp.com/api/stripe-webhook"
 * }'
 */
function parseRouteMap(): WebhookRouteMap {
    const raw = process.env.WEBHOOK_ROUTES;

    if (!raw) return {};

    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
            return parsed as WebhookRouteMap;
        }
        console.warn("WEBHOOK_ROUTES is not an object, ignoring");
        return {};
    } catch (err) {
        console.error("Failed to parse WEBHOOK_ROUTES JSON:", err);
        return {};
    }
}

const routeMap: WebhookRouteMap = parseRouteMap();

/**
 * Given a pathname like "/golden-deal/notion-match-form",
 * return the target URL from WEBHOOK_ROUTES, or null if none.
 */
export function resolveWebhookTarget(pathname: string): string | null {
    // normalize: remove leading/trailing slashes
    const key = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
    if (!key) return null;

    const target = routeMap[key];
    if (!target || typeof target !== "string") return null;

    return target;
}