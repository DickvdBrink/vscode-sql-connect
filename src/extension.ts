// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'; 

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-sql-connect" is now active!'); 

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	var disposable = vscode.commands.registerCommand('extension.sqlConnect', () => {
		// The code you place here will be executed every time your command is executed
		var mssql = require('mssql');
		var connection = null;
		var config: any = {};
		vscode.window.showInputBox({
			placeHolder: "hostname\\instance",
			prompt: "Enter hostname and optional instance name"
		}).then((host) => {
			config.server = host;
			return vscode.window.showInputBox({
				placeHolder: "Username",
				prompt: "Enter username"
			});
		}).then((user) => {
			config.user = user;
			return vscode.window.showInputBox({
				password: true,
				placeHolder: "Password",
				prompt: "Enter password"
			});
		}).then((password) => {
			config.password = password;
			connection = new mssql.Connection(config, function(err) {
				console.log("ERROR: " + err);
			});
		}).then(() => {
			var output = vscode.window.createOutputChannel("sql");
			output.show(vscode.ViewColumn.Two);
			output.appendLine("Connecting to server");

			loop();

			function loop() {
				return vscode.window.showInputBox({
					placeHolder: "SQL"
				}).then((sql) => {
					if (sql !== undefined) {
						output.appendLine("SQL: " + sql);
						var request = new mssql.Request(connection);
						request.query(sql, function(err, recordset) {
							if (!recordset) {
								loop();
								return;
							}
							for (var row of recordset) {
								output.append("|")
								for (var col in row) {
									output.append(` ${row[col]} |`)
								}
								output.appendLine("");
							}
							loop();
						});
					} else {
						connection.close();
					}
				});
			}
		});
	});

	context.subscriptions.push(disposable);
}