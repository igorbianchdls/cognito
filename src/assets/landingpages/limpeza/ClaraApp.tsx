import VerticalApp from '../novos-nichos/VerticalApp';
import { makeConfig } from '../novos-nichos/model';
const config=makeConfig('cleaning');
export default function ClaraApp() { return <VerticalApp config={config}/>; }
