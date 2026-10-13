import type { LearningModule } from '@/types';

export const costModules: LearningModule[] = [
  {
    id: 'cost-compute',
    domain: 'cost',
    title: 'Compute Pricing Models',
    summary: 'Pay the least for compute by matching purchase options to workload behaviour.',
    minutes: 16,
    objectives: [
      'Compare On-Demand, Savings Plans, Reserved Instances and Spot',
      'Identify workloads suitable for Spot',
      'Right-size and use serverless to remove idle cost',
    ],
    sections: [
      {
        heading: 'Purchase options',
        body: [
          'On-Demand has no commitment and suits unpredictable or short-term workloads. Savings Plans trade a one- or three-year spend commitment (per hour) for discounts; Compute Savings Plans apply flexibly across instance families, Regions, Fargate and Lambda, while EC2 Instance Savings Plans give deeper discounts for a family in a Region. Standard Reserved Instances give discounts for a specific configuration; Convertible RIs allow changes.',
          'Spot Instances use spare capacity at large discounts but can be interrupted with a two-minute warning, so they suit stateless, fault-tolerant, flexible work such as batch, CI, big data and containers. Dedicated Hosts address licensing or compliance needs rather than saving money.',
        ],
      },
      {
        heading: 'Reduce waste',
        body: [
          'Right-size instances using CloudWatch metrics and AWS Compute Optimizer. Use Auto Scaling to match capacity to demand, schedule non-production environments to stop outside working hours, and move suitable workloads to Lambda or Fargate so you do not pay for idle servers. Graviton-based instances often provide better price performance.',
        ],
      },
    ],
    services: ['EC2', 'Savings Plans', 'Spot Instances', 'Compute Optimizer', 'Auto Scaling'],
    traps: [
      'Using Spot for a stateful database without interruption handling.',
      'Buying a three-year commitment for a workload that may be retired soon.',
      'Assuming Reserved Instances reserve compute capacity unless a zonal reservation is chosen.',
    ],
    diagram: {
      caption: 'Layer pricing models by workload predictability.',
      tiers: [
        { label: 'Steady baseline', items: ['Savings Plans / Reserved'] },
        { label: 'Variable demand', items: ['On-Demand with Auto Scaling'] },
        { label: 'Flexible, fault tolerant', items: ['Spot Instances'] },
      ],
    },
  },
  {
    id: 'cost-storage',
    domain: 'cost',
    title: 'Storage and Data Transfer Costs',
    summary: 'Cut storage and network costs with lifecycle policies, endpoints and smart placement.',
    minutes: 16,
    objectives: [
      'Apply lifecycle and tiering to reduce storage spend',
      'Explain which data transfers are free or charged',
      'Use caching and endpoints to reduce transfer and NAT costs',
    ],
    sections: [
      {
        heading: 'Storage',
        body: [
          'Move cold data to cheaper S3 classes with lifecycle rules; use Intelligent-Tiering when access patterns vary. Delete incomplete multipart uploads, old versions and unattached EBS volumes and old snapshots. Right-size EBS volumes and choose gp3 over gp2 when it offers the same performance at a lower price. EFS Infrequent Access and lifecycle management reduce file storage costs.',
        ],
      },
      {
        heading: 'Data transfer',
        body: [
          'Data transfer into AWS is free. Transfer out to the internet and between Regions is charged, as is transfer between AZs. Keep chatty components in the same AZ where resilience allows, serve content through CloudFront (which has lower egress pricing and reduces origin load), and use gateway endpoints for S3 and DynamoDB to avoid NAT gateway data processing charges.',
          'For very large offline migrations, Snow Family devices may be cheaper and faster than network transfer; S3 Requester Pays shifts download cost to the requester.',
        ],
      },
    ],
    services: ['S3 Lifecycle', 'Intelligent-Tiering', 'CloudFront', 'VPC endpoints', 'Snow Family'],
    traps: [
      'Ignoring NAT gateway data-processing fees for traffic to S3.',
      'Forgetting that cross-AZ traffic is not free.',
      'Keeping all backups and snapshots forever with no lifecycle policy.',
    ],
    diagram: {
      caption: 'Reduce egress and NAT fees with edge caching and endpoints.',
      tiers: [
        { label: 'Users', items: ['Internet'] },
        { label: 'Edge', items: ['CloudFront cache'] },
        { label: 'Private traffic', items: ['S3 gateway endpoint instead of NAT'] },
      ],
    },
  },
  {
    id: 'cost-management',
    domain: 'cost',
    title: 'Cost Visibility and Governance',
    summary: 'Measure, allocate and control spend with tags, budgets and analysis tools.',
    minutes: 14,
    objectives: [
      'Use Cost Explorer, Budgets and Cost and Usage Reports for the right job',
      'Allocate costs with tags and consolidated billing',
      'Choose the right support and advisory tools',
    ],
    sections: [
      {
        heading: 'Visibility tools',
        body: [
          'Cost Explorer visualises and forecasts historical spend. AWS Budgets sets cost, usage or coverage thresholds and sends alerts or triggers actions. The Cost and Usage Report provides the most detailed data for analysis in Athena or QuickSight. Cost Anomaly Detection flags unexpected spikes.',
          'Cost allocation tags (activated in Billing) attribute spend to teams, projects or environments. Consolidated billing in AWS Organizations combines usage across accounts for volume discounts and shared Savings Plans.',
        ],
      },
      {
        heading: 'Advice and guardrails',
        body: [
          'Trusted Advisor flags idle or underutilised resources; Compute Optimizer recommends right-sizing; the AWS Pricing Calculator estimates future architectures. Use SCPs and service quotas to prevent expensive mistakes, and automate shutdown of unused resources.',
        ],
      },
    ],
    services: ['Cost Explorer', 'AWS Budgets', 'Cost and Usage Report', 'Trusted Advisor', 'Pricing Calculator', 'Organizations'],
    traps: [
      'Confusing Budgets (alerts on thresholds) with Cost Explorer (analysis).',
      'Expecting tags to appear in cost reports without activating them as cost allocation tags.',
      'Using the Pricing Calculator to analyse past spend; it estimates future cost.',
    ],
    diagram: {
      caption: 'Tag, measure, alert, optimise.',
      tiers: [
        { label: 'Allocate', items: ['Cost allocation tags', 'Organizations'] },
        { label: 'Measure', items: ['Cost Explorer', 'Cost and Usage Report'] },
        { label: 'Control', items: ['Budgets alerts', 'Compute Optimizer'] },
      ],
    },
  },
];
