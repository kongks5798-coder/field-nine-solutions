# 🌍 K-UNIVERSAL Cloudflare Tunnel Setup Guide

**글로벌 접속을 위한 Cloudflare Tunnel 배포 가이드**

---

## 🎯 Why Cloudflare Tunnel?

- ✅ **No Port Forwarding**: 라우터 설정 불필요
- ✅ **Global CDN**: 전 세계 빠른 접속
- ✅ **DDoS Protection**: 자동 공격 방어
- ✅ **Free HTTPS**: 자동 SSL 인증서
- ✅ **Zero Trust**: 보안 네트워크 레이어

---

## 📦 Prerequisites

### 1. Cloudflare 계정
```
https://dash.cloudflare.com
```

### 2. `cloudflared` 설치
```bash
# Windows (PowerShell)
winget install --id Cloudflare.cloudflared

# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

---

## 🚀 Step 1: Cloudflare 로그인

```bash
cloudflared tunnel login
```

브라우저가 열리면 Cloudflare 계정으로 로그인하고 도메인을 선택합니다.

---

## 🏗️ Step 2: Tunnel 생성

```bash
cloudflared tunnel create k-universal
```

**출력 예시**:
```
Created tunnel k-universal with id 12345678-1234-1234-1234-123456789abc
```

Tunnel ID를 복사해두세요!

---

## 🔧 Step 3: 설정 파일 생성

`config.yml` 파일을 생성합니다:

```yaml
# ~/.cloudflared/config.yml (Linux/macOS)
# C:\Users\<username>\.cloudflared\config.yml (Windows)

tunnel: 12345678-1234-1234-1234-123456789abc  # Your tunnel ID
credentials-file: C:\Users\<username>\.cloudflared\12345678-1234-1234-1234-123456789abc.json

ingress:
  # K-Universal Main App
  - hostname: k-universal.com
    service: http://localhost:3000
  
  # API Subdomain (optional)
  - hostname: api.k-universal.com
    service: http://localhost:3000
  
  # Catch-all rule (required)
  - service: http_status:404
```

---

## 🌐 Step 4: DNS 설정

```bash
# 도메인을 Tunnel에 연결
cloudflared tunnel route dns k-universal k-universal.com
cloudflared tunnel route dns k-universal api.k-universal.com
```

---

## ▶️ Step 5: Tunnel 실행

### Development (테스트)
```bash
cloudflared tunnel run k-universal
```

### Production (백그라운드)
```bash
# Windows (서비스 설치)
cloudflared service install

# Linux/macOS (systemd)
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

## 🧪 Step 6: 접속 테스트

```bash
# 로컬에서 앱 실행
npm run dev

# 브라우저에서 접속
https://k-universal.com
```

---

## 🐳 Docker와 함께 사용

### docker-compose.yml 업데이트

```yaml
services:
  k-universal:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    # ... other config

  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=<your-tunnel-token>
    depends_on:
      - k-universal
```

**Tunnel Token 발급**:
```bash
cloudflared tunnel token k-universal
```

---

## 🔐 보안 강화

### 1. IP Whitelist (선택 사항)
Cloudflare Dashboard → Access → Create Policy

### 2. Rate Limiting
```yaml
ingress:
  - hostname: k-universal.com
    service: http://localhost:3000
    originRequest:
      noTLSVerify: false
      connectTimeout: 30s
      tlsTimeout: 30s
```

### 3. WAF Rules
Cloudflare Dashboard → Security → WAF

---

## 📊 모니터링

### Tunnel 상태 확인
```bash
cloudflared tunnel info k-universal
```

### 로그 확인
```bash
# Windows
Get-Content C:\Users\<username>\.cloudflared\cloudflared.log -Tail 50

# Linux/macOS
tail -f ~/.cloudflared/cloudflared.log
```

---

## 🚨 문제 해결

### Tunnel이 연결되지 않을 때
```bash
# Tunnel 재시작
cloudflared tunnel cleanup k-universal
cloudflared tunnel run k-universal
```

### DNS 전파 확인
```bash
# 글로벌 DNS 체크
nslookup k-universal.com
```

전파까지 최대 24시간 소요 (보통 10-30분)

---

## 🎯 최종 체크리스트

- [ ] `cloudflared` 설치 완료
- [ ] Cloudflare 계정 로그인
- [ ] Tunnel 생성 (`k-universal`)
- [ ] config.yml 설정
- [ ] DNS 레코드 추가
- [ ] Tunnel 실행 확인
- [ ] HTTPS 접속 테스트
- [ ] Docker 통합 (선택 사항)

---

## 🌟 프로덕션 배포

### 1. 앱 빌드
```bash
npm run build
npm start
```

### 2. Tunnel 실행
```bash
cloudflared tunnel run k-universal
```

### 3. 접속 확인
```
https://k-universal.com
```

---

## 📝 Custom Domain 설정 (선택 사항)

도메인이 없다면 Cloudflare에서 제공하는 무료 도메인 사용 가능:
```
https://k-universal-12345.trycloudflare.com
```

---

**보스, 이제 K-Universal이 전 세계 어디서든 접속 가능합니다!** 🌍🚀

설정 후 URL:
- **Main**: https://k-universal.com
- **API**: https://api.k-universal.com
- **Demo**: https://k-universal.com/demo
