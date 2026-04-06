import { useRef, useState, useEffect } from 'react';
import { Download, Upload, Trash2, Plus, Pencil, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { useCategories, createCategory, updateCategory, deleteCategory } from '../../hooks/useCategories';
import { useActiveAccounts } from '../../hooks/useAccounts';
import { exportAllData, importAllData } from '../../utils/exportImport';
import { parseCsvFile, deduplicateTransactions, BANK_FORMAT_LABELS, type CsvTransaction } from '../../utils/csvImport';
import { db } from '../../db';
import { seedDatabase } from '../../db/seeds';
import { formatNOK } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import type { Category } from '../../db/schema';

// ──────────────────────────────────────────────
// Shared category dialog (reused from Budget page)
// ──────────────────────────────────────────────
const PRESET_COLORS = [
  '#ef4444','#f97316','#f59e0b','#84cc16','#22c55e',
  '#14b8a6','#06b6d4','#3b82f6','#8b5cf6','#ec4899',
  '#94a3b8','#64748b',
];
const PRESET_ICONS = ['🛒','🚗','🏠','💊','🎭','✈️','🍽️','📱','👕','🎓','💪','🐾','🎮','📦','💰','🏦','🛠️','🌿','🎁','📚'];

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

function CategoryDialog({
  open, onOpenChange, editing,
}: { open: boolean; onOpenChange: (v: boolean) => void; editing: Category | null }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [color, setColor] = useState('#94a3b8');
  const [icon, setIcon] = useState('📦');

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '');
      setType(editing?.type ?? 'expense');
      setColor(editing?.color ?? '#94a3b8');
      setIcon(editing?.icon ?? '📦');
    }
  }, [open, editing]);

  const handleSave = async () => {
    if (!name.trim()) return;
    const data = { name: name.trim(), type, color, icon, isDefault: false };
    if (editing?.id) await updateCategory(editing.id, data);
    else await createCategory(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? 'Rediger kategori' : 'Ny kategori'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Navn *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Kategorinavn" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={v => setType(v as 'expense' | 'income')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Utgift</SelectItem>
                <SelectItem value="income">Inntekt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Ikon</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ICONS.map(i => (
                <button key={i} type="button" onClick={() => setIcon(i)}
                  className={cn('w-8 h-8 text-base rounded border transition-colors',
                    icon === i ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700')}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Farge</Label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn('w-6 h-6 rounded-full border-2 transition-transform',
                    color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent')}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="w-6 h-6 rounded-full cursor-pointer border border-gray-200" />
              <div className="w-8 h-8 rounded flex items-center justify-center text-base ml-1"
                style={{ backgroundColor: color + '30' }}>{icon}</div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
            <Button onClick={handleSave} disabled={!name.trim()}>Lagre</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// CSV Import tab
// ──────────────────────────────────────────────
function CsvImportTab() {
  const accounts = useActiveAccounts();
  const categories = useCategories('expense');
  const fileRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<CsvTransaction[] | null>(null);
  const [format, setFormat] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [defaultCategoryId, setDefaultCategoryId] = useState<number>(0);
  const [duplicates, setDuplicates] = useState<CsvTransaction[]>([]);
  const [importStatus, setImportStatus] = useState('');
  const [importing, setImporting] = useState(false);
  const [includeDuplicates, setIncludeDuplicates] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = parseCsvFile(text);
    setFormat(BANK_FORMAT_LABELS[result.format]);
    setErrors(result.errors);
    setImportStatus('');

    if (result.transactions.length > 0) {
      // Check duplicates against existing transactions
      const existing = await db.transactions.toArray();
      const { unique, duplicates: dups } = deduplicateTransactions(result.transactions, existing);
      setParsed(unique);
      setDuplicates(dups);
    } else {
      setParsed(result.transactions);
      setDuplicates([]);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleImport = async () => {
    if (!parsed || parsed.length === 0) return;
    if (!selectedAccountId) { setImportStatus('Velg en konto først'); return; }
    if (!defaultCategoryId) { setImportStatus('Velg en standardkategori'); return; }
    setImporting(true);
    try {
      const now = new Date();
      const toImport = includeDuplicates ? [...parsed, ...duplicates] : parsed;
      const account = await db.accounts.get(selectedAccountId);
      if (!account) { setImportStatus('Konto ikke funnet'); return; }

      let balanceDelta = 0;
      await db.transaction('rw', db.transactions, db.accounts, async () => {
        for (const tx of toImport) {
          const type = tx.amount >= 0 ? 'income' : 'expense';
          const absAmount = Math.abs(tx.amount);
          await db.transactions.add({
            accountId: selectedAccountId,
            categoryId: defaultCategoryId,
            amount: absAmount,
            date: tx.date,
            description: tx.description,
            type,
            notes: '',
            tags: [],
            isRecurring: false,
            isReconciled: false,
            createdAt: now,
            updatedAt: now,
          });
          if (type === 'income') balanceDelta += absAmount;
          else balanceDelta -= absAmount;
        }
        await db.accounts.update(selectedAccountId, {
          balance: account.balance + balanceDelta,
          updatedAt: now,
        });
      });
      setImportStatus(`✓ ${toImport.length} transaksjoner importert`);
      setParsed(null);
      setDuplicates([]);
    } catch (err) {
      setImportStatus(`✗ Feil ved import: ${err instanceof Error ? err.message : 'Ukjent feil'}`);
    } finally {
      setImporting(false);
    }
  };

  const txToImport = includeDuplicates ? (parsed?.length ?? 0) + duplicates.length : (parsed?.length ?? 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            CSV-import fra norsk bank
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>Støttede banker: <span className="font-medium">DNB, Nordea, Sbanken / Skandiabanken</span></p>
            <p>Last ned CSV-eksport fra nettbanken din og last den opp her.</p>
          </div>

          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Klikk for å laste opp CSV-fil</p>
            <p className="text-xs text-gray-500 mt-1">eller dra og slipp filen her</p>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
          </div>

          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{e}</span>
                </div>
              ))}
            </div>
          )}

          {parsed !== null && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">{format}</Badge>
                <span className="text-gray-600 dark:text-gray-400">
                  {parsed.length} nye transaksjoner funnet
                  {duplicates.length > 0 && `, ${duplicates.length} mulige duplikater`}
                </span>
              </div>

              {duplicates.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDuplicates}
                      onChange={e => setIncludeDuplicates(e.target.checked)}
                      className="rounded"
                    />
                    Inkluder {duplicates.length} mulige duplikater i import
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Konto *</Label>
                  <Select
                    value={selectedAccountId ? String(selectedAccountId) : ''}
                    onValueChange={v => setSelectedAccountId(parseInt(v))}
                  >
                    <SelectTrigger><SelectValue placeholder="Velg konto" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Standardkategori *</Label>
                  <Select
                    value={defaultCategoryId ? String(defaultCategoryId) : ''}
                    onValueChange={v => setDefaultCategoryId(parseInt(v))}
                  >
                    <SelectTrigger><SelectValue placeholder="Velg kategori" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.icon} {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Alle importerte transaksjoner får standardkategorien. Du kan endre enkeltvis etterpå.
              </p>

              {/* Preview table */}
              {parsed.length > 0 && (
                <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-xs font-medium text-gray-500 grid grid-cols-3 gap-2">
                    <span>Dato</span>
                    <span>Beskrivelse</span>
                    <span className="text-right">Beløp</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                    {parsed.slice(0, 50).map((tx, i) => (
                      <div key={i} className="px-3 py-1.5 text-xs grid grid-cols-3 gap-2 items-center">
                        <span className="text-gray-500">{formatDate(tx.date)}</span>
                        <span className="truncate">{tx.description}</span>
                        <span className={cn('text-right font-medium', tx.amount >= 0 ? 'text-green-600' : 'text-red-500')}>
                          {tx.amount >= 0 ? '+' : ''}{formatNOK(Math.abs(tx.amount))}
                        </span>
                      </div>
                    ))}
                    {parsed.length > 50 && (
                      <div className="px-3 py-2 text-xs text-gray-400 text-center">
                        … og {parsed.length - 50} til
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => { setParsed(null); setDuplicates([]); setErrors([]); }}>
                  Avbryt
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || txToImport === 0}
                >
                  {importing ? 'Importerer…' : `Importer ${txToImport} transaksjoner`}
                </Button>
              </div>
            </>
          )}

          {importStatus && (
            <div className={cn(
              'flex items-center gap-2 text-sm p-3 rounded-md',
              importStatus.startsWith('✓')
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
            )}>
              {importStatus.startsWith('✓')
                ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                : <AlertCircle className="h-4 w-4 shrink-0" />}
              {importStatus}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Settings page
// ──────────────────────────────────────────────
export default function SettingsPage() {
  const categories = useCategories();
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => { await exportAllData(); };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importAllData(text);
      setImportStatus('✓ Data importert');
    } catch {
      setImportStatus('✗ Feil ved import – sjekk filformat');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClearAll = async () => {
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map(t => t.clear()));
    });
    await seedDatabase();
  };

  const expCats = categories.filter(c => c.type === 'expense');
  const incCats = categories.filter(c => c.type === 'income');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Innstillinger</h1>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Kategorier</TabsTrigger>
          <TabsTrigger value="csv">CSV-import</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        {/* ── Categories tab ── */}
        <TabsContent value="categories" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingCat(null); setCatOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Ny kategori
            </Button>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Utgiftskategorier ({expCats.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              {expCats.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800 first:border-0">
                  <div className="w-8 h-8 rounded flex items-center justify-center text-base" style={{ backgroundColor: cat.color + '20' }}>
                    {cat.icon}
                  </div>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="flex-1 text-sm font-medium">{cat.name}</span>
                  {cat.isDefault && <Badge variant="secondary" className="text-xs">Standard</Badge>}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCat(cat); setCatOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!cat.isDefault && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Slett kategori</AlertDialogTitle>
                          <AlertDialogDescription>Slette "{cat.name}"?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction onClick={() => cat.id && deleteCategory(cat.id)}>Slett</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Inntektskategorier ({incCats.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              {incCats.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800 first:border-0">
                  <div className="w-8 h-8 rounded flex items-center justify-center text-base" style={{ backgroundColor: cat.color + '20' }}>
                    {cat.icon}
                  </div>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="flex-1 text-sm font-medium">{cat.name}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCat(cat); setCatOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CSV Import tab ── */}
        <TabsContent value="csv" className="mt-4">
          <CsvImportTab />
        </TabsContent>

        {/* ── Data tab ── */}
        <TabsContent value="data" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Eksport og import</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Download className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Eksporter alle data</p>
                  <p className="text-xs text-gray-500 mt-1">Last ned en JSON-sikkerhetskopi av all din økonomidata.</p>
                  <Button className="mt-2" size="sm" onClick={handleExport}>Last ned backup</Button>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Upload className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Importer data</p>
                  <p className="text-xs text-gray-500 mt-1">Gjenopprett fra en JSON-sikkerhetskopi. <strong>Eksisterende data vil bli slettet.</strong></p>
                  <div className="mt-2">
                    <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" id="import-file" />
                    <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>Velg fil</Button>
                  </div>
                  {importStatus && <p className="text-sm mt-2 font-medium">{importStatus}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900">
            <CardHeader><CardTitle className="text-red-600">Farlig sone</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Slett alle data og tilbakestill appen til standardkategorier.</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" />Slett alle data</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Slett alle data</AlertDialogTitle>
                    <AlertDialogDescription>
                      Dette vil <strong>permanent slette</strong> alle kontoer, transaksjoner, budsjetter og all annen data. Dette kan ikke angres. Er du helt sikker?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll} className="bg-red-500 hover:bg-red-600">Slett alt</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CategoryDialog
        open={catOpen}
        onOpenChange={setCatOpen}
        editing={editingCat}
      />
    </div>
  );
}
