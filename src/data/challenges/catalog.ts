export type Tier = 'edge' | 'network' | 'compute' | 'integration' | 'data' | 'security' | 'ops';

export const TIERS: { id: Tier; label: string }[] = [
  { id: 'edge', label: 'Edge and DNS' },
  { id: 'security', label: 'Security' },
  { id: 'network', label: 'Network' },
  { id: 'compute', label: 'Compute' },
  { id: 'integration', label: 'Integration' },
  { id: 'data', label: 'Data' },
  { id: 'ops', label: 'Operations and recovery' },
];

export interface CatalogItem {
  name: string;
  tier: Tier;
  blurb: string;
}

/** Shared component catalog; each challenge decides how a component affects its own criteria. */
export const CATALOG: Record<string, CatalogItem> = {
  route53: { name: 'Route 53', tier: 'edge', blurb: 'Managed DNS with health checks and routing policies.' },
  cloudfront: { name: 'CloudFront', tier: 'edge', blurb: 'Global CDN with edge caching.' },
  waf: { name: 'AWS WAF', tier: 'security', blurb: 'Layer-7 web request filtering.' },
  secrets: { name: 'Secrets Manager', tier: 'security', blurb: 'Stores and rotates credentials.' },
  kms: { name: 'KMS encryption', tier: 'security', blurb: 'Customer-managed keys for data at rest.' },
  's3-endpoint': { name: 'S3 gateway endpoint', tier: 'network', blurb: 'Private route from the VPC to S3.' },
  vpc: { name: 'VPC with subnets in 2 AZs', tier: 'network', blurb: 'Public and private subnets across Availability Zones.' },
  nat: { name: 'NAT gateway', tier: 'network', blurb: 'Outbound internet for private subnets.' },
  alb: { name: 'Application Load Balancer', tier: 'network', blurb: 'Layer-7 load balancing across targets.' },
  apigw: { name: 'API Gateway', tier: 'integration', blurb: 'Managed API front door.' },
  'ec2-single': { name: 'Single EC2 instance', tier: 'compute', blurb: 'One server in one Availability Zone.' },
  asg: { name: 'EC2 Auto Scaling group', tier: 'compute', blurb: 'Self-healing, elastic fleet across AZs.' },
  lambda: { name: 'Lambda', tier: 'compute', blurb: 'Event-driven functions, no servers.' },
  spot: { name: 'Spot Instances', tier: 'compute', blurb: 'Discounted, interruptible capacity.' },
  'on-demand-fleet': { name: 'Always-on On-Demand fleet', tier: 'compute', blurb: 'Fixed fleet running 24/7.' },
  sqs: { name: 'SQS queue', tier: 'integration', blurb: 'Durable message buffer.' },
  sns: { name: 'SNS topic', tier: 'integration', blurb: 'Pub/sub fan-out.' },
  s3: { name: 'S3', tier: 'data', blurb: 'Durable object storage.' },
  'rds-multiaz': { name: 'RDS Multi-AZ', tier: 'data', blurb: 'Relational database with automatic failover.' },
  'rds-single': { name: 'RDS single-AZ', tier: 'data', blurb: 'Relational database in one AZ.' },
  dynamodb: { name: 'DynamoDB', tier: 'data', blurb: 'Serverless key-value database.' },
  elasticache: { name: 'ElastiCache', tier: 'data', blurb: 'In-memory cache or session store.' },
  'aurora-global': { name: 'Aurora Global Database', tier: 'data', blurb: 'Cross-Region replicated relational database.' },
  's3-lifecycle': { name: 'S3 lifecycle rules', tier: 'ops', blurb: 'Automatic tiering and expiry.' },
  backup: { name: 'AWS Backup (cross-Region copy)', tier: 'ops', blurb: 'Centralised, scheduled backups.' },
  cfn: { name: 'CloudFormation templates', tier: 'ops', blurb: 'Infrastructure as code for repeatable stacks.' },
  's3-crr': { name: 'S3 cross-Region replication', tier: 'data', blurb: 'Asynchronous object copy to another Region.' },
  'second-region-full': { name: 'Full active-active stack in a second Region', tier: 'compute', blurb: 'Complete duplicate environment serving traffic.' },
  'warm-standby': { name: 'Scaled-down standby stack in a second Region', tier: 'compute', blurb: 'Small running copy that scales up on failover.' },
  cloudwatch: { name: 'CloudWatch alarms', tier: 'ops', blurb: 'Metrics and alarms.' },
};
