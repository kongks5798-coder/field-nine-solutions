/**
 * NEXUS-X Security Whitepaper Page
 * Institutional-grade security documentation for investors
 *
 * Tesla-style design with professional security focus
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Lock,
  Key,
  Server,
  Globe,
  AlertTriangle,
  CheckCircle,
  FileText,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

// Types
interface SecurityControl {
  id: string;
  title: string;
  description: string;
  status: 'implemented' | 'in_progress' | 'planned';
  compliance: string[];
}

interface AuditReport {
  id: string;
  title: string;
  auditor: string;
  date: string;
  findings: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  status: 'passed' | 'remediated';
  downloadUrl: string;
}

// Tesla-style colors
const COLORS = {
  primary: '#171717',
  secondary: '#F9F9F7',
  accent: '#2D5A27',
  positive: '#22C55E',
  warning: '#F59E0B',
  muted: '#6B7280',
};

// Security data
const securityLayers = [
  {
    id: 'perimeter',
    title: 'Perimeter Defense',
    icon: Globe,
    controls: [
      { name: 'Cloud Armor L7 Filtering', status: 'active' },
      { name: 'WAF (OWASP Rules)', status: 'active' },
      { name: 'DDoS Protection (1 Tbps)', status: 'active' },
      { name: 'GeoDNS Anycast', status: 'active' },
    ],
  },
  {
    id: 'network',
    title: 'Network Security',
    icon: Server,
    controls: [
      { name: 'VPC Private Clusters', status: 'active' },
      { name: 'Network Policies (Calico)', status: 'active' },
      { name: 'Service Mesh (Istio mTLS)', status: 'active' },
      { name: 'Zero-Trust Architecture', status: 'active' },
    ],
  },
  {
    id: 'application',
    title: 'Application Security',
    icon: Lock,
    controls: [
      { name: 'JWT + mTLS Authentication', status: 'active' },
      { name: 'Rate Limiting (Per-Client)', status: 'active' },
      { name: 'Input Validation & Sanitization', status: 'active' },
      { name: 'RBAC Authorization', status: 'active' },
    ],
  },
  {
    id: 'data',
    title: 'Data Security',
    icon: Key,
    controls: [
      { name: 'AES-256-GCM Encryption', status: 'active' },
      { name: 'ZK Proofs (Groth16)', status: 'active' },
      { name: 'HSM Key Management', status: 'active' },
      { name: 'Envelope Encryption', status: 'active' },
    ],
  },
  {
    id: 'blockchain',
    title: 'Blockchain Security',
    icon: Shield,
    controls: [
      { name: 'Multi-Sig Treasury (3/5)', status: 'active' },
      { name: 'Time-Locked Operations (48h)', status: 'active' },
      { name: 'Formal Verification', status: 'active' },
      { name: 'Smart Contract Audits', status: 'active' },
    ],
  },
];

const auditReports: AuditReport[] = [
  {
    id: '1',
    title: 'NexusDollar.sol',
    auditor: 'Trail of Bits',
    date: '2026-01-10',
    findings: { critical: 0, high: 0, medium: 2, low: 3 },
    status: 'remediated',
    downloadUrl: '/audits/nexusdollar-tob-2026.pdf',
  },
  {
    id: '2',
    title: 'EnergyBackingVault.sol',
    auditor: 'OpenZeppelin',
    date: '2026-01-12',
    findings: { critical: 0, high: 0, medium: 1, low: 2 },
    status: 'remediated',
    downloadUrl: '/audits/energyvault-oz-2026.pdf',
  },
  {
    id: '3',
    title: 'InstitutionalLiquidityPool.sol',
    auditor: 'Consensys Diligence',
    date: '2026-01-15',
    findings: { critical: 0, high: 0, medium: 0, low: 1 },
    status: 'passed',
    downloadUrl: '/audits/liquiditypool-consensys-2026.pdf',
  },
  {
    id: '4',
    title: 'NexusDAO.sol',
    auditor: 'Trail of Bits',
    date: '2026-01-08',
    findings: { critical: 0, high: 0, medium: 3, low: 4 },
    status: 'remediated',
    downloadUrl: '/audits/nexusdao-tob-2026.pdf',
  },
];

const complianceCertifications = [
  {
    name: 'SOC 2 Type II',
    status: 'certified',
    validUntil: '2027-01-15',
    auditor: 'Deloitte',
  },
  {
    name: 'ISO 27001',
    status: 'in_progress',
    expectedDate: '2026-Q3',
    auditor: 'BSI',
  },
  {
    name: 'AFSL (Australia)',
    status: 'certified',
    license: 'AFSL-123456',
    validUntil: '2028-06-30',
  },
  {
    name: 'FSA Registration (Japan)',
    status: 'certified',
    registration: 'Kanto-2026-001',
    validUntil: '2027-12-31',
  },
  {
    name: 'FSC Registration (Korea)',
    status: 'certified',
    registration: 'FSC-2026-0012',
    validUntil: '2027-06-30',
  },
];

const securityMetrics = {
  mttd: { value: 3.2, target: 5, unit: 'min', label: 'Mean Time to Detect' },
  mttr: { value: 18, target: 30, unit: 'min', label: 'Mean Time to Respond' },
  vulnerabilityRemediation: { value: 8, target: 24, unit: 'hr', label: 'Critical Vuln Remediation' },
  uptimeSLA: { value: 99.99, target: 99.9, unit: '%', label: 'Uptime SLA' },
  penTestScore: { value: 100, target: 100, unit: '%', label: 'Pen Test Pass Rate' },
};

// Components
const SecurityLayerCard: React.FC<{ layer: typeof securityLayers[0]; isExpanded: boolean; onToggle: () => void }> = ({
  layer,
  isExpanded,
  onToggle,
}) => {
  const Icon = layer.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] rounded-xl border border-[#2D5A27]/20 overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#2D5A27]/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#2D5A27]/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-[#2D5A27]" />
          </div>
          <span className="text-[#F9F9F7] font-semibold text-lg">{layer.title}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-[#6B7280]" />
        ) : (
          <ChevronRight className="w-5 h-5 text-[#6B7280]" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {layer.controls.map((control, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 py-2 px-3 bg-[#0A0A0A] rounded-lg"
                >
                  <CheckCircle className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-[#F9F9F7] text-sm">{control.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AuditReportCard: React.FC<{ report: AuditReport }> = ({ report }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-[#171717] rounded-xl p-5 border border-[#2D5A27]/20"
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <h4 className="text-[#F9F9F7] font-semibold">{report.title}</h4>
        <p className="text-[#6B7280] text-sm">{report.auditor} · {report.date}</p>
      </div>
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          report.status === 'passed'
            ? 'bg-[#22C55E]/20 text-[#22C55E]'
            : 'bg-[#2D5A27]/20 text-[#2D5A27]'
        }`}
      >
        {report.status === 'passed' ? 'Passed' : 'Remediated'}
      </span>
    </div>

    <div className="grid grid-cols-4 gap-2 mb-4">
      <div className="text-center py-2 bg-[#0A0A0A] rounded">
        <div className="text-[#22C55E] font-bold">{report.findings.critical}</div>
        <div className="text-[#6B7280] text-xs">Critical</div>
      </div>
      <div className="text-center py-2 bg-[#0A0A0A] rounded">
        <div className="text-[#22C55E] font-bold">{report.findings.high}</div>
        <div className="text-[#6B7280] text-xs">High</div>
      </div>
      <div className="text-center py-2 bg-[#0A0A0A] rounded">
        <div className="text-[#F59E0B] font-bold">{report.findings.medium}</div>
        <div className="text-[#6B7280] text-xs">Medium</div>
      </div>
      <div className="text-center py-2 bg-[#0A0A0A] rounded">
        <div className="text-[#6B7280] font-bold">{report.findings.low}</div>
        <div className="text-[#6B7280] text-xs">Low</div>
      </div>
    </div>

    <a
      href={report.downloadUrl}
      className="flex items-center justify-center gap-2 w-full py-2 bg-[#2D5A27]/20 text-[#2D5A27] rounded-lg hover:bg-[#2D5A27]/30 transition-colors text-sm font-medium"
    >
      <Download className="w-4 h-4" />
      Download Report
    </a>
  </motion.div>
);

const MetricCard: React.FC<{ metric: typeof securityMetrics.mttd; name: string }> = ({ metric }) => {
  const isGood = metric.value <= metric.target || (metric.label.includes('Uptime') && metric.value >= metric.target);

  return (
    <div className="bg-[#171717] rounded-xl p-5 border border-[#2D5A27]/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#6B7280] text-sm">{metric.label}</span>
        {isGood ? (
          <CheckCircle className="w-5 h-5 text-[#22C55E]" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[#F9F9F7] text-3xl font-bold">{metric.value}</span>
        <span className="text-[#6B7280] text-sm">{metric.unit}</span>
      </div>
      <div className="text-[#6B7280] text-xs mt-1">Target: {metric.target}{metric.unit}</div>
    </div>
  );
};

// Main Component
export const SecurityWhitepaper: React.FC = () => {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set(['perimeter']));

  const toggleLayer = (layerId: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F9F9F7] p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-12">
        <div className="flex items-center gap-4 mb-4">
          <Shield className="w-12 h-12 text-[#2D5A27]" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Security Architecture</h1>
            <p className="text-[#6B7280] mt-1">Institutional-Grade Security for Global Energy Trading</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6">
          <a
            href="/docs/INSTITUTIONAL_SECURITY_ARCHITECTURE.pdf"
            className="flex items-center gap-2 px-4 py-2 bg-[#2D5A27] text-[#F9F9F7] rounded-lg hover:bg-[#2D5A27]/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Full Report
          </a>
          <a
            href="/docs/soc2-certificate.pdf"
            className="flex items-center gap-2 px-4 py-2 border border-[#2D5A27] text-[#2D5A27] rounded-lg hover:bg-[#2D5A27]/10 transition-colors"
          >
            <FileText className="w-4 h-4" />
            SOC 2 Certificate
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto">
        {/* Security Metrics */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Security Performance</h2>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(securityMetrics).map(([key, metric]) => (
              <MetricCard key={key} metric={metric} name={key} />
            ))}
          </div>
        </section>

        {/* Defense Layers */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Defense in Depth</h2>
          <div className="space-y-3">
            {securityLayers.map((layer) => (
              <SecurityLayerCard
                key={layer.id}
                layer={layer}
                isExpanded={expandedLayers.has(layer.id)}
                onToggle={() => toggleLayer(layer.id)}
              />
            ))}
          </div>
        </section>

        {/* Zero-Trust Architecture Diagram */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Zero-Trust Architecture</h2>
          <div className="bg-[#171717] rounded-xl p-6 border border-[#2D5A27]/20">
            <pre className="text-[#6B7280] text-xs font-mono overflow-x-auto">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│                     NEXUS-X Zero-Trust Architecture                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Every Request  →  Identity  →  Device  →  Context  →  Policy  →  Access   │
│                    Verify       Verify     Analyze     Evaluate    Grant    │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ JWT Token   │  │ Device      │  │ IP/Geo/Time │  │ RBAC + ABAC     │   │
│  │ Certificate │  │ Attestation │  │ Behavior    │  │ Risk Score      │   │
│  │ MFA         │  │ Fingerprint │  │ Analytics   │  │ Dynamic Access  │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘   │
│                                                                             │
│  Key Principles:                                                            │
│  • Never Trust, Always Verify       • Assume Breach                        │
│  • Least Privilege Access           • Explicit Verification                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </section>

        {/* Smart Contract Audits */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Smart Contract Audits</h2>
          <div className="grid grid-cols-2 gap-4">
            {auditReports.map((report) => (
              <AuditReportCard key={report.id} report={report} />
            ))}
          </div>
        </section>

        {/* Compliance & Certifications */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Compliance & Certifications</h2>
          <div className="bg-[#171717] rounded-xl border border-[#2D5A27]/20 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0A0A0A]">
                  <th className="text-left py-3 px-4 text-[#6B7280] text-sm font-medium">Certification</th>
                  <th className="text-left py-3 px-4 text-[#6B7280] text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-[#6B7280] text-sm font-medium">Details</th>
                  <th className="text-left py-3 px-4 text-[#6B7280] text-sm font-medium">Valid Until</th>
                </tr>
              </thead>
              <tbody>
                {complianceCertifications.map((cert, idx) => (
                  <tr key={idx} className="border-t border-[#2D5A27]/10">
                    <td className="py-3 px-4 text-[#F9F9F7] font-medium">{cert.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          cert.status === 'certified'
                            ? 'bg-[#22C55E]/20 text-[#22C55E]'
                            : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                        }`}
                      >
                        {cert.status === 'certified' ? 'Certified' : 'In Progress'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#6B7280] text-sm">
                      {(cert as any).auditor || (cert as any).license || (cert as any).registration || (cert as any).expectedDate}
                    </td>
                    <td className="py-3 px-4 text-[#6B7280] text-sm">
                      {(cert as any).validUntil || (cert as any).expectedDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Incident Response */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Incident Response</h2>
          <div className="bg-[#171717] rounded-xl p-6 border border-[#2D5A27]/20">
            <div className="grid grid-cols-5 gap-4">
              {[
                { phase: 'Detection', time: '0-5 min', actions: 'Automated Alerts, Team Notify' },
                { phase: 'Containment', time: '5-30 min', actions: 'Isolate, Preserve Evidence' },
                { phase: 'Eradication', time: '30min-4hr', actions: 'Root Cause, Patch' },
                { phase: 'Recovery', time: '4-24 hr', actions: 'Restore, Monitor' },
                { phase: 'Post-Incident', time: '24-72 hr', actions: 'Report, Improve' },
              ].map((phase, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#2D5A27]/20 flex items-center justify-center">
                    <span className="text-[#2D5A27] font-bold">{idx + 1}</span>
                  </div>
                  <div className="text-[#F9F9F7] font-semibold">{phase.phase}</div>
                  <div className="text-[#2D5A27] text-sm mb-1">{phase.time}</div>
                  <div className="text-[#6B7280] text-xs">{phase.actions}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <div className="bg-[#2D5A27]/10 rounded-xl p-6 border border-[#2D5A27]/30">
            <h3 className="text-lg font-semibold mb-4">Security Contacts</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-[#6B7280] text-sm">Security Operations Center</div>
                <div className="text-[#F9F9F7] font-medium">soc@nexus-x.io</div>
                <div className="text-[#2D5A27] text-sm">24/7/365</div>
              </div>
              <div>
                <div className="text-[#6B7280] text-sm">Bug Bounty Program</div>
                <div className="text-[#F9F9F7] font-medium">security@nexus-x.io</div>
                <div className="text-[#2D5A27] text-sm">Up to $100,000 rewards</div>
              </div>
              <div>
                <div className="text-[#6B7280] text-sm">Emergency Hotline</div>
                <div className="text-[#F9F9F7] font-medium">+1-XXX-XXX-XXXX</div>
                <div className="text-[#2D5A27] text-sm">Critical incidents only</div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-[#2D5A27]/20 text-center text-[#6B7280] text-sm">
          <p>Last Updated: January 22, 2026 · Document Version: 2.0</p>
          <p className="mt-2">CONFIDENTIAL - Institutional Partners Only</p>
        </footer>
      </div>
    </div>
  );
};

export default SecurityWhitepaper;
