function toNameCase(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

export default toNameCase;
