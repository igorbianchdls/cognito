import type { Metadata } from 'next';
import App from '@/assets/landingpages/salao/AuraApp';
export const metadata:Metadata={title:'Aura | Salão de Beleza',description:'Gestão interna para o seu negócio. Ambiente de demonstração.',robots:{index:false,follow:false}};
export default function Page(){return <App/>;}
