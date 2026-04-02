import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, FileText, Download, Trash2, Upload } from 'lucide-react';

const Documentos: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ titulo: '', descricao: '', tipo: 'documento' });
  const [file, setFile] = useState<File | null>(null);
  const companyId = user?.tenantId;

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createDocument = useMutation({
    mutationFn: async () => {
      let fileUrl = null;
      let fileName = null;

      if (file) {
        const ext = file.name.split('.').pop();
        const path = `${companyId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('company-documents')
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('company-documents').getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileName = file.name;
      }

      const { error } = await supabase.from('documents').insert({
        company_id: companyId!,
        titulo: newDoc.titulo,
        descricao: newDoc.descricao,
        tipo: newDoc.tipo,
        file_url: fileUrl,
        file_name: fileName,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDialogOpen(false);
      setNewDoc({ titulo: '', descricao: '', tipo: 'documento' });
      setFile(null);
      toast.success('Documento criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar documento'),
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento excluído');
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documentos e Contratos</h1>
          <p className="text-muted-foreground">Gerencie seus arquivos e contratos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Novo Documento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Documento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Título" value={newDoc.titulo} onChange={e => setNewDoc(p => ({ ...p, titulo: e.target.value }))} />
              <Textarea placeholder="Descrição" value={newDoc.descricao} onChange={e => setNewDoc(p => ({ ...p, descricao: e.target.value }))} />
              <Select value={newDoc.tipo} onValueChange={v => setNewDoc(p => ({ ...p, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="documento">Documento</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="nota_fiscal">Nota Fiscal</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <Input type="file" className="border-0 p-0" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
              <Button className="w-full" onClick={() => createDocument.mutate()} disabled={!newDoc.titulo || createDocument.isPending}>
                {createDocument.isPending ? 'Salvando...' : 'Salvar Documento'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum documento cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map(doc => (
            <Card key={doc.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {doc.titulo}
                  </CardTitle>
                  <Badge variant="outline">{doc.tipo}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {doc.descricao && <p className="text-sm text-muted-foreground mb-3">{doc.descricao}</p>}
                <div className="flex items-center gap-2">
                  {doc.file_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-1 h-3 w-3" /> {doc.file_name || 'Download'}
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteDocument.mutate(doc.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{new Date(doc.created_at).toLocaleDateString('pt-BR')}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documentos;
