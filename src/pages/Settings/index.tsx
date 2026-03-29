import { useRef } from 'react';
import { useState } from 'react';
import { Download, Upload, Trash2, Plus, Pencil } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useCategories, createCategory, updateCategory, deleteCategory } from '../../hooks/useCategories';
import { exportAllData, importAllData } from '../../utils/exportImport';
import { db } from '../../db';
import { seedDatabase } from '../../db/seeds';
import type { Category } from '../../db/schema';

export default function SettingsPage() {
  const categories = useCategories();
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');
  const [catColor, setCatColor] = useState('#94a3b8');
  const [catIcon, setCatIcon] = useState('📦');
  const [importStatus, setImportStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAddCat = () => {
    setEditingCat(null);
    setCatName('');
    setCatType('expense');
    setCatColor('#94a3b8');
    setCatIcon('📦');
    setCatOpen(true);
  };

  const handleEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatColor(cat.color);
    setCatIcon(cat.icon);
    setCatOpen(true);
  };

  const handleSaveCat = async () => {
    const data = { name: catName, type: catType, color: catColor, icon: catIcon, isDefault: false };
    if (editingCat?.id) await updateCategory(editingCat.id, data);
    else await createCategory(data);
    setCatOpen(false);
  };

  const handleExport = async () => {
    await exportAllData();
  };

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
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={handleAddCat}>
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
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditCat(cat)}>
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
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditCat(cat)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

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

      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat ? 'Rediger kategori' : 'Ny kategori'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Navn</Label>
              <Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Kategorinavn" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={catType} onValueChange={v => setCatType(v as 'expense' | 'income')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Utgift</SelectItem>
                    <SelectItem value="income">Inntekt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ikon (emoji)</Label>
                <Input value={catIcon} onChange={e => setCatIcon(e.target.value)} maxLength={2} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Farge</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="h-10 w-12 rounded cursor-pointer border border-gray-200" />
                <span className="text-sm text-gray-500">{catColor}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCatOpen(false)}>Avbryt</Button>
              <Button onClick={handleSaveCat} disabled={!catName.trim()}>Lagre</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
