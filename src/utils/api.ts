import { CartItem } from "../types";

const isDev = import.meta.env.DEV;
const API_BASE = import.meta.env.VITE_WAMP_API_URL || import.meta.env.VITE_API_URL || (isDev ? "http://localhost:8000" : "/wamp-api");

export function isApiEnabled(): boolean {
  return true;
}

async function postJson<T>(path: string, body: unknown, auth = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth) {
    const token = localStorage.getItem("gallery_auth_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await response.text();

    if (!response.ok) {
      try {
        const errorData = JSON.parse(text);
        return errorData as T;
      } catch {
        throw new Error(`API Error: ${response.status}`);
      }
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Invalid JSON response from API`);
    }
  } catch (err) {
    throw new Error(`Network error: ${String(err)}`);
  }
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
}): Promise<{ ok: true; orderId: number } | { ok: false }> {
  if (!isApiEnabled()) return { ok: false };

  const items = input.cart.map((item) => ({
    artworkId: item.artwork.id,
    quantity: item.quantity,
    frameType: item.selectedFrame,
    unitPrice: item.artwork.price,
  }));

  try {
    const guestToken = localStorage.getItem("gallery_guest_token");
    const data = await postJson<{ ok: boolean; orderId?: number }>("/orders/create.php", {
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
      return { ok: false };
    }

    return { ok: true, orderId: data.orderId };
  } catch (err) {
    console.error("Order creation error:", err);
    return { ok: false };
  }
}

export async function getOrderDetails(orderId: string | number): Promise<{ ok: boolean; order?: any }> {
  if (!isApiEnabled()) return { ok: false };

  try {
    const guestToken = localStorage.getItem("gallery_guest_token");
    const url = guestToken
      ? `${API_BASE}/orders/index.php?id=${orderId}&guest_token=${encodeURIComponent(guestToken)}`
      : `${API_BASE}/orders/index.php?id=${orderId}`;

    const headers: Record<string, string> = {};
    const token = localStorage.getItem("gallery_auth_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (guestToken) {
      headers["X-Guest-Token"] = guestToken;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) return { ok: false };
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch order details:", err);
    return { ok: false };
  }
}

export async function verifyOrderWithWebhook(body: string, from = "+21697816225"): Promise<{ ok: boolean; message?: string; orderNumber?: string }> {
  if (!isApiEnabled()) return { ok: false };

  try {
    const response = await fetch(`${API_BASE}/orders/webhook.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, from }),
    });
    const data = await response.json();
    return data;
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
    const response = await fetch(`${API_BASE}/orders/index.php`, {
      headers,
    });
    if (!response.ok) return { ok: false };
    const data = await response.json();
    return data;
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
      ? `${API_BASE}/orders/mine.php?guest_token=${encodeURIComponent(guestToken)}`
      : `${API_BASE}/orders/mine.php`;

    const response = await fetch(url, {
      headers,
    });
    if (!response.ok) return { ok: false };
    const data = await response.json();
    return data;
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

