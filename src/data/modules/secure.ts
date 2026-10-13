import type { LearningModule } from '@/types';

export const secureModules: LearningModule[] = [
  {
    id: 'iam',
    domain: 'secure',
    title: 'IAM: Identities, Policies and Least Privilege',
    summary: 'Control who can do what in an AWS account, using roles, policies and permission boundaries.',
    minutes: 20,
    objectives: [
      'Distinguish users, groups, roles and the root user',
      'Read an identity-based policy and predict the outcome of allow/deny evaluation',
      'Choose roles over long-lived access keys for workloads and cross-account access',
    ],
    sections: [
      {
        heading: 'Identities and policies',
        body: [
          'IAM users represent people or applications with long-term credentials; groups simplify attaching permissions to many users; roles provide temporary credentials that anyone (or any AWS service) authorised to assume the role can use. The root user has unrestricted access and should be protected with MFA and used only for the few tasks that require it.',
          'Permissions come from JSON policies. Identity-based policies attach to users, groups and roles. Resource-based policies (for example on an S3 bucket or SQS queue) attach to the resource and can grant access to other accounts.',
        ],
        bullets: [
          'Everything is denied by default; an explicit Allow is required.',
          'An explicit Deny always wins over any Allow.',
          'Grant least privilege: start narrow and widen only as needed.',
        ],
      },
      {
        heading: 'Roles, federation and guardrails',
        body: [
          'Applications on EC2, ECS or Lambda should use an execution or instance role rather than embedded access keys; credentials rotate automatically. For cross-account access, the trusting account creates a role whose trust policy names the other account, and principals there call sts:AssumeRole.',
          'Permissions boundaries cap the maximum permissions an identity-based policy can grant. Service control policies (SCPs) in AWS Organizations cap what accounts can do at all; they never grant permissions by themselves. Workforce users should sign in through IAM Identity Center rather than individual IAM users.',
        ],
      },
    ],
    services: ['IAM', 'AWS STS', 'IAM Identity Center', 'AWS Organizations'],
    traps: [
      'Putting access keys on an EC2 instance when an instance profile (role) is the correct answer.',
      'Assuming an SCP grants access: it only limits what can be allowed.',
      'Forgetting that a resource policy can allow cross-account access without any identity policy in the other account being sufficient on its own.',
    ],
    diagram: {
      caption: 'A workload obtains temporary credentials from a role instead of stored keys.',
      tiers: [
        { label: 'Workload', items: ['EC2 instance'] },
        { label: 'Credentials', items: ['Instance profile', 'IAM role', 'AWS STS temporary credentials'] },
        { label: 'Resource', items: ['S3 bucket (least-privilege policy)'] },
      ],
    },
  },
  {
    id: 'kms-secrets',
    domain: 'secure',
    title: 'Encryption, KMS and Secrets Management',
    summary: 'Protect data at rest and in transit and keep credentials out of code.',
    minutes: 18,
    objectives: [
      'Explain how KMS keys, key policies and envelope encryption relate',
      'Choose between Secrets Manager and Systems Manager Parameter Store',
      'Select encryption in transit and at rest options for common services',
    ],
    sections: [
      {
        heading: 'AWS KMS',
        body: [
          'AWS KMS creates and controls cryptographic keys. AWS managed keys are created for a service on your behalf; customer managed keys give you control over the key policy, rotation and deletion. Most AWS services integrate with KMS for server-side encryption (S3 SSE-KMS, EBS, RDS, DynamoDB).',
          'KMS encrypts small payloads directly (up to 4 KB). For larger data, services use envelope encryption: KMS protects a data key, and the data key encrypts the data. Access needs both the right KMS permission and the right service permission.',
        ],
        bullets: ['Customer managed keys can use automatic annual rotation.', 'KMS keys are Regional; multi-Region keys exist for cross-Region use cases.', 'CloudHSM gives dedicated single-tenant HSMs when compliance requires it.'],
      },
      {
        heading: 'Secrets and certificates',
        body: [
          'Secrets Manager stores credentials such as database passwords and can rotate them automatically using Lambda, with native RDS integration. Systems Manager Parameter Store holds configuration and simple secrets at lower cost but without built-in rotation for databases.',
          'AWS Certificate Manager provisions and renews public TLS certificates for integrated services such as ALB, CloudFront and API Gateway. Enforce HTTPS and consider S3 bucket policies that deny requests without secure transport.',
        ],
      },
    ],
    services: ['AWS KMS', 'Secrets Manager', 'Systems Manager Parameter Store', 'ACM', 'CloudHSM'],
    traps: [
      'Choosing Parameter Store when the question requires automatic credential rotation.',
      'Forgetting the key policy: an IAM allow alone cannot use a KMS key unless the key policy permits IAM control.',
      'Assuming a KMS key can be used in another Region by default.',
    ],
    diagram: {
      caption: 'Envelope encryption: KMS protects the data key, not the bulk data.',
      tiers: [
        { label: 'Application', items: ['Request data key'] },
        { label: 'Key service', items: ['KMS key (never leaves KMS)'] },
        { label: 'Storage', items: ['Data encrypted by data key', 'Encrypted data key stored alongside'] },
      ],
    },
  },
  {
    id: 'vpc-security',
    domain: 'secure',
    title: 'VPC Design and Network Security',
    summary: 'Build subnets, routing and layered network controls with security groups and NACLs.',
    minutes: 22,
    objectives: [
      'Design public and private subnets across multiple Availability Zones',
      'Compare security groups and network ACLs',
      'Provide outbound internet access to private resources with NAT and keep AWS traffic private with endpoints',
    ],
    sections: [
      {
        heading: 'Subnets and routing',
        body: [
          'A VPC spans a Region; each subnet lives in exactly one Availability Zone. A subnet is public when its route table has a route to an internet gateway and its resources have public IPs. Private subnets have no such route; instances there reach the internet through a NAT gateway placed in a public subnet.',
          'For high availability, create subnets in at least two AZs and deploy one NAT gateway per AZ if you need AZ-independent outbound access. Place load balancers in public subnets and application and database tiers in private subnets.',
        ],
      },
      {
        heading: 'Security groups, NACLs and endpoints',
        body: [
          'Security groups are stateful firewalls attached to network interfaces. They only support allow rules and can reference other security groups, which is the standard way to let the app tier reach the database tier. Network ACLs are stateless, apply to subnets, support allow and deny rules, and are evaluated in rule-number order.',
          'VPC gateway endpoints (S3 and DynamoDB) add a route to keep traffic on the AWS network at no charge. Interface endpoints (AWS PrivateLink) create private IPs in your subnets for many other services.',
        ],
        bullets: ['Use a NACL deny rule to block a specific IP range; security groups cannot deny.', 'Stateless NACLs need return-traffic rules (ephemeral ports).'],
      },
    ],
    services: ['VPC', 'Security groups', 'Network ACLs', 'NAT gateway', 'VPC endpoints', 'PrivateLink'],
    traps: [
      'Expecting a security group to block a single malicious IP: only a NACL can deny.',
      'Putting the NAT gateway in a private subnet. It must sit in a public subnet.',
      'Using a NAT gateway for S3 traffic when a free gateway endpoint would be cheaper and more private.',
    ],
    diagram: {
      caption: 'Three-tier layout across two Availability Zones.',
      tiers: [
        { label: 'Public subnets', items: ['Application Load Balancer', 'NAT gateway'] },
        { label: 'Private app subnets', items: ['EC2 Auto Scaling group'] },
        { label: 'Private data subnets', items: ['RDS (Multi-AZ)'] },
      ],
    },
  },
  {
    id: 'edge-security',
    domain: 'secure',
    title: 'Edge Protection and Account Governance',
    summary: 'Defend applications from common attacks and govern multiple accounts.',
    minutes: 16,
    objectives: [
      'Match WAF, Shield and GuardDuty to the threats they address',
      'Use Organizations and SCPs for account-level guardrails',
      'Know which services provide audit logging and threat detection',
    ],
    sections: [
      {
        heading: 'Protecting applications',
        body: [
          'AWS WAF filters HTTP(S) requests on CloudFront, ALB, API Gateway and AppSync using rules for SQL injection, cross-site scripting, rate limits and IP or geo match. AWS Shield Standard protects against common network and transport layer DDoS attacks at no extra cost; Shield Advanced adds enhanced detection, response support and cost protection.',
          'Placing an application behind CloudFront and an ALB hides origin servers and absorbs volumetric traffic at the edge.',
        ],
      },
      {
        heading: 'Detection, audit and governance',
        body: [
          'CloudTrail records API activity for auditing. GuardDuty analyses CloudTrail, VPC Flow Logs and DNS logs for threats. Inspector scans workloads for vulnerabilities, Macie discovers sensitive data in S3, and Security Hub aggregates findings. AWS Config tracks resource configuration and compliance over time.',
          'AWS Organizations groups accounts; SCPs set the maximum permissions across member accounts, such as denying use of unapproved Regions. A multi-account strategy limits blast radius.',
        ],
      },
    ],
    services: ['AWS WAF', 'AWS Shield', 'GuardDuty', 'CloudTrail', 'AWS Config', 'Macie', 'Inspector', 'Organizations'],
    traps: [
      'Choosing WAF to stop a volumetric network-layer DDoS: Shield addresses that layer.',
      'Confusing CloudTrail (who made which API call) with Config (what changed on a resource).',
      'Thinking GuardDuty blocks traffic: it detects and reports.',
    ],
    diagram: {
      caption: 'Layered edge protection in front of an application.',
      tiers: [
        { label: 'Edge', items: ['Route 53', 'CloudFront + Shield', 'AWS WAF'] },
        { label: 'Application', items: ['ALB', 'Private EC2 targets'] },
        { label: 'Monitoring', items: ['CloudTrail', 'GuardDuty', 'Security Hub'] },
      ],
    },
  },
];
