import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Download, Search, Database, Users, BarChart3, TrendingUp, FileText, MapPin, LogOut, Calendar, ChevronLeft, ChevronRight, Check, X, Filter, ArrowUpDown, Upload, Edit3, Eye, EyeOff, AlertTriangle, Info, Settings, RefreshCcw } from 'lucide-react';

// ---------------------------------------------
// VooZaaTracker_v2.jsx
// ---------------------------------------------
// Notes:
// - This is a single-file React component.
// - Uses Tailwind utility classes for styling.
// - Includes localStorage persistence.
// - Includes CSV export.
// - Includes basic validation and UI state handling.
// ---------------------------------------------

const STORAGE_KEY = 'voozaa_tracker_v2_state';

const defaultState = {
  profile: {
    orgName: 'VooZaa Tracking',
    userName: 'Admin',
  },
  ui: {
    activeTab: 'overview', // overview | leads | customers | analytics | locations | settings
    sidebarOpen: true,
    compactMode: false,
    showHelp: false,
  },
  settings: {
    currency: 'EUR',
    dateFormat: 'DD.MM.YYYY',
    allowDeleteConfirm: true,
  },
  leadStages: [
    'Neu',
    'Kontaktiert',
    'Qualifiziert',
    'Angebot gesendet',
    'Verhandlung',
    'Gewonnen',
    'Verloren',
  ],
  customerTags: [
    'VIP',
    'Bestandskunde',
    'Neukunde',
    'Upsell',
    'Churn-Risiko',
  ],
  locations: [
    { id: 'loc_1', name: 'Berlin', region: 'DE', address: 'Berlin, Deutschland' },
    { id: 'loc_2', name: 'Hamburg', region: 'DE', address: 'Hamburg, Deutschland' },
  ],
  leads: [
    {
      id: 'lead_1',
      name: 'Max Mustermann',
      company: 'Muster GmbH',
      email: 'max@example.com',
      phone: '+49 30 123456',
      stage: 'Neu',
      source: 'Website',
      locationId: 'loc_1',
      createdAt: '2026-01-12',
      updatedAt: '2026-01-12',
      value: 3500,
      notes: 'Interessiert an Tracking-Lösung für 3 Standorte.',
    },
    {
      id: 'lead_2',
      name: 'Erika Musterfrau',
      company: 'Example AG',
      email: 'erika@example.com',
      phone: '+49 40 654321',
      stage: 'Angebot gesendet',
      source: 'Referral',
      locationId: 'loc_2',
      createdAt: '2026-01-18',
      updatedAt: '2026-01-28',
      value: 7800,
      notes: 'Wartet auf Budget-Freigabe; Follow-up nächste Woche.',
    },
  ],
  customers: [
    {
      id: 'cust_1',
      name: 'ACME Logistics',
      contact: 'Jonas Becker',
      email: 'jonas@acme-logistics.com',
      phone: '+49 30 987654',
      locationId: 'loc_1',
      status: 'Aktiv', // Aktiv | Pausiert | Kündigung
      tags: ['VIP', 'Bestandskunde'],
      mrr: 1250,
      startDate: '2025-10-01',
      notes: 'Key account; monthly QBR.',
    },
  ],
  activities: [
    // optional: activity log items
  ],
};

function safeParseJSON(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function formatMoney(amount, currency = 'EUR') {
  const num = Number(amount || 0);
  try {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(num);
  } catch {
    return `${num.toFixed(2)} ${currency}`;
  }
}

function toISODate(date = new Date()) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCSV(rows, headers) {
  const escape = (v) => {
    const s = String(v ?? '');
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replaceAll('"', '""')}"`;
    }
    return s;
  };

  const headerLine = headers.map(h => escape(h.label)).join(',');
  const lines = rows.map(r => headers.map(h => escape(r[h.key])).join(','));
  return [headerLine, ...lines].join('\n');
}

function classNames(...args) {
  return args.filter(Boolean).join(' ');
}

function Card({ children, className }) {
  return (
    <div className={classNames('rounded-2xl border border-gray-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-4">
      <div>
        <div className="text-lg font-semibold text-gray-900">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-gray-500">{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function CardBody({ children, className }) {
  return <div className={classNames('p-4', className)}>{children}</div>;
}

function Button({ children, onClick, variant = 'primary', size = 'md', disabled, className, title, type = 'button' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2';
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base',
  };
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900 disabled:bg-gray-300',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 disabled:bg-red-200',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-200 disabled:text-gray-300',
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={classNames(base, sizes[size], variants[variant], className)}
    >
      {children}
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text', className, right, disabled }) {
  return (
    <label className={classNames('block', className)}>
      {label ? <div className="mb-1 text-sm font-medium text-gray-700">{label}</div> : null}
      <div className="relative">
        <input
          type={type}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={classNames(
            'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200',
            right ? 'pr-10' : '',
            disabled ? 'bg-gray-50 text-gray-500' : ''
          )}
        />
        {right ? <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">{right}</div> : null}
      </div>
    </label>
  );
}

function Select({ label, value, onChange, options, className, disabled }) {
  return (
    <label className={classNames('block', className)}>
      {label ? <div className="mb-1 text-sm font-medium text-gray-700">{label}</div> : null}
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={classNames(
          'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200',
          disabled ? 'bg-gray-50 text-gray-500' : ''
        )}
      >
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!value)}
      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-left shadow-sm hover:bg-gray-50"
    >
      <div className="text-sm font-medium text-gray-800">{label}</div>
      <div
        className={classNames(
          'h-6 w-11 rounded-full p-1 transition',
          value ? 'bg-gray-900' : 'bg-gray-200'
        )}
      >
        <div
          className={classNames(
            'h-4 w-4 rounded-full bg-white transition',
            value ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </div>
    </button>
  );
}

function Badge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return <span className={classNames('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', tones[tone])}>{children}</span>;
}

function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div className="text-base font-semibold text-gray-900">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto p-4">{children}</div>
        {footer ? <div className="border-t border-gray-100 p-4">{footer}</div> : null}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
      <div className="mb-3 text-gray-400">{icon}</div>
      <div className="text-base font-semibold text-gray-900">{title}</div>
      {subtitle ? <div className="mt-1 max-w-md text-sm text-gray-500">{subtitle}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function Stat({ label, value, hint, icon }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
          {hint ? <div className="mt-1 text-xs text-gray-400">{hint}</div> : null}
        </div>
        {icon ? <div className="rounded-xl bg-gray-100 p-2 text-gray-700">{icon}</div> : null}
      </div>
    </Card>
  );
}

function Divider() {
  return <div className="my-4 h-px w-full bg-gray-100" />;
}

function HelpCallout({ children }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
      <Info className="mt-0.5 h-5 w-5 text-gray-500" />
      <div>{children}</div>
    </div>
  );
}

function ConfirmDanger({ open, title = 'Wirklich löschen?', description, onCancel, onConfirm }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Löschen
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-red-50 p-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm text-gray-800">{description}</div>
          <div className="mt-2 text-xs text-gray-500">Dieser Vorgang kann nicht rückgängig gemacht werden.</div>
        </div>
      </div>
    </Modal>
  );
}

function Table({ columns, rows, rowKey, empty, onRowClick }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={classNames('px-4 py-3', c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={rowKey(r)}
                  onClick={() => onRowClick?.(r)}
                  className={classNames(
                    'border-t border-gray-100 hover:bg-gray-50',
                    onRowClick ? 'cursor-pointer' : ''
                  )}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={classNames('px-4 py-3 align-top text-gray-800', c.className)}>
                      {typeof c.render === 'function' ? c.render(r) : r[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function VooZaaTracker_v2() {
  const [state, setState] = useState(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    return saved ? safeParseJSON(saved, defaultState) : defaultState;
  });

  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [editingLeadId, setEditingLeadId] = useState(null);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editingLocationId, setEditingLocationId] = useState(null);

  const [deleteLeadId, setDeleteLeadId] = useState(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState(null);
  const [deleteLocationId, setDeleteLocationId] = useState(null);

  const [leadSearch, setLeadSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [leadStageFilter, setLeadStageFilter] = useState('all');
  const [customerStatusFilter, setCustomerStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const [sort, setSort] = useState({ key: 'updatedAt', dir: 'desc', scope: 'leads' }); // scope: leads/customers
  const currency = state.settings?.currency ?? 'EUR';

  // Persist to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const locationsById = useMemo(() => {
    const map = new Map();
    (state.locations || []).forEach((l) => map.set(l.id, l));
    return map;
  }, [state.locations]);

  const stageTone = (stage) => {
    switch (stage) {
      case 'Neu':
        return 'blue';
      case 'Kontaktiert':
        return 'purple';
      case 'Qualifiziert':
        return 'yellow';
      case 'Angebot gesendet':
        return 'blue';
      case 'Verhandlung':
        return 'yellow';
      case 'Gewonnen':
        return 'green';
      case 'Verloren':
        return 'red';
      default:
        return 'gray';
    }
  };

  const statusTone = (status) => {
    switch (status) {
      case 'Aktiv':
        return 'green';
      case 'Pausiert':
        return 'yellow';
      case 'Kündigung':
        return 'red';
      default:
        return 'gray';
    }
  };

  const setTab = (tab) => setState((s) => ({ ...s, ui: { ...(s.ui || {}), activeTab: tab } }));

  const toggleSidebar = () =>
    setState((s) => ({ ...s, ui: { ...(s.ui || {}), sidebarOpen: !(s.ui?.sidebarOpen ?? true) } }));

  const toggleCompact = () =>
    setState((s) => ({ ...s, ui: { ...(s.ui || {}), compactMode: !(s.ui?.compactMode ?? false) } }));

  const resetToDefaults = () => {
    setState(defaultState);
    setLeadSearch('');
    setCustomerSearch('');
    setLeadStageFilter('all');
    setCustomerStatusFilter('all');
    setLocationFilter('all');
    setSort({ key: 'updatedAt', dir: 'desc', scope: 'leads' });
  };

  const updateProfile = (patch) => setState((s) => ({ ...s, profile: { ...(s.profile || {}), ...patch } }));
  const updateSettings = (patch) => setState((s) => ({ ...s, settings: { ...(s.settings || {}), ...patch } }));

  const openNewLead = () => {
    setEditingLeadId(null);
    setLeadModalOpen(true);
  };

  const openEditLead = (lead) => {
    setEditingLeadId(lead.id);
    setLeadModalOpen(true);
  };

  const upsertLead = (lead) => {
    setState((s) => {
      const now = toISODate();
      const exists = (s.leads || []).some((l) => l.id === lead.id);
      const leads = exists
        ? (s.leads || []).map((l) => (l.id === lead.id ? { ...l, ...lead, updatedAt: now } : l))
        : [{ ...lead, id: uid('lead'), createdAt: now, updatedAt: now }, ...(s.leads || [])];
      return { ...s, leads };
    });
  };

  const deleteLead = (id) => {
    setState((s) => ({ ...s, leads: (s.leads || []).filter((l) => l.id !== id) }));
  };

  const openNewCustomer = () => {
    setEditingCustomerId(null);
    setCustomerModalOpen(true);
  };

  const openEditCustomer = (cust) => {
    setEditingCustomerId(cust.id);
    setCustomerModalOpen(true);
  };

  const upsertCustomer = (cust) => {
    setState((s) => {
      const exists = (s.customers || []).some((c) => c.id === cust.id);
      const customers = exists
        ? (s.customers || []).map((c) => (c.id === cust.id ? { ...c, ...cust } : c))
        : [{ ...cust, id: uid('cust') }, ...(s.customers || [])];
      return { ...s, customers };
    });
  };

  const deleteCustomer = (id) => {
    setState((s) => ({ ...s, customers: (s.customers || []).filter((c) => c.id !== id) }));
  };

  const openNewLocation = () => {
    setEditingLocationId(null);
    setLocationModalOpen(true);
  };

  const openEditLocation = (loc) => {
    setEditingLocationId(loc.id);
    setLocationModalOpen(true);
  };

  const upsertLocation = (loc) => {
    setState((s) => {
      const exists = (s.locations || []).some((l) => l.id === loc.id);
      const locations = exists
        ? (s.locations || []).map((l) => (l.id === loc.id ? { ...l, ...loc } : l))
        : [{ ...loc, id: uid('loc') }, ...(s.locations || [])];
      return { ...s, locations };
    });
  };

  const deleteLocation = (id) => {
    setState((s) => ({
      ...s,
      locations: (s.locations || []).filter((l) => l.id !== id),
      // also detach references
      leads: (s.leads || []).map((l) => (l.locationId === id ? { ...l, locationId: null } : l)),
      customers: (s.customers || []).map((c) => (c.locationId === id ? { ...c, locationId: null } : c)),
    }));
  };

  // Derived / filtered lists
  const filteredLeads = useMemo(() => {
    const q = leadSearch.trim().toLowerCase();
    const stageOk = (l) => leadStageFilter === 'all' || l.stage === leadStageFilter;
    const locOk = (l) => locationFilter === 'all' || (l.locationId || '') === locationFilter;
    return (state.leads || [])
      .filter((l) => stageOk(l) && locOk(l))
      .filter((l) => {
        if (!q) return true;
        return (
          (l.name || '').toLowerCase().includes(q) ||
          (l.company || '').toLowerCase().includes(q) ||
          (l.email || '').toLowerCase().includes(q) ||
          (l.phone || '').toLowerCase().includes(q) ||
          (l.source || '').toLowerCase().includes(q) ||
          (l.notes || '').toLowerCase().includes(q)
        );
      });
  }, [state.leads, leadSearch, leadStageFilter, locationFilter]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    const statusOk = (c) => customerStatusFilter === 'all' || c.status === customerStatusFilter;
    const locOk = (c) => locationFilter === 'all' || (c.locationId || '') === locationFilter;
    return (state.customers || [])
      .filter((c) => statusOk(c) && locOk(c))
      .filter((c) => {
        if (!q) return true;
        return (
          (c.name || '').toLowerCase().includes(q) ||
          (c.contact || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q) ||
          (c.tags || []).join(' ').toLowerCase().includes(q) ||
          (c.notes || '').toLowerCase().includes(q)
        );
      });
  }, [state.customers, customerSearch, customerStatusFilter, locationFilter]);

  const sortedLeads = useMemo(() => {
    const rows = [...filteredLeads];
    if (sort.scope !== 'leads') return rows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const av = a?.[sort.key];
      const bv = b?.[sort.key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? ''), 'de', { numeric: true }) * dir;
    });
    return rows;
  }, [filteredLeads, sort]);

  const sortedCustomers = useMemo(() => {
    const rows = [...filteredCustomers];
    if (sort.scope !== 'customers') return rows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const av = a?.[sort.key];
      const bv = b?.[sort.key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? ''), 'de', { numeric: true }) * dir;
    });
    return rows;
  }, [filteredCustomers, sort]);

  const stats = useMemo(() => {
    const leads = state.leads || [];
    const customers = state.customers || [];
    const mrr = customers.reduce((sum, c) => sum + Number(c.mrr || 0), 0);
    const pipeline = leads
      .filter((l) => l.stage !== 'Verloren' && l.stage !== 'Gewonnen')
      .reduce((sum, l) => sum + Number(l.value || 0), 0);
    const won = leads.filter((l) => l.stage === 'Gewonnen').reduce((sum, l) => sum + Number(l.value || 0), 0);
    const lost = leads.filter((l) => l.stage === 'Verloren').reduce((sum, l) => sum + Number(l.value || 0), 0);
    return {
      leads: leads.length,
      customers: customers.length,
      mrr,
      pipeline,
      won,
      lost,
    };
  }, [state.leads, state.customers]);

  const exportLeadsCSV = () => {
    const headers = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'company', label: 'Unternehmen' },
      { key: 'email', label: 'E-Mail' },
      { key: 'phone', label: 'Telefon' },
      { key: 'stage', label: 'Stage' },
      { key: 'source', label: 'Quelle' },
      { key: 'location', label: 'Standort' },
      { key: 'createdAt', label: 'Erstellt' },
      { key: 'updatedAt', label: 'Aktualisiert' },
      { key: 'value', label: 'Wert' },
      { key: 'notes', label: 'Notizen' },
    ];
    const rows = (state.leads || []).map((l) => ({
      ...l,
      location: locationsById.get(l.locationId)?.name ?? '',
    }));
    const csv = toCSV(rows, headers);
    downloadText(`voozaa_leads_${toISODate()}.csv`, csv);
  };

  const exportCustomersCSV = () => {
    const headers = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Kunde' },
      { key: 'contact', label: 'Kontakt' },
      { key: 'email', label: 'E-Mail' },
      { key: 'phone', label: 'Telefon' },
      { key: 'status', label: 'Status' },
      { key: 'tags', label: 'Tags' },
      { key: 'location', label: 'Standort' },
      { key: 'mrr', label: 'MRR' },
      { key: 'startDate', label: 'Startdatum' },
      { key: 'notes', label: 'Notizen' },
    ];
    const rows = (state.customers || []).map((c) => ({
      ...c,
      tags: (c.tags || []).join(' | '),
      location: locationsById.get(c.locationId)?.name ?? '',
    }));
    const csv = toCSV(rows, headers);
    downloadText(`voozaa_customers_${toISODate()}.csv`, csv);
  };

  const exportStateJSON = () => {
    downloadText(`voozaa_tracker_backup_${toISODate()}.json`, JSON.stringify(state, null, 2));
  };

  const importStateJSON = async (file) => {
    const text = await file.text();
    const parsed = safeParseJSON(text, null);
    if (!parsed || typeof parsed !== 'object') {
      alert('Ungültige JSON-Datei.');
      return;
    }
    setState((s) => ({
      ...s,
      ...parsed,
      // keep UI stable
      ui: { ...(s.ui || {}), ...(parsed.ui || {}) },
    }));
  };

  const setSortFor = (scope, key) => {
    setSort((s) => {
      if (s.scope !== scope || s.key !== key) return { scope, key, dir: 'asc' };
      return { scope, key, dir: s.dir === 'asc' ? 'desc' : 'asc' };
    });
  };

  // Forms state (modal buffers)
  const leadEditing = useMemo(() => {
    if (!editingLeadId) return null;
    return (state.leads || []).find((l) => l.id === editingLeadId) || null;
  }, [editingLeadId, state.leads]);

  const customerEditing = useMemo(() => {
    if (!editingCustomerId) return null;
    return (state.customers || []).find((c) => c.id === editingCustomerId) || null;
  }, [editingCustomerId, state.customers]);

  const locationEditing = useMemo(() => {
    if (!editingLocationId) return null;
    return (state.locations || []).find((l) => l.id === editingLocationId) || null;
  }, [editingLocationId, state.locations]);

  // -------------------------------------------------------
  // Layout parts
  // -------------------------------------------------------

  const sidebar = (
    <div className={classNames('flex h-full flex-col', state.ui?.sidebarOpen ? 'w-72' : 'w-20')}>
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gray-900 p-2 text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          {state.ui?.sidebarOpen ? (
            <div>
              <div className="text-sm font-semibold text-gray-900">{state.profile?.orgName || 'VooZaa Tracker'}</div>
              <div className="text-xs text-gray-500">CRM / Tracking</div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Toggle sidebar"
          title="Sidebar ein-/ausklappen"
        >
          {state.ui?.sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <nav className="space-y-1">
          <SidebarItem
            open={state.ui?.sidebarOpen}
            active={state.ui?.activeTab === 'overview'}
            icon={<BarChart3 className="h-5 w-5" />}
            label="Übersicht"
            onClick={() => setTab('overview')}
          />
          <SidebarItem
            open={state.ui?.sidebarOpen}
            active={state.ui?.activeTab === 'leads'}
            icon={<Users className="h-5 w-5" />}
            label="Leads"
            onClick={() => setTab('leads')}
          />
          <SidebarItem
            open={state.ui?.sidebarOpen}
            active={state.ui?.activeTab === 'customers'}
            icon={<Database className="h-5 w-5" />}
            label="Kunden"
            onClick={() => setTab('customers')}
          />
          <SidebarItem
            open={state.ui?.sidebarOpen}
            active={state.ui?.activeTab === 'analytics'}
            icon={<TrendingUp className="h-5 w-5" />}
            label="Analytics"
            onClick={() => setTab('analytics')}
          />
          <SidebarItem
            open={state.ui?.sidebarOpen}
            active={state.ui?.activeTab === 'locations'}
            icon={<MapPin className="h-5 w-5" />}
            label="Standorte"
            onClick={() => setTab('locations')}
          />
          <SidebarItem
            open={state.ui?.sidebarOpen}
            active={state.ui?.activeTab === 'settings'}
            icon={<Settings className="h-5 w-5" />}
            label="Einstellungen"
            onClick={() => setTab('settings')}
          />
        </nav>

        <Divider />

        <div className="space-y-2">
          <Toggle label="Kompaktmodus" value={state.ui?.compactMode ?? false} onChange={toggleCompact} />
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setHelpOpen(true)}
            title="Hilfe anzeigen"
          >
            <Info className="h-4 w-4" />
            {state.ui?.sidebarOpen ? 'Hilfe' : null}
          </Button>
        </div>
      </div>

      <div className="border-t border-gray-100 p-3">
        <div className={classNames('flex items-center gap-3 rounded-2xl bg-gray-50 p-3', state.ui?.sidebarOpen ? '' : 'justify-center')}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-gray-900 shadow-sm">
            <Users className="h-5 w-5" />
          </div>
          {state.ui?.sidebarOpen ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-gray-900">{state.profile?.userName || 'User'}</div>
              <div className="truncate text-xs text-gray-500">Lokaler Speicher</div>
            </div>
          ) : null}
          {state.ui?.sidebarOpen ? (
            <div className="ml-auto">
              <Button variant="ghost" size="sm" onClick={() => alert('Demo: Kein Login implementiert.')} title="Logout (Demo)">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  const topbar = (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-gray-100 p-2 text-gray-700">
          {state.ui?.activeTab === 'overview' ? <BarChart3 className="h-5 w-5" /> : null}
          {state.ui?.activeTab === 'leads' ? <Users className="h-5 w-5" /> : null}
          {state.ui?.activeTab === 'customers' ? <Database className="h-5 w-5" /> : null}
          {state.ui?.activeTab === 'analytics' ? <TrendingUp className="h-5 w-5" /> : null}
          {state.ui?.activeTab === 'locations' ? <MapPin className="h-5 w-5" /> : null}
          {state.ui?.activeTab === 'settings' ? <Settings className="h-5 w-5" /> : null}
        </div>
        <div>
          <div className="text-base font-semibold text-gray-900">
            {state.ui?.activeTab === 'overview' ? 'Übersicht' : null}
            {state.ui?.activeTab === 'leads' ? 'Leads' : null}
            {state.ui?.activeTab === 'customers' ? 'Kunden' : null}
            {state.ui?.activeTab === 'analytics' ? 'Analytics' : null}
            {state.ui?.activeTab === 'locations' ? 'Standorte' : null}
            {state.ui?.activeTab === 'settings' ? 'Einstellungen' : null}
          </div>
          <div className="text-xs text-gray-500">VooZaa Tracker v2</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => setState((s) => ({ ...s }))} title="UI refresh (noop)">
          <RefreshCcw className="h-4 w-4" />
          Aktualisieren
        </Button>

        {state.ui?.activeTab === 'leads' ? (
          <>
            <Button variant="secondary" onClick={exportLeadsCSV} title="Leads exportieren">
              <Download className="h-4 w-4" />
              CSV Export
            </Button>
            <Button onClick={openNewLead} title="Lead hinzufügen">
              <Plus className="h-4 w-4" />
              Lead
            </Button>
          </>
        ) : null}

        {state.ui?.activeTab === 'customers' ? (
          <>
            <Button variant="secondary" onClick={exportCustomersCSV} title="Kunden exportieren">
              <Download className="h-4 w-4" />
              CSV Export
            </Button>
            <Button onClick={openNewCustomer} title="Kunde hinzufügen">
              <Plus className="h-4 w-4" />
              Kunde
            </Button>
          </>
        ) : null}

        {state.ui?.activeTab === 'locations' ? (
          <Button onClick={openNewLocation} title="Standort hinzufügen">
            <Plus className="h-4 w-4" />
            Standort
          </Button>
        ) : null}

        {state.ui?.activeTab === 'overview' ? (
          <Button variant="secondary" onClick={exportStateJSON} title="Backup als JSON herunterladen">
            <Download className="h-4 w-4" />
            Backup
          </Button>
        ) : null}
      </div>
    </div>
  );

  const contentPadding = state.ui?.compactMode ? 'p-4' : 'p-6';

  return (
    <div className="h-screen w-full bg-gray-50">
      <div className="flex h-full">
        <aside className="hidden h-full border-r border-gray-100 bg-white md:block">{sidebar}</aside>

        <main className="flex h-full flex-1 flex-col">
          {topbar}

          <div className={classNames('flex-1 overflow-auto', contentPadding)}>
            {state.ui?.activeTab === 'overview' ? (
              <OverviewTab
                state={state}
                stats={stats}
                currency={currency}
                onExportBackup={exportStateJSON}
                onImport={importStateJSON}
                onOpenHelp={() => setHelpOpen(true)}
              />
            ) : null}

            {state.ui?.activeTab === 'leads' ? (
              <LeadsTab
                state={state}
                locationsById={locationsById}
                currency={currency}
                leadSearch={leadSearch}
                setLeadSearch={setLeadSearch}
                leadStageFilter={leadStageFilter}
                setLeadStageFilter={setLeadStageFilter}
                locationFilter={locationFilter}
                setLocationFilter={setLocationFilter}
                sortedLeads={sortedLeads}
                onEdit={openEditLead}
                onDelete={(id) => (state.settings?.allowDeleteConfirm ? setDeleteLeadId(id) : deleteLead(id))}
                sort={sort}
                setSortFor={setSortFor}
              />
            ) : null}

            {state.ui?.activeTab === 'customers' ? (
              <CustomersTab
                state={state}
                locationsById={locationsById}
                currency={currency}
                customerSearch={customerSearch}
                setCustomerSearch={setCustomerSearch}
                customerStatusFilter={customerStatusFilter}
                setCustomerStatusFilter={setCustomerStatusFilter}
                locationFilter={locationFilter}
                setLocationFilter={setLocationFilter}
                sortedCustomers={sortedCustomers}
                onEdit={openEditCustomer}
                onDelete={(id) => (state.settings?.allowDeleteConfirm ? setDeleteCustomerId(id) : deleteCustomer(id))}
                sort={sort}
                setSortFor={setSortFor}
              />
            ) : null}

            {state.ui?.activeTab === 'analytics' ? (
              <AnalyticsTab state={state} currency={currency} />
            ) : null}

            {state.ui?.activeTab === 'locations' ? (
              <LocationsTab
                state={state}
                onEdit={openEditLocation}
                onDelete={(id) => (state.settings?.allowDeleteConfirm ? setDeleteLocationId(id) : deleteLocation(id))}
              />
            ) : null}

            {state.ui?.activeTab === 'settings' ? (
              <SettingsTab
                state={state}
                onUpdateProfile={updateProfile}
                onUpdateSettings={updateSettings}
                onReset={resetToDefaults}
              />
            ) : null}
          </div>
        </main>
      </div>

      {/* Modals */}
      <LeadModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        onSave={upsertLead}
        lead={leadEditing}
        leadStages={state.leadStages}
        locations={state.locations}
        currency={currency}
      />

      <CustomerModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSave={upsertCustomer}
        customer={customerEditing}
        locations={state.locations}
        customerTags={state.customerTags}
      />

      <LocationModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSave={upsertLocation}
        location={locationEditing}
      />

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <ConfirmDanger
        open={Boolean(deleteLeadId)}
        title="Lead löschen?"
        description="Möchtest du diesen Lead wirklich löschen?"
        onCancel={() => setDeleteLeadId(null)}
        onConfirm={() => {
          deleteLead(deleteLeadId);
          setDeleteLeadId(null);
        }}
      />

      <ConfirmDanger
        open={Boolean(deleteCustomerId)}
        title="Kunde löschen?"
        description="Möchtest du diesen Kunden wirklich löschen?"
        onCancel={() => setDeleteCustomerId(null)}
        onConfirm={() => {
          deleteCustomer(deleteCustomerId);
          setDeleteCustomerId(null);
        }}
      />

      <ConfirmDanger
        open={Boolean(deleteLocationId)}
        title="Standort löschen?"
        description="Möchtest du diesen Standort wirklich löschen?"
        onCancel={() => setDeleteLocationId(null)}
        onConfirm={() => {
          deleteLocation(deleteLocationId);
          setDeleteLocationId(null);
        }}
      />
    </div>
  );
}

// -------------------------------------------------------
// Sidebar item
// -------------------------------------------------------
function SidebarItem({ open, active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition',
        active ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      <div className={classNames('shrink-0', active ? 'text-white' : 'text-gray-500')}>{icon}</div>
      {open ? <div className="truncate">{label}</div> : null}
    </button>
  );
}

// -------------------------------------------------------
// Overview tab
// -------------------------------------------------------
function OverviewTab({ state, stats, currency, onExportBackup, onImport, onOpenHelp }) {
  const [importing, setImporting] = useState(false);
  const fileRef = React.useRef(null);

  const leadStages = state.leadStages || [];
  const leadsByStage = useMemo(() => {
    const map = new Map();
    leadStages.forEach((s) => map.set(s, 0));
    (state.leads || []).forEach((l) => map.set(l.stage, (map.get(l.stage) || 0) + 1));
    return map;
  }, [state.leads, leadStages]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Leads" value={stats.leads} hint="Alle Leads" icon={<Users className="h-5 w-5" />} />
        <Stat label="Kunden" value={stats.customers} hint="Aktive & inaktive" icon={<Database className="h-5 w-5" />} />
        <Stat label="MRR" value={formatMoney(stats.mrr, currency)} hint="Monatlich wiederkehrend" icon={<TrendingUp className="h-5 w-5" />} />
        <Stat label="Pipeline" value={formatMoney(stats.pipeline, currency)} hint="Offene Opportunity-Summe" icon={<BarChart3 className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader
          title="Schnellaktionen"
          subtitle="Backup/Restore, Hilfe, und kurze Hinweise"
          right={
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onExportBackup}>
                <Download className="h-4 w-4" />
                Backup (JSON)
              </Button>
              <Button
                variant="secondary"
                onClick={() => fileRef.current?.click()}
                title="JSON Backup importieren"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImporting(true);
                  try {
                    await onImport(file);
                  } finally {
                    setImporting(false);
                    e.target.value = '';
                  }
                }}
              />
              <Button onClick={onOpenHelp}>
                <Info className="h-4 w-4" />
                Hilfe
              </Button>
            </div>
          }
        />
        <CardBody>
          {importing ? (
            <HelpCallout>Import läuft …</HelpCallout>
          ) : (
            <HelpCallout>
              Alle Daten werden lokal im Browser gespeichert (localStorage). Nutze regelmäßig ein Backup (JSON), wenn du den Browser wechselst
              oder den Cache leerst.
            </HelpCallout>
          )}

          <Divider />

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <FileText className="h-4 w-4" />
                Lead-Stages
              </div>
              <div className="space-y-2">
                {leadStages.map((s) => (
                  <div key={s} className="flex items-center justify-between text-sm">
                    <div className="text-gray-700">{s}</div>
                    <div className="font-semibold text-gray-900">{leadsByStage.get(s) || 0}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Calendar className="h-4 w-4" />
                Zeitraum / Notizen
              </div>
              <div className="text-sm text-gray-600">
                Dieses Dashboard ist bewusst „leichtgewichtig“ gehalten. Wenn du zusätzliche Felder (z. B. Deal-Owner, Tasks, Erinnerungen,
                SLA, etc.) brauchst, sag Bescheid – das kann ich strukturiert ergänzen.
              </div>
            </Card>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// -------------------------------------------------------
// Leads tab
// -------------------------------------------------------
function LeadsTab({
  state,
  locationsById,
  currency,
  leadSearch,
  setLeadSearch,
  leadStageFilter,
  setLeadStageFilter,
  locationFilter,
  setLocationFilter,
  sortedLeads,
  onEdit,
  onDelete,
  sort,
  setSortFor,
}) {
  const stageOptions = [{ value: 'all', label: 'Alle Stages' }, ...(state.leadStages || []).map((s) => ({ value: s, label: s }))];
  const locationOptions = [{ value: 'all', label: 'Alle Standorte' }, ...(state.locations || []).map((l) => ({ value: l.id, label: l.name }))];

  const columns = [
    {
      key: 'name',
      header: (
        <div className="flex items-center gap-2">
          Name
          <SortButton active={sort.scope === 'leads' && sort.key === 'name'} dir={sort.dir} onClick={() => setSortFor('leads', 'name')} />
        </div>
      ),
      render: (l) => (
        <div>
          <div className="font-semibold text-gray-900">{l.name || '-'}</div>
          <div className="text-xs text-gray-500">{l.company || ''}</div>
        </div>
      ),
    },
    {
      key: 'stage',
      header: (
        <div className="flex items-center gap-2">
          Stage
          <SortButton active={sort.scope === 'leads' && sort.key === 'stage'} dir={sort.dir} onClick={() => setSortFor('leads', 'stage')} />
        </div>
      ),
      render: (l) => <Badge tone={stageToneInline(l.stage)}>{l.stage}</Badge>,
    },
    {
      key: 'value',
      header: (
        <div className="flex items-center gap-2">
          Wert
          <SortButton active={sort.scope === 'leads' && sort.key === 'value'} dir={sort.dir} onClick={() => setSortFor('leads', 'value')} />
        </div>
      ),
      className: 'whitespace-nowrap',
      render: (l) => formatMoney(l.value, currency),
    },
    {
      key: 'location',
      header: 'Standort',
      render: (l) => locationsById.get(l.locationId)?.name ?? '—',
    },
    {
      key: 'updatedAt',
      header: (
        <div className="flex items-center gap-2">
          Update
          <SortButton active={sort.scope === 'leads' && sort.key === 'updatedAt'} dir={sort.dir} onClick={() => setSortFor('leads', 'updatedAt')} />
        </div>
      ),
      className: 'whitespace-nowrap',
      render: (l) => l.updatedAt || '—',
    },
    {
      key: 'actions',
      header: '',
      className: 'whitespace-nowrap text-right',
      render: (l) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(l); }} title="Bearbeiten">
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(l.id); }} title="Löschen">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <Input
          label="Suche"
          value={leadSearch}
          onChange={setLeadSearch}
          placeholder="Name, Firma, E-Mail, Notizen …"
          right={<Search className="h-4 w-4" />}
        />
        <Select label="Stage" value={leadStageFilter} onChange={setLeadStageFilter} options={stageOptions} />
        <Select label="Standort" value={locationFilter} onChange={setLocationFilter} options={locationOptions} />
      </div>

      <Table
        columns={columns}
        rows={sortedLeads}
        rowKey={(r) => r.id}
        onRowClick={onEdit}
        empty={
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Keine Leads gefunden"
            subtitle="Passe Filter/Suche an oder lege einen neuen Lead an."
          />
        }
      />
    </div>
  );
}

function stageToneInline(stage) {
  switch (stage) {
    case 'Neu':
      return 'blue';
    case 'Kontaktiert':
      return 'purple';
    case 'Qualifiziert':
      return 'yellow';
    case 'Angebot gesendet':
      return 'blue';
    case 'Verhandlung':
      return 'yellow';
    case 'Gewonnen':
      return 'green';
    case 'Verloren':
      return 'red';
    default:
      return 'gray';
  }
}

function SortButton({ active, dir, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'inline-flex items-center rounded-lg p-1 transition',
        active ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:bg-gray-100'
      )}
      title="Sortieren"
    >
      <ArrowUpDown className="h-3.5 w-3.5" />
      {active ? <span className="ml-1 text-[10px] font-semibold">{dir === 'asc' ? 'A→Z' : 'Z→A'}</span> : null}
    </button>
  );
}

// -------------------------------------------------------
// Customers tab
// -------------------------------------------------------
function CustomersTab({
  state,
  locationsById,
  currency,
  customerSearch,
  setCustomerSearch,
  customerStatusFilter,
  setCustomerStatusFilter,
  locationFilter,
  setLocationFilter,
  sortedCustomers,
  onEdit,
  onDelete,
  sort,
  setSortFor,
}) {
  const statusOptions = [
    { value: 'all', label: 'Alle Status' },
    { value: 'Aktiv', label: 'Aktiv' },
    { value: 'Pausiert', label: 'Pausiert' },
    { value: 'Kündigung', label: 'Kündigung' },
  ];
  const locationOptions = [{ value: 'all', label: 'Alle Standorte' }, ...(state.locations || []).map((l) => ({ value: l.id, label: l.name }))];

  const columns = [
    {
      key: 'name',
      header: (
        <div className="flex items-center gap-2">
          Kunde
          <SortButton active={sort.scope === 'customers' && sort.key === 'name'} dir={sort.dir} onClick={() => setSortFor('customers', 'name')} />
        </div>
      ),
      render: (c) => (
        <div>
          <div className="font-semibold text-gray-900">{c.name || '-'}</div>
          <div className="text-xs text-gray-500">{c.contact || ''}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: (
        <div className="flex items-center gap-2">
          Status
          <SortButton active={sort.scope === 'customers' && sort.key === 'status'} dir={sort.dir} onClick={() => setSortFor('customers', 'status')} />
        </div>
      ),
      render: (c) => <Badge tone={statusToneInline(c.status)}>{c.status}</Badge>,
    },
    {
      key: 'mrr',
      header: (
        <div className="flex items-center gap-2">
          MRR
          <SortButton active={sort.scope === 'customers' && sort.key === 'mrr'} dir={sort.dir} onClick={() => setSortFor('customers', 'mrr')} />
        </div>
      ),
      className: 'whitespace-nowrap',
      render: (c) => formatMoney(c.mrr, currency),
    },
    {
      key: 'location',
      header: 'Standort',
      render: (c) => locationsById.get(c.locationId)?.name ?? '—',
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {(c.tags || []).slice(0, 3).map((t) => (
            <Badge key={t} tone="gray">{t}</Badge>
          ))}
          {(c.tags || []).length > 3 ? <Badge tone="gray">+{(c.tags || []).length - 3}</Badge> : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'whitespace-nowrap text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(c); }} title="Bearbeiten">
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} title="Löschen">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <Input
          label="Suche"
          value={customerSearch}
          onChange={setCustomerSearch}
          placeholder="Kunde, Kontakt, Tags, Notizen …"
          right={<Search className="h-4 w-4" />}
        />
        <Select label="Status" value={customerStatusFilter} onChange={setCustomerStatusFilter} options={statusOptions} />
        <Select label="Standort" value={locationFilter} onChange={setLocationFilter} options={locationOptions} />
      </div>

      <Table
        columns={columns}
        rows={sortedCustomers}
        rowKey={(r) => r.id}
        onRowClick={onEdit}
        empty={
          <EmptyState
            icon={<Database className="h-6 w-6" />}
            title="Keine Kunden gefunden"
            subtitle="Passe Filter/Suche an oder lege einen neuen Kunden an."
          />
        }
      />
    </div>
  );
}

function statusToneInline(status) {
  switch (status) {
    case 'Aktiv':
      return 'green';
    case 'Pausiert':
      return 'yellow';
    case 'Kündigung':
      return 'red';
    default:
      return 'gray';
  }
}

// -------------------------------------------------------
// Analytics tab
// -------------------------------------------------------
function AnalyticsTab({ state, currency }) {
  const stageCounts = useMemo(() => {
    const map = new Map();
    (state.leadStages || []).forEach((s) => map.set(s, 0));
    (state.leads || []).forEach((l) => map.set(l.stage, (map.get(l.stage) || 0) + 1));
    return map;
  }, [state.leads, state.leadStages]);

  const mrrByStatus = useMemo(() => {
    const rows = (state.customers || []).reduce(
      (acc, c) => {
        const mrr = Number(c.mrr || 0);
        acc.total += mrr;
        acc[c.status] = (acc[c.status] || 0) + mrr;
        return acc;
      },
      { total: 0 }
    );
    return rows;
  }, [state.customers]);

  const wonLost = useMemo(() => {
    const leads = state.leads || [];
    const won = leads.filter((l) => l.stage === 'Gewonnen').reduce((sum, l) => sum + Number(l.value || 0), 0);
    const lost = leads.filter((l) => l.stage === 'Verloren').reduce((sum, l) => sum + Number(l.value || 0), 0);
    const open = leads.filter((l) => l.stage !== 'Gewonnen' && l.stage !== 'Verloren').reduce((sum, l) => sum + Number(l.value || 0), 0);
    return { won, lost, open };
  }, [state.leads]);

  return (
    <div className="space-y-6">
      <HelpCallout>
        Diese Analytics sind bewusst “basic”. Für echte KPI-Reports (Cohorts, Conversion Rates, Velocity, Forecasting) kann man das schnell erweitern.
      </HelpCallout>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <BarChart3 className="h-4 w-4" />
            Leads nach Stage
          </div>
          <div className="space-y-2">
            {(state.leadStages || []).map((s) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <div className="text-gray-700">{s}</div>
                <div className="font-semibold text-gray-900">{stageCounts.get(s) || 0}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <TrendingUp className="h-4 w-4" />
            Pipeline / Won / Lost
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-gray-700">Offen</div>
              <div className="font-semibold text-gray-900">{formatMoney(wonLost.open, currency)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-700">Gewonnen</div>
              <div className="font-semibold text-gray-900">{formatMoney(wonLost.won, currency)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-700">Verloren</div>
              <div className="font-semibold text-gray-900">{formatMoney(wonLost.lost, currency)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Database className="h-4 w-4" />
            MRR nach Status
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-gray-700">Total</div>
              <div className="font-semibold text-gray-900">{formatMoney(mrrByStatus.total, currency)}</div>
            </div>
            {['Aktiv', 'Pausiert', 'Kündigung'].map((s) => (
              <div key={s} className="flex items-center justify-between">
                <div className="text-gray-700">{s}</div>
                <div className="font-semibold text-gray-900">{formatMoney(mrrByStatus[s] || 0, currency)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Locations tab
// -------------------------------------------------------
function LocationsTab({ state, onEdit, onDelete }) {
  const columns = [
    {
      key: 'name',
      header: 'Standort',
      render: (l) => (
        <div>
          <div className="font-semibold text-gray-900">{l.name}</div>
          <div className="text-xs text-gray-500">{l.region || ''}</div>
        </div>
      ),
    },
    { key: 'address', header: 'Adresse', render: (l) => l.address || '—' },
    {
      key: 'actions',
      header: '',
      className: 'whitespace-nowrap text-right',
      render: (l) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(l); }} title="Bearbeiten">
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(l.id); }} title="Löschen">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Table
        columns={columns}
        rows={state.locations || []}
        rowKey={(r) => r.id}
        onRowClick={onEdit}
        empty={
          <EmptyState
            icon={<MapPin className="h-6 w-6" />}
            title="Keine Standorte"
            subtitle="Lege einen Standort an, um Leads/Kunden zuzuordnen."
          />
        }
      />
    </div>
  );
}

// -------------------------------------------------------
// Settings tab
// -------------------------------------------------------
function SettingsTab({ state, onUpdateProfile, onUpdateSettings, onReset }) {
  const [orgName, setOrgName] = useState(state.profile?.orgName || '');
  const [userName, setUserName] = useState(state.profile?.userName || '');
  const [currency, setCurrency] = useState(state.settings?.currency || 'EUR');
  const [dateFormat, setDateFormat] = useState(state.settings?.dateFormat || 'DD.MM.YYYY');
  const [allowDeleteConfirm, setAllowDeleteConfirm] = useState(state.settings?.allowDeleteConfirm ?? true);

  useEffect(() => setOrgName(state.profile?.orgName || ''), [state.profile?.orgName]);
  useEffect(() => setUserName(state.profile?.userName || ''), [state.profile?.userName]);
  useEffect(() => setCurrency(state.settings?.currency || 'EUR'), [state.settings?.currency]);
  useEffect(() => setDateFormat(state.settings?.dateFormat || 'DD.MM.YYYY'), [state.settings?.dateFormat]);
  useEffect(() => setAllowDeleteConfirm(state.settings?.allowDeleteConfirm ?? true), [state.settings?.allowDeleteConfirm]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Profil" subtitle="Organisationsname & Benutzer" />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <Input label="Organisation" value={orgName} onChange={setOrgName} placeholder="z. B. VooZaa" />
          <Input label="Benutzername" value={userName} onChange={setUserName} placeholder="z. B. Admin" />
          <div className="md:col-span-2">
            <Button
              onClick={() => onUpdateProfile({ orgName, userName })}
              className="w-full md:w-auto"
            >
              <Check className="h-4 w-4" />
              Speichern
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="App-Einstellungen" subtitle="Anzeige, Währung, Bestätigungen" />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <Select
            label="Währung"
            value={currency}
            onChange={setCurrency}
            options={[
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'USD', label: 'USD ($)' },
              { value: 'CHF', label: 'CHF' },
            ]}
          />
          <Select
            label="Datumsformat (nur Anzeige)"
            value={dateFormat}
            onChange={setDateFormat}
            options={[
              { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (de)' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
            ]}
          />
          <div className="md:col-span-2">
            <Toggle label="Lösch-Bestätigung aktiv" value={allowDeleteConfirm} onChange={setAllowDeleteConfirm} />
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <Button
              onClick={() => onUpdateSettings({ currency, dateFormat, allowDeleteConfirm })}
              className="w-full md:w-auto"
            >
              <Check className="h-4 w-4" />
              Speichern
            </Button>
            <Button variant="danger" onClick={onReset} className="w-full md:w-auto" title="Alles zurücksetzen">
              <Trash2 className="h-4 w-4" />
              Reset auf Default
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// -------------------------------------------------------
// Lead modal
// -------------------------------------------------------
function LeadModal({ open, onClose, onSave, lead, leadStages, locations, currency }) {
  const isEdit = Boolean(lead);

  const [name, setName] = useState(lead?.name || '');
  const [company, setCompany] = useState(lead?.company || '');
  const [email, setEmail] = useState(lead?.email || '');
  const [phone, setPhone] = useState(lead?.phone || '');
  const [stage, setStage] = useState(lead?.stage || (leadStages?.[0] || 'Neu'));
  const [source, setSource] = useState(lead?.source || '');
  const [locationId, setLocationId] = useState(lead?.locationId || (locations?.[0]?.id || null));
  const [value, setValue] = useState(String(lead?.value ?? ''));
  const [notes, setNotes] = useState(lead?.notes || '');
  const [showNotes, setShowNotes] = useState(true);

  useEffect(() => {
    setName(lead?.name || '');
    setCompany(lead?.company || '');
    setEmail(lead?.email || '');
    setPhone(lead?.phone || '');
    setStage(lead?.stage || (leadStages?.[0] || 'Neu'));
    setSource(lead?.source || '');
    setLocationId(lead?.locationId || (locations?.[0]?.id || null));
    setValue(String(lead?.value ?? ''));
    setNotes(lead?.notes || '');
  }, [lead, leadStages, locations, open]);

  const stageOptions = (leadStages || []).map((s) => ({ value: s, label: s }));
  const locationOptions = [{ value: '', label: '—' }, ...(locations || []).map((l) => ({ value: l.id, label: l.name }))];

  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const payload = {
      ...(lead || {}),
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      stage,
      source: source.trim(),
      locationId: locationId || null,
      value: value === '' ? 0 : Number(value),
      notes: notes.trim(),
    };
    onSave(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Lead bearbeiten' : 'Neuen Lead anlegen'}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={save} disabled={!canSave}>
            <Check className="h-4 w-4" />
            Speichern
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Name*" value={name} onChange={setName} placeholder="z. B. Max Mustermann" />
        <Input label="Firma" value={company} onChange={setCompany} placeholder="z. B. Muster GmbH" />
        <Input label="E-Mail" value={email} onChange={setEmail} placeholder="name@firma.de" />
        <Input label="Telefon" value={phone} onChange={setPhone} placeholder="+49 ..." />
        <Select label="Stage" value={stage} onChange={setStage} options={stageOptions} />
        <Input label="Quelle" value={source} onChange={setSource} placeholder="Website, Referral, Messe ..." />
        <Select label="Standort" value={locationId || ''} onChange={setLocationId} options={locationOptions} />
        <Input label={`Deal-Wert (${currency})`} value={value} onChange={setValue} type="number" placeholder="0" />

        <div className="md:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Notizen</div>
            <Button variant="ghost" size="sm" onClick={() => setShowNotes((v) => !v)} title="Notizen ein-/ausblenden">
              {showNotes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showNotes ? 'Ausblenden' : 'Einblenden'}
            </Button>
          </div>
          {showNotes ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Infos, nächste Schritte, etc."
              className="h-28 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

// -------------------------------------------------------
// Customer modal
// -------------------------------------------------------
function CustomerModal({ open, onClose, onSave, customer, locations, customerTags }) {
  const isEdit = Boolean(customer);

  const [name, setName] = useState(customer?.name || '');
  const [contact, setContact] = useState(customer?.contact || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [status, setStatus] = useState(customer?.status || 'Aktiv');
  const [locationId, setLocationId] = useState(customer?.locationId || (locations?.[0]?.id || null));
  const [mrr, setMrr] = useState(String(customer?.mrr ?? ''));
  const [startDate, setStartDate] = useState(customer?.startDate || toISODate());
  const [tags, setTags] = useState(customer?.tags || []);
  const [notes, setNotes] = useState(customer?.notes || '');

  useEffect(() => {
    setName(customer?.name || '');
    setContact(customer?.contact || '');
    setEmail(customer?.email || '');
    setPhone(customer?.phone || '');
    setStatus(customer?.status || 'Aktiv');
    setLocationId(customer?.locationId || (locations?.[0]?.id || null));
    setMrr(String(customer?.mrr ?? ''));
    setStartDate(customer?.startDate || toISODate());
    setTags(customer?.tags || []);
    setNotes(customer?.notes || '');
  }, [customer, locations, open]);

  const statusOptions = [
    { value: 'Aktiv', label: 'Aktiv' },
    { value: 'Pausiert', label: 'Pausiert' },
    { value: 'Kündigung', label: 'Kündigung' },
  ];
  const locationOptions = [{ value: '', label: '—' }, ...(locations || []).map((l) => ({ value: l.id, label: l.name }))];

  const toggleTag = (t) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const payload = {
      ...(customer || {}),
      name: name.trim(),
      contact: contact.trim(),
      email: email.trim(),
      phone: phone.trim(),
      status,
      locationId: locationId || null,
      mrr: mrr === '' ? 0 : Number(mrr),
      startDate,
      tags,
      notes: notes.trim(),
    };
    onSave(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Kunde bearbeiten' : 'Neuen Kunden anlegen'}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={save} disabled={!canSave}>
            <Check className="h-4 w-4" />
            Speichern
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Kunde*" value={name} onChange={setName} placeholder="z. B. ACME Logistics" />
        <Input label="Kontakt" value={contact} onChange={setContact} placeholder="z. B. Jonas Becker" />
        <Input label="E-Mail" value={email} onChange={setEmail} placeholder="kontakt@kunde.de" />
        <Input label="Telefon" value={phone} onChange={setPhone} placeholder="+49 ..." />
        <Select label="Status" value={status} onChange={setStatus} options={statusOptions} />
        <Select label="Standort" value={locationId || ''} onChange={setLocationId} options={locationOptions} />
        <Input label="MRR (monatlich)" value={mrr} onChange={setMrr} type="number" placeholder="0" />
        <Input label="Startdatum" value={startDate} onChange={setStartDate} type="date" />

        <div className="md:col-span-2">
          <div className="mb-2 text-sm font-medium text-gray-700">Tags</div>
          <div className="flex flex-wrap gap-2">
            {(customerTags || []).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={classNames(
                  'rounded-full border px-3 py-1 text-xs font-medium transition',
                  tags.includes(t) ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                {tags.includes(t) ? '✓ ' : ''}
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="mb-1 text-sm font-medium text-gray-700">Notizen</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Vertragsdetails, nächste Schritte, etc."
            className="h-28 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
      </div>
    </Modal>
  );
}

// -------------------------------------------------------
// Location modal
// -------------------------------------------------------
function LocationModal({ open, onClose, onSave, location }) {
  const isEdit = Boolean(location);

  const [name, setName] = useState(location?.name || '');
  const [region, setRegion] = useState(location?.region || '');
  const [address, setAddress] = useState(location?.address || '');

  useEffect(() => {
    setName(location?.name || '');
    setRegion(location?.region || '');
    setAddress(location?.address || '');
  }, [location, open]);

  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const payload = {
      ...(location || {}),
      name: name.trim(),
      region: region.trim(),
      address: address.trim(),
    };
    onSave(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Standort bearbeiten' : 'Neuen Standort anlegen'}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={save} disabled={!canSave}>
            <Check className="h-4 w-4" />
            Speichern
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Name*" value={name} onChange={setName} placeholder="z. B. Berlin" />
        <Input label="Region" value={region} onChange={setRegion} placeholder="z. B. DE" />
        <div className="md:col-span-2">
          <Input label="Adresse" value={address} onChange={setAddress} placeholder="Straße, PLZ, Ort" />
        </div>
      </div>
    </Modal>
  );
}

// -------------------------------------------------------
// Help modal
// -------------------------------------------------------
function HelpModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      title="Hilfe / Hinweise"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end">
          <Button onClick={onClose}>Schließen</Button>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-gray-700">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-2 font-semibold text-gray-900">Was ist das?</div>
          <div>
            Ein lokales CRM/Tracking-Board für Leads, Kunden und Standorte. Daten werden im Browser gespeichert (localStorage).
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-2 font-semibold text-gray-900">Backups</div>
          <div>
            Nutze in der Übersicht die Backup-Export-Funktion (JSON). Import ist ebenfalls möglich.
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-2 font-semibold text-gray-900">CSV Export</div>
          <div>
            Im Leads- und Kunden-Tab kannst du CSV-Dateien exportieren.
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-2 font-semibold text-gray-900">Erweiterungen</div>
          <div>
            Möglich: Tasks/Reminders, Deal Owner, E-Mail Templates, Integrationen, echte Auth, DB-Persistenz (z. B. Supabase/Prisma).
          </div>
        </div>
      </div>
    </Modal>
  );
}
