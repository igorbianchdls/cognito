'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { RegistrationRelations } from '@/products/erp/shared/registrationContracts'

export function ErpRegistrationRelations({ value, onChange, disabled }: { value: RegistrationRelations; onChange: (value: RegistrationRelations) => void; disabled: boolean }) {
  return <div className="grid gap-6">{(['contatos','enderecos'] as const).map(key => {
    const rows = value[key] || []
    const contact = key === 'contatos'
    const purposes = contact ? ['comercial','financeiro','operacional'] : ['comercial','cobranca','prestacao']
    const fields = contact ? ['nome','cargo','email','telefone'] : ['identificacao','logradouro','numero','complemento','bairro','cidade','uf','cep','pais']
    const labels: Record<string,string> = { nome:'Nome',cargo:'Cargo',email:'E-mail',telefone:'Telefone',identificacao:'Identificação',logradouro:'Logradouro',numero:'Número',complemento:'Complemento',bairro:'Bairro',cidade:'Cidade',uf:'UF',cep:'CEP',pais:'País',comercial:'Comercial',financeiro:'Financeiro',operacional:'Operacional',cobranca:'Cobrança',prestacao:'Prestação do serviço' }
    const update = (index: number, changes: Record<string,unknown>) => onChange({ ...value, [key]: rows.map((row,i) => i === index ? { ...row,...changes } : row) })
    return <section key={key} className="grid gap-3 border-t pt-4"><h3 className="font-semibold">{contact ? 'Contatos' : 'Endereços'}</h3>
      {rows.length === 0 && <p className="text-sm text-gray-500">Nenhum {contact ? 'contato' : 'endereço'} adicional.</p>}
      {rows.map((row,index) => <fieldset disabled={disabled} key={row.id || index} className="grid gap-3 rounded-md border p-3">
        <legend className="px-1 text-sm">{contact ? 'Contato' : 'Endereço'} {index+1}</legend>
        {fields.map(field => <label key={field} className="grid gap-1 text-sm">{labels[field]}<Input type={field === 'email' ? 'email' : 'text'} value={String((row as unknown as Record<string,unknown>)[field] || '')} onChange={event => update(index,{[field]:event.target.value})} /></label>)}
        {contact && <label className="flex gap-2 text-sm"><input type="checkbox" checked={Boolean((row as {whatsapp?:boolean}).whatsapp)} onChange={event=>update(index,{whatsapp:event.target.checked})} />Telefone com WhatsApp</label>}
        <p className="text-sm font-medium">Finalidades e principal</p>
        {purposes.map(purpose => { const selected=(row.finalidades as string[]).includes(purpose); return <div key={purpose} className="flex justify-between gap-3 text-sm"><label className="flex gap-2"><input type="checkbox" checked={selected} onChange={event=>update(index,{finalidades:event.target.checked ? [...row.finalidades,purpose] : row.finalidades.filter(p=>p!==purpose),principais:row.principais.filter(p=>p!==purpose)})} />{labels[purpose]}</label><label className="flex gap-2"><input type="checkbox" disabled={!selected} checked={(row.principais as string[]).includes(purpose)} onChange={event=>update(index,{principais:event.target.checked ? [...row.principais,purpose] : row.principais.filter(p=>p!==purpose)})} />Principal</label></div> })}
        <Button type="button" variant="outline" onClick={()=>onChange({...value,[key]:rows.filter((_,i)=>i!==index)})}>Remover {contact ? 'contato' : 'endereço'}</Button>
      </fieldset>)}
      <Button type="button" variant="outline" disabled={disabled || rows.length >= 100} onClick={()=>onChange({...value,[key]:[...rows,contact ? {nome:'',cargo:'',email:'',telefone:'',whatsapp:false,finalidades:['comercial'],principais:[]} : {identificacao:'',logradouro:'',numero:'',complemento:'',bairro:'',cidade:'',uf:'',cep:'',pais:'Brasil',finalidades:['comercial'],principais:[]}]})}>Adicionar {contact ? 'contato' : 'endereço'}</Button>
    </section>
  })}</div>
}
