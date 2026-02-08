# ============================================
# AWS CLI Setup Script for Windows (PowerShell)
# Field Nine Solutions - Phase 55
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AWS CLI & Infrastructure Setup" -ForegroundColor Cyan
Write-Host "  Field Nine Solutions - Phase 55" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if AWS CLI is installed
$awsInstalled = Get-Command aws -ErrorAction SilentlyContinue

if (-not $awsInstalled) {
    Write-Host "`n[1/4] Installing AWS CLI..." -ForegroundColor Yellow

    # Download AWS CLI MSI installer
    $installerUrl = "https://awscli.amazonaws.com/AWSCLIV2.msi"
    $installerPath = "$env:TEMP\AWSCLIV2.msi"

    Write-Host "Downloading AWS CLI installer..."
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath

    Write-Host "Installing AWS CLI (requires admin privileges)..."
    Start-Process msiexec.exe -Wait -ArgumentList "/i $installerPath /quiet"

    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    Write-Host "[OK] AWS CLI installed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n[1/4] AWS CLI already installed: $(aws --version)" -ForegroundColor Green
}

# Configure AWS credentials
Write-Host "`n[2/4] Configuring AWS Credentials..." -ForegroundColor Yellow
Write-Host "Enter your AWS credentials (from IAM console):" -ForegroundColor Cyan

$accessKey = Read-Host "AWS Access Key ID"
$secretKey = Read-Host "AWS Secret Access Key" -AsSecureString
$region = Read-Host "AWS Region (default: ap-northeast-2)"

if ([string]::IsNullOrEmpty($region)) {
    $region = "ap-northeast-2"
}

# Convert SecureString to plain text
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey)
$secretKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Create AWS credentials file
$awsDir = "$env:USERPROFILE\.aws"
if (-not (Test-Path $awsDir)) {
    New-Item -ItemType Directory -Path $awsDir -Force | Out-Null
}

$credentialsContent = @"
[default]
aws_access_key_id = $accessKey
aws_secret_access_key = $secretKeyPlain
"@

$configContent = @"
[default]
region = $region
output = json
"@

Set-Content -Path "$awsDir\credentials" -Value $credentialsContent
Set-Content -Path "$awsDir\config" -Value $configContent

Write-Host "[OK] AWS credentials configured!" -ForegroundColor Green

# Verify connection
Write-Host "`n[3/4] Verifying AWS Connection..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity | ConvertFrom-Json
    Write-Host "[OK] Connected as: $($identity.Arn)" -ForegroundColor Green
    Write-Host "    Account: $($identity.Account)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Failed to connect to AWS. Check your credentials." -ForegroundColor Red
    exit 1
}

# Create Lambda execution role if not exists
Write-Host "`n[4/4] Setting up IAM Role for Lambda..." -ForegroundColor Yellow

$trustPolicy = @'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
'@

$roleName = "field-nine-lambda-role"

try {
    aws iam get-role --role-name $roleName 2>$null | Out-Null
    Write-Host "[OK] IAM Role '$roleName' already exists" -ForegroundColor Green
} catch {
    Write-Host "Creating IAM Role '$roleName'..."

    # Save trust policy to temp file
    $trustPolicyFile = "$env:TEMP\trust-policy.json"
    Set-Content -Path $trustPolicyFile -Value $trustPolicy

    aws iam create-role `
        --role-name $roleName `
        --assume-role-policy-document "file://$trustPolicyFile"

    # Attach policies
    aws iam attach-role-policy `
        --role-name $roleName `
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

    aws iam attach-role-policy `
        --role-name $roleName `
        --policy-arn "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"

    Write-Host "[OK] IAM Role created with Lambda and DynamoDB permissions" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  AWS CLI Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nNext step: Run deploy-all-lambdas.ps1" -ForegroundColor Cyan
