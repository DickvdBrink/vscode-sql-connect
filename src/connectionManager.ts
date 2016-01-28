import * as pm from './profileManager';
import * as mssqlConnection from './providers/mssql';

interface ConnectionProvider {
	connect(profile: pm.Profile): void;
}

const providerMap: { [index: string]: ConnectionProvider } = { };
const providers: { id: string, description: string }[] = [];

(function() {
	const sqlProviders = mssqlConnection.getConnectionProviders();
	providers.push.apply(providers, sqlProviders);
	sqlProviders.forEach((item) => { providerMap[item.id] = mssqlConnection; });
})();

export function connect(profile: pm.Profile) {
	const provider = providerMap[profile.type];
	if (!provider) {
		throw "provider not found";
	}
	provider.connect(profile);
}

export function getConnectionProviders() {
	return providers;
}
