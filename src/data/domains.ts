import type { DomainId } from '@/types';

export interface DomainInfo {
  id: DomainId;
  name: string;
  short: string;
  /** Official SAA-C03 exam weighting. */
  weight: number;
  description: string;
}

export const DOMAINS: DomainInfo[] = [
  { id: 'secure', name: 'Design Secure Architectures', short: 'Secure', weight: 30, description: 'Access control, data protection, and network security.' },
  { id: 'resilient', name: 'Design Resilient Architectures', short: 'Resilient', weight: 26, description: 'Loose coupling, high availability, and disaster recovery.' },
  { id: 'performance', name: 'Design High-Performing Architectures', short: 'Performance', weight: 24, description: 'Compute, storage, database, network, and ingestion choices.' },
  { id: 'cost', name: 'Design Cost-Optimized Architectures', short: 'Cost', weight: 20, description: 'Cost-effective compute, storage, databases, and networking.' },
];

export const DOMAIN_IDS: DomainId[] = DOMAINS.map((d) => d.id);

export const domainById = (id: DomainId): DomainInfo => DOMAINS.find((d) => d.id === id) ?? DOMAINS[0]!;
