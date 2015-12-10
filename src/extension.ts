import * as vscode from 'vscode';
import * as pm from './profileManager';
import * as connectionManager from './connectionManager';

let profileManager: pm.ProfileManager = undefined;

export function activate(context: vscode.ExtensionContext) {
	profileManager = new pm.ProfileManager(context);

	const cmdConnect = vscode.commands.registerCommand('extension.sqlConnect', () => {
		connectCommand();
	});

	const cmdCreateProfile = vscode.commands.registerCommand('extension.sqlCreateProfile', () => {
		createProfile();
	});
	const cmdRemoveProfile = vscode.commands.registerCommand('extension.sqlRemoveProfile', () => {
		removeProfile();
	});

	context.subscriptions.push(cmdConnect);
	context.subscriptions.push(cmdCreateProfile);
	context.subscriptions.push(cmdRemoveProfile);
}

interface IConnectQuickPickItem extends vscode.QuickPickItem {
	profile: pm.Profile;
}

async function selectProfile() {
	const profiles = profileManager.getProfiles();
	const items = profiles.map((item) => {
		return <IConnectQuickPickItem>{
			label: item.host,
			description: `${item.host} - ${item.database}`,
			profile: item
		}
	});
	const selectedItem = await vscode.window.showQuickPick<IConnectQuickPickItem>(items);
	return (selectedItem ? selectedItem.profile : null);
}

async function connectCommand() {
	var profile = await selectProfile();
	if (!profile) {
		return;
	}
	connectionManager.connect(profile);
}

async function createProfile() {
	try {
		const providers = connectionManager.getConnectionProviders();

		const items = providers.map((item) => {
			return {
				label: item.id,
				description: item.description,
			}
		});

		const providerType = await vscode.window.showQuickPick(items, {
			placeHolder: "Choose connection provider"
		});
		if (!providerType) {
			return;
		}

		const server = await askQuestion({
			placeHolder: "hostname\\instance",
			prompt: "Enter hostname and optional instance name"
		});
		const profile: pm.Profile = {
			id: server,
			type: providerType.label,
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

async function removeProfile() {
	var profile = await selectProfile();
	if (!profile) {
		return;
	}
	profileManager.removeProfile(profile.id);
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
