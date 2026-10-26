import type { Metadata } from 'next';
import App from '@/assets/landingpages/imobiliaria/HabitaApp';
export const metadata:Metadata={title:'Habita | Imobiliária',description:'Gestão interna para o seu negócio. Ambiente de demonstração.',robots:{index:false,follow:false}};
export default function Page(){return <App/>;}
