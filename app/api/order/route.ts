import { buildTelegramMessages, clientIp, createOrderNumber, isRateLimited, validateOrder, type Order } from "@/lib/order-server";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64 * 1024;
const TELEGRAM_TIMEOUT_MS = 10_000;

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

/** One Bot API call. Returns the sent message's id, or null. Never logs the token, which is part of the request URL. */
async function callTelegram(method: string, payload: Record<string, unknown>): Promise<number | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error("[order] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set");
    return null;
  }
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, ...payload }),
      signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
    });
    const result = (await response.json().catch(() => null)) as { result?: { message_id?: number }; description?: string } | null;
    if (!response.ok) {
      console.error(`[order] Telegram refused ${method}: ${response.status} ${result?.description ?? ""}`);
      return null;
    }
    return result?.result?.message_id ?? 0;
  } catch (error) {
    console.error(`[order] Could not reach Telegram: ${error instanceof Error ? error.name : "unknown error"}`);
    return null;
  }
}

/** Sends the order to the manager: the text, then the shared location as a map pin replying to it. */
async function sendToTelegram(messages: string[], location: Order["location"]): Promise<boolean> {
  let firstId: number | null = null;
  for (const text of messages) {
    const id = await callTelegram("sendMessage", { text, parse_mode: "HTML", disable_web_page_preview: true });
    if (id === null) return false;
    firstId ??= id;
  }
  if (location) {
    // The order already reached the manager, and its text has the map link: a failed pin isn't a failed order.
    const pin = await callTelegram("sendLocation", {
      latitude: location.lat,
      longitude: location.lng,
      horizontal_accuracy: Math.min(location.accuracy, 1500),
      ...(firstId ? { reply_parameters: { message_id: firstId, allow_sending_without_reply: true } } : {}),
    });
    if (pin === null) console.error("[order] The location pin could not be sent; the map link is in the message");
  }
  return true;
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return json({ ok: false, error: "too_large" }, 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  // A filled honeypot is a bot. It gets a normal-looking answer, so it has no reason to try something else.
  const honeypot = (body as { website?: unknown } | null)?.website;
  if (honeypot) return json({ ok: true, orderNumber: createOrderNumber() });

  const result = validateOrder(body);
  if (!result.ok) return json({ ok: false, error: "validation", fields: result.fields }, 400);

  if (isRateLimited(clientIp(request.headers))) return json({ ok: false, error: "rate_limited" }, 429);

  const orderNumber = createOrderNumber();
  // Telegram is the only place orders go: on Netlify the filesystem isn't kept between requests, so nothing is written.
  const sent = await sendToTelegram(buildTelegramMessages(result.order, orderNumber), result.order.location);

  if (!sent) {
    console.error(`[order] ${orderNumber} did not reach the manager`);
    return json({ ok: false, error: "delivery", orderNumber }, 502);
  }
  return json({ ok: true, orderNumber });
}
