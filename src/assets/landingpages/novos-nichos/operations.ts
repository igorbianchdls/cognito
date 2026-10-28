import type { Booking, Classroom, Config, Deal, Enrollment, Store } from './model';
const minutes=(time:string)=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('Informe um horário válido.');const [h,m]=time.split(':').map(Number);return h*60+m;};
const overlap=(a:string,b:string,c:string,d:string)=>minutes(a)<minutes(d)&&minutes(c)<minutes(b);
export function saveBooking(db:Store,booking:Booking,c:Config):Store{
  if(!db.clients.some(p=>p.id===booking.clientId))throw new Error('Selecione um cliente cadastrado.');
  if(!booking.staffIds.length||booking.staffIds.some(id=>!db.staff.some(p=>p.id===id)))throw new Error('Selecione ao menos um profissional.');
  if(minutes(booking.end)<=minutes(booking.time))throw new Error('O horário final precisa ser depois do início.');
  const previous=db.bookings.find(b=>b.id===booking.id);
  if(previous?.status==='Concluído')throw new Error('Atendimentos concluídos preservam os dados do fechamento.');
  if(booking.status==='Concluído')throw new Error('Conclua o atendimento pela agenda para registrar o fechamento.');
  if(!Number.isFinite(booking.amount)||booking.amount<0||!Number.isFinite(booking.commission)||booking.commission<0||booking.commission>100)throw new Error('Informe preço e comissão válidos.');
  if(c.kind!=='realty'&&!db.services.some(s=>s.id===booking.serviceId))throw new Error('Selecione um serviço cadastrado.');
  if(c.kind==='realty'&&!db.properties.some(p=>p.id===booking.propertyId))throw new Error('Selecione o imóvel da visita.');
  if(c.kind==='cleaning'&&booking.contractId&&!db.contracts.some(p=>p.id===booking.contractId&&p.status==='Ativo'&&p.clientId===booking.clientId))throw new Error('O contrato precisa estar ativo e pertencer ao cliente.');
  if(c.kind==='cleaning'&&booking.contractId){const contract=db.contracts.find(p=>p.id===booking.contractId)!;if(booking.date<contract.start||booking.date>contract.end)throw new Error('A execução precisa estar dentro da vigência do contrato.');}
  if(booking.status!=='Cancelado'){
    const conflict=db.bookings.find(b=>b.id!==booking.id&&b.date===booking.date&&!['Cancelado','Concluído'].includes(b.status)&&overlap(b.time,b.end,booking.time,booking.end)&&(b.staffIds.some(id=>booking.staffIds.includes(id))||(c.kind==='salon'&&b.clientId===booking.clientId)||(c.kind==='realty'&&b.propertyId===booking.propertyId)));
    if(conflict)throw new Error('Há conflito de horário para o profissional, cliente ou recurso selecionado.');
  }
  const tasks=c.kind==='cleaning'&&!previous?['Conferir ambiente e materiais','Executar limpeza contratada','Revisar superfícies e banheiros','Concluir vistoria com o cliente'].map((title,i)=>({id:`${booking.id}-task-${i}`,bookingId:booking.id,title,done:false})):[];
  return {...db,bookings:previous?db.bookings.map(b=>b.id===booking.id?booking:b):[...db.bookings,booking],tasks:[...db.tasks,...tasks]};
}
export function finishBooking(db:Store,id:string,c:Config):Store{
  const b=db.bookings.find(b=>b.id===id);if(!b)throw new Error('Atendimento não encontrado.');if(b.status==='Concluído')return db;
  if(b.status==='Cancelado')throw new Error('Um atendimento cancelado precisa ser reagendado antes de concluir.');
  const tasks=db.tasks.filter(t=>t.bookingId===id);
  if(c.kind==='cleaning'&&(!tasks.length||tasks.some(t=>!t.done)))throw new Error('Conclua o checklist antes de finalizar o serviço.');
  const entryId=`booking-${id}`;
  const income=c.kind!=='realty'&&!(c.kind==='cleaning'&&b.contractId)&&b.amount>0&&!db.entries.some(e=>e.id===entryId)?[{id:entryId,title:`Atendimento · ${db.clients.find(p=>p.id===b.clientId)?.name}`,type:'Receita' as const,amount:b.amount,date:b.date,paid:false,category:'Serviços',reference:b.id}]:[];
  return {...db,bookings:db.bookings.map(v=>v.id===id?{...v,status:'Concluído'}:v),entries:[...db.entries,...income]};
}
export function payCommission(db:Store,id:string):Store{
  const b=db.bookings.find(b=>b.id===id);if(!b||b.status!=='Concluído')throw new Error('A comissão depende de um atendimento concluído.');const entryId=`repasse-${id}`;if(db.entries.some(e=>e.id===entryId))return db;
  const amount=Math.round(b.amount*b.commission)/100;
  if(amount<=0)throw new Error('Não há comissão prevista neste atendimento.');
  return {...db,entries:[...db.entries,{id:entryId,title:`Repasse · ${db.staff.find(p=>p.id===b.staffIds[0])?.name}`,type:'Despesa',amount,date:b.date,paid:true,category:'Comissões',reference:id}]};
}
export function consumeStock(db:Store,input:{id:string;bookingId:string;stockId:string;quantity:number}):Store{
  if(db.consumptions.some(c=>c.id===input.id))return db;const p=db.stock.find(p=>p.id===input.stockId),b=db.bookings.find(b=>b.id===input.bookingId);
  if(!p||!b||['Concluído','Cancelado'].includes(b.status)||!Number.isFinite(input.quantity)||input.quantity<=0||input.quantity>p.quantity)throw new Error('Verifique o material, a quantidade e a situação do serviço.');
  return {...db,stock:db.stock.map(v=>v.id===p.id?{...v,quantity:v.quantity-input.quantity}:v),consumptions:[...db.consumptions,input]};
}
export function returnStock(db:Store,id:string):Store{const c=db.consumptions.find(c=>c.id===id);if(!c)return db;return {...db,stock:db.stock.map(p=>p.id===c.stockId?{...p,quantity:p.quantity+c.quantity}:p),consumptions:db.consumptions.filter(v=>v.id!==id)};}
export function billContract(db:Store,id:string,month:string):Store{
  const c=db.contracts.find(c=>c.id===id);if(!c||c.status!=='Ativo')throw new Error('Selecione um contrato ativo.');
  if(month<c.start.slice(0,7)||month>c.end.slice(0,7))throw new Error('O mês precisa estar dentro da vigência do contrato.');
  const key=`contract-${id}-${month}`;if(db.entries.some(e=>e.id===key))return db;
  return {...db,entries:[...db.entries,{id:key,title:`Contrato · ${c.title}`,type:'Receita',amount:c.fee,date:`${month}-10`,paid:false,category:'Contratos',reference:c.id}]};
}
export function closeDeal(db:Store,id:string,date:string):Store{
  const d=db.deals.find(d=>d.id===id),p=db.properties.find(p=>p.id===d?.propertyId);if(!d||!p)throw new Error('Proposta ou imóvel não encontrado.');
  if(d.stage==='Contrato'&&db.entries.some(e=>e.id===`deal-${id}`))return db;
  if(['Vendido','Alugado'].includes(p.status)||db.deals.some(x=>x.id!==id&&x.propertyId===p.id&&x.stage==='Contrato'))throw new Error('Este imóvel já tem um negócio fechado.');
  const amount=Math.round(d.offer*d.commission)/100;
  return {...db,deals:db.deals.map(x=>x.id===id?{...x,stage:'Contrato'}:x),properties:db.properties.map(x=>x.id===p.id?{...x,status:p.transaction==='Locação'?'Alugado':'Vendido'}:x),entries:[...db.entries,{id:`deal-${id}`,title:`Comissão · ${p.title}`,type:'Receita',amount,date,paid:false,category:'Comissões',reference:id}]};
}
export function saveDeal(db:Store,deal:Deal):Store{
  const old=db.deals.find(d=>d.id===deal.id);if(old?.stage==='Contrato')throw new Error('Negócios fechados preservam os dados do fechamento.');
  if(deal.stage==='Contrato')throw new Error('Feche a oportunidade pela etapa Contrato para gerar a comissão.');
  if(!db.properties.some(p=>p.id===deal.propertyId)||!db.clients.some(p=>p.id===deal.clientId)||!db.staff.some(p=>p.id===deal.brokerId))throw new Error('Confira imóvel, cliente e corretor.');
  if(deal.commission<0||deal.commission>100||deal.offer<0)throw new Error('Informe valor e comissão válidos.');
  return {...db,deals:old?db.deals.map(d=>d.id===deal.id?deal:d):[...db.deals,deal]};
}
export function saveClass(db:Store,item:Classroom):Store{
  if(!db.courses.some(c=>c.id===item.courseId)||!db.staff.some(p=>p.id===item.teacherId))throw new Error('Selecione curso e professor válidos.');
  if(item.start>item.end||!item.weekdays.length||!Number.isInteger(item.capacity)||item.capacity<1||minutes(item.endTime)<=minutes(item.time))throw new Error('Confira período, dias, capacidade e horários da turma.');
  const enrolled=db.enrollments.filter(e=>e.classId===item.id&&e.status==='Ativa').length;if(item.capacity<enrolled)throw new Error('A capacidade não pode ser menor que as matrículas ativas.');
  if(item.status==='Ativa'&&db.classes.some(c=>c.id!==item.id&&c.status==='Ativa'&&c.start<=item.end&&item.start<=c.end&&c.weekdays.some(d=>item.weekdays.includes(d))&&overlap(c.time,c.endTime,item.time,item.endTime)&&(c.teacherId===item.teacherId||c.room.toLowerCase()===item.room.toLowerCase())))throw new Error('Há conflito de horário para professor ou sala.');
  return {...db,classes:db.classes.some(c=>c.id===item.id)?db.classes.map(c=>c.id===item.id?item:c):[...db.classes,item],enrollments:item.status==='Concluída'?db.enrollments.map(e=>e.classId===item.id&&e.status==='Ativa'?{...e,status:'Encerrada'}:e):db.enrollments};
}
export function enroll(db:Store,item:Enrollment):Store{
  const c=db.classes.find(c=>c.id===item.classId);if(!c||c.status!=='Ativa'||!db.clients.some(p=>p.id===item.studentId))throw new Error('Selecione uma turma ativa e um aluno cadastrado.');
  if(db.enrollments.some(e=>e.id===item.id))return db;
  if(db.enrollments.some(e=>e.classId===item.classId&&e.studentId===item.studentId&&e.status==='Ativa'))throw new Error('Este aluno já tem matrícula ativa na turma.');
  if(db.enrollments.filter(e=>e.classId===item.classId&&e.status==='Ativa').length>=c.capacity)throw new Error('A turma está sem vagas.');
  if(item.date>c.end||!Number.isFinite(item.tuition)||item.tuition<0)throw new Error('Confira data e valor da matrícula.');
  const next={...db,enrollments:[...db.enrollments,item]};return billEnrollment(next,item.id,item.date.slice(0,7));
}
export function billEnrollment(db:Store,id:string,month:string):Store{
  const e=db.enrollments.find(e=>e.id===id),c=db.classes.find(c=>c.id===e?.classId);if(!e||!c||e.status!=='Ativa')throw new Error('Selecione uma matrícula ativa.');
  if(month<e.date.slice(0,7)||month<c.start.slice(0,7)||month>c.end.slice(0,7))throw new Error('O mês precisa estar no período da matrícula e da turma.');
  const key=`tuition-${id}-${month}`;if(db.entries.some(v=>v.id===key))return db;
  return {...db,entries:[...db.entries,{id:key,title:`Mensalidade · ${db.clients.find(p=>p.id===e.studentId)?.name}`,type:'Receita',amount:e.tuition,date:`${month}-10`,paid:false,category:'Mensalidades',reference:e.id}]};
}
export function markAttendance(db:Store,enrollmentId:string,date:string,present:boolean|null):Store{
  const e=db.enrollments.find(e=>e.id===enrollmentId),c=db.classes.find(c=>c.id===e?.classId);if(!e||!c||c.status!=='Ativa'||e.status!=='Ativa'||date<c.start||date>c.end||date<e.date||!c.weekdays.includes(new Date(`${date}T12:00:00`).getDay()))throw new Error('Escolha uma data de aula válida para esta matrícula.');
  const next=db.attendance.filter(a=>a.enrollmentId!==enrollmentId||a.date!==date);return {...db,attendance:present===null?next:[...next,{enrollmentId,date,present}]};
}
