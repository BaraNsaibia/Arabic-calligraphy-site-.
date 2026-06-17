import { CartItem } from "../types";

const DEFAULT_API_BASE = "/wamp-api";
const CONFIGURED_API_BASE = (import.meta.env.VITE_WAMP_API_URL || DEFAULT_API_BASE).replace(/\/$/, "");
const isConfiguredAbsolute = /^https?:\/\//i.test(CONFIGURED_API_BASE);
// If a remote absolute API URL is configured, prefer calling the local proxy
// (`/wamp-api`) first so the server can proxy requests (avoids browser TLS
// or CORS/transport issues), then fall back to the absolute URL.
const API_BASES = isConfiguredAbsolute
  ? [DEFAULT_API_BASE, CONFIGURED_API_BASE]
  : CONFIGURED_API_BASE === DEFAULT_API_BASE
    ? [DEFAULT_API_BASE]
    : [CONFIGURED_API_BASE, DEFAULT_API_BASE];

export function isApiEnabled(): boolean {
  return true;
}

function buildApiUrl(base: string, path: string): string {
  return `${base}${path}`;
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  let lastError: unknown;

  for (const base of API_BASES) {
    try {
      const response = await fetch(buildApiUrl(base, path), init);
      const text = await response.text();

      if (!response.ok) {
        try {
          return JSON.parse(text) as T;
        } catch {
          console.error('API returned non-JSON error response:', text);
          const snippet = text.slice(0, 2000);
          throw new Error(`API Error: ${response.status} - Invalid JSON response from API: ${snippet}`);
        }
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        console.error('API returned invalid JSON:', text);
        const snippet = text.slice(0, 2000);
        throw new Error(`Invalid JSON response from API: ${snippet}`);
      }
    } catch (err) {
      lastError = err;
      if (base === DEFAULT_API_BASE) break;
      continue;
    }
  }

  throw new Error(`Network error: ${String(lastError)}`);
}

async function postJson<T>(path: string, body: unknown, auth = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth) {
    const token = localStorage.getItem("gallery_auth_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return requestJson<T>(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export async function subscribeNewsletter(email: string, language: "ar" | "en"): Promise<boolean> {
  if (!isApiEnabled()) return false;

  const data = await postJson<{ ok: boolean }>("/newsletter/subscribe.php", { email, language });
  return data.ok;
}

export async function createOrder(input: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  cart: CartItem[];
  paymentMethod?: string;
  paymentReference?: string;
}): Promise<{ ok: true; orderId: number; orderNumber?: string } | { ok: false; error?: string; message?: string }> {
  if (!isApiEnabled()) return { ok: false, error: "api_disabled" };

  const items = input.cart.map((item) => ({
    artworkId: item.artwork.id,
    quantity: item.quantity,
    frameType: item.selectedFrame,
    unitPrice: item.artwork.price,
  }));

  try {
    const guestToken = localStorage.getItem("gallery_guest_token");
    const data = await postJson<{ ok: boolean; orderId?: number; orderNumber?: string; error?: string; message?: string }>("/orders/create.php", {
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
      paymentReference: input.paymentReference,
      items,
      guest_token: guestToken,
    }, true);

    if (!data.ok || !data.orderId) {
      return { ok: false, error: data.error, message: data.message };
    }

    return { ok: true, orderId: data.orderId, orderNumber: data.orderNumber };
  } catch (err) {
    console.error("Order creation error:", err);
    return { ok: false, error: "network_error", message: String(err) };
  }
}

export async function getOrderDetails(orderId: string | number): Promise<{ ok: boolean; order?: any }> {
  if (!isApiEnabled()) return { ok: false };

  try {
    const guestToken = localStorage.getItem("gallery_guest_token");
    const params = new URLSearchParams({ id: String(orderId) });
    if (guestToken) {
      params.set("guest_token", guestToken);
    }

    const headers: Record<string, string> = {};
    const token = localStorage.getItem("gallery_auth_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (guestToken) {
      headers["X-Guest-Token"] = guestToken;
    }

    return await requestJson<{ ok: boolean; order?: any }>(`/orders/index.php?${params.toString()}`, {
      method: "GET",
      headers,
    });
  } catch (err) {
    console.error("Failed to fetch order details:", err);
    return { ok: false };
  }
}

export async function verifyOrderWithWebhook(body: string, from = "+21697816225"): Promise<{ ok: boolean; message?: string; orderNumber?: string }> {
  if (!isApiEnabled()) return { ok: false };

  try {
    return await requestJson<{ ok: boolean; message?: string; orderNumber?: string }>("/orders/webhook.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, from }),
    });
  } catch (err) {
    console.error("Failed to run webhook verification:", err);
    return { ok: false };
  }
}

export async function getAllOrders(): Promise<{ ok: boolean; orders?: any[] }> {
  if (!isApiEnabled()) return { ok: false };

  try {
    const token = localStorage.getItem("gallery_auth_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return await requestJson<{ ok: boolean; orders?: any[] }>("/orders/index.php", {
      method: "GET",
      headers,
    });
  } catch (err) {
    console.error("Failed to fetch all orders:", err);
    return { ok: false };
  }
}

export async function getMyOrders(): Promise<{ ok: boolean; orders?: any[] }> {
  if (!isApiEnabled()) return { ok: false };

  try {
    const token = localStorage.getItem("gallery_auth_token");
    const guestToken = localStorage.getItem("gallery_guest_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (guestToken) {
      headers["X-Guest-Token"] = guestToken;
    }
    const url = guestToken
      ? `/orders/mine.php?guest_token=${encodeURIComponent(guestToken)}`
      : "/orders/mine.php";

    return await requestJson<{ ok: boolean; orders?: any[] }>(url, {
      method: "GET",
      headers,
    });
  } catch (err) {
    console.error("Failed to fetch my orders:", err);
    return { ok: false };
  }
}

export async function updateOrderStatus(orderId: string | number, status: string): Promise<{ ok: boolean }> {
  if (!isApiEnabled()) return { ok: false };

  try {
    const numericId = typeof orderId === 'string' ? orderId.replace(/^ORD-/, '') : orderId;
    const data = await postJson<{ ok: boolean }>("/orders/update_status.php", {
      orderId: numericId,
      status,
    }, true);
    return data;
  } catch (err) {
    console.error("Failed to update order status:", err);
    return { ok: false };
  }
}
