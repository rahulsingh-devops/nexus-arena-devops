terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "nexus-arena-tf-state"
    prefix = "gcp"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
