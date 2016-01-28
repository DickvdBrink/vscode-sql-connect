import * as vscode from 'vscode';
import * as mssql from 'mssql';

import * as pm from './../profileManager';

const mssqlId = "mssql";
const azureId = "azure";

export function getConnectionProviders() {
	return [{
		id: mssqlId,
		description: 'Microsoft SQLServer Connection Provider'
	},
	{
		id: azureId,
		description: 'Azure / Microsoft SQLServer Connection Provider (encrypted)'
	}];
}

export async function connect(profile: pm.Profile) {
	const password = await vscode.window.showInputBox({
		password: true,
		placeHolder: "Password",
		prompt: "Enter password"
	});

	if (password === undefined) {
		// Canceled, just quit
		return;
	}
	const config: mssql.config = {
		server: profile.host,
		database: profile.database,
		user: profile.user,
		password: password
	};
	if (profile.type == azureId) {
		config.options = { encrypt:  true };
	}

	const connection = new mssql.Connection(config);
	try {
		await connection.connect();
	} catch (err) {
		vscode.window.showErrorMessage("Error connectiong db: " + err);
		return;
	}

	const output = vscode.window.createOutputChannel("sql");
	output.show(vscode.ViewColumn.Two);
	output.appendLine(`Connecting to server: ${config.server}`);

	let sql: string;
	while (
		(sql = await vscode.window.showInputBox({
			placeHolder: "SQL"
		})) != undefined) {
		output.appendLine(`SQL: ${sql}`);
		try {
			const recordset = await executeQuery(connection, sql);
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

function executeQuery(connection: mssql.Connection, sql: string) {
	return new Promise<any>((resolve, reject) => {
		const request = new mssql.Request(connection);
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
	for (let row of recordset) {
		const rowOutput = [];
		for (let col in row) {
			rowOutput.push(row[col]);
		}
		output.appendLine(
			[""].concat(rowOutput).concat("").join("|")
		);
	}
}
