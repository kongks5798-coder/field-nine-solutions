# NEXUS-X Trading Engine Infrastructure
# Phase 9 Real-Money Pilot
# GKE Autopilot Deployment

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
  }

  backend "gcs" {
    bucket = "field-nine-terraform-state"
    prefix = "nexus-trading/phase9"
  }
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "field-nine-os"
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-northeast3"  # Seoul
}

variable "environment" {
  description = "Environment (pilot, staging, production)"
  type        = string
  default     = "pilot"
}

# Provider configuration
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "container.googleapis.com",
    "containerregistry.googleapis.com",
    "artifactregistry.googleapis.com",
    "compute.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "secretmanager.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
}

# VPC Network
resource "google_compute_network" "nexus_vpc" {
  name                    = "nexus-trading-vpc"
  auto_create_subnetworks = false
  project                 = var.project_id

  depends_on = [google_project_service.apis]
}

# Subnet for GKE
resource "google_compute_subnetwork" "nexus_subnet" {
  name          = "nexus-trading-subnet"
  ip_cidr_range = "10.10.0.0/20"
  region        = var.region
  network       = google_compute_network.nexus_vpc.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.20.0.0/14"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.24.0.0/20"
  }

  private_ip_google_access = true
}

# GKE Autopilot Cluster
resource "google_container_cluster" "nexus_autopilot" {
  provider = google-beta

  name     = "nexus-trading-cluster"
  location = var.region

  # Autopilot mode
  enable_autopilot = true

  # Network configuration
  network    = google_compute_network.nexus_vpc.name
  subnetwork = google_compute_subnetwork.nexus_subnet.name

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Private cluster configuration
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  # Release channel for automatic updates
  release_channel {
    channel = "REGULAR"
  }

  # Maintenance window (Korean time: 3 AM - 7 AM)
  maintenance_policy {
    daily_maintenance_window {
      start_time = "18:00"  # UTC (3 AM KST)
    }
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Logging and monitoring
  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
    managed_prometheus {
      enabled = true
    }
  }

  # Binary authorization
  binary_authorization {
    evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
  }

  # Deletion protection (enable for production)
  deletion_protection = var.environment == "production" ? true : false

  depends_on = [
    google_project_service.apis,
    google_compute_subnetwork.nexus_subnet,
  ]
}

# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "nexus_images" {
  location      = var.region
  repository_id = "nexus-trading"
  format        = "DOCKER"
  description   = "NEXUS-X Trading Engine Docker images"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }

  depends_on = [google_project_service.apis]
}

# Secret Manager for sensitive data
resource "google_secret_manager_secret" "telegram_bot_token" {
  secret_id = "nexus-telegram-bot-token"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "polygon_private_key" {
  secret_id = "nexus-polygon-private-key"

  replication {
    auto {}
  }
}

# Cloud NAT for outbound internet access
resource "google_compute_router" "nexus_router" {
  name    = "nexus-trading-router"
  region  = var.region
  network = google_compute_network.nexus_vpc.id
}

resource "google_compute_router_nat" "nexus_nat" {
  name                               = "nexus-trading-nat"
  router                             = google_compute_router.nexus_router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Outputs
output "cluster_name" {
  value       = google_container_cluster.nexus_autopilot.name
  description = "GKE cluster name"
}

output "cluster_endpoint" {
  value       = google_container_cluster.nexus_autopilot.endpoint
  description = "GKE cluster endpoint"
  sensitive   = true
}

output "artifact_registry_url" {
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.nexus_images.repository_id}"
  description = "Artifact Registry URL for Docker images"
}

output "get_credentials_command" {
  value       = "gcloud container clusters get-credentials ${google_container_cluster.nexus_autopilot.name} --region ${var.region} --project ${var.project_id}"
  description = "Command to get cluster credentials"
}
