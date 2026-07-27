const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    },
  );

  if (!response.ok) {
    throw new Error(
      `API error: ${response.status}`,
    );
  }

  return response.json();
}