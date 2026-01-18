## Part 5: Step-by-Step Deployment Guide

### Initial Setup

**1. Install Prerequisites:**

```bash
# Install Terraform
brew install terraform  # macOS
# or download from terraform.io

# Install AWS CLI
brew install awscli

# Configure AWS credentials
aws configure
```

**2. Create GitHub Repository:**

```bash
cd blue-green-demo
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/blue-green-demo.git
git push -u origin main
```

**3. Add GitHub Secrets:**

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

### Deploy Infrastructure

**1. Initialize Terraform:**

```bash
cd infrastructure
terraform init
```

**2. Review the plan:**

```bash
terraform plan
```

**3. Deploy infrastructure:**

```bash
terraform apply
```

Type `yes` when prompted. This takes ~10-15 minutes.

**4. Save the outputs:**

```bash
terraform output
```

You'll see:

- ALB DNS name (your app URL)
- ECR repository URLs
- ECS cluster/service names
- CodeDeploy app/group names

### First Deployment

**1. Push initial Docker images manually:**

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push frontend
cd frontend
docker build -t YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/blue-green-demo-frontend:latest .
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/blue-green-demo-frontend:latest

# Build and push backend
cd ../backend
docker build -t YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/blue-green-demo-backend:latest .
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/blue-green-demo-backend:latest
```

**2. Update ECS service to pull images:**

```bash
aws ecs update-service \
  --cluster blue-green-demo-cluster \
  --service blue-green-demo-service \
  --force-new-deployment
```

**3. Check your app:**

Wait 2-3 minutes, then visit the ALB DNS name from terraform output:
http://blue-green-demo-alb-XXXXXXXXX.us-east-1.elb.amazonaws.com

You should see your Next.js app with "Version 1.0 - BLUE"

---

## Part 6: Testing Blue-Green Deployment

### Making a Change (Version 2.0)

**1. Update the frontend:**

Edit `frontend/app/page.tsx`:

```typescript
// Change this line (around line 23):
<div className="inline-block px-4 py-2 bg-green-600 text-white rounded-full text-sm font-bold mb-6">
  Version 2.0 - GREEN
</div>
```

**2. Update the backend:**

Edit `backend/app.py`:

```python
# Change this line (around line 48):
'version': '2.0',  # Changed from 1.0
```

**3. Commit and push:**

```bash
git add .
git commit -m "Deploy version 2.0 (Green)"
git push origin main
```

### Watch the Deployment

**1. Monitor GitHub Actions:**

- Go to your repository → Actions tab
- Watch the workflow run in real-time
- See each step: build, push, register task, deploy

**2. Monitor CodeDeploy:**

```bash
# Get the deployment ID from GitHub Actions output, then:
aws deploy get-deployment --deployment-id d-XXXXXXXXX
```

Or use AWS Console:

- Go to CodeDeploy → Applications → blue-green-demo-app
- Watch the deployment progress
- See the traffic shift from Blue to Green

**3. What's Happening Behind the Scenes:**
Minute 0: GitHub Actions starts
├── Builds Docker images
├── Pushes to ECR
└── Creates new task definition
Minute 2: CodeDeploy starts deployment
├── Creates GREEN tasks in green target group
└── Waits for tasks to be healthy (2-3 minutes)
Minute 5: All GREEN tasks healthy
├── ALB listener switches to green target group
└── 100% traffic now going to GREEN (Version 2.0)
Minute 6: Termination timer starts (5 minutes)
Minute 11: BLUE tasks terminated
└── Deployment complete ✅

**4. Verify the switch:**

Visit your ALB URL. You should now see:

- "Version 2.0 - GREEN" (instead of blue)
- Backend version shows 2.0

**Traffic never stopped!** Users experienced zero downtime.

---

## Part 7: Testing Rollback

### Simulate a Bad Deployment

**1. Introduce a bug:**

Edit `frontend/app/page.tsx`:

```typescript
// Add this to cause an error
useEffect(() => {
  throw new Error("Intentional bug for testing rollback");

  fetch("/api/health");
  // ... rest of code
}, []);
```

**2. Deploy:**

```bash
git add .
git commit -m "Version 3.0 - Intentional bug"
git push origin main
```

### Manual Rollback

**3. Stop the bad deployment:**

```bash
# Get the deployment ID
DEPLOYMENT_ID=$(aws deploy list-deployments \
  --application-name blue-green-demo-app \
  --deployment-group-name blue-green-demo-deployment-group \
  --query 'deployments[0]' \
  --output text)

# Stop it
aws deploy stop-deployment \
  --deployment-id $DEPLOYMENT_ID \
  --auto-rollback-enabled
```

**4. Or manually redeploy previous version:**

```bash
# Get the previous task definition
PREVIOUS_TASK_DEF=$(aws ecs describe-services \
  --cluster blue-green-demo-cluster \
  --services blue-green-demo-service \
  --query 'services[0].taskDefinition' \
  --output text)

# Create new deployment with previous task def
cat > appspec-rollback.yaml << EOF
version: 0.0
Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: "$PREVIOUS_TASK_DEF"
        LoadBalancerInfo:
          ContainerName: "frontend"
          ContainerPort: 3000
EOF

# Deploy the rollback
aws deploy create-deployment \
  --application-name blue-green-demo-app \
  --deployment-group-name blue-green-demo-deployment-group \
  --revision revisionType=AppSpecContent,appSpecContent={content="$(cat appspec-rollback.yaml)"}
```

This switches traffic back to the working version (2.0) in seconds!
