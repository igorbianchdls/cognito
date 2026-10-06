import type {z} from 'zod'
import type {simulationScenarioSchema} from '../../shared/serviceInvoiceContracts'

export type SimulationScenario=z.infer<typeof simulationScenarioSchema>
export type SimulationResult={status:'emitida'|'falha'|'aguardando_retorno';codigo:string;mensagem:string}
/** No credentials, networking, provider SDK or production fallback are permitted in this adapter. */
export const serviceInvoiceSimulator={
 emit(scenario:SimulationScenario):SimulationResult{
  if(scenario==='rejeicao')return {status:'falha',codigo:'SIMULADO_REJEICAO',mensagem:'Rejeição demonstrativa: confira o cadastro e a classificação do serviço.'}
  if(scenario==='demora'||scenario==='timeout')return {status:'aguardando_retorno',codigo:scenario==='timeout'?'SIMULADO_TIMEOUT':'SIMULADO_PROCESSANDO',mensagem:'Pedido local registrado. Consulte o resultado para concluir a simulação.'}
  return {status:'emitida',codigo:'SIMULADO_AUTORIZADO',mensagem:'Autorização simulada. Nenhuma nota fiscal real foi emitida.'}
 },
 consult():SimulationResult{return {status:'emitida',codigo:'SIMULADO_AUTORIZADO',mensagem:'Resultado local conciliado. Nenhuma API fiscal foi acessada.'}},
 cancel(){return {status:'cancelada' as const,codigo:'SIMULADO_CANCELADO',mensagem:'Cancelamento exclusivamente demonstrativo.'}},
}
