import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  Boxes,
  Receipt,
  MessageSquare,
  ShieldCheck,
  Send,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { useQuotations } from '../store/quotationStore';
import { formatINR, formatPercent, formatDate } from '@/utils/formatters';

export const QuoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getQuotation,
    simulateApproval,
    recordNegotiationCounterOffer,
    markClosedWon,
  } = useQuotations();

  const quote = getQuotation(id || '');

  const [activeTab, setActiveTab] = useState<string>('overview');

  // Counter-offer modal
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);
  const [counterDiscount, setCounterDiscount] = useState<number>(20);
  const [counterNote, setCounterNote] = useState<string>('');

  if (!quote) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <FileText className="h-12 w-12 text-gray-300 mb-3" />
        <h2 className="text-xl font-bold text-[#17213a]">Quotation Not Found</h2>
        <p className="mt-1 text-sm text-[#71809f]">The requested quote ID does not exist.</p>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => navigate('/quotations')}
        >
          View All Quotations
        </Button>
      </div>
    );
  }

  const handleOpenNegotiation = () => {
    setCounterDiscount(Math.round(quote.averageDiscountPercent + 4));
    setCounterNote('Customer requested additional discount in exchange for signing this quarter.');
    setIsNegotiationModalOpen(true);
  };

  const handleApplyCounterOffer = () => {
    recordNegotiationCounterOffer(quote.id, counterDiscount, counterNote);
    setIsNegotiationModalOpen(false);
  };

  const statusVariantMap: Record<string, 'draft' | 'pending' | 'approved' | 'negotiating' | 'won' | 'rejected'> = {
    draft: 'draft',
    pending_approval: 'pending',
    approved: 'approved',
    in_negotiation: 'negotiating',
    under_reapproval: 'pending',
    closed_won: 'won',
    rejected: 'rejected',
  };

  const statusLabelMap: Record<string, string> = {
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    approved: 'Approved by Governance',
    in_negotiation: 'In Negotiation',
    under_reapproval: 'Re-Approval Required',
    closed_won: 'Closed Won / Order Confirmed',
    rejected: 'Rejected',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/quotations')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            All Quotes
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
                Quote {quote.id}
              </h1>
              <Badge variant={statusVariantMap[quote.status]} size="md">
                {statusLabelMap[quote.status]}
              </Badge>
              <Badge variant="gold" size="sm">
                {quote.customerTier} Tier
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-[#71809f]">
              Customer: <strong className="text-[#17213a]">{quote.customerName}</strong> • Created {formatDate(quote.createdAt)} • Managed by {quote.salesRepName}
            </p>
          </div>
        </div>

        {/* Action Triggers based on State */}
        <div className="flex flex-wrap items-center gap-3">
          {quote.status === 'approved' && (
            <>
              <Button
                variant="secondary"
                leftIcon={<MessageSquare className="h-4 w-4" />}
                onClick={handleOpenNegotiation}
              >
                Log Customer Counter-Offer
              </Button>
              <Button
                variant="success"
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                onClick={() => markClosedWon(quote.id)}
              >
                Confirm & Close Won
              </Button>
            </>
          )}

          {quote.status === 'in_negotiation' && (
            <Button
              variant="primary"
              leftIcon={<MessageSquare className="h-4 w-4" />}
              onClick={handleOpenNegotiation}
            >
              Update Negotiation Terms
            </Button>
          )}

          {quote.status === 'under_reapproval' && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>Counter-offer triggered re-approval chain</span>
            </div>
          )}
        </div>
      </div>

      {/* Demo Simulation Bar (Designed for the 5-Minute Hackathon Demo) */}
      {(quote.status === 'pending_approval' || quote.status === 'under_reapproval') && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-[#f4f7ff] to-indigo-50 p-4 shadow-xs">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3568ed] text-white">
                <Zap className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#17213a]">
                  5-Minute Hackathon Demo Accelerator: Simulate Approval
                </h4>
                <p className="text-[11px] text-[#59657d]">
                  Test the approval workflow instantly without switching accounts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ShieldCheck className="h-3.5 w-3.5" />}
                onClick={() => simulateApproval(quote.id, 'Sales Manager')}
              >
                Simulate Manager Approve
              </Button>
              {quote.approvalChain.some((s) => s.role === 'Finance & Ops') && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ShieldCheck className="h-3.5 w-3.5" />}
                  onClick={() => simulateApproval(quote.id, 'Finance & Ops')}
                >
                  Simulate Finance Approve
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview & Line Items', icon: <FileText className="h-4 w-4" /> },
          {
            id: 'approvals',
            label: 'Approval Chain',
            icon: <ShieldCheck className="h-4 w-4" />,
            badge: (
              <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-[#3568ed]">
                {quote.approvalChain.length}
              </span>
            ),
          },
          {
            id: 'fulfillment',
            label: 'Multi-Warehouse Fulfillment',
            icon: <Boxes className="h-4 w-4" />,
            badge: (
              <span className="rounded-full bg-gray-100 px-1.5 py-0.2 text-[10px] font-bold text-gray-700">
                {quote.warehouses.length}
              </span>
            ),
          },
          {
            id: 'billing',
            label: 'Billing Milestones',
            icon: <Receipt className="h-4 w-4" />,
            badge: (
              <span className="rounded-full bg-gray-100 px-1.5 py-0.2 text-[10px] font-bold text-gray-700">
                {quote.billingMilestones.length}
              </span>
            ),
          },
          {
            id: 'negotiation',
            label: 'Customer Negotiation Log',
            icon: <MessageSquare className="h-4 w-4" />,
            badge: quote.negotiationEntries.length > 0 ? (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                {quote.negotiationEntries.length}
              </span>
            ) : undefined,
          },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab 1: Overview & Line Items */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contract Line Items</CardTitle>
                <span className="text-xs text-[#71809f]">
                  {quote.lineItems.length} Products &amp; Services
                </span>
              </CardHeader>

              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#eef2f9] text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                        <th className="pb-3 font-semibold">Product</th>
                        <th className="pb-3 font-semibold">Type</th>
                        <th className="pb-3 font-semibold">Qty</th>
                        <th className="pb-3 font-semibold">Unit Price</th>
                        <th className="pb-3 font-semibold">Discount</th>
                        <th className="pb-3 font-semibold">Margin</th>
                        <th className="pb-3 font-semibold text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f2f5fb]">
                      {quote.lineItems.map((item) => (
                        <tr key={item.id} className="hover:bg-[#f8faff] transition">
                          <td className="py-3.5">
                            <p className="font-bold text-[#17213a]">{item.name}</p>
                            <span className="text-[10px] text-gray-400">SKU: {item.sku}</span>
                          </td>
                          <td className="py-3.5">
                            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 uppercase">
                              {item.billingType === 'recurring' ? `${item.billingPeriod} SaaS` : 'One-Time'}
                            </span>
                          </td>
                          <td className="py-3.5 font-bold text-[#17213a]">{item.quantity}</td>
                          <td className="py-3.5 font-medium text-gray-600">{formatINR(item.unitPrice)}</td>
                          <td className="py-3.5">
                            <span className="font-semibold text-amber-700">
                              {item.discountPercent}%
                            </span>
                            {item.isDiscountExceeded && (
                              <span className="block text-[9px] text-amber-600 font-bold uppercase">
                                Over Ceiling
                              </span>
                            )}
                          </td>
                          <td className="py-3.5">
                            <span className="font-bold text-emerald-600">
                              {formatPercent(item.lineMarginPercent)}
                            </span>
                          </td>
                          <td className="py-3.5 font-bold text-[#17213a] text-right">
                            {formatINR(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Terms & Payment Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Terms &amp; Account SLA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3 text-xs">
                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[10px]">Payment Terms</span>
                    <p className="font-bold text-[#17213a] mt-1">{quote.paymentTerms}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[10px]">Quote Validity</span>
                    <p className="font-bold text-[#17213a] mt-1">Until {formatDate(quote.validUntil)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[10px]">Customer Tier</span>
                    <p className="font-bold text-[#17213a] mt-1">{quote.customerTier} Tier Partner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Gross List Total</span>
                    <span className="font-semibold text-gray-800">{formatINR(quote.grossTotal)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Total Discounts Applied</span>
                    <span className="font-semibold text-red-600">
                      - {formatINR(quote.totalDiscountAmount)} ({formatPercent(quote.averageDiscountPercent)})
                    </span>
                  </div>
                  {quote.recurringARRSubtotal > 0 && (
                    <div className="flex justify-between py-1 border-b border-gray-100 bg-blue-50/50 p-2 rounded-lg">
                      <span className="text-blue-800 font-medium">Annual Recurring (ARR)</span>
                      <span className="font-bold text-blue-800">{formatINR(quote.recurringARRSubtotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b-2 border-gray-200">
                    <span className="text-sm font-bold text-[#17213a]">Net Total Value</span>
                    <span className="text-base font-bold text-[#3568ed]">{formatINR(quote.netTotal)}</span>
                  </div>

                  {/* Margin Health Pill */}
                  <div className="rounded-xl bg-[#f8faff] border border-[#eef2fc] p-3.5 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#17213a]">Gross Margin %</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {formatPercent(quote.grossMarginPercent)}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] text-gray-400">
                      <span>Total COGS: {formatINR(quote.totalCost)}</span>
                      <span>Gross Profit: {formatINR(quote.grossProfit)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Governance Status Summary Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#3568ed]" />
                  <CardTitle>Governance Assessment</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Required Level:</span>
                    <Badge variant={quote.governanceLevel === 'auto_approved' ? 'success' : 'warning'}>
                      {quote.governanceLevel.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  {quote.governanceReasons.length > 0 && (
                    <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-800">
                      <p className="font-bold mb-1">Triggered Governance Policies:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {quote.governanceReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Multi-Step Approval Chain */}
      {activeTab === 'approvals' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Delegated Approval Chain Tracking</CardTitle>
              <p className="mt-0.5 text-xs text-[#71809f]">
                Multi-tier escalation based on category discount ceilings and commercial margin floors.
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Submission Step */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="flex-1 rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#17213a]">
                        Step 1: Sales Representative Submission
                      </h4>
                      <p className="text-xs text-[#59657d] mt-0.5">
                        Submitted by {quote.salesRepName}
                      </p>
                    </div>
                    <Badge variant="success">Completed</Badge>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Timestamp: {formatDate(quote.createdAt)}
                  </p>
                </div>
              </div>

              {/* Dynamic Approval Steps */}
              {quote.approvalChain.map((step, idx) => (
                <div key={step.role} className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      step.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {step.status === 'approved' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-[#17213a]">
                          Step {idx + 2}: {step.role} Review
                        </h4>
                        <p className="text-xs text-[#59657d] mt-0.5">
                          Assigned Approver: <strong className="text-[#17213a]">{step.approver}</strong>
                        </p>
                      </div>
                      <Badge variant={step.status === 'approved' ? 'success' : 'pending'}>
                        {step.status === 'approved' ? 'Approved' : 'Pending Review'}
                      </Badge>
                    </div>

                    {step.comments && (
                      <div className="mt-3 rounded-lg bg-gray-50 p-2.5 text-xs text-gray-700 border border-gray-100">
                        <span className="font-semibold text-[#17213a]">Reviewer Notes: </span>
                        {step.comments}
                      </div>
                    )}

                    {step.timestamp && (
                      <p className="mt-2 text-[11px] text-gray-400">
                        Signoff recorded on {formatDate(step.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Multi-Warehouse Inventory & Fulfillment */}
      {activeTab === 'fulfillment' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Multi-Warehouse Allocation &amp; Logistics Readiness</CardTitle>
              <p className="mt-0.5 text-xs text-[#71809f]">
                Inventory reserved across regional hubs to meet customer delivery SLAs.
              </p>
            </div>
            <Badge
              variant={
                quote.fulfillmentStatus === 'dispatched'
                  ? 'success'
                  : quote.fulfillmentStatus === 'ready_to_dispatch'
                  ? 'approved'
                  : 'pending'
              }
            >
              {quote.fulfillmentStatus.replace(/_/g, ' ')}
            </Badge>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quote.warehouses.map((wh) => (
                <div
                  key={wh.warehouseId}
                  className="rounded-xl border border-[#e4eaf6] p-4 bg-[#fbfcfe]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#17213a]">{wh.city} Node</span>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#3568ed]">
                      {wh.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-gray-800">{wh.warehouseName}</h4>
                  <div className="mt-3 flex items-center justify-between text-xs border-t border-gray-200 pt-2.5">
                    <span className="text-gray-500">Allocated Units:</span>
                    <strong className="text-base text-[#17213a]">{wh.itemsCount}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-900">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Boxes className="h-4 w-4 text-blue-600" />
                <span>Multi-Warehouse Logistics Policy</span>
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Stock is partitioned between Western (Mumbai) and Southern (Bengaluru) depots to minimize shipping transit time to under 48 hours. Orders transition to dispatch upon contract signoff and advance milestone payment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Billing & Invoicing Milestones */}
      {activeTab === 'billing' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Billing Schedule &amp; Invoicing Milestones</CardTitle>
              <p className="mt-0.5 text-xs text-[#71809f]">
                Milestone-based progress billing and recurring subscription invoicing terms.
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {quote.billingMilestones.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#3568ed]">
                      <Receipt className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[#17213a]">{m.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Due Date: {formatDate(m.dueDate)} • {m.percentage}% of contract total
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-0 sm:text-right flex items-center sm:block justify-between">
                    <span className="text-sm font-bold text-[#17213a] block">
                      {formatINR(m.amount)}
                    </span>
                    <span
                      className={`inline-block text-[11px] font-semibold mt-0.5 rounded px-2 py-0.5 ${
                        m.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.status === 'invoiced'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {m.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Customer Negotiation Log */}
      {activeTab === 'negotiation' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Customer Negotiation &amp; Re-Approval Log</CardTitle>
              <p className="mt-0.5 text-xs text-[#71809f]">
                Tracks customer counter-offers, revised terms, and governance re-evaluations.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<MessageSquare className="h-4 w-4" />}
              onClick={handleOpenNegotiation}
            >
              Log Counter-Offer
            </Button>
          </CardHeader>

          <CardContent>
            {quote.negotiationEntries.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 p-6 text-center">
                <MessageSquare className="h-7 w-7 text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-700">No negotiation logs yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  If the client requests additional discount or revised terms, log their counter-offer here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {quote.negotiationEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-amber-200 bg-amber-50/30 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#17213a]">
                          Counter-Offer: {entry.requestedDiscountPercent}% Discount Requested
                        </span>
                        {entry.requiresReapproval && (
                          <Badge variant="warning" size="sm">
                            Requires Re-Approval
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {formatDate(entry.date)}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-gray-700 leading-relaxed">{entry.notes}</p>

                    {entry.requiresReapproval && (
                      <div className="mt-3 rounded-lg bg-amber-100/60 p-2.5 text-[11px] text-amber-900 flex items-center justify-between">
                        <span>Governance Notice: Escalated to Finance &amp; Sales Director.</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => simulateApproval(quote.id, 'Finance & Ops')}
                        >
                          Simulate Finance Signoff
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Counter-Offer Negotiation Modal */}
      <Modal
        isOpen={isNegotiationModalOpen}
        onClose={() => setIsNegotiationModalOpen(false)}
        title="Log Customer Counter-Offer"
        description="Record revised discount or term demands and evaluate governance re-approval triggers"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#475467] mb-1.5">
              Requested Customer Discount (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="50"
                value={counterDiscount}
                onChange={(e) => setCounterDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 rounded-xl border border-gray-300 p-2 text-center text-sm font-bold text-[#17213a] focus:border-[#3568ed] focus:outline-none"
              />
              <span className="text-xs text-gray-500">
                Current Quote Average: <strong>{formatPercent(quote.averageDiscountPercent)}</strong>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475467] mb-1.5">
              Customer Negotiation Notes &amp; Concessions
            </label>
            <textarea
              rows={3}
              value={counterNote}
              onChange={(e) => setCounterNote(e.target.value)}
              placeholder="e.g. Customer agreed to 3-year contract in exchange for an extra 4% discount."
              className="w-full rounded-xl border border-gray-300 p-3 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
            />
          </div>

          {counterDiscount > quote.averageDiscountPercent && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Governance Re-Approval Alert</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Applying a {counterDiscount}% discount exceeds standard rep threshold and will trigger an automated re-approval review before the quote can be signed.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setIsNegotiationModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApplyCounterOffer}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Apply Counter-Offer &amp; Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
