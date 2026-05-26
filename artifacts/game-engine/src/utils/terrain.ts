export function getTerrainHeight(x: number, z: number): number {
  return (
    Math.sin(x * 0.04) * Math.cos(z * 0.04) * 18 +
    Math.sin(x * 0.09 + z * 0.06) * 9 +
    Math.sin(x * 0.16 - z * 0.13) * 5 +
    Math.cos(x * 0.32 + z * 0.27) * 2.5 +
    Math.sin(x * 0.65 + z * 0.58) * 1.2
  );
}
