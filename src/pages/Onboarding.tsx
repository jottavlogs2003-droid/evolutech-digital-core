import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowRight, ArrowLeft, Check, Upload, Eye, EyeOff,
  Calendar, Utensils, ShoppingCart, Store, Wrench,
  GraduationCap, Briefcase, Heart, Sparkles, User, Mail, Lock, Building2
} from 'lucide-react';

const NICHES = [
  { id: 'barbearia', name: 'Barbearia', icon: Calendar },
  { id: 'restaurante', name: 'Restaurante', icon: Utensils },
  { id: 'hamburgueria', name: 'Hamburgueria', icon: ShoppingCart },
  { id: 'acaiteria', name: 'Açaíteria', icon: Store },
  { id: 'loja', name: 'Loja', icon: Store },
  { id: 'clinica', name: 'Clínica', icon: Heart },
  { id: 'prestador', name: 'Prestador de Serviço', icon: Wrench },
  { id: 'outro', name: 'Outro', icon: Sparkles },
];

const MODULES = [
  { id: 'dashboard', name: 'Dashboard', desc: 'Visão geral em tempo real' },
  { id: 'agendamentos', name: 'Agenda', desc: 'Agendamentos e horários' },
  { id: 'clientes', name: 'CRM de Clientes', desc: 'Cadastro e histórico' },
  { id: 'financeiro', name: 'Financeiro', desc: 'Contas, caixa e fluxo' },
  { id: 'pedidos', name: 'Vendas e Pedidos', desc: 'Vendas e entregas' },
  { id: 'produtos', name: 'Produtos', desc: 'Catálogo e preços' },
  { id: 'estoque', name: 'Estoque', desc: 'Controle de entradas e saídas' },
  { id: 'automacao', name: 'Automação', desc: 'Mensagens automáticas' },
  { id: 'equipe', name: 'Equipe', desc: 'Usuários e permissões' },
  { id: 'marketing', name: 'Marketing', desc: 'Leads e campanhas' },
  { id: 'projetos', name: 'Projetos', desc: 'Tarefas e kanban' },
  { id: 'suporte', name: 'Suporte', desc: 'Tickets de atendimento' },
  { id: 'documentos', name: 'Documentos', desc: 'Arquivos e contratos' },
  { id: 'notificacoes', name: 'Notificações', desc: 'Alertas do sistema' },
  { id: 'auditoria', name: 'Auditoria', desc: 'Registro de ações' },
  { id: 'configuracoes', name: 'Configurações', desc: 'Preferências gerais' },
];

const STEPS = ['Cadastro', 'Nicho', 'Módulos', 'Personalização', 'Gerar'];

interface OnboardingData {
  fullName: string;
  companyName: string;
  email: string;
  password: string;
  niche: string;
  modules: string[];
  systemName: string;
  appName: string;
  primaryColor: string;
  logoFile: File | null;
  logoPreview: string;
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
    niche: '',
    modules: ['dashboard'],
    systemName: '',
    appName: '',
    primaryColor: '#ffffff',
    logoFile: null,
    logoPreview: '',
  });

  const update = useCallback((partial: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  const canNext = (): boolean => {
    switch (step) {
      case 0: return !!(data.fullName.trim() && data.companyName.trim() && data.email.trim() && data.password.length >= 6);
      case 1: return !!data.niche;
      case 2: return data.modules.length > 0;
      case 3: return !!(data.systemName.trim() && data.appName.trim());
      default: return true;
    }
  };

  const toggleModule = (id: string) => {
    update({
      modules: data.modules.includes(id)
        ? data.modules.filter(m => m !== id)
        : [...data.modules, id],
    });
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update({ logoFile: file, logoPreview: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      // Check if user is already authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      let userId: string;

      if (sessionData.session?.user) {
        userId = sessionData.session.user.id;
      } else {
        // 1. Sign up
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: data.fullName },
          },
        });
        if (authError) throw authError;
        if (!authData.user) throw new Error('Erro ao criar conta');
        userId = authData.user.id;

        // 2. Sign in immediately
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (loginError) throw loginError;
      }

      // 3. Generate company ID client-side to avoid SELECT permission issue
      const companyId = crypto.randomUUID();
      const slug = data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      
      const { error: companyError } = await supabase
        .from('companies')
        .insert({
          id: companyId,
          name: data.companyName,
          slug,
          niche: data.niche,
          plan: 'starter' as const,
          status: 'active' as const,
          settings: {
            system_name: data.systemName,
            app_name: data.appName,
          },
        });
      if (companyError) throw companyError;

      // 4. Upload logo
      if (data.logoFile) {
        const ext = data.logoFile.name.split('.').pop();
        const path = `${companyId}/logo.${ext}`;
        await supabase.storage.from('company-logos').upload(path, data.logoFile, { upsert: true });
        const { data: urlData } = supabase.storage.from('company-logos').getPublicUrl(path);
        await supabase.from('companies').update({ logo_url: urlData.publicUrl }).eq('id', companyId);
      }

      // 5. Assign role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'dono_empresa' as const,
        company_id: companyId,
      });
      if (roleError) throw roleError;

      // 6. Update profile with company_id
      await supabase.from('profiles').update({ company_id: companyId }).eq('id', userId);

      // 7. Create company theme
      await supabase.from('company_themes').insert({
        company_id: companyId,
        company_display_name: data.systemName,
        primary_color: hexToHsl(data.primaryColor),
      });

      // 8. Activate selected modules
      const { data: dbModules } = await supabase
        .from('modulos')
        .select('id, codigo')
        .in('codigo', data.modules);

      if (dbModules && dbModules.length > 0) {
        await supabase.from('empresa_modulos').insert(
          dbModules.map(m => ({
            empresa_id: companyId,
            modulo_id: m.id,
            ativo: true,
          }))
        );
      }

      toast.success('Sistema criado com sucesso!');
      
      // Force refresh auth state before redirecting
      window.location.href = '/empresa/dashboard';
    } catch (err: any) {
      const msg = err?.message || 'Erro ao criar sistema';
      if (msg.includes('already registered')) {
        toast.error('Este email já está cadastrado. Faça login.');
      } else {
        toast.error(msg);
        console.error('Onboarding error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const slideVariants = {
    enter: { x: 80, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { duration: 0.3 } },
    exit: { x: -80, opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar progress */}
      <div className="hidden lg:flex w-72 border-r border-border flex-col p-8 justify-between">
        <div>
          <Logo size="md" />
          <div className="mt-12 space-y-6">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  i < step ? 'bg-foreground text-background border-foreground' :
                  i === step ? 'border-foreground text-foreground' :
                  'border-border text-muted-foreground'
                }`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm ${i <= step ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Nexify Group</p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Mobile progress */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Logo size="sm" />
            <span className="text-xs text-muted-foreground">{step + 1} / {STEPS.length}</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-secondary rounded-full mb-8">
            <div className="h-full bg-foreground rounded-full transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} variants={slideVariants} initial="enter" animate="center" exit="exit">
              {/* STEP 0 — CADASTRO */}
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold">Crie sua conta</h2>
                    <p className="text-sm text-muted-foreground mt-1">Preencha seus dados para começar</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Seu nome" value={data.fullName} onChange={e => update({ fullName: e.target.value })} className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Nome da empresa</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Minha Empresa" value={data.companyName} onChange={e => update({ companyName: e.target.value, systemName: e.target.value, appName: e.target.value })} className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="email" placeholder="seu@email.com" value={data.email} onChange={e => update({ email: e.target.value })} className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          value={data.password}
                          onChange={e => update({ password: e.target.value })}
                          className="pl-10 pr-10"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1 — NICHO */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold">Escolha o nicho</h2>
                    <p className="text-sm text-muted-foreground mt-1">Qual é o segmento da sua empresa?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {NICHES.map(n => (
                      <button
                        key={n.id}
                        onClick={() => update({ niche: n.id })}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          data.niche === n.id
                            ? 'border-foreground bg-foreground/5'
                            : 'border-border hover:border-foreground/30'
                        }`}
                      >
                        <n.icon className={`w-6 h-6 mb-2 ${data.niche === n.id ? 'text-foreground' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">{n.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2 — MÓDULOS */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold">Escolha os módulos</h2>
                    <p className="text-sm text-muted-foreground mt-1">Ative as funcionalidades que precisa</p>
                  </div>
                  <div className="space-y-2">
                    {MODULES.map(m => (
                      <button
                        key={m.id}
                        onClick={() => toggleModule(m.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                          data.modules.includes(m.id)
                            ? 'border-foreground bg-foreground/5'
                            : 'border-border hover:border-foreground/30'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                          data.modules.includes(m.id) ? 'bg-foreground border-foreground' : 'border-muted-foreground'
                        }`}>
                          {data.modules.includes(m.id) && <Check className="w-3 h-3 text-background" />}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{m.name}</span>
                          <p className="text-xs text-muted-foreground">{m.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3 — PERSONALIZAÇÃO */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold">Personalize</h2>
                    <p className="text-sm text-muted-foreground mt-1">Deixe o sistema com a cara da sua empresa</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Logo da empresa</Label>
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-foreground/30 transition-colors">
                        {data.logoPreview ? (
                          <img src={data.logoPreview} alt="Logo" className="w-20 h-20 object-contain mb-2" />
                        ) : (
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        )}
                        <span className="text-sm text-muted-foreground">{data.logoFile ? data.logoFile.name : 'Clique para enviar'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                      </label>
                    </div>
                    <div className="space-y-2">
                      <Label>Cor principal</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={data.primaryColor}
                          onChange={e => update({ primaryColor: e.target.value })}
                          className="w-12 h-12 rounded-lg border border-border cursor-pointer bg-transparent"
                        />
                        <span className="text-sm text-muted-foreground">{data.primaryColor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Nome do sistema</Label>
                      <Input placeholder="Ex: Minha Empresa Pro" value={data.systemName} onChange={e => update({ systemName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome do aplicativo</Label>
                      <Input placeholder="Ex: Minha Empresa App" value={data.appName} onChange={e => update({ appName: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4 — GERAR */}
              {step === 4 && (
                <div className="space-y-6 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-foreground/10 border border-border flex items-center justify-center mx-auto">
                    {data.logoPreview ? (
                      <img src={data.logoPreview} alt="Logo" className="w-12 h-12 object-contain" />
                    ) : (
                      <Sparkles className="w-8 h-8 text-foreground" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Tudo pronto!</h2>
                    <p className="text-sm text-muted-foreground mt-1">Revise e gere seu sistema</p>
                  </div>
                  <div className="text-left space-y-3 p-6 rounded-xl border border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Empresa</span>
                      <span className="font-medium">{data.companyName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nicho</span>
                      <span className="font-medium capitalize">{NICHES.find(n => n.id === data.niche)?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Módulos</span>
                      <span className="font-medium">{data.modules.length} ativos</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sistema</span>
                      <span className="font-medium">{data.systemName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Aplicativo</span>
                      <span className="font-medium">{data.appName}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">Cor</span>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: data.primaryColor }} />
                        <span className="font-medium">{data.primaryColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => {
                if (step === 0) {
                  supabase.auth.signOut().then(() => navigate('/login'));
                } else {
                  setStep(step - 1);
                }
              }}
              className="border-border"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 0 ? 'Início' : 'Voltar'}
            </Button>

            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Gerando...
                  </div>
                ) : (
                  <>
                    Gerar meu sistema
                    <Sparkles className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
