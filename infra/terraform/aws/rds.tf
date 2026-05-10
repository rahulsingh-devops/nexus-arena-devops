# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.cluster_name}-db-subnet"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "${var.cluster_name}-db-subnet" }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${var.cluster_name}-rds-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_eks_cluster.main.vpc_config[0].cluster_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.cluster_name}-rds-sg" }
}

# RDS PostgreSQL
resource "aws_db_instance" "main" {
  identifier = "${var.cluster_name}-db"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false

  performance_insights_enabled = true

  tags = { Name = "${var.cluster_name}-postgresql" }
}
