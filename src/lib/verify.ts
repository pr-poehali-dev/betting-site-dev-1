import { getToken } from "@/lib/auth";

const VERIFY_URL = "https://functions.poehali.dev/4bb13849-df27-40e5-a498-6adf35a65bdd";

export interface VerifyStatus {
  status: "not_submitted" | "pending" | "approved" | "rejected";
  id?: number;
  full_name?: string;
  birth_date?: string;
  doc_type?: string;
  reject_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VerifySubmit {
  full_name: string;
  birth_date: string;
  doc_type: string;
  doc_number: string;
  doc_photo_front: string;
  doc_photo_back?: string;
  selfie_photo: string;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "X-Authorization": `Bearer ${token}`,
  };
}

export async function getVerifyStatus(): Promise<VerifyStatus> {
  const res = await fetch(VERIFY_URL, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка");
  return data;
}

export async function submitVerify(payload: VerifySubmit): Promise<{ success: boolean; message: string }> {
  const token = getToken();
  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: authHeaders(),
    // Токен также передаём в теле — запасной вариант если заголовок не дошёл
    body: JSON.stringify({ action: "submit", _token: token, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка отправки");
  return data;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}