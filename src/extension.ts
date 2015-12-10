import * as vscode from 'vscode';
import * as pm from './profileManager';
import * as connectionManager from './connectionManager';

let profileManager: pm.ProfileManager = undefined;

export function activate(context: vscode.ExtensionContext) {
	profileManager = new pm.ProfileManager(context);

	const cmdConnect = vscode.commands.registerCommand('extension.sqlConnect', () => {
		connectCommand();
	});

	const cmdCreateProfile = vscode.commands.registerCommand('extension.createSqlProfile', () => {
		createProfile();
	});

	context.subscriptions.push(cmdConnect);
	context.subscriptions.push(cmdCreateProfile);
}

async function connectCommand() {
	const profiles = profileManager.getProfiles();

	interface IConnectQuickPickItem extends vscode.QuickPickItem {
		profile: pm.Profile;
	}

	const items = profiles.map((item) => {
		return <IConnectQuickPickItem>{
			label: item.host,
			description: `${item.host} - ${item.database}`,
			profile: item
		}
	});
	const selectedItem: IConnectQuickPickItem = await vscode.window.showQuickPick<IConnectQuickPickItem>(items);
	if (!selectedItem) {
		return;
	}
	connectionManager.connect(selectedItem.profile);
}

async function createProfile() {
	try {
		const providers = connectionManager.getConnectionProviders();
		const providerType = await vscode.window.showQuickPick(providers);
		if (!providerType) {
			return;
		}

		const server = await askQuestion({
			placeHolder: "hostname\\instance",
			prompt: "Enter hostname and optional instance name"
		});
		const profile: pm.Profile = {
			id: server,
			type: providerType,
			host: server
		};

		profile.database = await askQuestion({
			placeHolder: "database",
			prompt: "Enter database (optional)"
		});

		profile.user = await askQuestion({
			placeHolder: "Username",
			prompt: "Enter username"
		});
		profileManager.createProfile(profile);
	} catch (e) {
		return;
	}
}

async function askQuestion(options: vscode.InputBoxOptions) {
	return new Promise<string>((resolve, reject) => {
		vscode.window.showInputBox(options).then((input) => {
			if (input !== undefined) {
				resolve(input);
			} else {
				reject();
			}
		})
	});
}
