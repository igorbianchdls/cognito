import VerticalApp from '../novos-nichos/VerticalApp';
import { makeConfig } from '../novos-nichos/model';
const config=makeConfig('realty');
export default function HabitaApp() { return <VerticalApp config={config}/>; }
