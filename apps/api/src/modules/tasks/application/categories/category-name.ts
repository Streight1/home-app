export function normalizeCategoryName(name: string): string {
  return name.trim().toLocaleLowerCase('cs-CZ').normalize('NFKC');
}
