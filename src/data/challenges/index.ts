import type { Challenge, ChallengeComponent, ChallengeDecisionOption, Criterion } from '@/types';

type Fx = Partial<Record<Criterion, number>>;

/** Positional effect helper: availability, security, scalability, performance, cost, operations. */
const fx = (av = 0, se = 0, sc = 0, pe = 0, co = 0, op = 0): Fx => {
  const out: Fx = {};
  if (av) out.availability = av;
  if (se) out.security = se;
  if (sc) out.scalability = sc;
  if (pe) out.performance = pe;
  if (co) out.cost = co;
  if (op) out.operations = op;
  return out;
};
const c = (id: string, effects: Fx, note: string): ChallengeComponent => ({ id, effects, note });
const o = (id: string, label: string, effects: Fx, feedback: string): ChallengeDecisionOption => ({ id, label, effects, feedback });
const W = (availability: number, security: number, scalability: number, performance: number, cost: number, operations: number): Record<Criterion, number> => ({
  availability, security, scalability, performance, cost, operations,
});

export const CHALLENGES: Challenge[] = [
  {
    id: 'ha-web',
    domain: 'resilient',
    title: 'Survive an Availability Zone failure',
    difficulty: 'easy',
    scenario:
      'A business runs an application on a single EC2 instance in one Availability Zone, backed by a single-AZ database. It must remain available during an Availability Zone failure, scale automatically with traffic, and minimise unnecessary operational overhead.',
    requirements: ['Stay available if one AZ fails', 'Scale automatically with traffic', 'Keep operations simple'],
    constraints: ['Application is stateless apart from user sessions', 'Relational database is required', 'No Regional DR requirement'],
    weights: W(35, 10, 20, 5, 10, 20),
    targets: W(10, 3, 5, 2, 0, 4),
    skills: ['elb-asg', 'multi-az'],
    components: [
      c('route53', fx(1, 0, 0, 0, -0, 0), 'Helpful for DNS but not decisive here; the ALB already provides a stable endpoint.'),
      c('vpc', fx(1, 2, 0, 0, 0, 0), 'Subnets in two AZs are the foundation for any multi-AZ design and keep servers private.'),
      c('alb', fx(3, 1, 2, 1, -1, 0), 'Spreads traffic across AZs and removes unhealthy targets automatically.'),
      c('asg', fx(3, 0, 3, 0, 0, 1), 'Replaces failed instances and scales with demand across both AZs.'),
      c('ec2-single', fx(-3, 0, -2, 0, 1, -1), 'A single instance is a single point of failure and cannot scale out.'),
      c('rds-multiaz', fx(3, 0, 0, 0, -1, 1), 'A synchronous standby in another AZ with automatic failover.'),
      c('rds-single', fx(-3, 0, 0, 0, 1, 0), 'A single-AZ database would take the application down in an AZ outage.'),
      c('elasticache', fx(1, 0, 1, 2, -1, -1), 'Good for session state, but extra infrastructure to run; DynamoDB or a shared store are alternatives.'),
      c('cloudfront', fx(0, 0, 1, 1, -1, -1), 'Not required by the stated requirements; adds cost and complexity.'),
      c('lambda', fx(0, 0, 0, 0, -1, -2), 'Rewriting the application as functions is a large change that the requirements do not demand.'),
      c('sqs', fx(0, 0, 0, 0, -1, -1), 'Nothing in the scenario calls for asynchronous processing.'),
    ],
    decisions: [
      {
        id: 'session',
        prompt: 'Where should user session state be stored?',
        options: [
          o('local', 'On each instance\'s local disk', fx(-2, 0, -2, 0, 0, 0), 'Sessions are lost when an instance is replaced or an AZ fails, and requests cannot be freely balanced.'),
          o('shared', 'In a shared, multi-AZ store such as ElastiCache or DynamoDB', fx(2, 0, 2, 0, 0, 0), 'Any instance can serve any user, so scaling in and failing over do not log users out.'),
          o('sticky', 'Rely on load balancer sticky sessions only', fx(-1, 0, -1, 0, 0, 0), 'Stickiness still loses sessions when the instance dies and uneven load can develop.'),
        ],
      },
      {
        id: 'health',
        prompt: 'How should the Auto Scaling group detect unhealthy instances?',
        options: [
          o('elb', 'Use the load balancer\'s application health checks', fx(2, 0, 0, 0, 0, 1), 'Instances that fail the application check are replaced even if the VM is running.'),
          o('ec2', 'EC2 status checks only', fx(0, 0, 0, 0, 0, 0), 'Catches hardware faults but misses a hung application.'),
        ],
      },
    ],
    reference: { components: ['vpc', 'alb', 'asg', 'rds-multiaz'], decisions: { session: 'shared', health: 'elb' } },
    idealSolution:
      'An Application Load Balancer in public subnets distributes traffic to an Auto Scaling group spread across private subnets in two AZs. The database is RDS Multi-AZ. Session state is moved to a shared store, and ELB health checks drive instance replacement. This removes every single point of failure at AZ level without adding services the requirements do not need.',
  },
  {
    id: 'global-static',
    domain: 'performance',
    title: 'Fast, cheap, global static website',
    difficulty: 'easy',
    scenario:
      'A marketing site made of static files must load quickly for visitors on every continent, cost as little as possible, and keep its origin storage from being accessed directly.',
    requirements: ['Low latency worldwide', 'Lowest practical cost', 'Origin data not publicly readable'],
    constraints: ['Content updates a few times a week', 'No server-side code needed'],
    weights: W(10, 25, 10, 25, 20, 10),
    targets: W(3, 4, 3, 4, 4, 2),
    skills: ['cdn-edge', 'storage-s3'],
    components: [
      c('s3', fx(2, 0, 3, 0, 3, 2), 'Durable, serverless storage that scales without management.'),
      c('cloudfront', fx(1, 1, 1, 4, 2, 0), 'Caches at edge locations near users, reducing latency and origin traffic.'),
      c('route53', fx(1, 0, 0, 0, 0, 0), 'Maps the custom domain to the distribution using an alias record.'),
      c('waf', fx(0, 1, 0, 0, -1, -1), 'Optional protection; reasonable but not required for a static site and adds cost.'),
      c('ec2-single', fx(-2, -1, -2, -1, -2, -2), 'Servers add cost and patching for content that needs none.'),
      c('alb', fx(0, 0, 0, 0, -2, -1), 'A load balancer has an hourly cost and no role in serving static objects.'),
      c('asg', fx(0, 0, 0, 0, -2, -2), 'Unnecessary compute for static files.'),
    ],
    decisions: [
      {
        id: 'origin',
        prompt: 'How is the S3 origin protected?',
        options: [
          o('oac', 'Private bucket with CloudFront Origin Access Control', fx(0, 4, 0, 0, 0, 0), 'Only CloudFront can read the bucket, so users cannot bypass the CDN.'),
          o('public', 'Public bucket with a read-everyone policy', fx(0, -4, 0, 0, 0, 0), 'Anyone can fetch objects directly; this exposes the origin and bypasses caching controls.'),
        ],
      },
    ],
    reference: { components: ['s3', 'cloudfront', 'route53'], decisions: { origin: 'oac' } },
    idealSolution:
      'Store the files in a private S3 bucket and serve them through CloudFront using Origin Access Control, with Route 53 aliasing the domain. This is serverless, globally cached and cheap. WAF can be added if abuse becomes a concern.',
  },
  {
    id: 'decoupled-orders',
    domain: 'resilient',
    title: 'Absorb bursty order traffic',
    difficulty: 'medium',
    scenario:
      'An online shop receives short, unpredictable bursts of orders. Orders must never be lost, downstream processing must not be overwhelmed, and the team wants minimal server management.',
    requirements: ['No lost orders', 'Handle bursts without overload', 'Minimise server management'],
    constraints: ['Orders are key-value documents', 'Processing takes a few seconds per order'],
    weights: W(30, 5, 25, 10, 10, 20),
    targets: W(7, 2, 8, 2, 3, 5),
    skills: ['decoupling', 'serverless'],
    components: [
      c('apigw', fx(2, 1, 3, 0, 0, 2), 'Managed, scalable entry point with throttling.'),
      c('sqs', fx(3, 0, 3, 0, 0, 1), 'Durably buffers orders and decouples intake from processing.'),
      c('lambda', fx(1, 0, 3, 1, 1, 2), 'Processes messages with automatic scaling and no servers.'),
      c('dynamodb', fx(2, 0, 3, 1, 1, 2), 'Serverless, multi-AZ store that suits key-value orders.'),
      c('sns', fx(0, 0, 1, 0, 0, 0), 'Useful for notifying other systems, but not required for the core flow.'),
      c('ec2-single', fx(-2, 0, -3, 0, 0, -2), 'A single server for intake would drop orders when it fails or is overloaded.'),
      c('rds-single', fx(-2, 0, -2, 0, -1, -1), 'A single-AZ database is a bottleneck and a failure point.'),
      c('asg', fx(1, 0, 1, 0, -1, -2), 'Workable but more to operate than serverless processing.'),
    ],
    decisions: [
      {
        id: 'failures',
        prompt: 'How do you handle messages that repeatedly fail?',
        options: [
          o('dlq', 'Dead-letter queue with an alarm', fx(2, 0, 0, 0, 0, 2), 'Bad messages are set aside for inspection, and healthy traffic keeps flowing.'),
          o('retry', 'Retry forever', fx(-1, 0, -1, 0, 0, -1), 'Poison messages are retried endlessly and waste capacity.'),
          o('drop', 'Delete messages after one failure', fx(-3, 0, 0, 0, 0, 0), 'Orders would be lost, which violates the core requirement.'),
        ],
      },
    ],
    reference: { components: ['apigw', 'sqs', 'lambda', 'dynamodb'], decisions: { failures: 'dlq' } },
    idealSolution:
      'API Gateway accepts orders and places them on an SQS queue. Lambda consumes the queue and writes to DynamoDB; failed messages move to a dead-letter queue with an alarm. Every layer is managed, Regional and scales independently.',
  },
  {
    id: 'secure-three-tier',
    domain: 'secure',
    title: 'Secure three-tier web application',
    difficulty: 'medium',
    scenario:
      'A company is moving a web application with a relational database to AWS. Auditors require that the database is never reachable from the internet, credentials are not stored in code, and common web attacks are filtered.',
    requirements: ['Database not internet-reachable', 'No credentials in code', 'Filter common web attacks', 'Encrypt data at rest'],
    constraints: ['Application servers need patches from the internet', 'Highly available across two AZs'],
    weights: W(15, 40, 10, 5, 10, 20),
    targets: W(5, 11, 3, 1, 0, 4),
    skills: ['vpc-security', 'kms-secrets', 'edge-security'],
    components: [
      c('vpc', fx(1, 3, 0, 0, 0, 0), 'Private subnets for app and data tiers create the network isolation auditors require.'),
      c('alb', fx(2, 2, 1, 0, -1, 0), 'Terminates TLS in public subnets and forwards to private targets.'),
      c('waf', fx(0, 3, 0, 0, -1, 0), 'Filters SQL injection, XSS and abusive request rates at layer 7.'),
      c('asg', fx(2, 0, 2, 0, 0, 1), 'Runs the application tier across both AZs.'),
      c('nat', fx(0, 1, 0, 0, -1, 0), 'Lets private instances fetch patches without being reachable.'),
      c('rds-multiaz', fx(2, 0, 0, 0, -1, 1), 'Highly available database, placed in private subnets.'),
      c('kms', fx(0, 3, 0, 0, 0, 0), 'Customer-managed keys encrypt the database and volumes, with auditable use.'),
      c('secrets', fx(0, 3, 0, 0, 0, 1), 'Stores credentials and rotates them without code changes.'),
      c('ec2-single', fx(-2, -1, -2, 0, 0, -1), 'A single instance cannot meet the availability requirement.'),
      c('cloudfront', fx(0, 0, 0, 1, -1, -1), 'Not required by the audit requirements.'),
    ],
    decisions: [
      {
        id: 'db-placement',
        prompt: 'Where should the database live?',
        options: [
          o('private', 'Private data subnets; allow the app tier\'s security group only', fx(1, 4, 0, 0, 0, 0), 'No route from the internet, and only the app tier can connect.'),
          o('public', 'Public subnet with a strong password', fx(0, -4, 0, 0, 0, 0), 'A password is the only barrier; this violates the "never reachable" requirement.'),
        ],
      },
      {
        id: 'credentials',
        prompt: 'How does the application obtain the database password?',
        options: [
          o('secrets', 'From Secrets Manager at runtime via the instance role', fx(0, 3, 0, 0, 0, 1), 'No secret in code, with controlled access and rotation.'),
          o('hardcode', 'Hard-coded in the application source', fx(0, -4, 0, 0, 0, -1), 'Secrets leak through repositories and are hard to rotate.'),
          o('ami', 'Baked into the AMI as an environment variable', fx(0, -2, 0, 0, 0, -1), 'Better hidden than source code, but any AMI user can read it and rotation requires a rebuild.'),
        ],
      },
    ],
    reference: {
      components: ['vpc', 'alb', 'waf', 'asg', 'nat', 'rds-multiaz', 'kms', 'secrets'],
      decisions: { 'db-placement': 'private', credentials: 'secrets' },
    },
    idealSolution:
      'Use public subnets only for the ALB (protected by WAF) and NAT gateways, run the app in private subnets via Auto Scaling, and place an encrypted Multi-AZ RDS database in private data subnets reachable only from the app tier security group. The application reads credentials from Secrets Manager using its instance role.',
  },
  {
    id: 'regional-dr',
    domain: 'resilient',
    title: 'Regional disaster recovery on a budget',
    difficulty: 'hard',
    scenario:
      'A customer-facing application with an Aurora database must recover from a full Regional outage within one hour, losing at most a few minutes of data. The business does not want to pay for a second full production environment.',
    requirements: ['RTO ≤ 1 hour', 'RPO of minutes', 'Avoid doubling infrastructure cost'],
    constraints: ['Primary Region is already multi-AZ', 'Infrastructure is defined in templates'],
    weights: W(45, 0, 0, 0, 30, 25),
    targets: W(9, 0, 0, 0, 0, 5),
    skills: ['dr-backup', 'multi-az'],
    components: [
      c('aurora-global', fx(4, 0, 0, 0, -1, 1), 'Replicates to a secondary Region typically within a second, meeting the RPO.'),
      c('route53', fx(2, 0, 0, 0, 0, 0), 'Health-checked failover routing moves users to the recovery Region.'),
      c('cfn', fx(1, 0, 0, 0, 1, 2), 'Recreates or scales the recovery stack consistently and quickly.'),
      c('warm-standby', fx(3, 0, 0, 0, -1, 0), 'A small running copy that scales up on failover meets a one-hour RTO at moderate cost.'),
      c('backup', fx(1, 0, 0, 0, 1, 1), 'Cross-Region backup copies are a valuable safety net but alone are too slow for this RTO.'),
      c('second-region-full', fx(3, 0, 0, 0, -4, -2), 'Meets the objectives but at roughly double the cost, which the business rejected.'),
      c('rds-single', fx(-1, 0, 0, 0, 0, 0), 'Not a DR mechanism.'),
    ],
    decisions: [
      {
        id: 'strategy',
        prompt: 'Which DR strategy do you adopt?',
        options: [
          o('warm', 'Warm standby or pilot light with continuous data replication', fx(2, 0, 0, 0, 1, 0), 'Meets one-hour RTO and minute-level RPO without duplicating production.'),
          o('backup', 'Backup and restore from nightly snapshots', fx(-3, 0, 0, 0, 1, 0), 'RPO could be up to a day, and restores may exceed the RTO.'),
          o('active', 'Active-active in two Regions', fx(1, 0, 0, 0, -3, -2), 'Excellent recovery, but it exceeds the stated needs and budget.'),
        ],
      },
    ],
    reference: { components: ['aurora-global', 'route53', 'cfn', 'warm-standby'], decisions: { strategy: 'warm' } },
    idealSolution:
      'Replicate the database with Aurora Global Database, keep a scaled-down warm standby (or pilot light) stack deployed by CloudFormation in a second Region, and use Route 53 failover routing. On a Regional failure, promote the secondary cluster and scale the standby stack.',
  },
  {
    id: 'cost-batch',
    domain: 'cost',
    title: 'Cost-optimised nightly data processing',
    difficulty: 'medium',
    scenario:
      'A company processes about 2 TB of log files from S3 every night in a job that can be split into small, restartable tasks. Today a fleet of On-Demand instances runs 24/7. Leadership wants a large cost reduction without losing results.',
    requirements: ['Cut compute spend substantially', 'Tolerate interruptions without data loss', 'Reduce storage and transfer cost'],
    constraints: ['Job runs about four hours per night', 'Raw logs older than 30 days are rarely read'],
    weights: W(10, 5, 15, 5, 50, 15),
    targets: W(1, 1, 3, 0, 9, 3),
    skills: ['cost-compute', 'cost-storage'],
    components: [
      c('spot', fx(0, 0, 1, 0, 4, 0), 'Large discount for interruptible capacity, ideal for restartable tasks.'),
      c('asg', fx(1, 0, 2, 0, 1, 1), 'Mixed-instances fleet that scales to zero when idle.'),
      c('sqs', fx(1, 0, 1, 0, 0, 1), 'Tracks tasks so interrupted work is retried on another node.'),
      c('s3-lifecycle', fx(0, 0, 0, 0, 3, 1), 'Moves cold logs to cheaper classes automatically.'),
      c('s3-endpoint', fx(0, 1, 0, 0, 2, 0), 'Avoids NAT gateway data-processing charges for S3 traffic.'),
      c('on-demand-fleet', fx(0, 0, -1, 0, -4, 0), 'Pays for roughly twenty idle hours a day.'),
      c('nat', fx(0, 0, 0, 0, -2, 0), 'Per-GB processing fees on terabytes of S3 traffic.'),
      c('lambda', fx(0, 0, 0, 0, -1, -1), 'Tasks of this size may exceed Lambda limits and costs, and a rewrite is required.'),
    ],
    decisions: [
      {
        id: 'purchase',
        prompt: 'How should the workers be purchased?',
        options: [
          o('spot', 'Spot Instances with checkpointing and retries', fx(0, 0, 0, 0, 4, 0), 'Best fit for stateless, restartable work.'),
          o('ri', 'Three-year Reserved Instances', fx(0, 0, 0, 0, -1, 0), 'Commits to 24/7 capacity for a four-hour job.'),
          o('od', 'On-Demand, as today', fx(0, 0, 0, 0, -3, 0), 'No saving at all.'),
        ],
      },
    ],
    reference: { components: ['spot', 'asg', 'sqs', 's3-lifecycle', 's3-endpoint'], decisions: { purchase: 'spot' } },
    idealSolution:
      'Queue tasks in SQS and process them with an Auto Scaling group of Spot Instances that scales to zero outside the nightly window. Use a gateway endpoint for S3 traffic and lifecycle rules to move old logs to cheaper storage classes.',
  },
];

export const getChallenge = (id: string): Challenge | undefined => CHALLENGES.find((x) => x.id === id);
