import type { Metadata } from 'next';
import App from '@/assets/landingpages/cursos/FormaApp';
export const metadata:Metadata={title:'Forma | Cursos & Idiomas',description:'Gestão interna para o seu negócio. Ambiente de demonstração.',robots:{index:false,follow:false}};
export default function Page(){return <App/>;}
