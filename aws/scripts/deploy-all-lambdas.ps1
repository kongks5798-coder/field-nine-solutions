# ============================================
# Lambda Deployment Script - All 6 Functions
# Field Nine Solutions - Phase 55
# ============================================

param(
    [string]$Region = "ap-northeast-2",
    [string]$Stage = "prod"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$LambdaDir = Join-Path $ProjectRoot "aws\lambda"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Lambda Deployment - All Functions" -ForegroundColor Cyan
Write-Host "  Region: $Region | Stage: $Stage" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get AWS Account ID
$AccountId = (aws sts get-caller-identity --query Account --output text)
$RoleArn = "arn:aws:iam::${AccountId}:role/field-nine-lambda-role"

Write-Host "`nAWS Account: $AccountId" -ForegroundColor Gray
Write-Host "Lambda Role: $RoleArn" -ForegroundColor Gray

# Lambda functions to deploy
$Functions = @(
    @{
        Name = "field-nine-recommend-shopping"
        Path = "recommend-shopping"
        Handler = "index.handler"
        Memory = 512
        Timeout = 30
        EnvVars = @{
            OPENAI_API_KEY = $env:OPENAI_API_KEY
            OPENAI_MODEL = "gpt-4o-mini"
            USERS_TABLE_NAME = "Users"
        }
    },
    @{
        Name = "field-nine-daily-schedule"
        Path = "daily-schedule"
        Handler = "index.handler"
        Memory = 512
        Timeout = 30
        EnvVars = @{
            OPENAI_API_KEY = $env:OPENAI_API_KEY
            USERS_TABLE_NAME = "Users"
        }
    },
    @{
        Name = "field-nine-predict-savings"
        Path = "predict-savings"
        Handler = "index.handler"
        Memory = 256
        Timeout = 15
        EnvVars = @{
            RECOMMENDATIONS_TABLE_NAME = "ProductRecommendations"
            USERS_TABLE_NAME = "Users"
        }
    },
    @{
        Name = "field-nine-stripe-webhook"
        Path = "stripe-webhook"
        Handler = "index.handler"
        Memory = 256
        Timeout = 30
        EnvVars = @{
            STRIPE_SECRET_KEY = $env:STRIPE_SECRET_KEY
            STRIPE_WEBHOOK_SECRET = $env:STRIPE_WEBHOOK_SECRET
            USERS_TABLE_NAME = "Users"
        }
    },
    @{
        Name = "field-nine-create-subscription"
        Path = "create-subscription"
        Handler = "index.handler"
        Memory = 256
        Timeout = 30
        EnvVars = @{
            STRIPE_SECRET_KEY = $env:STRIPE_SECRET_KEY
            USERS_TABLE_NAME = "Users"
        }
    },
    @{
        Name = "field-nine-crypto-arbitrage"
        Path = "crypto-arbitrage"
        Handler = "index.handler"
        Memory = 512
        Timeout = 60
        EnvVars = @{
            OPENAI_API_KEY = $env:OPENAI_API_KEY
        }
    }
)

# Create DynamoDB tables first
Write-Host "`n[1/3] Creating DynamoDB Tables..." -ForegroundColor Yellow

$Tables = @("Users", "ProductRecommendations")
foreach ($Table in $Tables) {
    $exists = aws dynamodb describe-table --table-name $Table --region $Region 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Table '$Table' exists" -ForegroundColor Green
    } else {
        Write-Host "  Creating table '$Table'..."
        aws dynamodb create-table `
            --table-name $Table `
            --attribute-definitions AttributeName=userId,AttributeType=S `
            --key-schema AttributeName=userId,KeyType=HASH `
            --billing-mode PAY_PER_REQUEST `
            --region $Region
        Write-Host "  [OK] Table '$Table' created" -ForegroundColor Green
    }
}

# Deploy each Lambda function
Write-Host "`n[2/3] Deploying Lambda Functions..." -ForegroundColor Yellow

$DeployedFunctions = @()

foreach ($Func in $Functions) {
    $FuncPath = Join-Path $LambdaDir $Func.Path
    $ZipPath = Join-Path $env:TEMP "$($Func.Name).zip"

    Write-Host "`n  Deploying: $($Func.Name)" -ForegroundColor Cyan

    # Check if function directory exists
    if (-not (Test-Path $FuncPath)) {
        Write-Host "    [SKIP] Directory not found: $FuncPath" -ForegroundColor Yellow
        continue
    }

    # Install dependencies
    Push-Location $FuncPath
    if (Test-Path "package.json") {
        Write-Host "    Installing dependencies..."
        npm install --production --silent 2>$null
    }

    # Create ZIP
    Write-Host "    Creating deployment package..."
    if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
    Compress-Archive -Path "$FuncPath\*" -DestinationPath $ZipPath -Force
    Pop-Location

    # Check if function exists
    $funcExists = aws lambda get-function --function-name $Func.Name --region $Region 2>$null

    # Build environment variables string
    $envVarsJson = ($Func.EnvVars | ConvertTo-Json -Compress) -replace '"', '\"'

    if ($LASTEXITCODE -eq 0) {
        # Update existing function
        Write-Host "    Updating function code..."
        aws lambda update-function-code `
            --function-name $Func.Name `
            --zip-file "fileb://$ZipPath" `
            --region $Region | Out-Null

        Start-Sleep -Seconds 2

        Write-Host "    Updating configuration..."
        aws lambda update-function-configuration `
            --function-name $Func.Name `
            --memory-size $Func.Memory `
            --timeout $Func.Timeout `
            --environment "Variables=$envVarsJson" `
            --region $Region | Out-Null
    } else {
        # Create new function
        Write-Host "    Creating new function..."
        aws lambda create-function `
            --function-name $Func.Name `
            --runtime nodejs18.x `
            --role $RoleArn `
            --handler $Func.Handler `
            --zip-file "fileb://$ZipPath" `
            --memory-size $Func.Memory `
            --timeout $Func.Timeout `
            --environment "Variables=$envVarsJson" `
            --region $Region | Out-Null
    }

    Write-Host "    [OK] $($Func.Name) deployed" -ForegroundColor Green
    $DeployedFunctions += $Func.Name

    # Cleanup
    Remove-Item $ZipPath -Force -ErrorAction SilentlyContinue
}

# Create API Gateway
Write-Host "`n[3/3] Creating API Gateway..." -ForegroundColor Yellow

$ApiName = "field-nine-api-$Stage"

# Check if API exists
$existingApis = aws apigateway get-rest-apis --region $Region | ConvertFrom-Json
$api = $existingApis.items | Where-Object { $_.name -eq $ApiName } | Select-Object -First 1

if ($api) {
    $ApiId = $api.id
    Write-Host "  [OK] API Gateway exists: $ApiId" -ForegroundColor Green
} else {
    Write-Host "  Creating API Gateway..."
    $newApi = aws apigateway create-rest-api `
        --name $ApiName `
        --description "Field Nine AI API - $Stage" `
        --region $Region | ConvertFrom-Json
    $ApiId = $newApi.id
    Write-Host "  [OK] API Gateway created: $ApiId" -ForegroundColor Green
}

# Get root resource ID
$resources = aws apigateway get-resources --rest-api-id $ApiId --region $Region | ConvertFrom-Json
$rootId = ($resources.items | Where-Object { $_.path -eq "/" }).id

# Create resources and methods for each function
$Endpoints = @(
    @{ Path = "recommend"; Function = "field-nine-recommend-shopping" },
    @{ Path = "schedule"; Function = "field-nine-daily-schedule" },
    @{ Path = "predict-savings"; Function = "field-nine-predict-savings" },
    @{ Path = "webhook"; Function = "field-nine-stripe-webhook" },
    @{ Path = "subscription"; Function = "field-nine-create-subscription" },
    @{ Path = "arbitrage"; Function = "field-nine-crypto-arbitrage" }
)

foreach ($Endpoint in $Endpoints) {
    $existingResource = $resources.items | Where-Object { $_.pathPart -eq $Endpoint.Path }

    if (-not $existingResource) {
        Write-Host "  Creating /$($Endpoint.Path) endpoint..."
        $resource = aws apigateway create-resource `
            --rest-api-id $ApiId `
            --parent-id $rootId `
            --path-part $Endpoint.Path `
            --region $Region | ConvertFrom-Json

        $resourceId = $resource.id
    } else {
        $resourceId = $existingResource.id
    }

    # Create POST method with Lambda integration
    $lambdaUri = "arn:aws:apigateway:${Region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${Region}:${AccountId}:function:$($Endpoint.Function)/invocations"

    aws apigateway put-method `
        --rest-api-id $ApiId `
        --resource-id $resourceId `
        --http-method POST `
        --authorization-type NONE `
        --region $Region 2>$null

    aws apigateway put-integration `
        --rest-api-id $ApiId `
        --resource-id $resourceId `
        --http-method POST `
        --type AWS_PROXY `
        --integration-http-method POST `
        --uri $lambdaUri `
        --region $Region 2>$null

    # Add Lambda permission
    aws lambda add-permission `
        --function-name $Endpoint.Function `
        --statement-id "apigateway-$($Endpoint.Path)" `
        --action lambda:InvokeFunction `
        --principal apigateway.amazonaws.com `
        --source-arn "arn:aws:execute-api:${Region}:${AccountId}:${ApiId}/*/*/$($Endpoint.Path)" `
        --region $Region 2>$null

    Write-Host "    [OK] /$($Endpoint.Path) -> $($Endpoint.Function)" -ForegroundColor Green
}

# Deploy API
Write-Host "`n  Deploying API to '$Stage' stage..."
aws apigateway create-deployment `
    --rest-api-id $ApiId `
    --stage-name $Stage `
    --region $Region | Out-Null

$ApiUrl = "https://${ApiId}.execute-api.${Region}.amazonaws.com/${Stage}"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nAPI Gateway URL:" -ForegroundColor Cyan
Write-Host "  $ApiUrl" -ForegroundColor White
Write-Host "`nDeployed Functions:" -ForegroundColor Cyan
foreach ($f in $DeployedFunctions) {
    Write-Host "  - $f" -ForegroundColor White
}
Write-Host "`nNext: Add to .env.local:" -ForegroundColor Yellow
Write-Host "  NEXT_PUBLIC_API_GATEWAY_URL=$ApiUrl" -ForegroundColor Gray
