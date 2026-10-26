import type { Metadata } from 'next';
import App from '@/assets/landingpages/limpeza/ClaraApp';
export const metadata:Metadata={title:'Clara | Limpeza & Manutenção',description:'Gestão interna para o seu negócio. Ambiente de demonstração.',robots:{index:false,follow:false}};
export default function Page(){return <App/>;}
