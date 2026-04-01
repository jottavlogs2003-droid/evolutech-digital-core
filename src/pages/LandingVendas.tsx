import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Check, 
  ChevronDown,
  Clock, 
  BarChart3, 
  ShoppingCart, 
  Users, 
  Smartphone,
  Palette,
  Shield,
  Headphones,
  Zap,
  Building2,
  GraduationCap,
  Utensils,
  Dumbbell,
  Calendar,
  Store,
  Home,
  Briefcase,
  Church,
  Wrench,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/Logo';

import heroDashboard from '@/assets/landing/hero-dashboard.jpg';
import mobileApp from '@/assets/landing/mobile-app.jpg';
import teamTech from '@/assets/landing/team-tech.jpg';
import whiteLabel from '@/assets/landing/white-label.jpg';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const templates = [
  { icon: Calendar, name: 'Barbearia', desc: 'Agendamentos e gestão' },
  { icon: Utensils, name: 'Restaurante', desc: 'Pedidos e delivery' },
  { icon: ShoppingCart, name: 'Hamburgueria', desc: 'Cardápio e pedidos' },
  { icon: Store, name: 'Açaíteria', desc: 'Vendas e estoque' },
  { icon: Store, name: 'Loja', desc: 'PDV e e-commerce' },
  { icon: Dumbbell, name: 'Clínica', desc: 'Pacientes e agenda' },
  { icon: Wrench, name: 'Prestador', desc: 'Orçamentos e serviços' },
  { icon: Home, name: 'Imobiliária', desc: 'Imóveis e contratos' },
  { icon: GraduationCap, name: 'Escola', desc: 'Alunos e cursos' },
  { icon: Briefcase, name: 'Escritório', desc: 'Projetos e equipe' },
];

const modules = [
  'Agenda', 'Clientes', 'Financeiro', 'Pedidos', 'Produtos',
  'Relatórios', 'Dashboard', 'Automação de atendimento', 'Controle de estoque'
];

const plans = [
  {
    name: 'Starter',
    price: 'R$ 197',
    period: '/mês',
    features: ['Sistema Web completo', 'PWA instalável', '3 usuários', 'Suporte por email', 'Atualizações incluídas'],
    highlight: false,
  },
  {
    name: 'Professional',
    price: 'R$ 397',
    period: '/mês',
    features: ['Tudo do Starter +', '10 usuários', 'App nativo', 'Suporte prioritário', 'Integrações avançadas', 'Relatórios personalizados'],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'R$ 697',
    period: '/mês',
    features: ['Tudo do Professional +', 'Usuários ilimitados', 'App iOS + Android', 'Suporte 24/7', 'API completa', 'Consultoria mensal'],
    highlight: false,
  },
];

const LandingVendas = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openWhatsApp = () => {
    window.open('https://wa.me/5500000000000?text=Olá! Gostaria de saber mais sobre a Nexify.', '_blank');
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* WhatsApp */}
      <button
        onClick={openWhatsApp}
        className="fixed bottom-6 right-6 z-50 bg-foreground hover:bg-foreground/90 text-background p-4 rounded-full shadow-elevated transition-all hover:scale-110"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-8">
            <a href="#nichos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Nichos</a>
            <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#planos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</a>
            <Link to="/login">
              <Button variant="outline" size="sm" className="border-foreground/20 text-foreground hover:bg-foreground hover:text-background">
                Área do Cliente
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 gradient-dark" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroDashboard})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateY(${scrollY * 0.3}px)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border text-xs text-muted-foreground mb-8 uppercase tracking-widest">
                Plataforma SaaS
              </span>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[0.95] tracking-tight"
            >
              Crie seu próprio{' '}
              <span className="text-gradient">sistema</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Escolha o nicho. Ative os módulos. Personalize tudo.
              <br />
              <strong className="text-foreground">Gere seu sistema e aplicativo com sua marca.</strong>
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/login">
                <Button 
                  size="lg" 
                  className="bg-foreground text-background hover:bg-foreground/90 text-base px-8 py-6 font-semibold"
                >
                  Criar meu sistema agora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-border text-foreground hover:bg-card text-base px-8 py-6"
                onClick={() => document.getElementById('nichos')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver nichos disponíveis
                <ChevronDown className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {[
              { icon: Clock, title: 'Automatize processos', desc: 'Menos tempo no operacional' },
              { icon: BarChart3, title: 'Controle total', desc: 'Dashboards em tempo real' },
              { icon: ShoppingCart, title: 'Venda mais', desc: 'Sistema organizado = mais vendas' },
              { icon: Smartphone, title: 'App próprio', desc: 'PWA + App com sua marca' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <div className="p-6 rounded-xl border border-border hover:border-foreground/20 transition-all group">
                  <item.icon className="w-8 h-8 mb-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <h3 className="text-base font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Como funciona</h2>
            <p className="text-muted-foreground">5 etapas simples para ter seu sistema</p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { step: '01', title: 'Cadastro', desc: 'Crie sua conta' },
              { step: '02', title: 'Nicho', desc: 'Escolha seu segmento' },
              { step: '03', title: 'Módulos', desc: 'Ative as funções' },
              { step: '04', title: 'Personalizar', desc: 'Logo, cores, nome' },
              { step: '05', title: 'Gerar', desc: 'Sistema + App prontos' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center">
                <div className="text-4xl font-bold text-muted-foreground/30 mb-3">{item.step}</div>
                <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* NICHOS */}
      <section id="nichos" className="py-24 relative border-t border-border/50">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Nichos disponíveis</h2>
            <p className="text-muted-foreground">Sistemas prontos para cada segmento</p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-5 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {templates.map((template, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <div className="p-6 rounded-xl border border-border hover:border-foreground/30 transition-all cursor-pointer group text-center">
                  <template.icon className="w-8 h-8 mx-auto mb-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <h3 className="text-sm font-semibold mb-0.5">{template.name}</h3>
                  <p className="text-xs text-muted-foreground">{template.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* MÓDULOS */}
      <section className="py-24 relative border-t border-border/50">
        <div className="container mx-auto px-6">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                Módulos que você escolhe
              </h2>
              <p className="text-muted-foreground mb-8">
                Ative apenas o que precisa. Sem funcionalidades desnecessárias.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modules.map((mod, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="w-5 h-5 rounded-full border border-foreground/30 flex items-center justify-center">
                      <Check className="w-3 h-3 text-foreground" />
                    </div>
                    <span className="text-sm">{mod}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="relative">
              <img 
                src={teamTech} 
                alt="Equipe usando sistema" 
                loading="lazy"
                className="rounded-2xl w-full border border-border"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* WHITE LABEL */}
      <section className="py-24 relative border-t border-border/50">
        <div className="container mx-auto px-6">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="order-2 lg:order-1">
              <img 
                src={whiteLabel} 
                alt="Personalização" 
                loading="lazy"
                className="rounded-2xl w-full border border-border"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6 uppercase tracking-widest">
                <Palette className="w-3 h-3" /> White Label
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                Tudo com a sua marca
              </h2>
              <p className="text-muted-foreground mb-8">
                Seu sistema, seu app, suas cores, sua logo. Sem menção à Nexify para o cliente final.
              </p>
              <ul className="space-y-3">
                {['Logo personalizado', 'Cores da sua marca', 'Nome do sistema', 'App com seu nome'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-foreground" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* APP */}
      <section className="py-24 relative border-t border-border/50">
        <div className="container mx-auto px-6">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6 uppercase tracking-widest">
                <Smartphone className="w-3 h-3" /> Mobile
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                Aplicativo automático
              </h2>
              <p className="text-muted-foreground mb-8">
                PWA gerado automaticamente com o nome da sua empresa e sua logo.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { title: 'Web', desc: 'Navegador' },
                  { title: 'PWA', desc: 'Instalável' },
                  { title: 'App', desc: 'Nas lojas' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border text-center">
                    <h4 className="text-sm font-semibold mb-0.5">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="flex justify-center">
              <img 
                src={mobileApp} 
                alt="App mobile" 
                loading="lazy"
                className="rounded-2xl max-w-sm border border-border"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-24 relative border-t border-border/50">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Planos</h2>
            <p className="text-muted-foreground">Escolha o ideal para sua empresa</p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {plans.map((plan, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <div className={`h-full rounded-2xl p-8 ${
                  plan.highlight 
                    ? 'border-2 border-foreground bg-card' 
                    : 'border border-border'
                }`}>
                  {plan.highlight && (
                    <span className="text-xs uppercase tracking-widest text-muted-foreground mb-4 block">Mais popular</span>
                  )}
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.highlight ? 'bg-foreground text-background hover:bg-foreground/90' : ''}`}
                    variant={plan.highlight ? 'default' : 'outline'}
                    onClick={openWhatsApp}
                  >
                    Começar agora
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 relative border-t border-border/50">
        <div className="container mx-auto px-6">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                Pronto para começar?
              </h2>
              <p className="text-muted-foreground mb-10">
                Crie seu sistema profissional em minutos.
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 text-base px-8 py-6 font-semibold">
                  Criar meu sistema
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-border text-base px-8 py-6"
                onClick={openWhatsApp}
              >
                <MessageCircle className="mr-2 w-5 h-5" />
                Falar com a equipe
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} Nexify Group. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingVendas;
