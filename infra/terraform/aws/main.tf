terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "nexus-arena-terraform-state"
    key            = "aws/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "nexus-arena-terraform-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "nexus-arena"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
