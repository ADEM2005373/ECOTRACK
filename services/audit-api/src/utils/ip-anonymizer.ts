/**
 * Utilitaire d'anonymisation des adresses IP conforme au RGPD (Art. 5 & 32)
 * Pour le microservice d'audit EcoTrack (ECO-15 / SCRUM-56)
 */

export function truncateIp(ip?: string): string {
  if (!ip) {
    return '0.0.0.0/0';
  }

  const cleanIp = ip.replace(/^.*:/, '').trim(); // Nettoie le préfixe ::ffff:

  // IPv4 : Conserve les 3 premiers octets et masque le dernier (ex: 192.168.1.0/24)
  const ipv4Parts = cleanIp.split('.');
  if (ipv4Parts.length === 4) {
    return `${ipv4Parts[0]}.${ipv4Parts[1]}.${ipv4Parts[2]}.0/24`;
  }

  // IPv6 : Conserve le préfixe /48
  const ipv6Parts = ip.split(':');
  if (ipv6Parts.length > 2) {
    return `${ipv6Parts.slice(0, 3).join(':')}::/48`;
  }

  return 'anonymized';
}
