# NEXUS-X SSL/TLS Certificate Configuration
# Fixes ERR_CERT_COMMON_NAME_INVALID by properly configuring SAN (Subject Alternative Name)
#
# ┌─────────────────────────────────────────────────────────────────────────────┐
# │                    SSL Certificate SAN Configuration                        │
# ├─────────────────────────────────────────────────────────────────────────────┤
# │                                                                             │
# │  Primary Domain: nexus-x.io                                                 │
# │                                                                             │
# │  SAN Entries (Subject Alternative Names):                                   │
# │  ├── nexus-x.io              (Root domain)                                  │
# │  ├── *.nexus-x.io            (Wildcard subdomain)                          │
# │  ├── dashboard.nexus-x.io   (CEO Dashboard)                                │
# │  ├── m.nexus-x.io           (Mobile Dashboard) ← FIX TARGET               │
# │  ├── api.nexus-x.io         (API Gateway)                                  │
# │  ├── apac.nexus-x.io        (APAC Region)                                  │
# │  ├── au.nexus-x.io          (Australia)                                    │
# │  └── jp.nexus-x.io          (Japan)                                        │
# │                                                                             │
# └─────────────────────────────────────────────────────────────────────────────┘

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "nexus-x-prod"
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for nexus-x.io"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

# ============================================================================
# GCP Managed SSL Certificate (Primary)
# ============================================================================

resource "google_compute_managed_ssl_certificate" "nexus_x_primary" {
  name = "nexus-x-primary-cert"

  managed {
    domains = [
      "nexus-x.io",
      "dashboard.nexus-x.io",
      "m.nexus-x.io",           # Mobile - FIX TARGET
      "api.nexus-x.io",
      "apac.nexus-x.io",
      "au.nexus-x.io",
      "jp.nexus-x.io",
    ]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# GCP Managed SSL Certificate (Wildcard - requires DNS authorization)
# ============================================================================

resource "google_certificate_manager_dns_authorization" "nexus_x_dns_auth" {
  name        = "nexus-x-dns-auth"
  description = "DNS authorization for nexus-x.io wildcard certificate"
  domain      = "nexus-x.io"
}

resource "google_certificate_manager_certificate" "nexus_x_wildcard" {
  name        = "nexus-x-wildcard-cert"
  description = "Wildcard certificate for *.nexus-x.io"

  managed {
    domains = [
      "nexus-x.io",
      "*.nexus-x.io",
    ]

    dns_authorizations = [
      google_certificate_manager_dns_authorization.nexus_x_dns_auth.id,
    ]
  }
}

# ============================================================================
# Cloudflare SSL/TLS Configuration
# ============================================================================

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Enable Full (Strict) SSL mode
resource "cloudflare_zone_settings_override" "nexus_x_ssl" {
  zone_id = var.cloudflare_zone_id

  settings {
    ssl                      = "strict"
    always_use_https         = "on"
    automatic_https_rewrites = "on"
    min_tls_version          = "1.2"
    tls_1_3                  = "on"

    # Security headers
    security_header {
      enabled            = true
      include_subdomains = true
      max_age            = 31536000  # 1 year
      preload            = true
      nosniff            = true
    }
  }
}

# Edge Certificate for m.nexus-x.io (Mobile Dashboard)
resource "cloudflare_certificate_pack" "nexus_x_mobile" {
  zone_id               = var.cloudflare_zone_id
  type                  = "advanced"
  hosts                 = ["m.nexus-x.io", "nexus-x.io"]
  validation_method     = "txt"
  validity_days         = 365
  certificate_authority = "digicert"

  lifecycle {
    create_before_destroy = true
  }
}

# DNS Records with proxied status for SSL
resource "cloudflare_record" "nexus_x_mobile" {
  zone_id = var.cloudflare_zone_id
  name    = "m"
  value   = google_compute_global_address.nexus_x_lb_ip.address
  type    = "A"
  ttl     = 1  # Auto (proxied)
  proxied = true

  comment = "Mobile dashboard - SSL via Cloudflare Edge"
}

resource "cloudflare_record" "nexus_x_dashboard" {
  zone_id = var.cloudflare_zone_id
  name    = "dashboard"
  value   = google_compute_global_address.nexus_x_lb_ip.address
  type    = "A"
  ttl     = 1
  proxied = true

  comment = "CEO Dashboard"
}

resource "cloudflare_record" "nexus_x_api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  value   = google_compute_global_address.nexus_x_lb_ip.address
  type    = "A"
  ttl     = 1
  proxied = true

  comment = "API Gateway"
}

# ============================================================================
# Global Load Balancer IP
# ============================================================================

resource "google_compute_global_address" "nexus_x_lb_ip" {
  name = "nexus-x-global-lb-ip"
}

# ============================================================================
# HTTPS Load Balancer with SSL Certificate
# ============================================================================

resource "google_compute_target_https_proxy" "nexus_x_https_proxy" {
  name             = "nexus-x-https-proxy"
  url_map          = google_compute_url_map.nexus_x_url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.nexus_x_primary.id]

  ssl_policy = google_compute_ssl_policy.nexus_x_ssl_policy.id
}

resource "google_compute_ssl_policy" "nexus_x_ssl_policy" {
  name            = "nexus-x-ssl-policy"
  profile         = "MODERN"
  min_tls_version = "TLS_1_2"

  # Custom features for maximum security
  custom_features = [
    "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
    "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
    "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384",
    "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
    "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
    "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256",
  ]
}

resource "google_compute_url_map" "nexus_x_url_map" {
  name            = "nexus-x-url-map"
  default_service = google_compute_backend_service.nexus_x_default_backend.id

  host_rule {
    hosts        = ["m.nexus-x.io"]
    path_matcher = "mobile"
  }

  host_rule {
    hosts        = ["dashboard.nexus-x.io"]
    path_matcher = "dashboard"
  }

  host_rule {
    hosts        = ["api.nexus-x.io"]
    path_matcher = "api"
  }

  path_matcher {
    name            = "mobile"
    default_service = google_compute_backend_service.nexus_x_mobile_backend.id
  }

  path_matcher {
    name            = "dashboard"
    default_service = google_compute_backend_service.nexus_x_dashboard_backend.id
  }

  path_matcher {
    name            = "api"
    default_service = google_compute_backend_service.nexus_x_api_backend.id
  }
}

resource "google_compute_backend_service" "nexus_x_default_backend" {
  name                  = "nexus-x-default-backend"
  protocol              = "HTTP2"
  timeout_sec           = 30
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = "projects/${var.project_id}/zones/us-central1-a/networkEndpointGroups/nexus-x-default-neg"
  }

  health_checks = [google_compute_health_check.nexus_x_health.id]
}

resource "google_compute_backend_service" "nexus_x_mobile_backend" {
  name                  = "nexus-x-mobile-backend"
  protocol              = "HTTP2"
  timeout_sec           = 30
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = "projects/${var.project_id}/zones/us-central1-a/networkEndpointGroups/nexus-x-mobile-neg"
  }

  health_checks = [google_compute_health_check.nexus_x_health.id]
}

resource "google_compute_backend_service" "nexus_x_dashboard_backend" {
  name                  = "nexus-x-dashboard-backend"
  protocol              = "HTTP2"
  timeout_sec           = 30
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = "projects/${var.project_id}/zones/us-central1-a/networkEndpointGroups/nexus-x-dashboard-neg"
  }

  health_checks = [google_compute_health_check.nexus_x_health.id]
}

resource "google_compute_backend_service" "nexus_x_api_backend" {
  name                  = "nexus-x-api-backend"
  protocol              = "HTTP2"
  timeout_sec           = 60
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = "projects/${var.project_id}/zones/us-central1-a/networkEndpointGroups/nexus-x-api-neg"
  }

  health_checks = [google_compute_health_check.nexus_x_health.id]
}

resource "google_compute_health_check" "nexus_x_health" {
  name = "nexus-x-health-check"

  http2_health_check {
    port         = 443
    request_path = "/health"
  }

  check_interval_sec  = 10
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3
}

# ============================================================================
# Forwarding Rule (HTTPS on 443)
# ============================================================================

resource "google_compute_global_forwarding_rule" "nexus_x_https" {
  name       = "nexus-x-https-forwarding"
  target     = google_compute_target_https_proxy.nexus_x_https_proxy.id
  port_range = "443"
  ip_address = google_compute_global_address.nexus_x_lb_ip.address
}

# HTTP to HTTPS redirect
resource "google_compute_url_map" "nexus_x_http_redirect" {
  name = "nexus-x-http-redirect"

  default_url_redirect {
    https_redirect = true
    strip_query    = false
  }
}

resource "google_compute_target_http_proxy" "nexus_x_http_proxy" {
  name    = "nexus-x-http-proxy"
  url_map = google_compute_url_map.nexus_x_http_redirect.id
}

resource "google_compute_global_forwarding_rule" "nexus_x_http" {
  name       = "nexus-x-http-forwarding"
  target     = google_compute_target_http_proxy.nexus_x_http_proxy.id
  port_range = "80"
  ip_address = google_compute_global_address.nexus_x_lb_ip.address
}

# ============================================================================
# Outputs
# ============================================================================

output "load_balancer_ip" {
  description = "Global Load Balancer IP Address"
  value       = google_compute_global_address.nexus_x_lb_ip.address
}

output "ssl_certificate_status" {
  description = "SSL Certificate provisioning status"
  value       = google_compute_managed_ssl_certificate.nexus_x_primary.managed[0].status
}

output "wildcard_certificate_id" {
  description = "Wildcard Certificate ID"
  value       = google_certificate_manager_certificate.nexus_x_wildcard.id
}

output "dns_authorization_record" {
  description = "DNS record to add for certificate validation"
  value = {
    name  = google_certificate_manager_dns_authorization.nexus_x_dns_auth.dns_resource_record[0].name
    type  = google_certificate_manager_dns_authorization.nexus_x_dns_auth.dns_resource_record[0].type
    value = google_certificate_manager_dns_authorization.nexus_x_dns_auth.dns_resource_record[0].data
  }
}
