export function truncateIp(ipAddress?: string): string {
  const raw = (ipAddress || '').replace('::ffff:', '');

  if (raw.includes('.')) {
    const parts = raw.split('.');
    if (parts.length === 4) {
      return `${parts.slice(0, 3).join('.')}.0/24`;
    }
  }

  if (raw.includes(':')) {
    return `${raw.split(':').slice(0, 4).join(':')}::/64`;
  }

  return '0.0.0.0/24';
}
