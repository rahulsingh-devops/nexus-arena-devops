# VPC Network
resource "google_compute_network" "main" {
  name                    = "${var.cluster_name}-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "main" {
  name          = "${var.cluster_name}-subnet"
  ip_cidr_range = "10.0.0.0/20"
  region        = var.region
  network       = google_compute_network.main.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.1.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.2.0.0/20"
  }
}

# GKE Autopilot Cluster
resource "google_container_cluster" "main" {
  name     = var.cluster_name
  location = var.region

  enable_autopilot = true

  network    = google_compute_network.main.id
  subnetwork = google_compute_subnetwork.main.id

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  release_channel {
    channel = "REGULAR"
  }

  # Private cluster
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  deletion_protection = false
}

# Artifact Registry (replaces GCR)
resource "google_artifact_registry_repository" "main" {
  location      = var.region
  repository_id = "nexus-arena"
  format        = "DOCKER"
  description   = "Nexus Arena container images"
}
