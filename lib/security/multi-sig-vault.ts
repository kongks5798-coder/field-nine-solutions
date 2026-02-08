/**
 * NEXUS-X Multi-Signature Vault Security System
 * @version 1.0.0 - Phase 10 Institutional Grade
 *
 * Implements multi-signature approval for large fund movements
 * Provides institutional-grade security for NXUSD vault operations
 */

import crypto from 'crypto';

// ============================================
// Types & Interfaces
// ============================================

export interface Signer {
  id: string;
  name: string;
  role: 'CEO' | 'CFO' | 'CTO' | 'COMPLIANCE' | 'EXTERNAL_AUDITOR';
  publicKey: string;
  weight: number;  // Signature weight (1-10)
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  lastActive: string;
}

export interface ApprovalRequest {
  id: string;
  type: 'WITHDRAWAL' | 'TRANSFER' | 'POLICY_CHANGE' | 'EMERGENCY_STOP';
  amount?: number;
  destination?: string;
  reason: string;
  requester: string;
  createdAt: string;
  expiresAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'EXECUTED';
  requiredWeight: number;
  currentWeight: number;
  signatures: Signature[];
}

export interface Signature {
  signerId: string;
  signerName: string;
  role: string;
  weight: number;
  timestamp: string;
  signature: string;  // Cryptographic signature
  approved: boolean;
}

export interface VaultPolicy {
  id: string;
  name: string;
  description: string;
  thresholdAmount: number;  // Amount above which multi-sig is required
  requiredWeight: number;    // Total weight needed for approval
  minSigners: number;        // Minimum number of signers
  timeoutHours: number;      // Hours before request expires
  cooldownHours: number;     // Hours between large withdrawals
  roles: string[];           // Required roles
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  result: 'SUCCESS' | 'FAILURE' | 'PENDING';
}

// ============================================
// Multi-Sig Vault Manager
// ============================================

export class MultiSigVault {
  private signers: Map<string, Signer> = new Map();
  private policies: Map<string, VaultPolicy> = new Map();
  private pendingRequests: Map<string, ApprovalRequest> = new Map();
  private auditLog: AuditLog[] = [];
  private lastLargeWithdrawal: Date | null = null;

  constructor() {
    this.initializeDefaultSigners();
    this.initializeDefaultPolicies();
  }

  // Initialize default signers
  private initializeDefaultSigners(): void {
    const defaultSigners: Signer[] = [
      {
        id: 'SIG-001',
        name: 'CEO',
        role: 'CEO',
        publicKey: this.generateMockPublicKey(),
        weight: 4,
        status: 'ACTIVE',
        lastActive: new Date().toISOString(),
      },
      {
        id: 'SIG-002',
        name: 'CFO',
        role: 'CFO',
        publicKey: this.generateMockPublicKey(),
        weight: 3,
        status: 'ACTIVE',
        lastActive: new Date().toISOString(),
      },
      {
        id: 'SIG-003',
        name: 'CTO',
        role: 'CTO',
        publicKey: this.generateMockPublicKey(),
        weight: 2,
        status: 'ACTIVE',
        lastActive: new Date().toISOString(),
      },
      {
        id: 'SIG-004',
        name: 'Compliance Officer',
        role: 'COMPLIANCE',
        publicKey: this.generateMockPublicKey(),
        weight: 2,
        status: 'ACTIVE',
        lastActive: new Date().toISOString(),
      },
      {
        id: 'SIG-005',
        name: 'External Auditor',
        role: 'EXTERNAL_AUDITOR',
        publicKey: this.generateMockPublicKey(),
        weight: 1,
        status: 'ACTIVE',
        lastActive: new Date().toISOString(),
      },
    ];

    defaultSigners.forEach(signer => this.signers.set(signer.id, signer));
  }

  // Initialize default policies
  private initializeDefaultPolicies(): void {
    const defaultPolicies: VaultPolicy[] = [
      {
        id: 'POL-SMALL',
        name: 'Small Transaction',
        description: 'Transactions under $100 - No approval needed',
        thresholdAmount: 100,
        requiredWeight: 0,
        minSigners: 0,
        timeoutHours: 0,
        cooldownHours: 0,
        roles: [],
      },
      {
        id: 'POL-MEDIUM',
        name: 'Medium Transaction',
        description: 'Transactions $100-$500 - CFO or CEO approval',
        thresholdAmount: 500,
        requiredWeight: 3,
        minSigners: 1,
        timeoutHours: 24,
        cooldownHours: 1,
        roles: ['CEO', 'CFO'],
      },
      {
        id: 'POL-LARGE',
        name: 'Large Transaction',
        description: 'Transactions $500+ - Multi-sig required',
        thresholdAmount: Infinity,
        requiredWeight: 7,
        minSigners: 3,
        timeoutHours: 48,
        cooldownHours: 24,
        roles: ['CEO', 'CFO', 'COMPLIANCE'],
      },
      {
        id: 'POL-EMERGENCY',
        name: 'Emergency Stop',
        description: 'Emergency actions - CEO + CTO required',
        thresholdAmount: 0,
        requiredWeight: 6,
        minSigners: 2,
        timeoutHours: 1,
        cooldownHours: 0,
        roles: ['CEO', 'CTO'],
      },
    ];

    defaultPolicies.forEach(policy => this.policies.set(policy.id, policy));
  }

  // Generate mock public key
  private generateMockPublicKey(): string {
    return '0x' + crypto.randomBytes(32).toString('hex');
  }

  // Get applicable policy for amount
  getApplicablePolicy(amount: number, type: ApprovalRequest['type']): VaultPolicy {
    if (type === 'EMERGENCY_STOP') {
      return this.policies.get('POL-EMERGENCY')!;
    }

    const policies = Array.from(this.policies.values())
      .filter(p => p.id !== 'POL-EMERGENCY')
      .sort((a, b) => a.thresholdAmount - b.thresholdAmount);

    for (const policy of policies) {
      if (amount <= policy.thresholdAmount) {
        return policy;
      }
    }

    return policies[policies.length - 1];
  }

  // Create approval request
  createApprovalRequest(
    type: ApprovalRequest['type'],
    amount: number,
    destination: string,
    reason: string,
    requester: string
  ): ApprovalRequest {
    const policy = this.getApplicablePolicy(amount, type);
    const now = new Date();

    // Check cooldown for large withdrawals
    if (amount > 500 && this.lastLargeWithdrawal) {
      const cooldownMs = policy.cooldownHours * 60 * 60 * 1000;
      if (now.getTime() - this.lastLargeWithdrawal.getTime() < cooldownMs) {
        throw new Error(`Cooldown period active. Next withdrawal available at ${new Date(this.lastLargeWithdrawal.getTime() + cooldownMs).toISOString()}`);
      }
    }

    const request: ApprovalRequest = {
      id: `REQ-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      type,
      amount,
      destination,
      reason,
      requester,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + policy.timeoutHours * 60 * 60 * 1000).toISOString(),
      status: policy.requiredWeight === 0 ? 'APPROVED' : 'PENDING',
      requiredWeight: policy.requiredWeight,
      currentWeight: 0,
      signatures: [],
    };

    if (policy.requiredWeight > 0) {
      this.pendingRequests.set(request.id, request);
    }

    this.addAuditLog('CREATE_APPROVAL_REQUEST', requester, {
      requestId: request.id,
      type,
      amount,
      destination,
      policy: policy.name,
    });

    return request;
  }

  // Sign approval request
  signRequest(requestId: string, signerId: string, approved: boolean): ApprovalRequest {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Request is ${request.status}`);
    }

    if (new Date(request.expiresAt) < new Date()) {
      request.status = 'EXPIRED';
      throw new Error('Request has expired');
    }

    const signer = this.signers.get(signerId);
    if (!signer) {
      throw new Error('Signer not found');
    }

    if (signer.status !== 'ACTIVE') {
      throw new Error('Signer is not active');
    }

    // Check if already signed
    if (request.signatures.some(s => s.signerId === signerId)) {
      throw new Error('Already signed this request');
    }

    // Create signature
    const signature: Signature = {
      signerId,
      signerName: signer.name,
      role: signer.role,
      weight: signer.weight,
      timestamp: new Date().toISOString(),
      signature: this.createSignature(request, signer),
      approved,
    };

    request.signatures.push(signature);

    if (approved) {
      request.currentWeight += signer.weight;
    }

    // Check if approved
    if (request.currentWeight >= request.requiredWeight) {
      const policy = this.getApplicablePolicy(request.amount || 0, request.type);
      if (request.signatures.filter(s => s.approved).length >= policy.minSigners) {
        request.status = 'APPROVED';
      }
    }

    // Check if rejected (more than half rejected)
    const rejections = request.signatures.filter(s => !s.approved).length;
    if (rejections > Math.floor(this.signers.size / 2)) {
      request.status = 'REJECTED';
    }

    this.addAuditLog('SIGN_REQUEST', signerId, {
      requestId,
      approved,
      currentWeight: request.currentWeight,
      status: request.status,
    });

    return request;
  }

  // Execute approved request
  executeRequest(requestId: string): { success: boolean; txHash?: string; error?: string } {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    if (request.status !== 'APPROVED') {
      return { success: false, error: `Request is ${request.status}` };
    }

    // Simulate execution
    const txHash = '0x' + crypto.randomBytes(32).toString('hex');
    request.status = 'EXECUTED';

    if (request.amount && request.amount > 500) {
      this.lastLargeWithdrawal = new Date();
    }

    this.addAuditLog('EXECUTE_REQUEST', 'SYSTEM', {
      requestId,
      txHash,
      amount: request.amount,
      destination: request.destination,
    });

    return { success: true, txHash };
  }

  // Create cryptographic signature
  private createSignature(request: ApprovalRequest, signer: Signer): string {
    const message = JSON.stringify({
      requestId: request.id,
      type: request.type,
      amount: request.amount,
      timestamp: new Date().toISOString(),
    });

    return crypto
      .createHmac('sha256', signer.publicKey)
      .update(message)
      .digest('hex');
  }

  // Add audit log entry
  private addAuditLog(
    action: string,
    actor: string,
    details: Record<string, unknown>
  ): void {
    this.auditLog.push({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      actor,
      details,
      ipAddress: '0.0.0.0',
      userAgent: 'NEXUS-System',
      result: 'SUCCESS',
    });

    // Keep only recent logs
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }
  }

  // Get signers
  getSigners(): Signer[] {
    return Array.from(this.signers.values());
  }

  // Get pending requests
  getPendingRequests(): ApprovalRequest[] {
    return Array.from(this.pendingRequests.values())
      .filter(r => r.status === 'PENDING');
  }

  // Get audit log
  getAuditLog(limit: number = 50): AuditLog[] {
    return this.auditLog.slice(-limit);
  }

  // Get policies
  getPolicies(): VaultPolicy[] {
    return Array.from(this.policies.values());
  }
}

// Export singleton
export const multiSigVault = new MultiSigVault();
