# Field Nine OS Unified Integration - Infrastructure Configuration
# Phase 8.5: Domain Re-mapping & SSL/TLS Hardening
#
# ┌─────────────────────────────────────────────────────────────────────────────┐
# │                    FIELD NINE OS - UNIFIED DOMAIN MAPPING                   │
# ├─────────────────────────────────────────────────────────────────────────────┤
# │                                                                             │
# │  Domain Migration:                                                          │
# │  ├── nexus-x.io          → fieldnine.io (Deprecated)                       │
# │  ├── dashboard.nexus-x.io → nexus.fieldnine.io                             │
# │  ├── m.nexus-x.io        → m.fieldnine.io                                  │
# │  ├── api.nexus-x.io      → api.fieldnine.io                                │
# │  ├── apac.nexus-x.io     → apac.fieldnine.io                               │
# │  ├── au.nexus-x.io       → au.fieldnine.io                                 │
# │  └── jp.nexus-x.io       → jp.fieldnine.io                                 │
# │                                                                             │
# │  Brand Identity: NEXUS-X → Field Nine Energy                               │
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

  backend "gcs" {
    bucket = "fieldnine-terraform-state"
    prefix = "energy/unified"
  }
}

# ============================================================================
# Variables
# ============================================================================

variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "fieldnine-prod"
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for fieldnine.io"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment (prod/staging)"
  type        = string
  default     = "prod"
}

locals {
  # Field Nine unified domain configuration
  primary_domain = "fieldnine.io"

  subdomains = {
    nexus    = "nexus.fieldnine.io"      # Energy Dashboard (CEO)
    mobile   = "m.fieldnine.io"          # Mobile Dashboard
    api      = "api.fieldnine.io"        # API Gateway
    apac     = "apac.fieldnine.io"       # APAC Region
    australia = "au.fieldnine.io"        # Australia (AEMO)
    japan    = "jp.fieldnine.io"         # Japan (JEPX)
    auth     = "auth.fieldnine.io"       # OAuth Gateway
    nomad    = "nomad.fieldnine.io"      # K-Universal Nomad
  }

  # Legacy domain redirects (301)
  legacy_redirects = {
    "nexus-x.io"           = "fieldnine.io"
    "dashboard.nexus-x.io" = "nexus.fieldnine.io"
    "m.nexus-x.io"         = "m.fieldnine.io"
    "api.nexus-x.io"       = "api.fieldnine.io"
    "apac.nexus-x.io"      = "apac.fieldnine.io"
    "au.nexus-x.io"        = "au.fieldnine.io"
    "jp.nexus-x.io"        = "jp.fieldnine.io"
  }
}

# ============================================================================
# Cloudflare Provider
# ============================================================================

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# ============================================================================
# SSL/TLS Wildcard Certificate (*.fieldnine.io)
# ============================================================================

resource "cloudflare_zone_settings_override" "fieldnine_ssl" {
  zone_id = var.cloudflare_zone_id

  settings {
    ssl                      = "strict"
    always_use_https         = "on"
    automatic_https_rewrites = "on"
    min_tls_version          = "1.2"
    tls_1_3                  = "on"

    # Universal SSL with Edge Certificates
    universal_ssl = "on"

    # Security headers (HSTS)
    security_header {
      enabled            = true
      include_subdomains = true
      max_age            = 31536000  # 1 year
      preload            = true
      nosniff            = true
    }

    # Additional security
    browser_check        = "on"
    challenge_ttl        = 1800
    security_level       = "high"

    # Performance
    minify {
      css  = "on"
      html = "on"
      js   = "on"
    }

    brotli = "on"
    http3  = "on"
  }
}

# Advanced Certificate Pack (Wildcard)
resource "cloudflare_certificate_pack" "fieldnine_wildcard" {
  zone_id               = var.cloudflare_zone_id
  type                  = "advanced"
  hosts                 = [
    "fieldnine.io",
    "*.fieldnine.io",
  ]
  validation_method     = "txt"
  validity_days         = 365
  certificate_authority = "digicert"
  cloudflare_branding   = false

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# GCP Managed SSL Certificate
# ============================================================================

resource "google_certificate_manager_dns_authorization" "fieldnine_dns_auth" {
  name        = "fieldnine-dns-auth"
  description = "DNS authorization for fieldnine.io wildcard certificate"
  domain      = "fieldnine.io"
}

resource "google_certificate_manager_certificate" "fieldnine_wildcard" {
  name        = "fieldnine-wildcard-cert"
  description = "Wildcard certificate for *.fieldnine.io"
  scope       = "DEFAULT"

  managed {
    domains = [
      "fieldnine.io",
      "*.fieldnine.io",
    ]

    dns_authorizations = [
      google_certificate_manager_dns_authorization.fieldnine_dns_auth.id,
    ]
  }

  labels = {
    environment = var.environment
    project     = "fieldnine-energy"
  }
}

resource "google_compute_managed_ssl_certificate" "fieldnine_primary" {
  name = "fieldnine-primary-cert"

  managed {
    domains = [
      local.primary_domain,
      local.subdomains.nexus,
      local.subdomains.mobile,
      local.subdomains.api,
      local.subdomains.apac,
      local.subdomains.australia,
      local.subdomains.japan,
      local.subdomains.auth,
      local.subdomains.nomad,
    ]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# DNS Records (Cloudflare)
# ============================================================================

resource "google_compute_global_address" "fieldnine_lb_ip" {
  name = "fieldnine-global-lb-ip"
}

# Root domain
resource "cloudflare_record" "fieldnine_root" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = google_compute_global_address.fieldnine_lb_ip.address
  type    = "A"
  ttl     = 1
  proxied = true
  comment = "Field Nine root domain"
}

# Energy Dashboard (nexus.fieldnine.io)
resource "cloudflare_record" "fieldnine_nexus" {
  zone_id = var.cloudflare_zone_id
  name    = "nexus"
  value   = google_compute_global_address.fieldnine_lb_ip.address
  type    = "A"
  ttl     = 1
  proxied = true
  comment = "Field Nine Energy Dashboard (CEO)"
}

# Mobile Dashboard (m.fieldnine.io)
resource "cloudflare_record" "fieldnine_mobile" {
  zone_id = var.cloudflare_zone_id
  name    = "m"
  value   = google_compute_global_address.fieldnine_lb_ip.address
  type    = "A"
  ttl     = 1
  proxied = true
  comment = "Field Nine Mobile Dashboard"
}

# API Gateway (api.fieldnine.io)
resource "cloudflare_record" "fieldnine_api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  value   = google_compute_global_address.fieldnine_lb_ip.address
  type    = "A"
  ttl     = 1
  proxied = true
  comment = "Field Nine API Gateway"
}

# Auth Gateway (auth.fieldnine.io)
resource "cloudflare_record" "fieldnine_auth" {
  zone_id = var.cloudflare_zone_id
  name    = "auth"
  value   = google_compute_global_address.fieldnine_lb_ip.address
  type    = "A"
  ttl     = 1
  proxied = true
  comment = "Field Nine OAuth Gateway (Google + Kakao)"
}

# APAC Region (apac.fieldnine.io)
resource "cloudflare_record" "fieldnine_apac" {
  zone_id = var.cloudflare_zone_id
  name    = "apac"
  value   = google_compute_global_address.fieldnine_lb_ip.address
  type    = "A"
  ttl     = 1
  proxied = true
  comment = "Field Nine APAC Region"
}

# Australia (au.fieldnine.io)
resource "cloudflare_record" "fieldnine_australia" {
  zone_id = var.cloudflare_zone_id
  name    = "au"
  value   = google_compute_global_address.fieldnine_lb_ip.address
  type    = "A"
  ttl     = 1
  proxied = true
  comment = "Field Nine Australia (AEMO)"
}

# Japan (jp.fieldnine.io)
resource "cloudflare_record" "fieldnine_japan" {
  zone_id = var.cloudflare_zone_id
  name    = "jp"
  value   = google_compute_global_address.fieldnine_lb_ip.address
  type    = "A"
  ttl     = 1
  proxied = true
  comment = "Field Nine Japan (JEPX)"
}

# K-Universal Nomad (nomad.fieldnine.io)
resource "cloudflare_record" "fieldnine_nomad" {
  zone_id = var.cloudflare_zone_id
  name    = "nomad"
  value   = google_compute_global_address.fieldnine_lb_ip.address
  type    = "A"
  ttl     = 1
  proxied = true
  comment = "K-Universal Nomad Monthly"
}

# ============================================================================
# Legacy Domain Redirects (301 Permanent)
# ============================================================================

# Page rule for nexus-x.io → fieldnine.io redirect
resource "cloudflare_page_rule" "legacy_redirect_nexus_x" {
  zone_id  = var.cloudflare_zone_id
  target   = "*.nexus-x.io/*"
  priority = 1

  actions {
    forwarding_url {
      url         = "https://$1.fieldnine.io/$2"
      status_code = 301
    }
  }
}

# ============================================================================
# Load Balancer Configuration
# ============================================================================

resource "google_compute_ssl_policy" "fieldnine_ssl_policy" {
  name            = "fieldnine-ssl-policy"
  profile         = "MODERN"
  min_tls_version = "TLS_1_2"
}

resource "google_compute_url_map" "fieldnine_url_map" {
  name            = "fieldnine-url-map"
  default_service = google_compute_backend_service.fieldnine_default_backend.id

  host_rule {
    hosts        = [local.subdomains.nexus]
    path_matcher = "nexus-dashboard"
  }

  host_rule {
    hosts        = [local.subdomains.mobile]
    path_matcher = "mobile-dashboard"
  }

  host_rule {
    hosts        = [local.subdomains.api]
    path_matcher = "api-gateway"
  }

  host_rule {
    hosts        = [local.subdomains.auth]
    path_matcher = "auth-gateway"
  }

  host_rule {
    hosts        = [local.subdomains.nomad]
    path_matcher = "nomad-service"
  }

  path_matcher {
    name            = "nexus-dashboard"
    default_service = google_compute_backend_service.fieldnine_nexus_backend.id
  }

  path_matcher {
    name            = "mobile-dashboard"
    default_service = google_compute_backend_service.fieldnine_mobile_backend.id
  }

  path_matcher {
    name            = "api-gateway"
    default_service = google_compute_backend_service.fieldnine_api_backend.id
  }

  path_matcher {
    name            = "auth-gateway"
    default_service = google_compute_backend_service.fieldnine_auth_backend.id
  }

  path_matcher {
    name            = "nomad-service"
    default_service = google_compute_backend_service.fieldnine_nomad_backend.id
  }
}

# Backend Services
resource "google_compute_backend_service" "fieldnine_default_backend" {
  name                  = "fieldnine-default-backend"
  protocol              = "HTTP2"
  timeout_sec           = 30
  load_balancing_scheme = "EXTERNAL_MANAGED"
  health_checks         = [google_compute_health_check.fieldnine_health.id]
}

resource "google_compute_backend_service" "fieldnine_nexus_backend" {
  name                  = "fieldnine-nexus-backend"
  protocol              = "HTTP2"
  timeout_sec           = 30
  load_balancing_scheme = "EXTERNAL_MANAGED"
  health_checks         = [google_compute_health_check.fieldnine_health.id]
}

resource "google_compute_backend_service" "fieldnine_mobile_backend" {
  name                  = "fieldnine-mobile-backend"
  protocol              = "HTTP2"
  timeout_sec           = 30
  load_balancing_scheme = "EXTERNAL_MANAGED"
  health_checks         = [google_compute_health_check.fieldnine_health.id]
}

resource "google_compute_backend_service" "fieldnine_api_backend" {
  name                  = "fieldnine-api-backend"
  protocol              = "HTTP2"
  timeout_sec           = 60
  load_balancing_scheme = "EXTERNAL_MANAGED"
  health_checks         = [google_compute_health_check.fieldnine_health.id]
}

resource "google_compute_backend_service" "fieldnine_auth_backend" {
  name                  = "fieldnine-auth-backend"
  protocol              = "HTTP2"
  timeout_sec           = 30
  load_balancing_scheme = "EXTERNAL_MANAGED"
  health_checks         = [google_compute_health_check.fieldnine_health.id]
}

resource "google_compute_backend_service" "fieldnine_nomad_backend" {
  name                  = "fieldnine-nomad-backend"
  protocol              = "HTTP2"
  timeout_sec           = 30
  load_balancing_scheme = "EXTERNAL_MANAGED"
  health_checks         = [google_compute_health_check.fieldnine_health.id]
}

resource "google_compute_health_check" "fieldnine_health" {
  name = "fieldnine-health-check"

  http2_health_check {
    port         = 443
    request_path = "/health"
  }

  check_interval_sec  = 10
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3
}

# HTTPS Proxy
resource "google_compute_target_https_proxy" "fieldnine_https_proxy" {
  name             = "fieldnine-https-proxy"
  url_map          = google_compute_url_map.fieldnine_url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.fieldnine_primary.id]
  ssl_policy       = google_compute_ssl_policy.fieldnine_ssl_policy.id
}

# Forwarding Rule
resource "google_compute_global_forwarding_rule" "fieldnine_https" {
  name       = "fieldnine-https-forwarding"
  target     = google_compute_target_https_proxy.fieldnine_https_proxy.id
  port_range = "443"
  ip_address = google_compute_global_address.fieldnine_lb_ip.address
}

# HTTP → HTTPS Redirect
resource "google_compute_url_map" "fieldnine_http_redirect" {
  name = "fieldnine-http-redirect"

  default_url_redirect {
    https_redirect = true
    strip_query    = false
  }
}

resource "google_compute_target_http_proxy" "fieldnine_http_proxy" {
  name    = "fieldnine-http-proxy"
  url_map = google_compute_url_map.fieldnine_http_redirect.id
}

resource "google_compute_global_forwarding_rule" "fieldnine_http" {
  name       = "fieldnine-http-forwarding"
  target     = google_compute_target_http_proxy.fieldnine_http_proxy.id
  port_range = "80"
  ip_address = google_compute_global_address.fieldnine_lb_ip.address
}

# ============================================================================
# Outputs
# ============================================================================

output "load_balancer_ip" {
  description = "Global Load Balancer IP Address"
  value       = google_compute_global_address.fieldnine_lb_ip.address
}

output "unified_domains" {
  description = "Field Nine Unified Domain Mapping"
  value       = local.subdomains
}

output "ssl_certificate_status" {
  description = "SSL Certificate Status"
  value       = google_compute_managed_ssl_certificate.fieldnine_primary.managed[0].status
}

output "wildcard_certificate_id" {
  description = "Wildcard Certificate ID"
  value       = google_certificate_manager_certificate.fieldnine_wildcard.id
}
