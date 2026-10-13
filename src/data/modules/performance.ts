import type { LearningModule } from '@/types';

export const performanceModules: LearningModule[] = [
  {
    id: 'compute-perf',
    domain: 'performance',
    title: 'EC2 Instance Families and Placement',
    summary: 'Pick the right instance type, purchase-independent options and placement for the workload.',
    minutes: 16,
    objectives: [
      'Match workload profiles to instance families',
      'Explain placement groups and enhanced networking',
      'Describe when containers or serverless beat EC2',
    ],
    sections: [
      {
        heading: 'Instance families',
        body: [
          'General purpose (M, T) balance CPU and memory; T instances are burstable and suit spiky, low-average workloads. Compute optimized (C) suit batch, media encoding and high-performance web. Memory optimized (R, X) suit in-memory databases and large caches. Storage optimized (I, D) provide high local IOPS or throughput. Accelerated computing (P, G, Inf) uses GPUs and ML chips.',
          'Instance store volumes give very fast temporary storage that is lost when the instance stops or fails; use them for caches and scratch data, not durable data. Graviton (Arm) instances often provide better price performance for compatible software.',
        ],
      },
      {
        heading: 'Placement and alternatives',
        body: [
          'Placement groups influence where instances run: cluster (low-latency, high-throughput inside one AZ), spread (small groups on distinct hardware to limit correlated failure), and partition (large distributed systems such as Hadoop or Cassandra).',
          'Containers on ECS or EKS (with Fargate for serverless compute) and Lambda reduce operational overhead for suitable workloads. Choose EC2 when you need OS-level control, specialised hardware, or long-running steady processes.',
        ],
      },
    ],
    services: ['EC2', 'Placement groups', 'ECS', 'EKS', 'Fargate', 'Lambda'],
    traps: [
      'Storing data you need to keep on instance store volumes.',
      'Choosing a cluster placement group for fault tolerance; it concentrates instances on purpose.',
      'Picking a burstable T instance for sustained high CPU.',
    ],
    diagram: {
      caption: 'Workload profile determines the family.',
      tiers: [
        { label: 'CPU heavy', items: ['C family'] },
        { label: 'Memory heavy', items: ['R / X family'] },
        { label: 'IOPS heavy', items: ['I family + instance store'] },
        { label: 'ML / GPU', items: ['P / G / Inf families'] },
      ],
    },
  },
  {
    id: 'storage-s3',
    domain: 'performance',
    title: 'Amazon S3: Features and Storage Classes',
    summary: 'Use S3 for durable object storage and pick storage classes, security and performance features.',
    minutes: 20,
    objectives: [
      'Choose the right S3 storage class for an access pattern',
      'Secure buckets with policies, Block Public Access and encryption',
      'Use replication, versioning and multipart upload appropriately',
    ],
    sections: [
      {
        heading: 'Storage classes',
        body: [
          'S3 Standard suits frequently accessed data. Intelligent-Tiering moves objects between tiers automatically when access patterns are unknown or change. Standard-IA and One Zone-IA are cheaper for infrequent access with retrieval fees (One Zone-IA keeps data in a single AZ). Glacier Instant Retrieval, Flexible Retrieval and Deep Archive progressively reduce cost with slower retrieval.',
          'Lifecycle rules transition objects between classes and expire them on a schedule. S3 offers eleven nines of durability for all classes; availability differs.',
        ],
      },
      {
        heading: 'Security, protection and performance',
        body: [
          'Buckets are private by default; Block Public Access guards against accidental exposure. Control access with IAM policies, bucket policies, and pre-signed URLs for temporary access. Versioning protects against accidental deletes and overwrites; MFA Delete adds more protection. Object Lock provides write-once-read-many retention.',
          'Use multipart upload for large objects, S3 Transfer Acceleration for long-distance uploads, and Cross-Region or Same-Region Replication for copies. S3 scales to very high request rates per prefix, so spreading keys across prefixes helps parallelism.',
        ],
      },
    ],
    services: ['S3', 'S3 Glacier', 'S3 Lifecycle', 'S3 Replication', 'Transfer Acceleration'],
    traps: [
      'Using One Zone-IA for data that must survive an AZ loss.',
      'Forgetting that replication requires versioning on both buckets.',
      'Choosing Glacier Deep Archive for data needed within minutes.',
    ],
    diagram: {
      caption: 'Lifecycle policy moves data to cheaper classes as it ages.',
      tiers: [
        { label: 'Day 0', items: ['S3 Standard'] },
        { label: 'Day 30', items: ['Standard-IA'] },
        { label: 'Day 90', items: ['Glacier Flexible Retrieval'] },
        { label: 'Day 365', items: ['Deep Archive or expire'] },
      ],
    },
  },
  {
    id: 'block-file',
    domain: 'performance',
    title: 'EBS, EFS and FSx',
    summary: 'Choose block, shared file and specialised file storage for EC2 and containers.',
    minutes: 16,
    objectives: [
      'Compare gp3, io2 and HDD-based EBS volumes',
      'Choose EFS or FSx for shared file access',
      'Use snapshots for backup and cross-AZ/Region recovery',
    ],
    sections: [
      {
        heading: 'Amazon EBS',
        body: [
          'EBS provides block storage attached to one instance at a time in the same AZ (io1/io2 Multi-Attach is a specialised exception). gp3 is the general purpose SSD default with independently configurable IOPS and throughput. io2 / io2 Block Express serve latency-sensitive databases needing high provisioned IOPS. st1 and sc1 are low-cost HDD options for throughput-oriented and cold data.',
          'Snapshots are incremental, stored in S3 and can be copied across Regions or restored into other AZs. Amazon Data Lifecycle Manager automates them.',
        ],
      },
      {
        heading: 'Shared file systems',
        body: [
          'Amazon EFS is a managed NFS file system for Linux that spans multiple AZs and scales automatically; use it for shared content across many instances. It offers Standard and Infrequent Access classes and bursting or provisioned throughput.',
          'Amazon FSx offers managed specialised file systems: FSx for Windows File Server (SMB, Active Directory), FSx for Lustre (HPC, tightly integrated with S3), FSx for NetApp ONTAP and OpenZFS.',
        ],
      },
    ],
    services: ['EBS', 'EFS', 'FSx for Windows', 'FSx for Lustre', 'Data Lifecycle Manager'],
    traps: [
      'Trying to mount one standard EBS volume on instances in multiple AZs.',
      'Choosing EFS for Windows workloads that need SMB; use FSx for Windows File Server.',
      'Selecting provisioned IOPS for a workload that gp3 already satisfies.',
    ],
    diagram: {
      caption: 'Shared file storage across Availability Zones.',
      tiers: [
        { label: 'AZ a', items: ['EC2 instances'] },
        { label: 'AZ b', items: ['EC2 instances'] },
        { label: 'Shared', items: ['EFS mount targets in each AZ'] },
      ],
    },
  },
  {
    id: 'databases',
    domain: 'performance',
    title: 'Relational Databases: RDS and Aurora',
    summary: 'Select between RDS engines and Aurora and scale reads, writes and storage.',
    minutes: 20,
    objectives: [
      'Explain what RDS manages and what you still manage',
      'Compare Aurora to standard RDS',
      'Apply read replicas, RDS Proxy and Serverless v2 appropriately',
    ],
    sections: [
      {
        heading: 'RDS essentials',
        body: [
          'Amazon RDS runs MySQL, PostgreSQL, MariaDB, Oracle and SQL Server with managed patching, backups (automated with point-in-time recovery, plus manual snapshots) and Multi-AZ failover. You cannot SSH to the underlying host. Storage auto scaling grows storage automatically.',
          'Read replicas offload read traffic (up to 15 for RDS MySQL, MariaDB and PostgreSQL) and can be cross-Region. Encryption with KMS must be chosen at creation; to encrypt an existing database, copy a snapshot with encryption and restore from it.',
        ],
      },
      {
        heading: 'Aurora and connection management',
        body: [
          'Aurora is a MySQL- and PostgreSQL-compatible engine with a distributed storage layer that keeps six copies across three AZs, auto-grows to 128 TiB, supports up to 15 low-lag replicas and offers faster failover. Aurora Serverless v2 scales capacity in fine steps for variable or unpredictable workloads.',
          'RDS Proxy pools and shares database connections, which helps applications such as Lambda that open many short-lived connections, and speeds up failover handling.',
        ],
        bullets: ['Use Secrets Manager for credentials and IAM database authentication where supported.', 'Choose DynamoDB instead when the data model is key-value with massive scale.'],
      },
    ],
    services: ['RDS', 'Aurora', 'Aurora Serverless v2', 'RDS Proxy', 'Secrets Manager'],
    traps: [
      'Expecting to enable encryption on an existing unencrypted RDS instance with a simple toggle.',
      'Using a read replica for failover without promotion planning.',
      'Letting Lambda open unlimited connections to RDS without RDS Proxy.',
    ],
    diagram: {
      caption: 'Aurora cluster: one writer, several readers, shared distributed storage.',
      tiers: [
        { label: 'Application', items: ['Writer endpoint', 'Reader endpoint'] },
        { label: 'Compute', items: ['Writer instance', 'Reader instances (up to 15)'] },
        { label: 'Storage', items: ['6 copies across 3 AZs'] },
      ],
    },
  },
  {
    id: 'dynamodb-cache',
    domain: 'performance',
    title: 'DynamoDB and Caching',
    summary: 'Build low-latency data access with DynamoDB, DAX and ElastiCache.',
    minutes: 18,
    objectives: [
      'Choose DynamoDB capacity modes and index types',
      'Pick between DAX, ElastiCache for Redis and Memcached',
      'Apply caching patterns to reduce database load',
    ],
    sections: [
      {
        heading: 'DynamoDB',
        body: [
          'DynamoDB is a serverless key-value and document database with single-digit millisecond latency at any scale and built-in multi-AZ replication. On-demand capacity suits unpredictable traffic; provisioned capacity with auto scaling suits steady or predictable patterns and can be cheaper.',
          'Design access patterns around the partition key to avoid hot partitions. Global secondary indexes support alternate query keys; local secondary indexes share the partition key. Features include TTL for expiry, Streams for change capture, point-in-time recovery, transactions and global tables for multi-Region active-active.',
        ],
      },
      {
        heading: 'Caching',
        body: [
          'DynamoDB Accelerator (DAX) is an in-memory cache for DynamoDB that delivers microsecond reads without application logic changes beyond the client. ElastiCache for Redis offers rich data structures, replication, persistence and Multi-AZ failover; Memcached is simple, multi-threaded and has no replication.',
          'Common patterns: lazy loading (cache-aside) fills the cache on misses, while write-through updates the cache on each write. Caches also hold session state so web servers stay stateless.',
        ],
      },
    ],
    services: ['DynamoDB', 'DAX', 'ElastiCache for Redis', 'ElastiCache for Memcached'],
    traps: [
      'Using ElastiCache in front of DynamoDB when DAX is the purpose-built, drop-in option.',
      'Expecting Memcached to provide replication or persistence.',
      'Choosing a low-cardinality partition key, which creates hot partitions.',
    ],
    diagram: {
      caption: 'Cache-aside pattern reduces load on the primary store.',
      tiers: [
        { label: 'App', items: ['Check cache first'] },
        { label: 'Cache', items: ['ElastiCache / DAX'] },
        { label: 'Database', items: ['RDS / DynamoDB (on miss)'] },
      ],
    },
  },
  {
    id: 'cdn-edge',
    domain: 'performance',
    title: 'Route 53, CloudFront and Global Accelerator',
    summary: 'Reduce latency for global users with DNS routing, caching at the edge and anycast networking.',
    minutes: 18,
    objectives: [
      'Select Route 53 routing policies by requirement',
      'Explain how CloudFront caches and secures content',
      'Differentiate CloudFront from Global Accelerator',
    ],
    sections: [
      {
        heading: 'Route 53',
        body: [
          'Route 53 is a highly available DNS service with health checks. Alias records point your domain apex to AWS resources such as ALBs, CloudFront and S3 website endpoints at no query charge. Routing policies: simple, weighted (gradual rollouts), latency-based, failover, geolocation (by user location, for compliance or localisation), geoproximity and multivalue answer.',
        ],
      },
      {
        heading: 'CloudFront and Global Accelerator',
        body: [
          'CloudFront caches content at edge locations to reduce latency and origin load, for static and dynamic content. Origins can be S3, ALB, EC2 or any HTTP server. Use Origin Access Control to keep S3 origins private, signed URLs or cookies for private content, and field-level encryption for sensitive form fields. Lambda@Edge and CloudFront Functions run code at the edge.',
          'AWS Global Accelerator provides two static anycast IPs and routes users over the AWS backbone to the nearest healthy endpoint. It suits non-HTTP (TCP/UDP) workloads, fast regional failover and static IP requirements; it does not cache content.',
        ],
      },
    ],
    services: ['Route 53', 'CloudFront', 'Global Accelerator', 'Lambda@Edge'],
    traps: [
      'Choosing Global Accelerator when the requirement is caching static content.',
      'Using geolocation routing when the goal is lowest latency (that is latency routing).',
      'Leaving an S3 origin public instead of using Origin Access Control.',
    ],
    diagram: {
      caption: 'Content is served from the nearest edge location.',
      tiers: [
        { label: 'User', items: ['Browser'] },
        { label: 'Edge', items: ['Route 53 alias', 'CloudFront edge cache'] },
        { label: 'Origin', items: ['Private S3 bucket (OAC)', 'ALB for dynamic'] },
      ],
    },
  },
  {
    id: 'vpc-connect',
    domain: 'performance',
    title: 'Hybrid and VPC Connectivity',
    summary: 'Connect VPCs, accounts and data centres with peering, Transit Gateway, VPN and Direct Connect.',
    minutes: 16,
    objectives: [
      'Choose between VPC peering and Transit Gateway',
      'Compare Site-to-Site VPN and Direct Connect',
      'Use PrivateLink to expose a service privately',
    ],
    sections: [
      {
        heading: 'Connecting VPCs',
        body: [
          'VPC peering connects two VPCs privately; it is non-transitive and requires non-overlapping CIDR ranges. For many VPCs and on-premises networks, AWS Transit Gateway acts as a regional hub with transitive routing, simplifying a mesh of peerings. AWS PrivateLink exposes a single service to other VPCs or accounts through interface endpoints without exposing the whole network.',
        ],
      },
      {
        heading: 'Hybrid connectivity',
        body: [
          'Site-to-Site VPN creates encrypted IPsec tunnels over the internet and can be set up in minutes. Direct Connect provides a dedicated private network connection with consistent latency and higher bandwidth, but takes weeks to provision. Combine them: use a VPN as a backup for Direct Connect, or run VPN over Direct Connect for encryption.',
          'Use Direct Connect gateway to reach VPCs in multiple Regions, and Transit Gateway to attach many VPCs to one connection.',
        ],
      },
    ],
    services: ['VPC peering', 'Transit Gateway', 'PrivateLink', 'Site-to-Site VPN', 'Direct Connect'],
    traps: [
      'Expecting VPC peering to route traffic through a peered VPC to a third network (non-transitive).',
      'Trying to peer VPCs with overlapping CIDR blocks.',
      'Selecting Direct Connect when the requirement is "connected today".',
    ],
    diagram: {
      caption: 'Transit Gateway as a hub for VPCs and on-premises connectivity.',
      tiers: [
        { label: 'Spokes', items: ['VPC A', 'VPC B', 'VPC C'] },
        { label: 'Hub', items: ['Transit Gateway'] },
        { label: 'On premises', items: ['Direct Connect', 'VPN backup'] },
      ],
    },
  },
  {
    id: 'serverless',
    domain: 'performance',
    title: 'Lambda and API Gateway',
    summary: 'Build event-driven backends that scale automatically with no servers to manage.',
    minutes: 18,
    objectives: [
      'Describe Lambda execution limits and scaling',
      'Select API Gateway endpoint types and integrations',
      'Place Lambda in a VPC only when required',
    ],
    sections: [
      {
        heading: 'AWS Lambda',
        body: [
          'Lambda runs code in response to events (API calls, S3 events, SQS messages, schedules) and bills per request and millisecond of duration. A function can run up to 15 minutes, with memory from 128 MB to 10 GB (CPU scales with memory), and 512 MB or more of /tmp storage. Concurrency scales automatically, and you can reserve or provision concurrency to protect or pre-warm functions.',
          'For long-running or containerised tasks, use ECS/Fargate or AWS Batch instead. Use Step Functions to orchestrate multi-step workflows. Attach a Lambda function to a VPC only when it must reach private resources, and use RDS Proxy for relational databases.',
        ],
      },
      {
        heading: 'API Gateway',
        body: [
          'Amazon API Gateway exposes REST, HTTP and WebSocket APIs. It handles authentication (IAM, Cognito, Lambda authorizers), throttling, request validation, usage plans and caching of responses. HTTP APIs are cheaper and simpler; REST APIs offer more features such as API keys, usage plans and caching.',
          'Endpoint types: Regional, edge-optimized (uses CloudFront) and private (only accessible from a VPC through an interface endpoint).',
        ],
      },
    ],
    services: ['Lambda', 'API Gateway', 'Step Functions', 'Cognito', 'ECS Fargate'],
    traps: [
      'Choosing Lambda for a job that runs for hours.',
      'Ignoring downstream limits: Lambda can scale faster than a database can accept connections.',
      'Putting every Lambda in a VPC when it does not need private resources.',
    ],
    diagram: {
      caption: 'Serverless request path.',
      tiers: [
        { label: 'Client', items: ['Web or mobile app'] },
        { label: 'Front door', items: ['API Gateway + Cognito authorizer'] },
        { label: 'Logic and data', items: ['Lambda', 'DynamoDB'] },
      ],
    },
  },
];
