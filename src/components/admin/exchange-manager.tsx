"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Save, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExchangeFee = {
  id: string;
  exchangeId: string;
  spotMakerFee: number;
  spotTakerFee: number;
  futuresMakerFee: number | null;
  futuresTakerFee: number | null;
  withdrawalFee: number | null;
  updatedAt: string;
};

type ExchangeOffer = {
  id: string;
  exchangeId: string;
  offerText: string;
  bonusAmount: number | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

type Exchange = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  affiliateUrl: string | null;
  score: number;
  foundedYear: number | null;
  headquarters: string | null;
  description: string | null;
  supportedCoinsCount: number;
  kycRequired: boolean;
  spotAvailable: boolean;
  futuresAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  fees: ExchangeFee | null;
  offers: ExchangeOffer[];
};

type ExchangeFormData = {
  name: string;
  slug: string;
  logoUrl: string;
  affiliateUrl: string;
  score: string;
  foundedYear: string;
  headquarters: string;
  description: string;
  supportedCoinsCount: string;
  kycRequired: boolean;
  spotAvailable: boolean;
  futuresAvailable: boolean;
  spotMakerFee: string;
  spotTakerFee: string;
  futuresMakerFee: string;
  futuresTakerFee: string;
  withdrawalFee: string;
};

function getEmptyForm(): ExchangeFormData {
  return {
    name: "",
    slug: "",
    logoUrl: "",
    affiliateUrl: "",
    score: "0",
    foundedYear: "",
    headquarters: "",
    description: "",
    supportedCoinsCount: "0",
    kycRequired: false,
    spotAvailable: true,
    futuresAvailable: false,
    spotMakerFee: "0.1",
    spotTakerFee: "0.1",
    futuresMakerFee: "",
    futuresTakerFee: "",
    withdrawalFee: "",
  };
}

function exchangeToForm(exchange: Exchange): ExchangeFormData {
  return {
    name: exchange.name,
    slug: exchange.slug,
    logoUrl: exchange.logoUrl || "",
    affiliateUrl: exchange.affiliateUrl || "",
    score: String(exchange.score),
    foundedYear: exchange.foundedYear ? String(exchange.foundedYear) : "",
    headquarters: exchange.headquarters || "",
    description: exchange.description || "",
    supportedCoinsCount: String(exchange.supportedCoinsCount),
    kycRequired: exchange.kycRequired,
    spotAvailable: exchange.spotAvailable,
    futuresAvailable: exchange.futuresAvailable,
    spotMakerFee: exchange.fees ? String(exchange.fees.spotMakerFee) : "0.1",
    spotTakerFee: exchange.fees ? String(exchange.fees.spotTakerFee) : "0.1",
    futuresMakerFee: exchange.fees?.futuresMakerFee != null ? String(exchange.fees.futuresMakerFee) : "",
    futuresTakerFee: exchange.fees?.futuresTakerFee != null ? String(exchange.fees.futuresTakerFee) : "",
    withdrawalFee: exchange.fees?.withdrawalFee != null ? String(exchange.fees.withdrawalFee) : "",
  };
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-input"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

export function ExchangeManager({ exchanges: initialExchanges }: { exchanges: Exchange[] }) {
  const [exchanges, setExchanges] = useState(initialExchanges);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ExchangeFormData>(getEmptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateForm(field: keyof ExchangeFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(getEmptyForm());
    setIsCreating(true);
    setError(null);
  }

  function startEdit(exchange: Exchange) {
    setIsCreating(false);
    setEditingId(exchange.id);
    setForm(exchangeToForm(exchange));
    setError(null);
  }

  function cancel() {
    setEditingId(null);
    setIsCreating(false);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const url = isCreating
        ? "/api/admin/exchanges"
        : `/api/admin/exchanges/${editingId}`;
      const method = isCreating ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save exchange");
        return;
      }

      if (isCreating) {
        setExchanges((prev) => [data.exchange, ...prev]);
      } else {
        setExchanges((prev) =>
          prev.map((e) => (e.id === editingId ? data.exchange : e))
        );
      }

      cancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this exchange?")) return;

    try {
      const res = await fetch(`/api/admin/exchanges/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete");
        return;
      }

      setExchanges((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const showForm = isCreating || editingId !== null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={startCreate} disabled={showForm}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Exchange
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {isCreating ? "Add Exchange" : "Edit Exchange"}
            </h2>
            <Button variant="ghost" size="sm" onClick={cancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField label="Name" value={form.name} onChange={(v) => updateForm("name", v)} placeholder="Binance" />
            <InputField label="Slug" value={form.slug} onChange={(v) => updateForm("slug", v)} placeholder="binance" />
            <InputField label="Score (0-10)" value={form.score} onChange={(v) => updateForm("score", v)} type="number" />
            <InputField label="Logo URL" value={form.logoUrl} onChange={(v) => updateForm("logoUrl", v)} placeholder="/images/exchanges/binance.png" />
            <InputField label="Affiliate URL" value={form.affiliateUrl} onChange={(v) => updateForm("affiliateUrl", v)} placeholder="https://..." />
            <InputField label="Founded Year" value={form.foundedYear} onChange={(v) => updateForm("foundedYear", v)} type="number" />
            <InputField label="Headquarters" value={form.headquarters} onChange={(v) => updateForm("headquarters", v)} />
            <InputField label="Supported Coins" value={form.supportedCoinsCount} onChange={(v) => updateForm("supportedCoinsCount", v)} type="number" />
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <div className="flex gap-6">
            <CheckboxField label="KYC Required" checked={form.kycRequired} onChange={(v) => updateForm("kycRequired", v)} />
            <CheckboxField label="Spot Available" checked={form.spotAvailable} onChange={(v) => updateForm("spotAvailable", v)} />
            <CheckboxField label="Futures Available" checked={form.futuresAvailable} onChange={(v) => updateForm("futuresAvailable", v)} />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Fee Structure (%)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <InputField label="Spot Maker" value={form.spotMakerFee} onChange={(v) => updateForm("spotMakerFee", v)} type="number" />
              <InputField label="Spot Taker" value={form.spotTakerFee} onChange={(v) => updateForm("spotTakerFee", v)} type="number" />
              <InputField label="Futures Maker" value={form.futuresMakerFee} onChange={(v) => updateForm("futuresMakerFee", v)} type="number" />
              <InputField label="Futures Taker" value={form.futuresTakerFee} onChange={(v) => updateForm("futuresTakerFee", v)} type="number" />
              <InputField label="Withdrawal" value={form.withdrawalFee} onChange={(v) => updateForm("withdrawalFee", v)} type="number" />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={cancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? "Saving..." : "Save Exchange"}
            </Button>
          </div>
        </div>
      )}

      {/* Exchanges Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium">Exchange</th>
                <th className="text-center py-3 px-4 font-medium">Score</th>
                <th className="text-center py-3 px-4 font-medium">Coins</th>
                <th className="text-center py-3 px-4 font-medium">Spot Fee</th>
                <th className="text-center py-3 px-4 font-medium">Offers</th>
                <th className="text-right py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exchanges.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No exchanges found. Add your first exchange above.
                  </td>
                </tr>
              ) : (
                exchanges.map((exchange) => (
                  <tr
                    key={exchange.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{exchange.name}</p>
                          <p className="text-xs text-muted-foreground">/{exchange.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {exchange.score}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums">
                      {exchange.supportedCoinsCount}
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums text-muted-foreground">
                      {exchange.fees
                        ? `${exchange.fees.spotMakerFee}% / ${exchange.fees.spotTakerFee}%`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs text-muted-foreground">
                        {exchange.offers.filter((o) => o.isActive).length} active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {exchange.affiliateUrl && (
                        <a
                          href={exchange.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startEdit(exchange)}
                        disabled={showForm}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(exchange.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
