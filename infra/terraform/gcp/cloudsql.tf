# Private IP for Cloud SQL
resource "google_compute_global_address" "sql_private_ip" {
  name          = "${var.cluster_name}-sql-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.main.id
}

resource "google_service_networking_connection" "sql_private" {
  network                 = google_compute_network.main.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.sql_private_ip.name]
}

# Cloud SQL PostgreSQL
resource "google_sql_database_instance" "main" {
  name             = "${var.cluster_name}-db"
  database_version = "POSTGRES_15"
  region           = var.region

  depends_on = [google_service_networking_connection.sql_private]

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"
    disk_size         = 10
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main.id
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
    }

    insights_config {
      query_insights_enabled = true
    }
  }

  deletion_protection = false
}

resource "google_sql_database" "main" {
  name     = "nexusarena"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "main" {
  name     = "nexus"
  instance = google_sql_database_instance.main.name
  password = var.db_password
}
