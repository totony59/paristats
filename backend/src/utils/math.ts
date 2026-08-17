export function sum(values: Array<number | null | undefined>): number {
  return values.reduce<number>((acc, value) => acc + (value ?? 0), 0);
}

export function average(values: Array<number | null | undefined>): number {
  const defined = values.filter((v): v is number => v != null);
  return defined.length > 0 ? sum(defined) / defined.length : 0;
}
