import VerticalApp from '../novos-nichos/VerticalApp';
import { makeConfig } from '../novos-nichos/model';
const config=makeConfig('school');
export default function FormaApp() { return <VerticalApp config={config}/>; }
