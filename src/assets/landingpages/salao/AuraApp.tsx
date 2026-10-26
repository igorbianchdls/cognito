import VerticalApp from '../novos-nichos/VerticalApp';
import { makeConfig } from '../novos-nichos/model';
const config=makeConfig('salon');
export default function AuraApp() { return <VerticalApp config={config}/>; }
