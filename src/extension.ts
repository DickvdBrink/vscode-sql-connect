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
		connectCommand();
	});

	context.subscriptions.push(disposable);
}

function connectCommand() {
	var mssql = require('mssql');
	var connection = null;
	var config: any = {};
	askQuestion({
		placeHolder: "hostname\\instance",
		prompt: "Enter hostname and optional instance name"
	}).then((host) => {
		config.server = host;
		return askQuestion({
			placeHolder: "Username",
			prompt: "Enter username"
		});
	}).then((user) => {
		config.user = user;
		return askQuestion({
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
		output.appendLine(`Connecting to server: ${config.server}`);
		loop((next, cancel) => {
			return askQuestion({
				placeHolder: "SQL"
			}).then((sql) => {
				output.appendLine(`SQL: ${sql}`);
				var request = new mssql.Request(connection);
				request.query(sql, function(err, recordset) {
					if (err) {
						output.appendLine(err);
						next();
					}
					if (!recordset) {
						next();
						return;
					}
					showResult(output, recordset);
					next();
				});
			}).catch(() => {
				cancel();
			})
		}, () => {
			connection.close();
		});
	}).catch(() => { });
}

function askQuestion(options: vscode.InputBoxOptions) {
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

type actionFunc = () => void;
type loopFunc = (next: actionFunc, cancel?: actionFunc) => void;

function loop(func: loopFunc, cancelFunc: actionFunc) {
	func(() => loop(func, cancelFunc), cancelFunc);
}

function showResult(output: vscode.OutputChannel, recordset) {
	for (var row of recordset) {
		output.append("|")
		for (var col in row) {
			output.append(` ${row[col]} |`)
		}
		output.appendLine("");
	}
}
