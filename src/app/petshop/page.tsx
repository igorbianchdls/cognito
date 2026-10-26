import type { Metadata } from 'next';
import App from '@/assets/landingpages/petshop/PataApp';
export const metadata:Metadata={title:'Pata | Pet Shop',description:'Gestão interna para o seu negócio. Ambiente de demonstração.',robots:{index:false,follow:false}};
export default function Page(){return <App/>;}
