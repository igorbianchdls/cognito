import type { Brand, Entry } from '../gestao-demo/common';
export type Kind = 'salon' | 'realty' | 'school' | 'cleaning';
export type Client = { id:string;name:string;contact:string;email:string;address:string };
export type Staff = { id:string;name:string;role:string;commission:number };
export type Offering = { id:string;name:string;duration:number;price:number;category:string };
export type Booking = { id:string;clientId:string;staffIds:string[];serviceId:string;propertyId:string;contractId:string;date:string;time:string;end:string;amount:number;commission:number;status:string;notes:string };
export type Stock = { id:string;name:string;category:string;quantity:number;minimum:number;unit:string;price:number;cost:number };
export type Task = { id:string;bookingId:string;title:string;done:boolean };
export type Consumption = { id:string;bookingId:string;stockId:string;quantity:number };
export type Property = { id:string;title:string;code:string;address:string;type:string;transaction:string;price:number;area:number;beds:number;ownerId:string;brokerId:string;status:string;description:string;photo:string };
export type Deal = { id:string;propertyId:string;clientId:string;brokerId:string;stage:string;offer:number;commission:number };
export type Course = { id:string;title:string;category:string;workload:number;tuition:number };
export type Classroom = { id:string;courseId:string;teacherId:string;title:string;room:string;capacity:number;weekdays:number[];time:string;endTime:string;start:string;end:string;status:string };
export type Enrollment = { id:string;classId:string;studentId:string;tuition:number;date:string;status:string };
export type Attendance = { enrollmentId:string;date:string;present:boolean };
export type Contract = { id:string;title:string;clientId:string;address:string;frequency:string;fee:number;start:string;end:string;status:string;staffIds:string[] };
export type Store = { clients:Client[];staff:Staff[];services:Offering[];bookings:Booking[];stock:Stock[];tasks:Task[];consumptions:Consumption[];entries:Entry[];properties:Property[];deals:Deal[];courses:Course[];classes:Classroom[];enrollments:Enrollment[];attendance:Attendance[];contracts:Contract[];notes:Record<string,string> };
export type Config = Brand & { kind:Kind;placeholder:string;seed:Store };
export const collections = ['clients','staff','services','bookings','stock','tasks','consumptions','entries','properties','deals','courses','classes','enrollments','attendance','contracts'];
export const bookingStages=['Agendado','Confirmado','Em atendimento','Concluído','Cancelado'];
export const dealStages=['Novo contato','Visita agendada','Proposta enviada','Contrato','Perdido'];
export const weekdayNames=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

export function makeConfig(kind:Kind):Config {
  const settings={
    salon:{slug:'salao',name:'AURA',subtitle:'BELEZA & BEM-ESTAR',description:'Uma agenda bem cuidada. Um negócio que floresce.',primary:'Novo agendamento',menus:['Visão geral','Agenda','Clientes','Serviços','Profissionais','Comissões','Estoque','Financeiro','Relatórios'],placeholder:'Buscar clientes, serviços, profissionais...'},
    realty:{slug:'imobiliaria',name:'HABITA',subtitle:'GESTÃO IMOBILIÁRIA',description:'Bons encontros entre pessoas, imóveis e oportunidades.',primary:'Novo imóvel',menus:['Visão geral','Imóveis','Oportunidades','Visitas','Clientes','Corretores','Financeiro','Documentos','Relatórios'],placeholder:'Buscar imóveis, endereços, clientes...'},
    school:{slug:'cursos',name:'FORMA',subtitle:'CURSOS & IDIOMAS',description:'Cada aluno acompanhado. Cada turma em movimento.',primary:'Nova matrícula',menus:['Visão geral','Turmas','Cursos','Alunos','Matrículas','Presença','Professores','Mensalidades','Financeiro','Relatórios'],placeholder:'Buscar alunos, cursos, turmas...'},
    cleaning:{slug:'limpeza',name:'CLARA',subtitle:'LIMPEZA & MANUTENÇÃO',description:'Equipes alinhadas. Ambientes cuidados. Contratos em dia.',primary:'Agendar serviço',menus:['Visão geral','Agenda','Contratos','Clientes','Equipe','Escalas','Serviços','Materiais','Financeiro','Relatórios'],placeholder:'Buscar contratos, clientes, equipes...'},
  }[kind];
  const db:Store={clients:[],staff:[],services:[],bookings:[],stock:[],tasks:[],consumptions:[],entries:[],properties:[],deals:[],courses:[],classes:[],enrollments:[],attendance:[],contracts:[],notes:{}};
  db.clients=['Marina Costa','Camila Rocha','Lucas Martins','Ana Beatriz','Ricardo Lima','Fernanda Alves','Bruno Mendes','Julia Nunes'].map((name,i)=>({id:`c${i}`,name:kind==='cleaning'?['Condomínio Jardim','Clínica Essencial','Escritório Horizonte','Residência Costa','Loja Alma','Edifício Alameda','Studio Nativa','Casa das Palmeiras'][i]:name,contact:`(85) 99912-34${50+i}`,email:`cliente${i}@example.com`,address:['Meireles, Fortaleza','Aldeota, Fortaleza','Cocó, Fortaleza','Eusébio, CE'][i%4]}));
  db.staff=['Mariana Silva','Ana Costa','Rafael Lima','Julia Martins'].map((name,i)=>({id:`e${i}`,name,role:kind==='salon'?['Cabeleireira','Manicure','Barbeiro','Colorista'][i]:kind==='realty'?'Corretor(a)':kind==='school'?['Inglês','Espanhol','Tecnologia','Gestão'][i]:['Supervisão','Limpeza','Limpeza','Manutenção'][i],commission:kind==='salon'?[40,50,40,35][i]:0}));
  const catalogs = kind==='salon'?[['Corte e finalização',60,120,'Cabelo'],['Manicure e pedicure',90,95,'Unhas'],['Coloração e tratamento',120,320,'Cabelo'],['Escova e hidratação',60,160,'Cabelo']]:[['Limpeza comercial',240,450,'Comercial'],['Limpeza residencial',240,320,'Residencial'],['Limpeza pós-obra',360,850,'Pós-obra'],['Higienização de ambientes',180,280,'Especializada']];
  db.services=catalogs.map(([name,duration,price,category],i)=>({id:`s${i}`,name:String(name),duration:Number(duration),price:Number(price),category:String(category)}));
  db.stock=(kind==='salon'?[['Shampoo profissional','Cabelo','un',8,3,85,45],['Máscara de hidratação','Cabelo','un',2,3,120,65],['Esmalte nude','Unhas','un',18,6,18,8]]:[['Detergente neutro','Limpeza','litros',25,8,12,7],['Desinfetante','Limpeza','litros',8,10,18,10],['Pano de microfibra','Utensílios','un',40,10,15,6]]).map(([name,category,unit,quantity,minimum,price,cost],i)=>({id:`i${i}`,name:String(name),category:String(category),unit:String(unit),quantity:Number(quantity),minimum:Number(minimum),price:Number(price),cost:Number(cost)}));
  if(kind==='cleaning')db.contracts=Array.from({length:5},(_,i)=>({id:`ct${i}`,title:['Limpeza de áreas comuns','Conservação da clínica','Limpeza do escritório','Manutenção residencial','Limpeza da loja'][i],clientId:`c${i}`,address:db.clients[i].address,frequency:['Semanal','Diária','Semanal','Quinzenal','Semanal'][i],fee:[4800,6200,3600,1800,2400][i],start:'2026-10-01',end:'2027-09-30',status:'Ativo',staffIds:i%2?['e2','e3']:['e0','e1']}));
  if(['salon','cleaning'].includes(kind)){
    for(let i=0;i<12;i++){
      const service=db.services[i%db.services.length],start=kind==='cleaning'?8:9+(Math.floor(i/4)%2)*3,date=i<4?'2026-10-26':i<8?'2026-10-27':'2026-10-28';
      const end=start*60+service.duration;
      db.bookings.push({id:`b${i}`,clientId:`c${kind==='cleaning'?i%5:i%8}`,staffIds:[`e${i%4}`],serviceId:service.id,propertyId:'',contractId:kind==='cleaning'?`ct${i%5}`:'',date,time:`${String(start).padStart(2,'0')}:00`,end:`${String(Math.floor(end/60)).padStart(2,'0')}:${String(end%60).padStart(2,'0')}`,amount:service.price,commission:db.staff[i%4].commission,status:i===0?'Em atendimento':i%3===0?'Confirmado':'Agendado',notes:''});
      if(kind==='cleaning')for(let t=0;t<4;t++)db.tasks.push({id:`t${i}-${t}`,bookingId:`b${i}`,title:['Conferir ambiente e materiais','Higienizar áreas de uso comum','Revisar banheiros e superfícies','Concluir vistoria com o cliente'][t],done:i===0&&t<2});
    }
    const done={...db.bookings[0],id:'b-completed',date:'2026-10-23',status:'Concluído',commission:40};db.bookings.push(done);
    db.entries.push({id:`booking-${done.id}`,title:`Atendimento · ${db.clients[0].name}`,type:'Receita',amount:done.amount,date:done.date,paid:true,category:'Serviços',reference:done.id});
    if(kind==='cleaning'){
      db.entries=[];
      for(const contract of db.contracts)db.entries.push({id:`contract-${contract.id}-2026-10`,title:`Contrato · ${contract.title}`,type:'Receita',amount:contract.fee,date:'2026-10-10',paid:contract.id!=='ct1',category:'Contratos',reference:contract.id});
      for(let t=0;t<4;t++)db.tasks.push({id:`done-${t}`,bookingId:done.id,title:['Conferir materiais','Executar limpeza','Revisar ambiente','Vistoria final'][t],done:true});
    }
  }
  if(kind==='realty'){
    db.properties=Array.from({length:8},(_,i)=>({id:`im${i}`,title:['Apartamento Jardim','Casa das Palmeiras','Studio Meireles','Cobertura Horizonte','Apartamento Alameda','Casa do Lago','Sala Essencial','Loft Nativa'][i],code:`HB-${101+i}`,address:db.clients[i].address,type:['Apartamento','Casa','Studio','Cobertura'][i%4],transaction:i%3===2?'Locação':'Venda',price:i%3===2?2800+i*300:650000+i*85000,area:65+i*18,beds:1+i%3,ownerId:`c${i}`,brokerId:`e${i%4}`,status:i===1?'Em negociação':'Disponível',description:'Ambiente acolhedor, boa iluminação natural e localização privilegiada.',photo:i%2?'property-2':'hero'}));
    db.deals=Array.from({length:8},(_,i)=>({id:`d${i}`,propertyId:`im${i%8}`,clientId:`c${(i+2)%8}`,brokerId:`e${i%4}`,stage:dealStages[i%3],offer:db.properties[i%8].price,commission:i%3===2?100:5}));
    db.bookings=Array.from({length:6},(_,i)=>({id:`v${i}`,clientId:`c${(i+2)%8}`,staffIds:[`e${i%4}`],serviceId:'',propertyId:`im${i}`,contractId:'',date:i<4?'2026-10-26':'2026-10-27',time:'10:00',end:'11:00',amount:0,commission:0,status:'Confirmado',notes:''}));
    db.bookings[5].time='14:00';db.bookings[5].end='15:00';
  }
  if(kind==='school'){
    db.courses=[{id:'co0',title:'Inglês Conversação',category:'Idiomas',workload:60,tuition:320},{id:'co1',title:'Espanhol Essencial',category:'Idiomas',workload:48,tuition:290},{id:'co2',title:'Excel Profissional',category:'Tecnologia',workload:40,tuition:250},{id:'co3',title:'Gestão para Empreendedores',category:'Negócios',workload:36,tuition:280}];
    db.classes=db.courses.map((co,i)=>({id:`tu${i}`,courseId:co.id,teacherId:`e${i}`,title:['Inglês · Turma A','Espanhol · Turma B','Excel · Turma C','Gestão · Turma D'][i],room:`Sala 0${i+1}`,capacity:[12,15,16,12][i],weekdays:i%2?[2,4]:[1,3],time:i%2?'19:00':'18:00',endTime:i%2?'20:30':'19:30',start:'2026-10-05',end:'2027-01-29',status:'Ativa'}));
    for(let i=0;i<8;i++){const cl=db.classes[i%4],co=db.courses[i%4],en={id:`en${i}`,classId:cl.id,studentId:`c${i}`,tuition:co.tuition,date:'2026-10-05',status:'Ativa'};db.enrollments.push(en);db.entries.push({id:`tuition-${en.id}-2026-10`,title:`Mensalidade · ${db.clients[i].name}`,type:'Receita',amount:en.tuition,date:'2026-10-10',paid:i%3!==0,category:'Mensalidades',reference:en.id});}
    db.attendance=[{enrollmentId:'en0',date:'2026-10-26',present:true},{enrollmentId:'en4',date:'2026-10-26',present:false}];
  }
  const totals={salon:18400,realty:32500,school:0,cleaning:0};
  if(totals[kind])db.entries.push({id:'income-month',title:kind==='realty'?'Comissões de negócios anteriores':'Receitas consolidadas do mês',type:'Receita',amount:totals[kind],date:'2026-10-15',paid:true,category:kind==='realty'?'Comissões':'Serviços'});
  db.entries.push({id:'cost-month',title:'Equipe e despesas operacionais',type:'Despesa',amount:{salon:7400,realty:12300,school:950,cleaning:8800}[kind],date:'2026-10-25',paid:true,category:'Operação'});
  for(let m=5;m<=9;m++)db.entries.push({id:`hist-${m}`,title:'Receitas consolidadas',type:'Receita',amount:Math.round(({salon:19000,realty:33000,school:2200,cleaning:18000}[kind])*(.4+(m-5)*.1)),date:`2026-0${m}-15`,paid:true,category:'Histórico'});
  return {...settings,kind,seed:db};
}
