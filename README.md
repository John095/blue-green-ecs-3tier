# Blue-Green ECS 3-Tier Application

A complete blue-green deployment demo using AWS ECS Fargate with a 3-tier architecture: Next.js frontend, Flask backend, and PostgreSQL database.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (Flask)       │◄──►│ (PostgreSQL)    │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Features

- **Blue-Green Deployment**: Zero-downtime deployments with instant rollback
- **3-Tier Architecture**: Separated presentation, application, and data layers  
- **Containerized**: Docker containers for consistent environments
- **AWS ECS Fargate**: Serverless container orchestration
- **Infrastructure as Code**: Terraform for AWS resource management
- **Health Monitoring**: Built-in health checks and monitoring

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- AWS CLI configured
- Terraform 1.0+

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blue-green-ecs-3tier
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/health

### Manual Setup

1. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Database Setup**
   ```bash
   docker run -d \
     --name postgres \
     -e POSTGRES_USER=user \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=mydatabase \
     -p 5432:5432 \
     postgres:13
   ```

## AWS Deployment

### 1. Deploy Infrastructure

```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

### 2. Build and Push Images

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd backend
docker build -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/blue-green-demo-backend:latest .
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/blue-green-demo-backend:latest

# Build and push frontend
cd ../frontend
docker build -f app/Dockerfile -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/blue-green-demo-frontend:latest .
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/blue-green-demo-frontend:latest
```

### 3. Update ECS Service

The ECS service will automatically pull the latest images and perform a blue-green deployment.

## Environment Variables

### Frontend (.env)
```bash
BACKEND_URL=http://localhost:5000
```

### Backend (.env)
```bash
DB_HOST=localhost
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=password
DB_PORT=5432
FLASK_ENV=production
```

## Project Structure

```
blue-green-ecs-3tier/
├── frontend/                 # Next.js application
│   ├── app/
│   │   ├── api/health/      # Health check API route
│   │   ├── Dockerfile       # Frontend container
│   │   └── page.tsx         # Main page component
│   ├── .dockerignore
│   └── package.json
├── backend/                  # Flask application
│   ├── app.py              # Main Flask app
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend container
│   └── .dockerignore
├── infrastructure/          # Terraform IaC
│   └── main.tf             # AWS resources
├── docker-compose.yaml     # Local development
├── .gitignore
└── README.md
```

## Blue-Green Deployment Process

1. **Blue Environment**: Current production version
2. **Green Environment**: New version deployment
3. **Health Checks**: Validate green environment
4. **Traffic Switch**: Route traffic from blue to green
5. **Rollback**: Instant switch back if issues occur

## AWS Resources Created

- **VPC**: Custom VPC with public/private subnets
- **ECS**: Fargate cluster with blue-green deployment
- **ALB**: Application Load Balancer with target groups
- **RDS**: PostgreSQL database in private subnets
- **ECR**: Container registries for images
- **CodeDeploy**: Blue-green deployment automation
- **CloudWatch**: Logging and monitoring

## Monitoring & Health Checks

- **Frontend Health**: `/` endpoint returns 200
- **Backend Health**: `/health` endpoint with database status
- **Database Health**: Connection and version check
- **CloudWatch Logs**: Centralized logging for all services

## Security Features

- **Private Subnets**: Database and ECS tasks in private networks
- **Security Groups**: Restrictive network access rules
- **IAM Roles**: Least privilege access for ECS tasks
- **No Hardcoded Secrets**: Use AWS Secrets Manager in production

## Development Tips

- Change version badge color in `frontend/app/page.tsx` to verify deployments
- Monitor CloudWatch logs for debugging
- Use `docker-compose logs -f` for local development debugging
- Test health endpoints before deployment

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check security group rules
   - Verify database credentials
   - Ensure RDS is in correct subnets

2. **ECS Tasks Not Starting**
   - Check CloudWatch logs
   - Verify ECR image exists
   - Check IAM permissions

3. **ALB Health Check Failing**
   - Verify container port mapping
   - Check security group rules
   - Test health endpoint manually

### Useful Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster blue-green-demo-cluster --services blue-green-demo-service

# View CloudWatch logs
aws logs tail /ecs/blue-green-demo --follow

# Force new deployment
aws ecs update-service --cluster blue-green-demo-cluster --service blue-green-demo-service --force-new-deployment
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with Docker Compose
5. Submit a pull request

## License

MIT License - see LICENSE file for details