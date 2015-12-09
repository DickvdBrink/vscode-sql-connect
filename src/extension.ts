// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
"use strict"

import * as vscode from 'vscode';
import * as mssql from 'mssql';
import * as pm from './profileManager';

var profileManager: pm.ProfileManager = undefined;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-sql-connect" is now active!'); 

	profileManager = new pm.ProfileManager(context);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	var cmdConnect = vscode.commands.registerCommand('extension.sqlConnect', () => {
		// The code you place here will be executed every time your command is executed
		connectCommand();
	});

	var cmdCreateProfile = vscode.commands.registerCommand('extension.createSqlProfile', () => {
		// The code you place here will be executed every time your command is executed
		createProfile();
	});

	context.subscriptions.push(cmdConnect);
	context.subscriptions.push(cmdCreateProfile);
}

async function connectCommand() {
	var profiles = profileManager.getProfiles();

	interface IConnectQuickPickItem extends vscode.QuickPickItem {
		profile: pm.Profile;
	}

	var items = profiles.map((item) => {
		return <IConnectQuickPickItem>{
			label: item.host,
			description: `${item.host} - ${item.database}`,
			profile: item
		}
	});
	var selectedItem: IConnectQuickPickItem = await vscode.window.showQuickPick<IConnectQuickPickItem>(items);
	if (!selectedItem) {
		return;
	}
	var profile = selectedItem.profile;
	var config: mssql.config = {
		server: profile.host,
		user: profile.user,
		database: profile.database
	};
	try {
		config.password = await askQuestion({
			password: true,
			placeHolder: "Password",
			prompt: "Enter password"
		});
	} catch (error) {
		// Canceled, just quit
		return;
	}
	var connection = new mssql.Connection(config);
	try {
		await connection.connect();
	} catch(err) {
		vscode.window.showErrorMessage("Error connectiong db: " + err);
		return;
	}

	var output = vscode.window.createOutputChannel("sql");
	output.show(vscode.ViewColumn.Two);
	output.appendLine(`Connecting to server: ${config.server}`);

	var sql: string;
	while (
		(sql = await vscode.window.showInputBox({
			placeHolder: "SQL"
		})) != undefined) {
		output.appendLine(`SQL: ${sql}`);
		try {
			var recordset = await executeQuery(connection, sql);
			if (!recordset) {
				output.appendLine("Command completed");
			} else {
				showResult(output, recordset);
			}
		} catch (err) {
			output.appendLine(err);
		}
	}
	connection.close();
}

async function createProfile() {

	try {
		var server = await askQuestion({
			placeHolder: "hostname\\instance",
			prompt: "Enter hostname and optional instance name"
		});
		var profile: pm.Profile = {
			id: server,
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

function executeQuery(connection: mssql.Connection, sql: string) {
	return new Promise<any>((resolve, reject) => {
		var request = new mssql.Request(connection);
		request.query(sql, function(err, recordset) {
			if (err) {
				reject(err);
			} else {
				resolve(recordset);
			}
		});
	});
}

function showResult(output: vscode.OutputChannel, recordset: mssql.recordSet) {
	for (var row of recordset) {
		var rowOutput = [];
		for (var col in row) {
			rowOutput.push(row[col]);
		}
		output.appendLine(
			[""].concat(rowOutput).concat("").join("|")
		);
	}
}
