import type {z} from 'zod'
import type {simulationScenarioSchema} from '../../shared/serviceInvoiceContracts'

export type SimulationScenario=z.infer<typeof simulationScenarioSchema>
export type SimulationResult={status:'emitida'|'falha'|'aguardando_retorno';codigo:string;mensagem:string;protocolo?:string;erros?:Array<{codigo:string;campo:string;mensagem:string}>}
/** Provedor simulado com o mesmo contrato de um provedor real (envio do DPS, retorno assíncrono, cancelamento com
 * motivo). Sem credenciais, rede ou SDK: nada sai do ERP e nenhum documento tem validade fiscal. */
export const serviceInvoiceSimulator={
 emit(scenario:SimulationScenario,dps:{infDPS:{nDPS:number;serie:string}}):SimulationResult{
  const protocolo=`SIM${dps.infDPS.serie.padStart(5,'0')}${String(dps.infDPS.nDPS).padStart(15,'0')}`
  // Rejeição no formato dos provedores: código e campo do leiaute.
  if(scenario==='rejeicao')return {status:'falha',codigo:'E0312',protocolo,mensagem:'Rejeição simulada: código de tributação nacional incompatível com o município de incidência.',
   erros:[{codigo:'E0312',campo:'serv.cServ.cTribNac',mensagem:'Código de tributação nacional não administrado pelo município de incidência do ISSQN (simulação).'}]}
  if(scenario==='demora'||scenario==='timeout')return {status:'aguardando_retorno',protocolo,codigo:scenario==='timeout'?'SIMULADO_TIMEOUT':'SIMULADO_PROCESSANDO',mensagem:'DPS recebido e em processamento. O resultado chega pelo retorno do provedor (consulte para concluir).'}
  return {status:'emitida',protocolo,codigo:'100',mensagem:'NFS-e autorizada (simulação). Nenhuma nota fiscal real foi emitida.'}
 },
 consult():SimulationResult{return {status:'emitida',codigo:'100',mensagem:'Retorno do provedor processado: NFS-e autorizada (simulação).'}},
 cancel(codigoMotivo:string):{status:'cancelada';codigo:string;mensagem:string;erros?:SimulationResult['erros']}{return {status:'cancelada',codigo:'101',mensagem:`Cancelamento homologado (simulação). Motivo ${codigoMotivo}.`}},
}
