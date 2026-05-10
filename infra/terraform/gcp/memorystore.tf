# Memorystore Redis
resource "google_redis_instance" "main" {
  name           = "${var.cluster_name}-redis"
  tier           = "BASIC"
  memory_size_gb = var.redis_memory_size
  region         = var.region
  redis_version  = "REDIS_7_0"

  authorized_network = google_compute_network.main.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"

  redis_configs = {
    maxmemory-policy = "allkeys-lru"
  }

  depends_on = [google_service_networking_connection.sql_private]

  labels = {
    environment = var.environment
    app         = "nexus-arena"
  }
}

output "redis_host" {
  description = "Memorystore Redis host"
  value       = google_redis_instance.main.host
}

output "redis_port" {
  description = "Memorystore Redis port"
  value       = google_redis_instance.main.port
}

output "cloudsql_connection" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.main.connection_name
}

output "gke_cluster_name" {
  description = "GKE cluster name"
  value       = google_container_cluster.main.name
}
