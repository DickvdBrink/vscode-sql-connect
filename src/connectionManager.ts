import * as pm from './profileManager';
import * as mssqlConnection from './providers/mssql';

interface ConnectionProvider {
	connect(profile: pm.Profile): void;
}

const providerMap: { [index: string]: ConnectionProvider } = {
	'mssql': mssqlConnection
}

const providers = [
	{
		id: 'mssql',
		description: 'Microsoft SQLServer connection provider'
	}
]

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
