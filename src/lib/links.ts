export function whatsappUrl(numero: string, mensagem: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

export function mailtoUrl(email: string): string {
  return `mailto:${email}`;
}
