import VerticalApp from '../novos-nichos/VerticalApp';
import { makeConfig } from '../novos-nichos/model';
const config=makeConfig('pet');
export default function PataApp() { return <VerticalApp config={config}/>; }
