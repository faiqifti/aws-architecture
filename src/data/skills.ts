import type { BranchId, Skill } from '@/types';

export const BRANCHES: { id: BranchId; name: string }[] = [
  { id: 'security', name: 'Security and Identity' },
  { id: 'networking', name: 'Networking' },
  { id: 'compute', name: 'Compute' },
  { id: 'storage', name: 'Storage' },
  { id: 'databases', name: 'Databases' },
  { id: 'integration', name: 'Integration and Serverless' },
  { id: 'reliability', name: 'Reliability and Disaster Recovery' },
  { id: 'perfcost', name: 'Performance and Cost Optimization' },
];

/** Each skill maps 1:1 to a learning module with the same id. */
export const SKILLS: Skill[] = [
  { id: 'iam', branch: 'security', name: 'IAM and Access Control', prerequisites: [] },
  { id: 'kms-secrets', branch: 'security', name: 'Encryption, KMS and Secrets', prerequisites: ['iam'] },
  { id: 'edge-security', branch: 'security', name: 'Edge and Account Protection', prerequisites: ['vpc-security'] },
  { id: 'vpc-security', branch: 'networking', name: 'VPC and Network Security', prerequisites: [] },
  { id: 'vpc-connect', branch: 'networking', name: 'Hybrid and VPC Connectivity', prerequisites: ['vpc-security'] },
  { id: 'cdn-edge', branch: 'networking', name: 'DNS and Content Delivery', prerequisites: ['vpc-security'] },
  { id: 'compute-perf', branch: 'compute', name: 'EC2 Instance Selection', prerequisites: [] },
  { id: 'elb-asg', branch: 'compute', name: 'Load Balancing and Auto Scaling', prerequisites: ['compute-perf', 'vpc-security'] },
  { id: 'storage-s3', branch: 'storage', name: 'Amazon S3', prerequisites: ['iam'] },
  { id: 'block-file', branch: 'storage', name: 'Block and File Storage', prerequisites: ['compute-perf'] },
  { id: 'databases', branch: 'databases', name: 'Relational Databases', prerequisites: ['vpc-security'] },
  { id: 'dynamodb-cache', branch: 'databases', name: 'DynamoDB and Caching', prerequisites: ['databases'] },
  { id: 'decoupling', branch: 'integration', name: 'Decoupling and Messaging', prerequisites: ['compute-perf'] },
  { id: 'serverless', branch: 'integration', name: 'Lambda and API Gateway', prerequisites: ['iam'] },
  { id: 'multi-az', branch: 'reliability', name: 'High Availability Design', prerequisites: ['elb-asg'] },
  { id: 'dr-backup', branch: 'reliability', name: 'Disaster Recovery and Backup', prerequisites: ['multi-az'] },
  { id: 'cost-compute', branch: 'perfcost', name: 'Compute Cost Optimization', prerequisites: ['compute-perf'] },
  { id: 'cost-storage', branch: 'perfcost', name: 'Storage and Transfer Cost', prerequisites: ['storage-s3'] },
  { id: 'cost-management', branch: 'perfcost', name: 'Cost Visibility and Governance', prerequisites: ['cost-compute'] },
];

export const skillById = (id: string): Skill | undefined => SKILLS.find((s) => s.id === id);
