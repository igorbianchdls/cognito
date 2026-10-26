import ServiceApp from '../gestao-demo/ServiceApp';
import { makeServiceConfig } from '../gestao-demo/service-data';
const config = makeServiceConfig(false);
export default function NexoApp() { return <ServiceApp config={config} />; }
