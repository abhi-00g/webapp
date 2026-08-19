# Cloud-Native Web Application

A production-grade, cloud-native backend API built on AWS with a fully automated CI/CD pipeline. The application runs on auto-scaled EC2 instances behind an Application Load Balancer, uses RDS for persistence, S3 for file storage, and CloudWatch for observability — all provisioned via Terraform with zero manual intervention.

> **Infrastructure repo:** [tf-aws-infra](https://github.com/abhi-00g/tf-aws-infra) — Terraform configuration for the full AWS stack.

## Architecture

```
                    ┌───────────────────────────────────────────────┐
                    │                    AWS VPC                    │
   HTTPS            │  ┌─────────────────────────────────────────┐  │
 ────────►  ALB ───►   │        Auto Scaling Group (3–5)         │  │
   SSL/TLS          │  │  ┌──────┐  ┌──────┐  ┌──────┐           │  │
                    │  │  │ EC2  │  │ EC2  │  │ EC2  │           │  │
                    │  │  │(AMI) │  │(AMI) │  │(AMI) │           │  │
                    │  │  └──┬───┘  └──┬───┘  └──┬───┘           │  │
                    │  └─────┼─────────┼─────────┼───────────────┘  │
                    │        │         │         │                  │
                    │   ┌────▼─────────▼─────────▼────┐             │
                    │   │    RDS PostgreSQL           │  Private    │
                    │   │    (Private Subnet)         │  Subnet     │
                    │   └─────────────────────────────┘             │
                    │                                               │
                    │   ┌─────────────────────────────┐             │
                    │   │    S3 (File Storage)        │             │
                    │   │    AES-256 / KMS Encrypted  │             │
                    │   └─────────────────────────────┘             │
                    └───────────────────────────────────────────────┘

   CloudWatch ◄── Logs + Custom Metrics (API counts, latency, DB query time)
   Route 53  ──► ALB (A record alias)
   KMS      ──► Encryption for EC2, RDS, S3, Secrets Manager
```

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js, Express |
| Database | PostgreSQL (AWS RDS) |
| ORM | Sequelize |
| File Storage | AWS S3 |
| Machine Images | Packer (Ubuntu 24.04 LTS) |
| Infrastructure | Terraform (see [tf-aws-infra](https://github.com/abhi-00g/tf-aws-infra)) |
| CI/CD | GitHub Actions |
| Monitoring | AWS CloudWatch (logs + custom StatsD metrics) |
| Security | KMS encryption, SSL/TLS, IAM roles, Secrets Manager |
| Load Balancing | AWS ALB with Auto Scaling (3–5 instances) |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/healthz` | Health check — verifies database connectivity, returns 200 or 503 |
| GET | `/cicd` | CI/CD verification endpoint |
| POST | `/v1/user/self/pic` | Upload a profile picture (stored in S3) |
| GET | `/v1/user/self/pic` | Get profile picture metadata (S3 path, upload date) |
| DELETE | `/v1/user/self/pic` | Delete profile picture (removes from S3 and database) |

All responses are JSON. No UI — API only.

## CI/CD Pipeline

The GitHub Actions workflow automates the full deployment lifecycle:

**On pull request:** Runs application tests and Packer template validation (`packer fmt`, `packer validate`). PRs with failing checks cannot be merged.

**On merge to main:**
1. Runs unit tests
2. Builds the application artifact on the runner
3. Builds a custom AMI with Packer in the DEV account (application + dependencies baked in)
4. Shares the AMI with the DEMO account
5. Creates a new Launch Template version with the latest AMI
6. Triggers an Auto Scaling Group instance refresh
7. Waits for the instance refresh to complete before marking the workflow as successful

## Custom AMI (Packer)

The Packer template builds an Ubuntu 24.04 LTS image with:

- Node.js runtime and application dependencies pre-installed
- Application binary copied and configured
- CloudWatch Unified Agent installed and configured
- systemd service file for automatic application startup
- Dedicated `csye6225` user (non-login, least privilege)
- No database installed locally — the app connects to RDS

## Observability

CloudWatch integration provides:

- **Application logs** streamed to CloudWatch Logs in near real-time
- **API call counts** — custom metric tracking how many times each endpoint is called
- **API latency** — Timer metrics measuring response time per endpoint (ms)
- **Database query time** — Timer metrics for every Sequelize query (ms)
- **S3 operation time** — Timer metrics for file upload/delete operations (ms)

## Security

- All traffic routed through ALB with SSL/TLS termination
- EC2 instances not directly accessible from the internet
- RDS deployed in private subnets, accessible only from application security group
- S3 buckets are private with KMS encryption and lifecycle policies
- Database credentials stored in AWS Secrets Manager (KMS-encrypted)
- KMS keys with 90-day rotation for EC2, RDS, S3, and Secrets Manager
- IAM roles follow the principle of least privilege — no hardcoded credentials

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- AWS CLI configured with appropriate credentials

### Setup

```bash
git clone https://github.com/abhi-00g/webapp.git
cd webapp
npm install
```

Create a `.env` file:

```
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=csye6225
DB_PORT=5432
APP_PORT=3000
```

### Run

```bash
node server.js
```

### Test

```bash
npm test
```

The health check endpoint verifies database connectivity:

```bash
# Success (DB connected)
curl -i http://localhost:3000/healthz    # 200 OK

# Failure (DB down)
curl -i http://localhost:3000/healthz    # 503 Service Unavailable
```
