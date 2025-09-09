import React, { useEffect, useMemo, useState } from "react";

/**
 * ZEINA — Company Map + Rich Entity Editor
 * - Click a card to open an edit panel (owners, directors, docs, registration, tax, bank accounts)
 * - Multiple owners supported (entity or person)
 * - Data persists in localStorage
 */

/* ---------- Types ---------- */
type Status = "compliant" | "warning" | "critical";

type Doc = { id: string; name: string; size: number; uploadedAt: string };

type Owner =
  | { id: string; kind: "entity"; entityId: string }
  | { id: string; kind: "person"; name: string };

type CompanyNode = {
  id: string;
  name: string;
  regNo: string;
  country: string;
  docs: number;
  status: Status;
  children: CompanyNode[];

  // governance & ownership
  owners: Owner[];
  directors: string[];
  directorDocs: Doc[];
  ownershipDocs: Doc[];
  regDate?: string;
  taxNo?: string;
  bankAccounts: string[];
};

/* ---------- Utils ---------- */
const uid = () => Math.random().toString(36).slice(2, 9);
const STORAGE_KEY = "zeina_bids_ui_v2";

function save(tree: CompanyNode[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
}
function load(): CompanyNode[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CompanyNode[]) : null;
  } catch {
    return null;
  }
}

/* ---------- Seed Data ---------- */
const seed: CompanyNode[] = [
  {
    id: uid(),
    name: "Alpine Holdings SA",
    regNo: "CH-001-234-567",
    country: "Switzerland",
    docs: 2,
    status: "compliant",
    owners: [],
    directors: ["Anna Keller"],
    directorDocs: [],
    ownershipDocs: [],
    regDate: "2018-05-12",
    taxNo: "CHE-123.456.789",
    bankAccounts: ["CH93 0076 2011 6238 5295 7"],
    children: [
      {
        id: uid(),
        name: "Monaco Investments Ltd",
        regNo: "MC-2021-789",
        country: "Monaco",
        docs: 2,
        status: "warning",
        owners: [],
        directors: ["Jean Dupont"],
        directorDocs: [],
        ownershipDocs: [],
        regDate: "2021-09-01",
        taxNo: "MC-987654",
        bankAccounts: [],
        children: [],
      },
      {
        id: uid(),
        name: "Luxembourg Financial SPV",
        regNo: "LU-2019-001",
        country: "Luxembourg",
        docs: 2,
        status: "critical",
        owners: [],
        directors: [],
        directorDocs: [],
        ownershipDocs: [],
        regDate: "2019-01-03",
        taxNo: "LU-2019-001-TAX",
        bankAccounts: ["LU28 0019 4006 4475 0000"],
        children: [],
      },
    ],
  },
];

/* ---------- UI primitives ---------- */
function Badge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    compliant: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    critical: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs border px-2 py-0.5 rounded-full ${map[status]}`}>
      {status}
    </span>
  );
}
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border shadow-sm ${className}`}>{children}</div>;
}
function Header({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  const Tab = ({ id, label }: any) => (
    <button
      onClick={() => onChange(id)}
      className={`px-3 py-2 rounded-xl text-sm border ${active === id ? "bg-yellow-400/90 border-yellow-500 text-black" : "hover:bg-black/5"}`}
    >
      {label}
    </button>
  );
  return (
    <div className="sticky top-0 z-30">
      <div className="h-20 w-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-gray-200 border-b" />
      <div className="absolute inset-x-0 top-0 h-20 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-yellow-500 text-black grid place-items-center font-bold">🛡️</div>
          <div>
            <div className="font-bold tracking-wide">ZEINA</div>
            <div className="text-xs text-black/70 -mt-0.5">Quality that powers your success</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tab id="map" label={<><span className="mr-1">🏢</span>Company Map</>} />
          <Tab id="world" label={<><span className="mr-1">🌍</span>World View</>} />
          <Tab id="cmdb" label={<><span className="mr-1">🧩</span>CMDB</>} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Cards ---------- */
function NodeCard({
  node, onEdit, onAddChild, onDelete, editable, onOpen,
}: {
  node: CompanyNode;
  onEdit: () => void;
  onAddChild?: () => void;
  onDelete?: () => void;
  editable?: boolean;
  onOpen?: () => void;
}) {
  return (
    <Card className="p-4 w-[300px]">
      <div className="flex items-start justify-between" onClick={onOpen} role="button">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-yellow-400 grid place-items-center">🏢</div>
          <div>
            <div className="font-semibold leading-5 truncate max-w-[220px]" title={node.name}>{node.name}</div>
            <div className="text-xs text-gray-500">{node.regNo}</div>
          </div>
        </div>
        <div className="ml-2"><Badge status={node.status} /></div>
      </div>
      <div className="mt-3 text-xs text-gray-600">{node.docs} docs • {node.country}</div>
      {editable && (
        <div className="mt-3 flex gap-2">
          {onAddChild && <button onClick={onAddChild} className="px-2 py-1 text-xs border rounded-lg hover:bg-gray-50">Add</button>}
          {onEdit && <button onClick={onEdit} className="px-2 py-1 text-xs border rounded-lg hover:bg-gray-50">Edit</button>}
          {onDelete && <button onClick={onDelete} className="px-2 py-1 text-xs border rounded-lg text-red-600 border-red-300 hover:bg-red-50">Delete</button>}
        </div>
      )}
    </Card>
  );
}

/* ---------- Assistant (left) ---------- */
function AssistantPanel({ onAction }: { onAction: (action: "overview" | "check" | "kyc") => void }) {
  return (
    <Card className="h-full overflow-hidden">
      <div className="border-b p-4">
        <div className="font-semibold">ZEINA Assistant</div>
        <div className="text-sm text-gray-500">Your AI compliance companion</div>
      </div>
      <div className="p-4">
        <div className="bg-gray-50 rounded-2xl p-4 border">
          <div className="text-sm">
            Hello! I'm ZEINA, your compliance assistant. I can help you manage company documents, track compliance status,
            generate KYC packs, and coordinate with regulatory bodies.
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => onAction("overview")} className="px-3 py-1.5 rounded-xl border hover:bg-gray-50">Show Company Overview</button>
            <button onClick={() => onAction("check")} className="px-3 py-1.5 rounded-xl border hover:bg-gray-50">Check Compliance Status</button>
            <button onClick={() => onAction("kyc")} className="px-3 py-1.5 rounded-xl border hover:bg-gray-50">Generate KYC Pack</button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Edit Panel ---------- */
function EditInline({
  node, onSave, onCancel, allEntities,
}: { node: CompanyNode; onSave: (n: CompanyNode) => void; onCancel: () => void; allEntities: CompanyNode[] }) {
  const [draft, setDraft] = useState<CompanyNode>({ ...node, children: node.children });

  // Directors
  const addDirector = () => setDraft({ ...draft, directors: [...(draft.directors || []), ""] });
  const updateDirector = (i: number, v: string) => {
    const arr = [...(draft.directors || [])];
    arr[i] = v;
    setDraft({ ...draft, directors: arr });
  };
  const removeDirector = (i: number) => {
    const arr = [...(draft.directors || [])];
    arr.splice(i, 1);
    setDraft({ ...draft, directors: arr });
  };

  // Banks
  const addBank = () => setDraft({ ...draft, bankAccounts: [...(draft.bankAccounts || []), ""] });
  const updateBank = (i: number, v: string) => {
    const arr = [...(draft.bankAccounts || [])];
    arr[i] = v;
    setDraft({ ...draft, bankAccounts: arr });
  };
  const removeBank = (i: number) => {
    const arr = [...(draft.bankAccounts || [])];
    arr.splice(i, 1);
    setDraft({ ...draft, bankAccounts: arr });
  };

  // Owners
  const addOwnerPerson = () =>
    setDraft({ ...draft, owners: [...(draft.owners || []), { id: uid(), kind: "person", name: "" }] });
  const addOwnerEntity = (entityId: string) =>
    setDraft({ ...draft, owners: [...(draft.owners || []), { id: uid(), kind: "entity", entityId }] });
  const updateOwnerPerson = (i: number, v: string) => {
    const arr = [...(draft.owners || [])] as any[];
    arr[i] = { ...(arr[i] || {}), name: v };
    setDraft({ ...draft, owners: arr as any });
  };
  const removeOwner = (i: number) => {
    const arr = [...(draft.owners || [])];
    arr.splice(i, 1);
    setDraft({ ...draft, owners: arr });
  };

  // Uploads
  const onUpload = (kind: "director" | "ownership", files: FileList | null) => {
    if (!files || !files.length) return;
    const list = Array.from(files).map((f) => ({
      id: uid(),
      name: f.name,
      size: f.size,
      uploadedAt: new Date().toISOString(),
    }));
    if (kind === "director")
      setDraft({ ...draft, directorDocs: [...(draft.directorDocs || []), ...list] as Doc[] });
    else setDraft({ ...draft, ownershipDocs: [...(draft.ownershipDocs || []), ...list] as Doc[] });
  };

  return (
    <Card className="p-4 w-[340px] border-2 border-yellow-300">
      <div className="text-sm font-semibold mb-3">Edit entity</div>

      {/* Basics */}
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500">Name</label>
            <input className="w-full px-2 py-1 border rounded-lg" value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Registration No</label>
            <input className="w-full px-2 py-1 border rounded-lg" value={draft.regNo}
              onChange={(e) => setDraft({ ...draft, regNo: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Country</label>
            <input className="w-full px-2 py-1 border rounded-lg" value={draft.country}
              onChange={(e) => setDraft({ ...draft, country: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Registration Date</label>
            <input type="date" className="w-full px-2 py-1 border rounded-lg" value={draft.regDate || ""}
              onChange={(e) => setDraft({ ...draft, regDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Tax number</label>
            <input className="w-full px-2 py-1 border rounded-lg" value={draft.taxNo || ""}
              onChange={(e) => setDraft({ ...draft, taxNo: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500">Docs</label>
              <input type="number" className="w-full px-2 py-1 border rounded-lg" value={draft.docs}
                onChange={(e) => setDraft({ ...draft, docs: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Status</label>
              <select className="w-full px-2 py-1 border rounded-lg" value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })}>
                <option value="compliant">compliant</option>
                <option value="warning">warning</option>
                <option value="critical">critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Owners */}
        <div>
          <div className="font-medium mb-1">Owners</div>
          <div className="flex flex-wrap gap-2 mb-2">
            <button onClick={addOwnerPerson} className="px-2 py-1 border rounded-lg text-xs">+ Person</button>
            <select className="px-2 py-1 border rounded-lg text-xs"
              onChange={(e) => { if (e.target.value) { addOwnerEntity(e.target.value); e.target.value = ""; } }}>
              <option value="">+ Entity…</option>
              {allEntities.filter(e => e.id !== draft.id).map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            {draft.owners?.map((o, i) => (
              <div key={o.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{o.kind}</span>
                {o.kind === "person" ? (
                  <input className="flex-1 px-2 py-1 border rounded-lg" placeholder="Owner name"
                    value={(o as any).name || ""} onChange={(e) => updateOwnerPerson(i, e.target.value)} />
                ) : (
                  <span className="flex-1 text-sm">
                    {allEntities.find(e => e.id === (o as any).entityId)?.name || "Unknown entity"}
                  </span>
                )}
                <button onClick={() => removeOwner(i)} className="px-2 py-1 text-xs border rounded-lg">Remove</button>
              </div>
            ))}
          </div>
        </div>

        {/* Directors */}
        <div>
          <div className="font-medium mb-1">Director(s)</div>
          <div className="space-y-2">
            {draft.directors?.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className="flex-1 px-2 py-1 border rounded-lg" placeholder="Director name"
                  value={d} onChange={(e) => updateDirector(i, e.target.value)} />
                <button onClick={() => removeDirector(i)} className="px-2 py-1 text-xs border rounded-lg">Remove</button>
              </div>
            ))}
            <button onClick={addDirector} className="px-2 py-1 text-xs border rounded-lg">+ Add director</button>
          </div>
        </div>

        {/* Documents */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="font-medium">Director Documents</div>
              <label className="px-2 py-1 text-xs border rounded-lg cursor-pointer">+ Upload
                <input type="file" className="hidden" multiple onChange={(e) => onUpload("director", e.target.files)} />
              </label>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-gray-600">
              {draft.directorDocs?.map(doc => (
                <li key={doc.id}>• {doc.name} <span className="text-gray-400">({Math.round(doc.size / 1024)} KB)</span></li>
              ))}
              {!draft.directorDocs?.length && <li className="text-gray-400">No files yet.</li>}
            </ul>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <div className="font-medium">Ownership Documents</div>
              <label className="px-2 py-1 text-xs border rounded-lg cursor-pointer">+ Upload
                <input type="file" className="hidden" multiple onChange={(e) => onUpload("ownership", e.target.files)} />
              </label>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-gray-600">
              {draft.ownershipDocs?.map(doc => (
                <li key={doc.id}>• {doc.name} <span className="text-gray-400">({Math.round(doc.size / 1024)} KB)</span></li>
              ))}
              {!draft.ownershipDocs?.length && <li className="text-gray-400">No files yet.</li>}
            </ul>
          </div>
        </div>

        {/* Bank accounts */}
        <div>
          <div className="font-medium mb-1">Bank accounts</div>
          <div className="space-y-2">
            {draft.bankAccounts?.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className="flex-1 px-2 py-1 border rounded-lg" placeholder="IBAN or label"
                  value={b} onChange={(e) => updateBank(i, e.target.value)} />
                <button onClick={() => removeBank(i)} className="px-2 py-1 text-xs border rounded-lg">Remove</button>
              </div>
            ))}
            <button onClick={addBank} className="px-2 py-1 text-xs border rounded-lg">+ Add account</button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={() => onSave(draft)} className="px-3 py-1.5 rounded-lg border bg-yellow-400">Save</button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg border">Cancel</button>
      </div>
    </Card>
  );
}

/* ---------- Main App ---------- */
export default function App() {
  const [tree, setTree] = useState<CompanyNode[]>(load() || seed);
  const [activeTab, setActiveTab] = useState<"map" | "world" | "cmdb">("map");
  const [modify, setModify] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => save(tree), [tree]);

  // Traverse + helpers
  const walk = (nodes: CompanyNode[], fn: (n: CompanyNode, parent?: CompanyNode) => void, parent?: CompanyNode) => {
    nodes.forEach(n => { fn(n, parent); walk(n.children, fn, n); });
  };
  const updateNode = (id: string, updater: (n: CompanyNode) => CompanyNode) => {
    const rec = (nodes: CompanyNode[]): CompanyNode[] =>
      nodes.map(n => (n.id === id ? updater({ ...n }) : { ...n, children: rec(n.children) }));
    setTree(rec(tree));
  };
  const flatten = (nodes: CompanyNode[]) => {
    const out: CompanyNode[] = [];
    walk(nodes, n => out.push(n));
    return out;
  };
  const addChild = (parentId: string) => {
    const child: CompanyNode = {
      id: uid(),
      name: "New Entity",
      regNo: "—",
      country: "—",
      docs: 0,
      status: "warning",
      children: [],
      owners: [],
      directors: [],
      directorDocs: [],
      ownershipDocs: [],
      bankAccounts: [],
    };
    const rec = (nodes: CompanyNode[]): CompanyNode[] =>
      nodes.map(n => (n.id === parentId ? { ...n, children: [...n.children, child] } : { ...n, children: rec(n.children) }));
    setTree(rec(tree));
    setEditingId(child.id);
    setModify(true);
  };
  const deleteNode = (id: string) => {
    const rec = (nodes: CompanyNode[]): CompanyNode[] =>
      nodes.filter(n => n.id !== id).map(n => ({ ...n, children: rec(n.children) }));
    setTree(rec(tree));
  };

  // Portfolio summary
  const summary = useMemo(() => {
    let compliant = 0, warning = 0, critical = 0;
    walk(tree, n => {
      if (n.status === "compliant") compliant++;
      else if (n.status === "warning") warning++;
      else critical++;
    });
    return { compliant, warning, critical };
  }, [tree]);

  const root = tree[0];

  const onAssistant = (action: "overview" | "check" | "kyc") => {
    if (action === "check") {
      alert(`Portfolio status — Compliant: ${summary.compliant}, Warning: ${summary.warning}, Critical: ${summary.critical}`);
    } else if (action === "kyc") {
      alert("KYC pack generation is stubbed in MVP. (Hook your backend here)");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const Legend = () => {
    const Item = ({ color, label }: any) => (
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
        {label}
      </div>
    );
    return (
      <div className="flex items-center gap-4">
        <Item color="bg-emerald-500" label="Compliant" />
        <Item color="bg-amber-500" label="Warning" />
        <Item color="bg-red-500" label="Critical" />
      </div>
    );
  };

  const Structure = () => (
    <div className="relative">
      <div className="flex items-center justify-end gap-4 mb-4">
        <button onClick={() => setModify(m => !m)} className={`px-3 py-1.5 rounded-xl border ${modify ? "bg-yellow-400" : "hover:bg-gray-50"}`}>
          {modify ? "Done" : "Modify"}
        </button>
        <Legend />
      </div>

      {/* Root */}
      <div className="w-full flex justify-center">
        {editingId === root?.id && modify ? (
          <EditInline
            node={root}
            allEntities={flatten(tree)}
            onSave={(draft) => { updateNode(root.id, () => draft); setEditingId(null); }}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <NodeCard
            node={root}
            editable={modify}
            onEdit={() => { setEditingId(root.id); }}
            onAddChild={() => addChild(root.id)}
            onDelete={undefined}
            onOpen={() => { setEditingId(root.id); setModify(true); }}
          />
        )}
      </div>

      {root?.children.length ? (
        <div className="flex items-center justify-center" aria-hidden>
          <div className="h-10 w-px bg-gray-300" />
        </div>
      ) : null}

      {/* Children */}
      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-8 place-items-center">
        {root?.children.map((child) => (
          <div key={child.id} className="relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 h-6 w-px bg-gray-300" aria-hidden />
            {editingId === child.id && modify ? (
              <EditInline
                node={child}
                allEntities={flatten(tree)}
                onSave={(draft) => { updateNode(child.id, () => draft); setEditingId(null); }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <NodeCard
                node={child}
                editable={modify}
                onEdit={() => setEditingId(child.id)}
                onAddChild={() => addChild(child.id)}
                onDelete={() => { if (confirm("Delete entity?")) deleteNode(child.id); }}
                onOpen={() => { setEditingId(child.id); setModify(true); }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Portfolio Summary */}
      <div className="mt-8">
        <Card className="p-4">
          <div className="font-semibold mb-1">Portfolio Summary</div>
          <div className="grid grid-cols-3 text-center">
            <div>
              <div className="text-emerald-600 text-xl font-bold">{summary.compliant}</div>
              <div className="text-xs text-gray-600">Compliant</div>
            </div>
            <div>
              <div className="text-amber-600 text-xl font-bold">{summary.warning}</div>
              <div className="text-xs text-gray-600">Warning</div>
            </div>
            <div>
              <div className="text-red-600 text-xl font-bold">{summary.critical}</div>
              <div className="text-xs text-gray-600">Critical</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header active={activeTab} onChange={(v) => setActiveTab(v as any)} />
      <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-6 p-4 md:p-6">
        <div className="col-span-12 lg:col-span-4">
          <AssistantPanel onAction={onAssistant} />
        </div>
        <div className="col-span-12 lg:col-span-8">
          <div className="text-xl font-semibold mb-2">Company Structure</div>
          <Structure />
        </div>
      </div>
    </div>
  );
}
