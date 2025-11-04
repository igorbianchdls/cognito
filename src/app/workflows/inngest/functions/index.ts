// Registro central das funções Inngest deste app
// Adicione exports de funções individuais aqui conforme forem criadas
import { helloWorld } from './hello'
export { helloWorld }

export const functions = [helloWorld] as const
