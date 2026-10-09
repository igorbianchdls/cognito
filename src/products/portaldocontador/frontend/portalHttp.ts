export async function portalFetch(url: string, init: RequestInit = {}) {
  const response = await fetch(url, { cache: "no-store", ...init });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      typeof body.error?.message === "string"
        ? body.error.message
        : typeof body.error === "string"
          ? body.error
          : "Não foi possível concluir a consulta.";
    throw new Error(message);
  }
  return response;
}
