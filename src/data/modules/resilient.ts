import type { LearningModule } from '@/types';

export const resilientModules: LearningModule[] = [
  {
    id: 'elb-asg',
    domain: 'resilient',
    title: 'Elastic Load Balancing and Auto Scaling',
    summary: 'Spread traffic across healthy instances and scale capacity automatically.',
    minutes: 20,
    objectives: [
      'Choose between ALB, NLB and Gateway Load Balancer',
      'Configure Auto Scaling groups across multiple Availability Zones',
      'Select a scaling policy type for a given workload pattern',
    ],
    sections: [
      {
        heading: 'Load balancer types',
        body: [
          'An Application Load Balancer operates at layer 7 and supports path-based and host-based routing, HTTP/2, WebSockets and targets such as instances, IPs and Lambda. A Network Load Balancer operates at layer 4, handles millions of requests per second with ultra-low latency, offers static IPs per AZ and preserves source IPs. A Gateway Load Balancer inserts third-party virtual appliances such as firewalls.',
          'Load balancers use health checks and stop sending traffic to unhealthy targets. Cross-zone load balancing spreads traffic evenly across all registered targets in all enabled AZs.',
        ],
      },
      {
        heading: 'Auto Scaling groups',
        body: [
          'An Auto Scaling group (ASG) keeps a minimum, desired and maximum number of instances launched from a launch template, spanning the subnets (and so AZs) you choose. If an instance or an AZ fails, the group replaces capacity in healthy AZs. Using ELB health checks lets the group replace instances that fail application-level checks.',
          'Target tracking keeps a metric (such as average CPU or requests per target) near a value and is the simplest policy. Step scaling reacts to alarm thresholds in increments. Scheduled scaling handles predictable peaks. Predictive scaling forecasts load from history.',
        ],
        bullets: ['Warm-up and cooldown settings avoid scaling thrash.', 'Use a mix of On-Demand and Spot in an ASG to reduce cost for fault-tolerant workloads.'],
      },
    ],
    services: ['Elastic Load Balancing', 'ALB', 'NLB', 'EC2 Auto Scaling', 'CloudWatch'],
    traps: [
      'Choosing NLB when path-based routing is required; that needs an ALB.',
      'Placing an ASG in a single subnet and calling it highly available.',
      'Using only EC2 status checks when the app can hang while the instance looks healthy; enable ELB health checks.',
    ],
    diagram: {
      caption: 'Traffic is balanced across instances in an Auto Scaling group spanning two AZs.',
      tiers: [
        { label: 'Entry', items: ['Application Load Balancer'] },
        { label: 'AZ a / AZ b', items: ['EC2 instances (Auto Scaling group)'] },
        { label: 'Scaling signal', items: ['CloudWatch metric', 'Target tracking policy'] },
      ],
    },
  },
  {
    id: 'multi-az',
    domain: 'resilient',
    title: 'High Availability and Multi-AZ Design',
    summary: 'Remove single points of failure by using multiple Availability Zones and health-based routing.',
    minutes: 18,
    objectives: [
      'Identify single points of failure in an architecture',
      'Explain RDS Multi-AZ versus read replicas',
      'Use Route 53 health checks and routing policies for failover',
    ],
    sections: [
      {
        heading: 'Designing for failure',
        body: [
          'An Availability Zone is one or more discrete data centres within a Region with independent power and networking. Highly available designs run redundant components in at least two AZs and use stateless application tiers so any instance can serve any request. Store session state in ElastiCache or DynamoDB instead of on a single instance.',
          'Many AWS services are Regional and already span AZs (S3, DynamoDB, SQS, Lambda, ELB). Others, such as EC2, EBS volumes and single-AZ databases, need you to design the redundancy.',
        ],
      },
      {
        heading: 'Databases and DNS failover',
        body: [
          'RDS Multi-AZ keeps a synchronous standby in another AZ and fails over automatically, usually within a minute or two; the standby cannot serve reads. Read replicas replicate asynchronously and scale reads; they can also be in other Regions, and can be promoted manually. Aurora stores six copies of data across three AZs and fails over to a replica quickly.',
          'Route 53 health checks combined with failover routing send traffic to a secondary endpoint when the primary is unhealthy. Weighted, latency and geolocation policies address other needs.',
        ],
        bullets: ['Multi-AZ = availability. Read replicas = read scaling.', 'EBS volumes are tied to one AZ; use snapshots or EFS for cross-AZ data.'],
      },
    ],
    services: ['RDS Multi-AZ', 'Aurora', 'Route 53', 'ELB', 'ElastiCache', 'EFS'],
    traps: [
      'Treating a read replica as the high-availability solution for the primary.',
      'Assuming an EBS volume can be attached to an instance in another AZ.',
      'Forgetting that a single NAT gateway or a single AZ NAT is itself a single point of failure.',
    ],
    diagram: {
      caption: 'Redundant tiers in two Availability Zones with a synchronous standby database.',
      tiers: [
        { label: 'DNS', items: ['Route 53 with health checks'] },
        { label: 'Compute', items: ['ALB', 'App instances in AZ a', 'App instances in AZ b'] },
        { label: 'Data', items: ['RDS primary (AZ a)', 'RDS standby (AZ b)'] },
      ],
    },
  },
  {
    id: 'decoupling',
    domain: 'resilient',
    title: 'Decoupling with SQS, SNS and EventBridge',
    summary: 'Use queues, topics and event buses so components fail and scale independently.',
    minutes: 20,
    objectives: [
      'Choose between SQS, SNS, EventBridge and Kinesis for a messaging need',
      'Explain standard versus FIFO queues and dead-letter queues',
      'Design a fan-out pattern',
    ],
    sections: [
      {
        heading: 'Queues and topics',
        body: [
          'Amazon SQS is a managed queue. Producers send messages and consumers poll and delete them after processing; the queue absorbs bursts so downstream components scale at their own pace. Standard queues offer at-least-once delivery and best-effort ordering; FIFO queues preserve order per message group and support exactly-once processing with deduplication.',
          'The visibility timeout hides a message while a consumer works on it; messages that repeatedly fail can be moved to a dead-letter queue (DLQ) for inspection. Long polling reduces empty responses and cost.',
        ],
      },
      {
        heading: 'Pub/sub and events',
        body: [
          'Amazon SNS delivers one published message to many subscribers (SQS, Lambda, HTTP, email, mobile push). Pairing SNS with several SQS queues is the fan-out pattern. EventBridge routes events from AWS services, SaaS partners and your applications to targets using rules, with schema discovery and scheduling.',
          'Kinesis Data Streams handles ordered, replayable, high-throughput streams of records, whereas SQS is for discrete message processing.',
        ],
        bullets: ['Need ordering and no duplicates: SQS FIFO.', 'Need many consumers of the same event: SNS (or EventBridge).', 'Need replay by multiple consumers: Kinesis.'],
      },
    ],
    services: ['SQS', 'SNS', 'EventBridge', 'Kinesis Data Streams', 'Step Functions'],
    traps: [
      'Using SNS alone for work that must not be lost when consumers are down; use SQS or SNS to SQS.',
      'Expecting standard SQS queues to guarantee order.',
      'Setting a visibility timeout shorter than the processing time, causing duplicate processing.',
    ],
    diagram: {
      caption: 'Fan-out: one event, independent queues, independent scaling.',
      tiers: [
        { label: 'Producer', items: ['Order service'] },
        { label: 'Topic', items: ['SNS topic'] },
        { label: 'Consumers', items: ['SQS: billing', 'SQS: shipping', 'Lambda: notifications'] },
      ],
    },
  },
  {
    id: 'dr-backup',
    domain: 'resilient',
    title: 'Disaster Recovery and Backup Strategies',
    summary: 'Match recovery objectives to a backup, pilot-light, warm-standby or active-active strategy.',
    minutes: 18,
    objectives: [
      'Define RTO and RPO and use them to choose a DR strategy',
      'Order DR strategies by cost and recovery speed',
      'Use AWS Backup, snapshots and cross-Region replication',
    ],
    sections: [
      {
        heading: 'RTO, RPO and strategies',
        body: [
          'Recovery Time Objective (RTO) is how long the business can be down; Recovery Point Objective (RPO) is how much data loss is acceptable. Tighter objectives cost more. The four common strategies, from cheapest and slowest to costliest and fastest, are: backup and restore, pilot light, warm standby, and multi-site active-active.',
          'Backup and restore keeps copies of data (hours of RTO). Pilot light keeps core data replicated and infrastructure defined but switched off (tens of minutes). Warm standby runs a scaled-down but functional copy (minutes). Active-active serves traffic from multiple Regions at once (near zero).',
        ],
      },
      {
        heading: 'AWS building blocks',
        body: [
          'AWS Backup centralises scheduled backups with retention policies across EBS, RDS, DynamoDB, EFS and more, including cross-Region and cross-account copies. S3 cross-Region replication, Aurora Global Database, DynamoDB global tables and RDS cross-Region read replicas replicate data to a second Region.',
          'Infrastructure as code (CloudFormation) and AMIs allow a recovery site to be created quickly and consistently. Route 53 failover routing or AWS Global Accelerator redirects users.',
        ],
      },
    ],
    services: ['AWS Backup', 'S3 CRR', 'Aurora Global Database', 'DynamoDB global tables', 'CloudFormation', 'Route 53'],
    traps: [
      'Picking active-active when the stated RTO of several hours only needs backup and restore.',
      'Confusing Multi-AZ (high availability inside a Region) with disaster recovery across Regions.',
      'Forgetting to test restores; backups that were never restored are unproven.',
    ],
    diagram: {
      caption: 'Warm standby: a small always-on copy in a second Region.',
      tiers: [
        { label: 'Primary Region', items: ['Full-size stack', 'Aurora writer'] },
        { label: 'Replication', items: ['Continuous data replication'] },
        { label: 'Recovery Region', items: ['Minimum-size stack', 'Aurora secondary'] },
      ],
    },
  },
];
