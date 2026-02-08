# NEXUS-X GKE APAC Expansion
# Terraform configuration for Australia and Japan regions
#
# Architecture:
# ┌────────────────────────────────────────────────────────────────────────────┐
# │                    GKE Multi-Region APAC Infrastructure                    │
# ├────────────────────────────────────────────────────────────────────────────┤
# │                                                                            │
# │  ┌─────────────────────────┐        ┌─────────────────────────┐           │
# │  │ australia-southeast1    │        │ asia-northeast1 (Tokyo) │           │
# │  │ (Sydney)                │        │                         │           │
# │  │ ┌─────────────────────┐ │        │ ┌─────────────────────┐ │           │
# │  │ │ NEXUS-X Cluster     │ │        │ │ NEXUS-X Cluster     │ │           │
# │  │ │ - Trading Engine    │ │        │ │ - Trading Engine    │ │           │
# │  │ │ - AEMO Adapter      │ │        │ │ - JEPX Adapter      │ │           │
# │  │ │ - ML Predictor      │ │        │ │ - ML Predictor      │ │           │
# │  │ │ - ZKP Prover (GPU)  │ │        │ │ - ZKP Prover (GPU)  │ │           │
# │  │ └─────────────────────┘ │        │ └─────────────────────┘ │           │
# │  └─────────────────────────┘        └─────────────────────────┘           │
# │              │                                 │                          │
# │              └─────────────┬───────────────────┘                          │
# │                            ▼                                              │
# │              ┌──────────────────────────┐                                 │
# │              │ Global Load Balancer     │                                 │
# │              │ Multi-Region Failover    │                                 │
# │              └──────────────────────────┘                                 │
# └────────────────────────────────────────────────────────────────────────────┘

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
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "gcs" {
    bucket = "nexus-x-terraform-state"
    prefix = "gke-apac"
  }
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "nexus_x_version" {
  description = "NEXUS-X application version"
  type        = string
  default     = "latest"
}

# APAC Region Configuration
variable "apac_regions" {
  description = "APAC regions for GKE clusters"
  type = map(object({
    region           = string
    zones            = list(string)
    market_adapter   = string
    node_count       = number
    gpu_node_count   = number
    machine_type     = string
    gpu_machine_type = string
  }))
  default = {
    australia = {
      region           = "australia-southeast1"
      zones            = ["australia-southeast1-a", "australia-southeast1-b", "australia-southeast1-c"]
      market_adapter   = "aemo"
      node_count       = 3
      gpu_node_count   = 2
      machine_type     = "n2-standard-8"
      gpu_machine_type = "n1-standard-8"
    }
    japan = {
      region           = "asia-northeast1"
      zones            = ["asia-northeast1-a", "asia-northeast1-b", "asia-northeast1-c"]
      market_adapter   = "jepx"
      node_count       = 3
      gpu_node_count   = 2
      machine_type     = "n2-standard-8"
      gpu_machine_type = "n1-standard-8"
    }
  }
}

# Provider Configuration
provider "google" {
  project = var.project_id
}

provider "google-beta" {
  project = var.project_id
}

# Local Values
locals {
  common_labels = {
    project     = "nexus-x"
    environment = var.environment
    managed_by  = "terraform"
  }
}

# VPC Network for APAC
resource "google_compute_network" "nexus_x_apac_vpc" {
  name                    = "nexus-x-apac-vpc"
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
}

# Subnets for each APAC region
resource "google_compute_subnetwork" "nexus_x_apac_subnets" {
  for_each = var.apac_regions

  name          = "nexus-x-${each.key}-subnet"
  ip_cidr_range = each.key == "australia" ? "10.20.0.0/16" : "10.21.0.0/16"
  region        = each.value.region
  network       = google_compute_network.nexus_x_apac_vpc.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = each.key == "australia" ? "10.120.0.0/14" : "10.124.0.0/14"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = each.key == "australia" ? "10.220.0.0/20" : "10.221.0.0/20"
  }

  private_ip_google_access = true
}

# Cloud Router for each region (for NAT)
resource "google_compute_router" "nexus_x_apac_routers" {
  for_each = var.apac_regions

  name    = "nexus-x-${each.key}-router"
  region  = each.value.region
  network = google_compute_network.nexus_x_apac_vpc.id
}

# Cloud NAT for each region
resource "google_compute_router_nat" "nexus_x_apac_nat" {
  for_each = var.apac_regions

  name                               = "nexus-x-${each.key}-nat"
  router                             = google_compute_router.nexus_x_apac_routers[each.key].name
  region                             = each.value.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# GKE Clusters for APAC Regions
resource "google_container_cluster" "nexus_x_apac_clusters" {
  for_each = var.apac_regions

  provider = google-beta

  name     = "nexus-x-${each.key}-cluster"
  location = each.value.region

  # Enable Autopilot for simplified management (alternative to standard)
  # For production trading, we use standard mode for more control
  enable_autopilot = false

  # Remove default node pool
  remove_default_node_pool = true
  initial_node_count       = 1

  # Network configuration
  network    = google_compute_network.nexus_x_apac_vpc.id
  subnetwork = google_compute_subnetwork.nexus_x_apac_subnets[each.key].id

  # IP allocation policy for VPC-native cluster
  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Private cluster configuration
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = each.key == "australia" ? "172.16.20.0/28" : "172.16.21.0/28"
  }

  # Master authorized networks
  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "0.0.0.0/0"
      display_name = "All (restrict in production)"
    }
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Binary Authorization
  binary_authorization {
    evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
  }

  # Security configurations
  security_posture_config {
    mode               = "BASIC"
    vulnerability_mode = "VULNERABILITY_BASIC"
  }

  # Network policy
  network_policy {
    enabled  = true
    provider = "CALICO"
  }

  # Addons
  addons_config {
    horizontal_pod_autoscaling {
      disabled = false
    }
    http_load_balancing {
      disabled = false
    }
    gce_persistent_disk_csi_driver_config {
      enabled = true
    }
    gcp_filestore_csi_driver_config {
      enabled = true
    }
  }

  # Cluster autoscaling
  cluster_autoscaling {
    enabled = true
    resource_limits {
      resource_type = "cpu"
      minimum       = 8
      maximum       = 100
    }
    resource_limits {
      resource_type = "memory"
      minimum       = 32
      maximum       = 400
    }
  }

  # Maintenance window (during low trading hours)
  maintenance_policy {
    recurring_window {
      # Sunday 2-6 AM local time (low trading activity)
      start_time = "2026-01-01T02:00:00Z"
      end_time   = "2026-01-01T06:00:00Z"
      recurrence = "FREQ=WEEKLY;BYDAY=SU"
    }
  }

  # Release channel
  release_channel {
    channel = "REGULAR"
  }

  # Logging and monitoring
  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
    managed_prometheus {
      enabled = true
    }
  }

  resource_labels = merge(local.common_labels, {
    region         = each.value.region
    market_adapter = each.value.market_adapter
  })

  lifecycle {
    ignore_changes = [
      node_config,
    ]
  }
}

# Primary Node Pool - Trading Engine & Grid Adapter
resource "google_container_node_pool" "nexus_x_apac_primary" {
  for_each = var.apac_regions

  name     = "nexus-x-${each.key}-primary"
  location = each.value.region
  cluster  = google_container_cluster.nexus_x_apac_clusters[each.key].name

  node_count = each.value.node_count

  autoscaling {
    min_node_count = each.value.node_count
    max_node_count = each.value.node_count * 3
  }

  node_config {
    preemptible  = false
    machine_type = each.value.machine_type

    disk_size_gb = 100
    disk_type    = "pd-ssd"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = merge(local.common_labels, {
      node_type = "primary"
      workload  = "trading-engine"
    })

    taint {
      key    = "workload"
      value  = "trading"
      effect = "NO_SCHEDULE"
    }

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    metadata = {
      disable-legacy-endpoints = "true"
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
  }
}

# GPU Node Pool - ZKP Prover & ML Inference
resource "google_container_node_pool" "nexus_x_apac_gpu" {
  for_each = var.apac_regions

  name     = "nexus-x-${each.key}-gpu"
  location = each.value.region
  cluster  = google_container_cluster.nexus_x_apac_clusters[each.key].name

  node_count = each.value.gpu_node_count

  autoscaling {
    min_node_count = 1
    max_node_count = each.value.gpu_node_count * 2
  }

  node_config {
    preemptible  = false
    machine_type = each.value.gpu_machine_type

    disk_size_gb = 200
    disk_type    = "pd-ssd"

    guest_accelerator {
      type  = "nvidia-tesla-t4"
      count = 1
      gpu_driver_installation_config {
        gpu_driver_version = "DEFAULT"
      }
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = merge(local.common_labels, {
      node_type      = "gpu"
      workload       = "zkp-ml"
      gpu_type       = "nvidia-tesla-t4"
    })

    taint {
      key    = "nvidia.com/gpu"
      value  = "present"
      effect = "NO_SCHEDULE"
    }

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}

# High-Memory Node Pool - Transformer AI Models
resource "google_container_node_pool" "nexus_x_apac_highmem" {
  for_each = var.apac_regions

  name     = "nexus-x-${each.key}-highmem"
  location = each.value.region
  cluster  = google_container_cluster.nexus_x_apac_clusters[each.key].name

  node_count = 2

  autoscaling {
    min_node_count = 1
    max_node_count = 5
  }

  node_config {
    preemptible  = false
    machine_type = "n2-highmem-8" # 64 GB RAM

    disk_size_gb = 200
    disk_type    = "pd-ssd"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = merge(local.common_labels, {
      node_type = "highmem"
      workload  = "transformer-ai"
    })

    taint {
      key    = "workload"
      value  = "ml-inference"
      effect = "NO_SCHEDULE"
    }

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}

# Cloud Armor Security Policy
resource "google_compute_security_policy" "nexus_x_apac_armor" {
  name = "nexus-x-apac-security-policy"

  # Default rule - deny all
  rule {
    action   = "deny(403)"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default deny rule"
  }

  # Allow institutional partners (placeholder CIDRs)
  rule {
    action   = "allow"
    priority = "1000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = [
          "203.0.113.0/24",  # Institutional Partner A
          "198.51.100.0/24", # Institutional Partner B
        ]
      }
    }
    description = "Allow institutional partners"
  }

  # Allow Australian energy market IPs
  rule {
    action   = "allow"
    priority = "1100"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = [
          "144.140.0.0/16", # AEMO network range (example)
        ]
      }
    }
    description = "Allow AEMO market access"
  }

  # Allow Japanese energy market IPs
  rule {
    action   = "allow"
    priority = "1200"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = [
          "210.130.0.0/16", # JEPX network range (example)
        ]
      }
    }
    description = "Allow JEPX market access"
  }

  # Rate limiting
  rule {
    action   = "rate_based_ban"
    priority = "2000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = 1000
        interval_sec = 60
      }
      ban_duration_sec = 300
    }
    description = "Rate limiting - 1000 req/min per IP"
  }

  # OWASP ModSecurity Core Rule Set
  adaptive_protection_config {
    layer_7_ddos_defense_config {
      enable = true
    }
  }
}

# Global Load Balancer for APAC regions
resource "google_compute_global_address" "nexus_x_apac_lb_ip" {
  name = "nexus-x-apac-lb-ip"
}

# Health Check
resource "google_compute_health_check" "nexus_x_apac_health" {
  name               = "nexus-x-apac-health-check"
  check_interval_sec = 5
  timeout_sec        = 5

  tcp_health_check {
    port = 8080
  }
}

# Backend Service for Multi-Region
resource "google_compute_backend_service" "nexus_x_apac_backend" {
  name                  = "nexus-x-apac-backend"
  protocol              = "HTTP2"
  port_name             = "http2"
  timeout_sec           = 30
  health_checks         = [google_compute_health_check.nexus_x_apac_health.id]
  security_policy       = google_compute_security_policy.nexus_x_apac_armor.id
  load_balancing_scheme = "EXTERNAL_MANAGED"

  # Enable CDN for static assets
  enable_cdn = false

  # Connection draining
  connection_draining_timeout_sec = 300

  # Logging
  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

# URL Map
resource "google_compute_url_map" "nexus_x_apac_url_map" {
  name            = "nexus-x-apac-url-map"
  default_service = google_compute_backend_service.nexus_x_apac_backend.id
}

# SSL Certificate (Managed)
resource "google_compute_managed_ssl_certificate" "nexus_x_apac_cert" {
  name = "nexus-x-apac-cert"

  managed {
    domains = ["apac.nexus-x.io", "au.nexus-x.io", "jp.nexus-x.io"]
  }
}

# HTTPS Proxy
resource "google_compute_target_https_proxy" "nexus_x_apac_https_proxy" {
  name             = "nexus-x-apac-https-proxy"
  url_map          = google_compute_url_map.nexus_x_apac_url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.nexus_x_apac_cert.id]
}

# Global Forwarding Rule
resource "google_compute_global_forwarding_rule" "nexus_x_apac_forwarding" {
  name       = "nexus-x-apac-forwarding-rule"
  target     = google_compute_target_https_proxy.nexus_x_apac_https_proxy.id
  port_range = "443"
  ip_address = google_compute_global_address.nexus_x_apac_lb_ip.address
}

# Cloud DNS Records
resource "google_dns_managed_zone" "nexus_x_apac_zone" {
  name        = "nexus-x-apac-zone"
  dns_name    = "nexus-x.io."
  description = "NEXUS-X APAC DNS Zone"
}

resource "google_dns_record_set" "nexus_x_apac_records" {
  for_each = toset(["apac", "au", "jp"])

  name         = "${each.value}.nexus-x.io."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.nexus_x_apac_zone.name
  rrdatas      = [google_compute_global_address.nexus_x_apac_lb_ip.address]
}

# Secret Manager for API Keys
resource "google_secret_manager_secret" "nexus_x_apac_secrets" {
  for_each = toset(["aemo-api-key", "jepx-api-key", "jepx-api-secret"])

  secret_id = "nexus-x-${each.key}"

  replication {
    user_managed {
      replicas {
        location = "australia-southeast1"
      }
      replicas {
        location = "asia-northeast1"
      }
    }
  }

  labels = local.common_labels
}

# Service Account for NEXUS-X workloads
resource "google_service_account" "nexus_x_apac_sa" {
  account_id   = "nexus-x-apac-workload"
  display_name = "NEXUS-X APAC Workload Service Account"
}

# IAM Bindings
resource "google_project_iam_member" "nexus_x_apac_iam" {
  for_each = toset([
    "roles/secretmanager.secretAccessor",
    "roles/cloudtrace.agent",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter",
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.nexus_x_apac_sa.email}"
}

# Workload Identity Binding
resource "google_service_account_iam_member" "nexus_x_apac_workload_identity" {
  for_each = var.apac_regions

  service_account_id = google_service_account.nexus_x_apac_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[nexus-x/nexus-x-sa]"
}

# Outputs
output "cluster_endpoints" {
  description = "GKE Cluster endpoints"
  value = {
    for k, cluster in google_container_cluster.nexus_x_apac_clusters :
    k => cluster.endpoint
  }
  sensitive = true
}

output "cluster_names" {
  description = "GKE Cluster names"
  value = {
    for k, cluster in google_container_cluster.nexus_x_apac_clusters :
    k => cluster.name
  }
}

output "load_balancer_ip" {
  description = "Global Load Balancer IP"
  value       = google_compute_global_address.nexus_x_apac_lb_ip.address
}

output "service_account_email" {
  description = "Workload Service Account"
  value       = google_service_account.nexus_x_apac_sa.email
}

output "dns_records" {
  description = "DNS Records"
  value = {
    for k, record in google_dns_record_set.nexus_x_apac_records :
    k => record.name
  }
}
