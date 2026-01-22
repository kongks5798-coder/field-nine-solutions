'use client';

import { useState, useEffect } from 'react';

/**
 * EPO ENERGY CREDIT GRADE SAMPLE REPORT
 *
 * 금융권용 Energy Credit Grade 샘플 리포트
 * S&P/Moody's 스타일의 에너지 자산 신용등급
 */

interface CreditReport {
  reportId: string;
  generatedAt: string;
  validUntil: string;
  nodeId: string;
  nodeName: string;
  nodeLocation: string;
  nodeType: string;
  capacity: number;
  operationalSince: string;

  // Overall Grade
  overallGrade: string;
  gradeScore: number;
  gradeOutlook: 'Positive' | 'Stable' | 'Negative' | 'Watch';
  previousGrade: string;
  gradeChange: 'upgrade' | 'downgrade' | 'stable';

  // Component Scores (0-100)
  components: {
    productionStability: { score: number; grade: string; trend: string };
    complianceHistory: { score: number; grade: string; trend: string };
    financialHealth: { score: number; grade: string; trend: string };
    marketPosition: { score: number; grade: string; trend: string };
    regulatoryRisk: { score: number; grade: string; trend: string };
  };

  // Historical Production
  monthlyProduction: Array<{
    month: string;
    actual: number;
    projected: number;
    variance: number;
  }>;

  // Lending Assessment
  lending: {
    maxLoanAmount: number;
    suggestedRate: number;
    ltv: number;
    debtServiceCoverage: number;
    paybackPeriod: number;
    collateralValue: number;
  };

  // Insurance Assessment
  insurance: {
    insurabilityGrade: string;
    basePremium: number;
    riskAdjustedPremium: number;
    coverageLimit: number;
    deductible: number;
    exclusions: string[];
  };

  // Risk Factors
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    mitigation: string;
  }>;

  // Revenue Projection
  revenueProjection: {
    annual: number;
    fiveYear: number;
    npv: number;
    irr: number;
  };
}

const SAMPLE_REPORT: CreditReport = {
  reportId: 'ECG-2026-KR-001847',
  generatedAt: '2026-01-22T10:30:00Z',
  validUntil: '2026-04-22T10:30:00Z',
  nodeId: 'YEONGDONG-001',
  nodeName: '영동 태양광 발전소',
  nodeLocation: 'Yeongdong-gun, Chungcheongbuk-do, South Korea',
  nodeType: 'Solar PV',
  capacity: 50000, // kW
  operationalSince: '2023-03-15',

  overallGrade: 'AA',
  gradeScore: 87,
  gradeOutlook: 'Positive',
  previousGrade: 'A+',
  gradeChange: 'upgrade',

  components: {
    productionStability: { score: 92, grade: 'AAA', trend: '↑' },
    complianceHistory: { score: 95, grade: 'AAA', trend: '→' },
    financialHealth: { score: 85, grade: 'AA', trend: '↑' },
    marketPosition: { score: 78, grade: 'A+', trend: '↑' },
    regulatoryRisk: { score: 88, grade: 'AA', trend: '→' },
  },

  monthlyProduction: [
    { month: '2025-07', actual: 6800000, projected: 6500000, variance: 4.6 },
    { month: '2025-08', actual: 7200000, projected: 7000000, variance: 2.9 },
    { month: '2025-09', actual: 5900000, projected: 5800000, variance: 1.7 },
    { month: '2025-10', actual: 4500000, projected: 4600000, variance: -2.2 },
    { month: '2025-11', actual: 3200000, projected: 3100000, variance: 3.2 },
    { month: '2025-12', actual: 2800000, projected: 2900000, variance: -3.4 },
  ],

  lending: {
    maxLoanAmount: 45000000,
    suggestedRate: 4.25,
    ltv: 75,
    debtServiceCoverage: 1.45,
    paybackPeriod: 8.5,
    collateralValue: 60000000,
  },

  insurance: {
    insurabilityGrade: 'A',
    basePremium: 125000,
    riskAdjustedPremium: 98750,
    coverageLimit: 60000000,
    deductible: 500000,
    exclusions: ['Acts of War', 'Nuclear Incident', 'Intentional Damage'],
  },

  riskFactors: [
    {
      factor: 'Weather Dependency',
      severity: 'medium',
      description: 'Solar output varies with weather conditions',
      mitigation: 'Diversified grid connections, battery storage planned',
    },
    {
      factor: 'Regulatory Changes',
      severity: 'low',
      description: 'Potential FIT rate adjustments',
      mitigation: '10-year locked FIT contract until 2033',
    },
    {
      factor: 'Equipment Degradation',
      severity: 'low',
      description: 'Standard panel efficiency decline',
      mitigation: 'Tier-1 panels with 25-year warranty, 0.5%/year degradation',
    },
    {
      factor: 'Grid Curtailment',
      severity: 'medium',
      description: 'Occasional grid capacity constraints',
      mitigation: 'Priority dispatch agreement with KEPCO',
    },
  ],

  revenueProjection: {
    annual: 8500000,
    fiveYear: 42500000,
    npv: 35200000,
    irr: 12.5,
  },
};

const GRADE_COLORS: Record<string, string> = {
  'AAA': 'bg-emerald-600',
  'AA+': 'bg-emerald-500',
  'AA': 'bg-green-500',
  'AA-': 'bg-green-400',
  'A+': 'bg-lime-500',
  'A': 'bg-lime-400',
  'A-': 'bg-yellow-500',
  'BBB+': 'bg-yellow-400',
  'BBB': 'bg-orange-400',
  'BBB-': 'bg-orange-500',
  'BB+': 'bg-red-400',
  'BB': 'bg-red-500',
  'B': 'bg-red-600',
  'CCC': 'bg-red-700',
  'CC': 'bg-red-800',
  'C': 'bg-red-900',
  'D': 'bg-gray-800',
};

export default function CreditGradeReport() {
  const [report] = useState<CreditReport>(SAMPLE_REPORT);
  const [activeTab, setActiveTab] = useState<'overview' | 'components' | 'lending' | 'insurance' | 'risks'>('overview');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">ENERGY CREDIT GRADE REPORT</h1>
                <p className="text-slate-400">EPO Banking & Insurance Risk Analysis</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-slate-400">Report ID</div>
              <div className="font-mono">{report.reportId}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Grade Display */}
        <div className="bg-slate-800/50 rounded-2xl p-8 mb-8 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Grade */}
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-2">OVERALL GRADE</div>
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-2xl ${GRADE_COLORS[report.overallGrade]} shadow-lg`}>
                <span className="text-5xl font-bold">{report.overallGrade}</span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  report.gradeOutlook === 'Positive' ? 'bg-green-800 text-green-200' :
                  report.gradeOutlook === 'Negative' ? 'bg-red-800 text-red-200' :
                  report.gradeOutlook === 'Watch' ? 'bg-yellow-800 text-yellow-200' :
                  'bg-slate-700 text-slate-200'
                }`}>
                  Outlook: {report.gradeOutlook}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-400">
                Score: {report.gradeScore}/100
              </div>
            </div>

            {/* Node Info */}
            <div className="col-span-2">
              <h2 className="text-xl font-bold mb-4">{report.nodeName}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Node ID:</span>
                  <span className="ml-2 font-mono">{report.nodeId}</span>
                </div>
                <div>
                  <span className="text-slate-400">Type:</span>
                  <span className="ml-2">{report.nodeType}</span>
                </div>
                <div>
                  <span className="text-slate-400">Location:</span>
                  <span className="ml-2">{report.nodeLocation}</span>
                </div>
                <div>
                  <span className="text-slate-400">Capacity:</span>
                  <span className="ml-2">{formatNumber(report.capacity)} kW</span>
                </div>
                <div>
                  <span className="text-slate-400">Operational Since:</span>
                  <span className="ml-2">{report.operationalSince}</span>
                </div>
                <div>
                  <span className="text-slate-400">Previous Grade:</span>
                  <span className="ml-2">{report.previousGrade}</span>
                  <span className={`ml-2 ${
                    report.gradeChange === 'upgrade' ? 'text-green-400' :
                    report.gradeChange === 'downgrade' ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    ({report.gradeChange === 'upgrade' ? '↑ Upgraded' :
                      report.gradeChange === 'downgrade' ? '↓ Downgraded' : '→ Stable'})
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-4">
                <div className="bg-slate-700/50 rounded-lg px-4 py-2">
                  <div className="text-xs text-slate-400">Report Generated</div>
                  <div className="font-mono text-sm">{new Date(report.generatedAt).toLocaleDateString()}</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg px-4 py-2">
                  <div className="text-xs text-slate-400">Valid Until</div>
                  <div className="font-mono text-sm">{new Date(report.validUntil).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: '📈 Overview' },
            { id: 'components', label: '🔬 Components' },
            { id: 'lending', label: '🏦 Lending Assessment' },
            { id: 'insurance', label: '🛡️ Insurance' },
            { id: 'risks', label: '⚠️ Risk Factors' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Revenue Projection</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400">Annual Revenue</div>
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(report.revenueProjection.annual)}
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400">5-Year Revenue</div>
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(report.revenueProjection.fiveYear)}
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400">NPV</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(report.revenueProjection.npv)}
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400">IRR</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {report.revenueProjection.irr}%
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold mt-8">Production History (6 Months)</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm">
                      <th className="pb-2">Month</th>
                      <th className="pb-2 text-right">Actual (kWh)</th>
                      <th className="pb-2 text-right">Projected (kWh)</th>
                      <th className="pb-2 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.monthlyProduction.map((month, idx) => (
                      <tr key={idx} className="border-t border-slate-700">
                        <td className="py-3 font-mono">{month.month}</td>
                        <td className="py-3 text-right">{formatNumber(month.actual)}</td>
                        <td className="py-3 text-right text-slate-400">{formatNumber(month.projected)}</td>
                        <td className={`py-3 text-right ${month.variance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {month.variance >= 0 ? '+' : ''}{month.variance.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'components' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Component Breakdown</h3>
              <p className="text-slate-400 text-sm">
                Overall grade is calculated from weighted component scores.
              </p>

              {Object.entries(report.components).map(([key, value]) => (
                <div key={key} className="bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-12 h-8 flex items-center justify-center rounded ${GRADE_COLORS[value.grade]} text-sm font-bold`}>
                        {value.grade}
                      </span>
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{value.trend}</span>
                      <span className="font-mono text-lg">{value.score}/100</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${GRADE_COLORS[value.grade]} transition-all duration-500`}
                      style={{ width: `${value.score}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 bg-blue-900/30 rounded-xl border border-blue-700">
                <h4 className="font-bold text-blue-400">Grade Scale Reference</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D'].map(grade => (
                    <span key={grade} className={`px-2 py-1 rounded ${GRADE_COLORS[grade]} text-xs`}>
                      {grade}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  AAA-BBB: Investment Grade | BB-D: Speculative/Default
                </p>
              </div>
            </div>
          )}

          {activeTab === 'lending' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Lending Assessment</h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-green-900/30 rounded-xl p-4 border border-green-700">
                  <div className="text-sm text-green-400">Maximum Loan Amount</div>
                  <div className="text-3xl font-bold">{formatCurrency(report.lending.maxLoanAmount)}</div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400">Suggested Interest Rate</div>
                  <div className="text-3xl font-bold">{report.lending.suggestedRate}%</div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400">Loan-to-Value (LTV)</div>
                  <div className="text-3xl font-bold">{report.lending.ltv}%</div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400">Debt Service Coverage</div>
                  <div className="text-3xl font-bold">{report.lending.debtServiceCoverage}x</div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400">Payback Period</div>
                  <div className="text-3xl font-bold">{report.lending.paybackPeriod} years</div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400">Collateral Value</div>
                  <div className="text-3xl font-bold">{formatCurrency(report.lending.collateralValue)}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-700/30 rounded-xl">
                <h4 className="font-bold mb-2">Lending Recommendation</h4>
                <p className="text-slate-300">
                  Based on the AA credit grade and strong debt service coverage ratio of {report.lending.debtServiceCoverage}x,
                  this asset qualifies for favorable financing terms. The suggested rate of {report.lending.suggestedRate}%
                  reflects the investment-grade risk profile.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'insurance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Insurance Assessment</h3>

              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-xl ${GRADE_COLORS[report.insurance.insurabilityGrade]} flex items-center justify-center`}>
                  <span className="text-2xl font-bold">{report.insurance.insurabilityGrade}</span>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Insurability Grade</div>
                  <div className="text-lg font-bold">Highly Insurable</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400">Base Premium</div>
                  <div className="text-2xl font-bold">{formatCurrency(report.insurance.basePremium)}</div>
                  <div className="text-xs text-slate-500">Annual</div>
                </div>
                <div className="bg-green-900/30 rounded-xl p-4 border border-green-700">
                  <div className="text-sm text-green-400">Risk-Adjusted Premium</div>
                  <div className="text-2xl font-bold text-green-400">{formatCurrency(report.insurance.riskAdjustedPremium)}</div>
                  <div className="text-xs text-green-600">21% discount applied</div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400">Coverage Limit</div>
                  <div className="text-2xl font-bold">{formatCurrency(report.insurance.coverageLimit)}</div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-sm text-slate-400">Deductible</div>
                  <div className="text-2xl font-bold">{formatCurrency(report.insurance.deductible)}</div>
                </div>
              </div>

              <div className="p-4 bg-red-900/20 rounded-xl border border-red-800">
                <h4 className="font-bold text-red-400 mb-2">Standard Exclusions</h4>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  {report.insurance.exclusions.map((exclusion, idx) => (
                    <li key={idx}>{exclusion}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'risks' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Risk Factor Analysis</h3>

              {report.riskFactors.map((risk, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${
                  risk.severity === 'high' ? 'bg-red-900/20 border-red-700' :
                  risk.severity === 'medium' ? 'bg-yellow-900/20 border-yellow-700' :
                  'bg-green-900/20 border-green-700'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold">{risk.factor}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      risk.severity === 'high' ? 'bg-red-800 text-red-200' :
                      risk.severity === 'medium' ? 'bg-yellow-800 text-yellow-200' :
                      'bg-green-800 text-green-200'
                    }`}>
                      {risk.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">{risk.description}</p>
                  <div className="text-sm">
                    <span className="text-slate-400">Mitigation: </span>
                    <span className="text-slate-200">{risk.mitigation}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-6 bg-slate-900/50 rounded-xl border border-slate-700 text-sm text-slate-400">
          <h4 className="font-bold text-white mb-2">⚠️ Disclaimer</h4>
          <p>
            This credit grade report is generated by the EPO Protocol's Banking Risk API and is intended
            for informational purposes only. The grades and assessments are based on available data
            and proprietary algorithms. Financial institutions should conduct their own due diligence
            before making lending or insurance decisions.
          </p>
          <p className="mt-2">
            Report validity: 90 days from generation date. Data sources: EPO Network real-time telemetry,
            regulatory compliance records, and verified financial statements.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-slate-700 text-center text-slate-500 text-sm">
          <p>EPO Energy Credit Grade Report</p>
          <p>Generated by Field Nine Solutions • NEXUS-X Protocol v14.0</p>
          <p className="mt-2 font-mono text-xs">
            Verification Hash: {`0x${report.reportId.split('-').join('')}`.toLowerCase()}
          </p>
        </div>
      </div>
    </div>
  );
}
