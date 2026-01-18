# RDS PostgreSQL Database
resource "aws_db_instance" "main" {
  identifier           = "${var.project_name}-db"
  engine              = "postgres"
  engine_version      = "15.4"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20
  storage_type        = "gp3"
  
  db_name  = "main_db"
  username = "dbadmin"
  password = "securepassword123" # Use Secrets Manager in production
  
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  skip_final_snapshot = true
  publicly_accessible = false
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  tags = {
    Name = "${var.project_name}-db"
  }
}