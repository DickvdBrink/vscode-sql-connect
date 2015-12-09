import * as vscode from 'vscode';

export class ProfileManager {
	private profiles: Profile[] = undefined;

	constructor(private context: vscode.ExtensionContext) {
	}

	public createProfile(profile: Profile): void {
		this.ensureLoadConfiguration();
		this.profiles.push(profile);
		this.saveConfiguration();
	}

	public getProfiles(): Profile[] {
		this.ensureLoadConfiguration();
		return this.profiles;
	}

	public removeProfile(id: string): void {
		this.ensureLoadConfiguration();
		var index = this.profiles.findIndex((value) => value.id == id);
		if (index != -1) {
			this.profiles = this.profiles.splice(index, 1);
		}
		this.saveConfiguration();
	}

	private ensureLoadConfiguration(): void {
		if (this.profiles === undefined) {
			this.profiles = this.context.globalState.get<Profile[]>("profiles", []);
		}
	}

	private saveConfiguration(): void {
		this.context.globalState.update("profiles", this.profiles);
	}
}

export interface Profile {
	id: string;
	host: string;
	database?: string;
	user?: string;
}
