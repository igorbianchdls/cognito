import ServiceApp from '../gestao-demo/ServiceApp';
import { makeServiceConfig } from '../gestao-demo/service-data';
const config = makeServiceConfig(true);
export default function TorqueApp() { return <ServiceApp config={config} />; }
