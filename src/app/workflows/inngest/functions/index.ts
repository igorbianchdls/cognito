// Registro central das funções Inngest deste app
// Adicione exports de funções individuais aqui conforme forem criadas
import { helloWorld } from './hello'
import { bigqueryTestDemo } from './bigquery-test.demo'

export { helloWorld, bigqueryTestDemo }

export const functions = [helloWorld, bigqueryTestDemo] as const
