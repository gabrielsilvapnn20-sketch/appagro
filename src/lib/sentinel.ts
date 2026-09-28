// Imagem de satélite (Sentinel Hub, WMS por Instance ID — sem OAuth).
// Configure NEXT_PUBLIC_SENTINEL_INSTANCE_ID (Configuration Utility do
// Sentinel Hub). Os nomes de camada padrão de uma configuração nova são
// "1_TRUE_COLOR" e "3_NDVI"; ajuste se a sua configuração usar outros.

export function sentinelInstanceId(): string {
  return process.env.NEXT_PUBLIC_SENTINEL_INSTANCE_ID || "";
}

export function sentinelWmsUrl(
  layer: string,
  lat: number,
  lng: number,
  opts?: { km?: number }
): string {
  const id = sentinelInstanceId();
  if (!id) return "";
  const km = opts?.km ?? 1.2;
  const dLat = km / 111;
  const dLng = km / (111 * Math.cos((lat * Math.PI) / 180) || 1);
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat].join(",");
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 90 * 86400000)
    .toISOString()
    .slice(0, 10);
  const params = new URLSearchParams({
    SERVICE: "WMS",
    VERSION: "1.1.1",
    REQUEST: "GetMap",
    LAYERS: layer,
    SRS: "EPSG:4326",
    BBOX: bbox,
    WIDTH: "512",
    HEIGHT: "512",
    FORMAT: "image/png",
    MAXCC: "40",
    TIME: `${start}/${end}`,
  });
  return `https://services.sentinel-hub.com/ogc/wms/${id}?${params.toString()}`;
}

export const SENTINEL_TRUE_COLOR = "1_TRUE_COLOR";
export const SENTINEL_NDVI = "3_NDVI";
