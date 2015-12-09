import * as vscode from 'vscode';
import * as mssql from 'mssql';

import * as pm from './../profileManager';

export async function connect(profile: pm.Profile) {
	var password = await vscode.window.showInputBox({
		password: true,
		placeHolder: "Password",
		prompt: "Enter password"
	});

	if (password === undefined) {
		// Canceled, just quit
		return;
	}
	var config: mssql.config = {
		server: profile.host,
		database: profile.database,
		user: profile.user,
		password: password
	};

	var connection = new mssql.Connection(config);
	try {
		await connection.connect();
	} catch (err) {
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
