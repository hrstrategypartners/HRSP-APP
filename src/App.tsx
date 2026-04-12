import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate 
} from 'react-router-dom';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { handleFirestoreError, OperationType } from './lib/error-handler';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Clock, 
  Bell, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Calendar,
  Cake,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Award,
  TrendingUp,
  UserPlus,
  GitGraph,
  Download,
  PenTool,
  PartyPopper,
  Heart,
  Plus,
  Filter,
  Search,
  Send,
  Upload,
  FileUp,
  Paperclip,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---
interface TenantProfile {
  id: string;
  name: string;
  logoUrl?: string;
  brandColor?: string;
  serviceModel: 'SaaS' | 'BPO';
}

interface UserProfile {
  id: string;
  tenantId: string;
  email: string;
  role: 'GLOBAL_ADMIN' | 'COMPANY_ADMIN' | 'EMPLOYEE';
  name: string;
  dni?: string;
  position?: string;
  department?: string;
}

// --- Components ---

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-brand-navy flex items-center justify-center z-50">
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mb-6 mx-auto" />
      <h1 className="text-xl font-serif font-medium text-white tracking-[0.2em] uppercase">HR Strategy Partners</h1>
    </motion.div>
  </div>
);

const Sidebar = ({ user, tenant, activeTab, setActiveTab }: { user: UserProfile, tenant: TenantProfile | null, activeTab: string, setActiveTab: (t: string) => void }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'org', label: 'Mi Estructura', icon: GitGraph },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus },
    { id: 'employees', label: 'Talento Humano', icon: Users, roles: ['GLOBAL_ADMIN', 'COMPANY_ADMIN'] },
    { id: 'documents', label: 'Gestión Documental', icon: FileText },
    { id: 'time', label: 'Tiempo y Ausencias', icon: Clock },
    { id: 'communication', label: 'Comunicación', icon: MessageSquare },
    { id: 'admin-global', label: 'Admin Global', icon: ShieldCheck, roles: ['GLOBAL_ADMIN'] },
    { id: 'settings', label: 'Configuración', icon: Settings, roles: ['GLOBAL_ADMIN', 'COMPANY_ADMIN'] },
  ];

  // RBAC Filter: If BPO Managed, Company Admin has limited access (Visor/Aprobador)
  const filteredMenu = menuItems.filter(item => {
    if (item.roles && !item.roles.includes(user.role)) return false;
    
    // BPO Logic: If Managed Service, Company Admin cannot access Settings or Employee Management if not authorized
    if (tenant?.serviceModel === 'BPO' && user.role === 'COMPANY_ADMIN') {
      if (['settings', 'employees'].includes(item.id)) return false;
    }
    
    return true;
  });

  return (
    <div className="w-72 bg-[#0C1630] text-white h-screen flex flex-col relative z-20 shadow-2xl">
      <div className="p-8 mb-4 border-b border-white/5">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {tenant?.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="w-12 h-12 object-contain" />
            ) : (
              <div className="logo-circle w-12 h-12">
                <span className="tracking-tighter text-sm">HR</span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-brand-blue to-brand-magenta flex items-center justify-center text-[4px] text-white font-black">HR</div>
            </div>
          </div>
          <div className="overflow-hidden">
            <h1 className="text-[11px] font-sans font-black leading-tight tracking-[0.2em] uppercase text-white truncate">
              {tenant?.name || 'HR Strategy Partners'}
            </h1>
            <p className="text-[8px] text-white/40 uppercase tracking-[0.15em] font-bold mt-1">
              {tenant?.serviceModel === 'BPO' ? 'Managed Service' : 'Self-Service Portal'}
            </p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pt-4">
        {filteredMenu.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center space-x-4 px-4 py-4 rounded-[1px] transition-all duration-300 group relative",
              activeTab === item.id 
                ? "bg-white/5 text-white" 
                : "text-white/30 hover:text-white hover:bg-white/5"
            )}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeNav"
                className="absolute left-0 w-1 h-6 bg-dynamic-primary rounded-r-full shadow-[0_0_15px_rgba(var(--primary-color-rgb),0.5)]"
              />
            )}
            <item.icon className={cn("w-4 h-4 transition-colors duration-300", activeTab === item.id ? "text-dynamic-primary" : "text-white/10 group-hover:text-white/40")} />
            <span className="font-bold text-[9px] tracking-[0.2em] uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-8 border-t border-white/5 bg-[#0C1630]/40">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-10 h-10 rounded-[1px] bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-xs shadow-inner">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold truncate tracking-tight text-white">{user.name}</p>
            <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] truncate font-bold mt-0.5">{user.position || 'Arquitectura de Talento'}</p>
          </div>
        </div>
        <button 
          onClick={() => signOut(auth)}
          className="w-full flex items-center justify-center space-x-3 py-3.5 border border-white/10 rounded-[1px] text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-white/5 hover:border-white/20 transition-all duration-300"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

const BirthdayBanner = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="executive-card p-8 bg-gradient-to-br from-pantone-2767 to-brand-navy text-white relative overflow-hidden group"
  >
    <div className="absolute top-0 right-0 w-64 h-64 bg-dynamic-primary/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-dynamic-primary/20 transition-all duration-1000" />
    <div className="absolute bottom-0 left-0 w-48 h-48 bg-pantone-7712/10 rounded-full -ml-24 -mb-24 blur-3xl" />
    
    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-[1px] border-2 border-white/20 p-1 bg-white/10 backdrop-blur-md shadow-2xl">
            <img 
              src="https://picsum.photos/seed/lucia/200" 
              className="w-full h-full rounded-[1px] object-cover"
              alt="Birthday person"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-dynamic-primary p-2 rounded-full shadow-xl animate-bounce">
            <Cake className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="text-left">
          <h3 className="text-2xl font-serif font-bold text-white tracking-tight">¡Feliz Cumpleaños, Lucía!</h3>
          <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-bold mt-1">Hoy celebramos tu talento y compromiso en el equipo.</p>
        </div>
      </div>
      <div className="hidden lg:block text-right">
        <p className="text-[9px] font-bold text-dynamic-primary uppercase tracking-[0.3em] mb-3">Próximos Festejos</p>
        <div className="flex -space-x-3 justify-end">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-10 h-10 rounded-full border-2 border-brand-navy bg-stone-100 overflow-hidden shadow-2xl hover:translate-y-[-4px] transition-transform cursor-pointer">
              <img src={`https://picsum.photos/seed/birth${i}/100`} alt="" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

const OrgModule = () => {
  const team = [
    { id: 1, name: 'Lucía Fernández', role: 'Directora de Estrategia', level: 'C-Level', photo: 'https://picsum.photos/seed/lucia/100', dept: 'Dirección General' },
    { id: 2, name: 'Marcos Paz', role: 'Gerente de Operaciones', level: 'Management', photo: 'https://picsum.photos/seed/marcos/100', dept: 'Operaciones' },
    { id: 3, name: 'Ana García', role: 'Consultora Senior', level: 'Senior', photo: 'https://picsum.photos/seed/ana/100', dept: 'Consultoría' },
    { id: 4, name: 'Julián Sosa', role: 'Analista de Datos', level: 'Junior', photo: 'https://picsum.photos/seed/julian/100', dept: 'BI & Analytics' },
  ];

  const OrgCard = ({ member, isTop = false }: { member: typeof team[0], isTop?: boolean }) => (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "relative p-5 bg-white border rounded-[1px] shadow-sm w-64 group transition-all duration-500",
        isTop ? "border-pantone-2767 border-t-[4px]" : "border-stone-100 hover:border-pantone-7712"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <img 
            src={member.photo} 
            className="w-12 h-12 rounded-[1px] object-cover border border-stone-100 shadow-sm" 
            alt={member.name} 
          />
          <div className={cn(
            "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
            isTop ? "bg-pantone-2728" : "bg-emerald-500"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-pantone-2767 truncate">{member.name}</p>
          <p className="text-[9px] text-stone-400 font-bold uppercase tracking-tighter truncate">{member.role}</p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-stone-50 flex justify-between items-center">
        <span className="text-[8px] font-bold text-stone-300 uppercase tracking-widest">{member.dept}</span>
        <span className={cn(
          "text-[8px] font-bold px-1.5 py-0.5 rounded-[1px] uppercase",
          isTop ? "bg-pantone-2767 text-white" : "bg-stone-50 text-stone-400"
        )}>
          {member.level}
        </span>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif font-bold text-pantone-2767 tracking-tight">Estructura Estratégica</h2>
          <p className="text-stone-500 mt-2 font-medium">Visualización jerárquica y mapa de dependencias de capital humano.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-stone-200 text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors">Exportar PDF</button>
          <button className="px-4 py-2 bg-pantone-2767 text-white text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all">Modo Edición</button>
        </div>
      </header>

      <div className="executive-card p-20 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] min-h-[700px] flex flex-col items-center">
        <div className="relative flex flex-col items-center">
          {/* Level 0: Director */}
          <div className="relative z-10">
            <OrgCard member={team[0]} isTop />
            <div className="absolute top-full left-1/2 w-px h-16 bg-stone-200 -translate-x-1/2" />
          </div>

          {/* Level 1: Manager */}
          <div className="mt-16 relative z-10">
            <OrgCard member={team[1]} />
            <div className="absolute top-full left-1/2 w-px h-16 bg-stone-200 -translate-x-1/2" />
            {/* Horizontal Connector */}
            <div className="absolute top-[calc(100%+64px)] left-1/2 w-[500px] h-px bg-stone-200 -translate-x-1/2" />
          </div>

          {/* Level 2: Team */}
          <div className="mt-32 flex gap-12 relative z-10">
            {team.slice(2).map((member) => (
              <div key={member.id} className="relative">
                <div className="absolute bottom-full left-1/2 w-px h-16 bg-stone-200 -translate-x-1/2" />
                <OrgCard member={member} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-pantone-2767/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[1px] shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="font-serif font-bold text-xl text-pantone-2767">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const OnboardingModule = ({ user, tenant }: { user: UserProfile, tenant: TenantProfile | null }) => {
  const [showCultureModal, setShowCultureModal] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  
  const tasks = [
    { title: 'Firma de Contrato Digital', status: 'COMPLETED', date: '10 Abr' },
    { title: 'Carga de Documentación (Legajo)', status: 'IN_PROGRESS', date: 'Pendiente' },
    { title: 'Configuración de Herramientas', status: 'COMPLETED', date: '11 Abr' },
    { title: 'Capacitación de Cultura Corporativa', status: 'IN_PROGRESS', date: 'En curso' },
    { title: 'Reunión con Mentor Estratégico', status: 'PENDING', date: '15 Abr' },
  ];

  const handleFileUpload = (docName: string) => {
    setUploading(docName);
    setTimeout(() => {
      setUploading(null);
      alert(`Documento "${docName}" cargado exitosamente al legajo digital.`);
    }, 2000);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif font-bold text-pantone-2767 tracking-tight">Onboarding</h2>
          <p className="text-stone-500 mt-2 font-medium">Programa de Inmersión Ejecutiva • {tenant?.name}</p>
        </div>
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-stone-100 overflow-hidden shadow-sm">
              <img src={`https://picsum.photos/seed/user${i}/100`} alt="" />
            </div>
          ))}
          <div className="w-8 h-8 rounded-full border-2 border-white bg-dynamic-primary flex items-center justify-center text-[8px] text-white font-bold shadow-sm">
            +12
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="executive-card p-10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="font-serif font-bold text-2xl text-pantone-2767">Hoja de Ruta</h3>
              <span className="text-[10px] font-bold text-dynamic-primary uppercase tracking-[0.2em] bg-dynamic-primary/5 px-3 py-1 rounded-[1px]">40% Completado</span>
            </div>
            
            <div className="space-y-12 relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-stone-100" />
              
              {tasks.map((task, i) => (
                <div key={i} className="flex items-start gap-8 relative z-10">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm",
                    task.status === 'COMPLETED' ? "bg-pantone-2767 text-white" : 
                    task.status === 'IN_PROGRESS' ? "bg-dynamic-primary text-white ring-4 ring-dynamic-primary/10" : "bg-white border-2 border-stone-200 text-stone-300"
                  )}>
                    {task.status === 'COMPLETED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={cn("text-sm font-bold tracking-tight", task.status === 'PENDING' ? "text-stone-400" : "text-pantone-2767")}>
                          {task.title}
                        </p>
                        <p className="text-[10px] text-stone-400 font-medium mt-0.5">Módulo de Integración {i + 1}</p>
                      </div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{task.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="executive-card p-10 space-y-8">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-6">
              <FileUp className="w-6 h-6 text-dynamic-primary" />
              <h3 className="font-serif font-bold text-2xl text-pantone-2767">Carga de Legajo Digital</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Documento de Identidad (DNI/ID)', id: 'dni' },
                { label: 'Constancia de CUIL/Tax ID', id: 'cuil' },
                { label: 'Título Habilitante', id: 'titulo' },
                { label: 'Certificado de Domicilio', id: 'domicilio' }
              ].map((doc) => (
                <div key={doc.id} className="p-6 border border-stone-100 rounded-[1px] bg-stone-50/30 hover:bg-stone-50 transition-colors group">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">{doc.label}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-stone-300">
                      <FileText className="w-4 h-4" />
                      <span className="text-[10px] font-medium italic">Sin archivo...</span>
                    </div>
                    <button 
                      onClick={() => handleFileUpload(doc.label)}
                      disabled={uploading === doc.label}
                      className="p-2 bg-white border border-stone-200 rounded-[1px] text-stone-400 hover:text-dynamic-primary hover:border-dynamic-primary transition-all shadow-sm"
                    >
                      {uploading === doc.label ? (
                        <div className="w-4 h-4 border-2 border-dynamic-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 bg-dynamic-primary/5 border border-dynamic-primary/10 rounded-[1px] flex items-start gap-4">
              <Info className="w-5 h-5 text-dynamic-primary shrink-0 mt-0.5" />
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                La documentación cargada será validada por el equipo de RRHH en un plazo de 48hs hábiles. Asegúrese de que los archivos sean legibles y en formato PDF o JPG.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="executive-card p-8 bg-pantone-2767 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-dynamic-primary/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-dynamic-primary/20 transition-all duration-700" />
            <Award className="w-10 h-10 text-dynamic-primary mb-6 relative z-10" />
            <h4 className="text-2xl font-serif font-bold relative z-10">Excelencia en la Bienvenida</h4>
            <p className="text-xs text-white/60 mt-4 leading-relaxed relative z-10 font-medium">
              Su integración es nuestra prioridad estratégica. Hemos diseñado este camino para asegurar su éxito desde el primer día.
            </p>
            <button 
              onClick={() => setShowCultureModal(true)}
              className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-dynamic-primary hover:text-white transition-colors flex items-center gap-2 group/btn"
            >
              Ver Guía de Cultura
              <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="executive-card p-8">
            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-6">Mentor Asignado</h4>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[2px] bg-stone-100 overflow-hidden border border-stone-100 shadow-inner">
                <img src="https://picsum.photos/seed/mentor/200" alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-pantone-2767">Roberto Sánchez</p>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Consultor Principal</p>
                <div className="flex gap-2 mt-3">
                  <button className="p-1.5 bg-stone-50 text-stone-400 hover:text-dynamic-primary transition-colors rounded-[1px]">
                    <MessageSquare className="w-3 h-3" />
                  </button>
                  <button className="p-1.5 bg-stone-50 text-stone-400 hover:text-dynamic-primary transition-colors rounded-[1px]">
                    <Calendar className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={showCultureModal} 
        onClose={() => setShowCultureModal(false)} 
        title="Guía de Cultura Corporativa"
      >
        <div className="space-y-6">
          <div className="aspect-[4/3] bg-stone-100 rounded-[1px] flex flex-col items-center justify-center border-2 border-dashed border-stone-200">
            <FileText className="w-12 h-12 text-stone-300 mb-4" />
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Visualizador de PDF</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-serif font-bold text-lg text-pantone-2767">Nuestros Valores</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              En HR Strategy Partners, creemos en la excelencia operativa y la innovación constante. Esta guía detalla nuestros principios fundamentales y expectativas para cada miembro del equipo.
            </p>
          </div>
          <button className="btn-primary w-full">Descargar Guía Completa (PDF)</button>
        </div>
      </Modal>
    </div>
  );
};

const TimeModule = () => (
  <div className="space-y-8 animate-in fade-in duration-700">
    <header className="flex justify-between items-end">
      <div>
        <h2 className="text-3xl font-serif font-bold text-pantone-2767">Tiempo y Ausencias</h2>
        <p className="text-stone-500 mt-1">Gestión de licencias, vacaciones y control horario.</p>
      </div>
      <button className="btn-primary flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Nueva Solicitud
      </button>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="executive-card p-6">
        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-2">Vacaciones Disponibles</p>
        <div className="flex items-end justify-between">
          <h4 className="text-4xl font-serif font-bold text-pantone-2767">14</h4>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-[1px]">Días</span>
        </div>
        <div className="mt-4 h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-pantone-2728 w-[70%]" />
        </div>
      </div>
      <div className="executive-card p-6">
        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-2">Licencias Tomadas</p>
        <div className="flex items-end justify-between">
          <h4 className="text-4xl font-serif font-bold text-pantone-2767">03</h4>
          <span className="text-xs font-bold text-stone-400 bg-stone-50 px-2 py-1 rounded-[1px]">Días</span>
        </div>
      </div>
      <div className="executive-card p-6">
        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-2">Próxima Ausencia</p>
        <div className="flex items-center gap-3 mt-2">
          <div className="p-2 bg-pantone-7712/10 rounded-[2px]">
            <Calendar className="w-5 h-5 text-pantone-7712" />
          </div>
          <div>
            <p className="text-sm font-bold text-pantone-2767">24 de Mayo</p>
            <p className="text-[10px] text-stone-400 font-bold uppercase">Día de Estudio</p>
          </div>
        </div>
      </div>
    </div>

    <div className="executive-card overflow-hidden">
      <div className="p-6 border-b border-stone-100 flex items-center justify-between">
        <h3 className="font-serif font-bold text-lg">Historial de Solicitudes</h3>
        <div className="flex gap-2">
          <button className="p-2 border border-stone-200 rounded-[2px] hover:bg-stone-50 transition-colors">
            <Filter className="w-4 h-4 text-stone-400" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50/50">
              <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Tipo</th>
              <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Desde</th>
              <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Hasta</th>
              <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Estado</th>
              <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {[
              { type: 'Vacaciones', from: '10/01/2024', to: '20/01/2024', status: 'APPROVED' },
              { type: 'Día de Estudio', from: '24/05/2024', to: '24/05/2024', status: 'PENDING' },
              { type: 'Licencia Médica', from: '05/03/2024', to: '06/03/2024', status: 'APPROVED' }
            ].map((req, i) => (
              <tr key={i} className="hover:bg-stone-50/30 transition-colors">
                <td className="px-8 py-5 font-bold text-sm text-pantone-2767">{req.type}</td>
                <td className="px-8 py-5 text-xs text-stone-500">{req.from}</td>
                <td className="px-8 py-5 text-xs text-stone-500">{req.to}</td>
                <td className="px-8 py-5">
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-[1px]",
                    req.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  )}>
                    {req.status === 'APPROVED' ? 'Aprobado' : 'Pendiente'}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <button className="text-[10px] font-bold text-pantone-7712 uppercase tracking-widest hover:underline">Detalles</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const CommunicationModule = () => {
  const [messages, setMessages] = useState([
    { text: 'Hola! Te escribo para avisarte que ya están disponibles los recibos de Marzo para firmar.', time: '10:25 AM', sent: false },
    { text: 'Perfecto, muchas gracias. Los reviso ahora mismo.', time: '10:30 AM', sent: true }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, { text: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), sent: true }]);
    setNewMessage('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-bold text-pantone-2767">Comunicación</h2>
          <p className="text-stone-500 mt-1">Canales internos y mensajería corporativa.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-stone-200 rounded-[2px] text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors">
            Directorio
          </button>
          <button 
            onClick={() => setShowNewChatModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Nuevo Mensaje
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[600px]">
        <div className="lg:col-span-1 executive-card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-100 bg-stone-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
              <input 
                type="text" 
                placeholder="Buscar chat..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-[2px] text-xs focus:outline-none focus:border-pantone-7712"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
            {[
              { name: 'RRHH Consultas', last: 'Hola, ¿pudiste ver el recibo?', time: '10:30', unread: true },
              { name: 'Equipo Estrategia', last: 'La reunión se pasa a las 15hs', time: 'Ayer', unread: false },
              { name: 'Ana García', last: 'Aprobado el pedido de vacaciones', time: 'Lun', unread: false }
            ].map((chat, i) => (
              <button key={i} className={cn(
                "w-full p-4 text-left hover:bg-stone-50 transition-colors flex items-center gap-3",
                chat.unread && "bg-pantone-7712/5"
              )}>
                <div className="w-10 h-10 rounded-[2px] bg-stone-100 flex items-center justify-center font-bold text-stone-400 text-xs">
                  {chat.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-xs font-bold text-pantone-2767 truncate">{chat.name}</p>
                    <span className="text-[9px] text-stone-400">{chat.time}</span>
                  </div>
                  <p className="text-[10px] text-stone-500 truncate">{chat.last}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 executive-card flex flex-col">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[2px] bg-pantone-7712 flex items-center justify-center text-white font-bold text-xs">RC</div>
              <div>
                <p className="text-xs font-bold text-pantone-2767">RRHH Consultas</p>
                <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-tighter">En línea</p>
              </div>
            </div>
          </div>
          <div className="flex-1 p-6 bg-stone-50/30 overflow-y-auto space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.sent ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "p-3 rounded-[1px] max-w-md shadow-sm",
                  msg.sent ? "bg-pantone-2728 text-white" : "bg-white border border-stone-100 text-stone-600"
                )}>
                  <p className="text-xs leading-relaxed">{msg.text}</p>
                  <span className={cn("text-[8px] mt-1 block", msg.sent ? "text-white/60 text-right" : "text-stone-400")}>{msg.time}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-stone-100">
            <div className="flex gap-3">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe un mensaje..." 
                className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-[2px] text-xs focus:outline-none focus:border-pantone-7712"
              />
              <button 
                onClick={handleSendMessage}
                className="p-3 bg-pantone-2728 text-white rounded-[2px] hover:brightness-110 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={showNewChatModal} 
        onClose={() => setShowNewChatModal(false)} 
        title="Nuevo Mensaje"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Destinatario</label>
            <select className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-[1px] text-xs focus:outline-none focus:border-pantone-7712">
              <option>Seleccionar contacto...</option>
              <option>Roberto Sánchez (Mentor)</option>
              <option>Ana García (Consultora)</option>
              <option>Departamento de RRHH</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Mensaje Inicial</label>
            <textarea 
              rows={4}
              placeholder="Escribe tu mensaje aquí..."
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-[1px] text-xs focus:outline-none focus:border-pantone-7712 resize-none"
            />
          </div>
          <button 
            onClick={() => {
              alert('Mensaje enviado correctamente.');
              setShowNewChatModal(false);
            }}
            className="btn-primary w-full"
          >
            Iniciar Conversación
          </button>
        </div>
      </Modal>
    </div>
  );
};

const GlobalAdminModule = () => {
  const [tenants, setTenants] = useState<TenantProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'tenants'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tenantList = snapshot.docs.map(doc => doc.data() as TenantProfile);
      setTenants(tenantList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tenants');
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif font-bold text-pantone-2767 tracking-tight">Consola Global HRSP</h2>
          <p className="text-stone-500 mt-2 font-medium">Gestión de Inquilinos y Permisos de Plataforma.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Alta de Empresa
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="executive-card p-6">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-2">Empresas Activas</p>
          <h4 className="text-4xl font-serif font-bold text-pantone-2767">{tenants.length}</h4>
        </div>
        <div className="executive-card p-6">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-2">Usuarios Totales</p>
          <h4 className="text-4xl font-serif font-bold text-pantone-2767">1,240</h4>
        </div>
        <div className="executive-card p-6">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-2">SLA Promedio</p>
          <h4 className="text-4xl font-serif font-bold text-emerald-600">99.9%</h4>
        </div>
      </div>

      <div className="executive-card overflow-hidden">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
          <h3 className="font-serif font-bold text-lg">Directorio de Inquilinos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Empresa</th>
                <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Modelo</th>
                <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {tenants.map((t, i) => (
                <tr key={i} className="hover:bg-stone-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[1px] bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-100">
                        {t.logoUrl ? <img src={t.logoUrl} className="w-full h-full object-contain" /> : <Briefcase className="w-4 h-4 text-stone-300" />}
                      </div>
                      <span className="font-bold text-sm text-pantone-2767">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "text-[9px] font-bold uppercase px-2 py-1 rounded-[1px]",
                      t.serviceModel === 'BPO' ? "bg-pantone-7712/10 text-pantone-7712" : "bg-dynamic-primary/10 text-dynamic-primary"
                    )}>
                      {t.serviceModel}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-stone-500 uppercase">Activo</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-[10px] font-bold text-pantone-2728 uppercase tracking-widest hover:underline">Gestionar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DashboardHome = ({ user }: { user: UserProfile }) => {
  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-serif font-bold text-pantone-2767 tracking-tight">Panel Estratégico</h2>
          <p className="text-stone-500 mt-2 font-medium text-sm">Gestión de Capital Humano • {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-pantone-2767 uppercase tracking-[0.2em]">Estado del Sistema</p>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> OPERATIVO
            </p>
          </div>
          <div className="w-10 h-10 bg-white border border-stone-200 rounded-[2px] flex items-center justify-center shadow-sm">
            <Award className="w-5 h-5 text-pantone-7712" />
          </div>
        </div>
      </header>

      <BirthdayBanner />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Recibos Pendientes', value: '02', icon: PenTool, color: 'text-pantone-232', bg: 'bg-pantone-232/5' },
          { label: 'Días de Licencia', value: '14', icon: Calendar, color: 'text-pantone-2728', bg: 'bg-pantone-2728/5' },
          { label: 'Tareas Onboarding', value: '65%', icon: TrendingUp, color: 'text-pantone-7712', bg: 'bg-pantone-7712/5' },
          { label: 'Novedades', value: '03', icon: Bell, color: 'text-stone-400', bg: 'bg-stone-50' },
        ].map((stat, i) => (
          <div key={i} className="executive-card p-6 group cursor-default">
            <div className={cn("w-10 h-10 rounded-[2px] flex items-center justify-center mb-4 transition-transform group-hover:scale-105", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <p className="text-3xl font-serif font-bold text-pantone-2767">{stat.value}</p>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-2xl text-pantone-2767">Muro de Novedades</h3>
            <button className="text-[10px] font-bold text-pantone-7712 uppercase tracking-widest hover:underline">Ver Historial</button>
          </div>
          <div className="space-y-4">
            {[
              { title: 'Actualización de Beneficios Corporativos', type: 'Comunicado de Prensa', author: 'Dpto. de RRHH', urgent: true },
              { title: 'Nuevas Políticas de Trabajo Híbrido', type: 'Normativa Interna', author: 'Dirección General', urgent: false }
            ].map((news, i) => (
              <div key={i} className="executive-card p-8 relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-pantone-7712 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-stone-100 text-stone-500 text-[9px] font-bold uppercase tracking-widest rounded-[1px]">
                    {news.type}
                  </span>
                  {news.urgent && <span className="tag-urgent">Firma Requerida</span>}
                </div>
                <h4 className="text-xl font-serif font-bold text-pantone-2767 mb-3 group-hover:text-pantone-7712 transition-colors">{news.title}</h4>
                <p className="text-stone-600 text-sm leading-relaxed mb-6">
                  Estimados colaboradores, nos complace anunciar la evolución de nuestro programa de beneficios estratégicos...
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[2px] bg-pantone-2767 flex items-center justify-center text-[10px] text-white font-bold">HR</div>
                    <div>
                      <p className="text-xs font-bold text-pantone-2767">{news.author}</p>
                      <p className="text-[9px] text-stone-400 uppercase font-bold">Firma Autorizada</p>
                    </div>
                  </div>
                  <button className="px-5 py-2 bg-pantone-2728 text-white text-[10px] font-bold uppercase tracking-widest rounded-[2px] hover:brightness-110 transition-all">
                    Leer y Firmar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="font-serif font-bold text-2xl text-pantone-2767">Gestión de Recibos</h3>
          <div className="executive-card overflow-hidden">
            <div className="p-6 bg-stone-50/50 border-b border-stone-100">
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Últimos Documentos</p>
            </div>
            <div className="divide-y divide-stone-100">
              {[
                { period: 'Marzo 2024', status: 'PENDING' },
                { period: 'Febrero 2024', status: 'SIGNED' },
                { period: 'Enero 2024', status: 'SIGNED' }
              ].map((doc, i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors group">
                  <div>
                    <p className="font-bold text-sm text-pantone-2767">Recibo de Sueldo</p>
                    <p className="text-[10px] text-stone-400 font-medium uppercase tracking-tighter">{doc.period}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {doc.status === 'SIGNED' ? (
                      <div className="flex items-center gap-1 text-pantone-2728">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-bold uppercase tracking-tighter">Firmado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-pantone-232">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-bold uppercase tracking-tighter">Pendiente</span>
                      </div>
                    )}
                    <button className="p-2 text-stone-300 group-hover:text-pantone-7712 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-4 text-[10px] font-bold text-pantone-2767 uppercase tracking-widest bg-stone-50/50 hover:bg-stone-100 transition-colors">
              Ver Archivo Completo
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const Login = () => {
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'Estratega de Talento',
          tenantId: 'default-tenant',
          role: 'COMPANY_ADMIN',
          position: 'Arquitectura de Talento',
          createdAt: new Date().toISOString()
        });
        
        await setDoc(doc(db, 'tenants', 'default-tenant'), {
          id: 'default-tenant',
          name: 'HR Strategy Partners Client',
          serviceModel: 'SaaS',
          brandColor: '#4169E1',
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C1630] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(65,105,225,0.15),transparent_60%)]" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-magenta/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-pantone-7712/5 rounded-full blur-3xl" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md w-full space-y-12 bg-white p-16 rounded-[1px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] text-center relative z-10 border-t-[6px] border-brand-blue"
      >
        <div className="space-y-6">
          <div className="logo-circle mx-auto mb-8 w-20 h-20 shadow-xl">
            <span className="tracking-tighter text-2xl">HR</span>
          </div>
          <h1 className="text-2xl font-sans font-black leading-tight tracking-[0.25em] uppercase text-[#0C1630]">HR Strategy Partners</h1>
          <div className="h-px w-12 bg-brand-blue mx-auto" />
          <p className="text-stone-400 font-bold text-[10px] uppercase tracking-[0.3em]">Alianzas Estratégicas • Elite Portal</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            className="btn-primary w-full py-5 flex items-center justify-center gap-4 shadow-xl hover:shadow-brand-blue/20"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Acceso Multi-Inquilino</span>
          </button>
          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-stone-100 flex-1" />
            <span className="text-[8px] text-stone-300 font-bold uppercase tracking-widest">O</span>
            <div className="h-px bg-stone-100 flex-1" />
          </div>
          <p className="text-[9px] text-stone-400 uppercase tracking-[0.2em] font-medium leading-relaxed">
            El sistema detectará automáticamente su organización y permisos asignados por la Casa Matriz.
          </p>
        </div>

        <div className="pt-8 border-t border-stone-100">
          <p className="text-[9px] text-stone-300 uppercase tracking-[0.4em] leading-relaxed font-bold">
            Talento que produce.<br/>Sistemas que perduran.
          </p>
        </div>
      </motion.div>
      
      <div className="mt-12 opacity-30">
        <p className="text-[8px] text-white font-bold uppercase tracking-[0.5em]">Powered by HRSP Technology</p>
      </div>
    </div>
  );
};

const SettingsModule = ({ user, tenant }: { user: UserProfile, tenant: TenantProfile | null }) => {
  const [logoUrl, setLogoUrl] = useState(tenant?.logoUrl || '');
  const [brandColor, setBrandColor] = useState(tenant?.brandColor || '#4169E1');
  const [serviceModel, setServiceModel] = useState<'SaaS' | 'BPO'>(tenant?.serviceModel || 'SaaS');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'tenants', tenant.id), {
        ...tenant,
        logoUrl,
        brandColor,
        serviceModel
      });
      alert('Configuración estratégica actualizada. Los cambios se aplicarán en la próxima sesión.');
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header>
        <h2 className="text-4xl font-serif font-bold text-pantone-2767 tracking-tight">Configuración</h2>
        <p className="text-stone-500 mt-2 font-medium">Gestión de Identidad Corporativa y Parámetros de Servicio.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="executive-card p-10 space-y-8">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-6">
            <PenTool className="w-5 h-5 text-dynamic-primary" />
            <h3 className="font-serif font-bold text-2xl text-pantone-2767">White Label (Identidad)</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-3">Logo Corporativo (URL)</label>
              <input 
                type="text" 
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://brand.com/logo.png"
                className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-[1px] text-xs focus:outline-none focus:border-dynamic-primary transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-3">Color de Acento (Hex)</label>
              <div className="flex gap-4">
                <input 
                  type="color" 
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-14 h-14 p-1 bg-white border border-stone-200 rounded-[1px] cursor-pointer"
                />
                <input 
                  type="text" 
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#4169E1"
                  className="flex-1 px-5 py-4 bg-stone-50 border border-stone-200 rounded-[1px] text-xs focus:outline-none focus:border-dynamic-primary transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="executive-card p-10 space-y-8">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-6">
            <ShieldCheck className="w-5 h-5 text-pantone-7712" />
            <h3 className="font-serif font-bold text-2xl text-pantone-2767">Modalidad de Servicio</h3>
          </div>
          
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setServiceModel('SaaS')}
                className={cn(
                  "p-6 border-2 rounded-[1px] text-left transition-all",
                  serviceModel === 'SaaS' ? "border-dynamic-primary bg-dynamic-primary/5" : "border-stone-100 hover:border-stone-200"
                )}
              >
                <Briefcase className={cn("w-6 h-6 mb-4", serviceModel === 'SaaS' ? "text-dynamic-primary" : "text-stone-300")} />
                <p className="text-sm font-bold text-pantone-2767">Self-Service (SaaS)</p>
                <p className="text-[10px] text-stone-400 mt-2 leading-relaxed">Control total para el administrador de la empresa.</p>
              </button>
              
              <button 
                onClick={() => setServiceModel('BPO')}
                className={cn(
                  "p-6 border-2 rounded-[1px] text-left transition-all",
                  serviceModel === 'BPO' ? "border-pantone-7712 bg-pantone-7712/5" : "border-stone-100 hover:border-stone-200"
                )}
              >
                <Users className={cn("w-6 h-6 mb-4", serviceModel === 'BPO' ? "text-pantone-7712" : "text-stone-300")} />
                <p className="text-sm font-bold text-pantone-2767">Managed (BPO)</p>
                <p className="text-[10px] text-stone-400 mt-2 leading-relaxed">Gestión delegada a HR Strategy Partners.</p>
              </button>
            </div>

            <div className="p-6 bg-stone-50 rounded-[1px] border border-stone-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-stone-400 mt-0.5" />
                <p className="text-[10px] text-stone-500 leading-relaxed font-medium">
                  La modalidad BPO restringe el acceso a configuraciones críticas para el cliente, delegando la carga y control a la central de HRSP.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary min-w-[240px]"
        >
          {saving ? 'Procesando...' : 'Actualizar Configuración'}
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCertModal, setShowCertModal] = useState(false);
  const [requestingCert, setRequestingCert] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data() as UserProfile;
            setUser(userData);

            // Fetch Tenant Data
            const tenantRef = doc(db, 'tenants', userData.tenantId);
            const tenantSnap = await getDoc(tenantRef);
            if (tenantSnap.exists()) {
              const tenantData = tenantSnap.data() as TenantProfile;
              setTenant(tenantData);
              
              // Apply White Label Styles
              if (tenantData.brandColor) {
                document.documentElement.style.setProperty('--primary-color', tenantData.brandColor);
                document.documentElement.style.setProperty('--accent-color', tenantData.brandColor + 'CC');
              }
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'users/tenants');
        }
      } else {
        setUser(null);
        setTenant(null);
        document.documentElement.style.removeProperty('--primary-color');
        document.documentElement.style.removeProperty('--accent-color');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  if (!user) return <Login />;

  return (
    <Router>
      <div className="flex bg-neutral-bg min-h-screen font-sans text-brand-navy selection:bg-brand-magenta/20">
        <Sidebar user={user} tenant={tenant} activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 h-screen overflow-y-auto flex flex-col relative custom-scrollbar">
          <div className="flex-1 p-12">
            <div className="max-w-6xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'dashboard' && <DashboardHome user={user} />}
                  {activeTab === 'time' && <TimeModule />}
                  {activeTab === 'communication' && <CommunicationModule />}
                  {activeTab === 'org' && <OrgModule />}
                  {activeTab === 'onboarding' && <OnboardingModule user={user} tenant={tenant} />}
                  {activeTab === 'admin-global' && <GlobalAdminModule />}
                  {activeTab === 'employees' && (
                    <div className="executive-card p-20 text-center space-y-6">
                      <Users className="w-16 h-16 text-stone-200 mx-auto" />
                      <h2 className="text-3xl font-serif font-bold">Talento Humano</h2>
                      <p className="text-stone-500 max-w-md mx-auto">Gestión estratégica de legajos y KPIs de desempeño.</p>
                    </div>
                  )}
                  {activeTab === 'documents' && (
                    <div className="space-y-8">
                      <header className="flex items-center justify-between">
                        <div>
                          <h2 className="text-3xl font-serif font-bold text-pantone-2767">Gestión Documental</h2>
                          <p className="text-stone-500 mt-1">Archivo histórico y firma de documentos legales.</p>
                        </div>
                        <button 
                          onClick={() => setShowCertModal(true)}
                          className="btn-primary"
                        >
                          Solicitar Certificado
                        </button>
                      </header>
                      <div className="executive-card overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-stone-50 border-b border-stone-100">
                              <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Documento</th>
                              <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Periodo</th>
                              <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Estado</th>
                              <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-50">
                            {[
                              { name: 'Recibo de Sueldo', period: 'Marzo 2024', status: 'PENDING' },
                              { name: 'Recibo de Sueldo', period: 'Febrero 2024', status: 'SIGNED' },
                              { name: 'Contrato de Confidencialidad', period: 'Anual 2024', status: 'SIGNED' }
                            ].map((doc, i) => (
                              <tr key={i} className="hover:bg-stone-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-stone-300 group-hover:text-dynamic-primary transition-colors" />
                                    <span className="font-bold text-brand-navy">{doc.name}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-6 text-stone-500 text-sm font-medium">{doc.period}</td>
                                <td className="px-8 py-6">
                                  <div className={cn(
                                    "inline-flex items-center gap-2 px-3 py-1 rounded-[1px] text-[9px] font-bold uppercase tracking-tighter",
                                    doc.status === 'SIGNED' ? "bg-brand-navy text-white" : "bg-dynamic-primary/10 text-dynamic-primary border border-dynamic-primary/20"
                                  )}>
                                    {doc.status === 'SIGNED' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                    {doc.status === 'SIGNED' ? 'Firmado' : 'Pendiente'}
                                  </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <button className="text-brand-blue hover:text-brand-magenta font-bold text-[10px] uppercase tracking-widest transition-colors">
                                    {doc.status === 'SIGNED' ? 'Descargar' : 'Firmar Ahora'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {activeTab === 'settings' && <SettingsModule user={user} tenant={tenant} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          
          {/* Footer Watermark */}
          <footer className="p-8 border-t border-stone-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
            <p className="text-[9px] text-stone-400 uppercase tracking-widest font-medium">
              © {new Date().getFullYear()} {tenant?.name || 'Empresa'}. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
              <span className="text-[8px] text-stone-400 uppercase tracking-tighter font-bold">Plataforma gestionada por</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-blue to-brand-magenta flex items-center justify-center text-[6px] text-white font-black">HR</div>
                <span className="text-[8px] font-black tracking-tighter text-brand-navy">HR Strategy Partners</span>
              </div>
            </div>
          </footer>
        </main>
      </div>

      <Modal 
        isOpen={showCertModal} 
        onClose={() => setShowCertModal(false)} 
        title="Solicitud de Certificado"
      >
        <div className="space-y-6">
          <p className="text-xs text-stone-500 leading-relaxed">
            Seleccione el tipo de certificado que desea solicitar. El documento será generado y enviado a su legajo digital en un plazo de 24hs.
          </p>
          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Tipo de Certificado</label>
            <select className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-[1px] text-xs focus:outline-none focus:border-pantone-7712">
              <option>Certificado Laboral (Antigüedad)</option>
              <option>Certificado de Ingresos</option>
              <option>Certificado para Obra Social</option>
              <option>Certificado de ART</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Observaciones (Opcional)</label>
            <textarea 
              rows={3}
              placeholder="Indique si necesita alguna mención especial..."
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-[1px] text-xs focus:outline-none focus:border-pantone-7712 resize-none"
            />
          </div>
          <button 
            onClick={() => {
              setRequestingCert(true);
              setTimeout(() => {
                setRequestingCert(false);
                setShowCertModal(false);
                alert('Solicitud enviada con éxito. Recibirá una notificación cuando el documento esté listo.');
              }, 1500);
            }}
            disabled={requestingCert}
            className="btn-primary w-full"
          >
            {requestingCert ? 'Procesando...' : 'Confirmar Solicitud'}
          </button>
        </div>
      </Modal>
    </Router>
  );
}
