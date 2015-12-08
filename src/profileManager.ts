import * as vscode from 'vscode';

var profiles: Profile[] = null;

interface Profile {
	id: string;
	host: string;
	database?: string;
	user?: string;
}

function createProfile(profile: Profile) {
	ensureLoadConfiguration();
	profiles.push(profile);
	saveConfiguration();
}

function getProfiles() {
	return profiles;
}

function removeProfile(id: string) {
	ensureLoadConfiguration();
}

function ensureLoadConfiguration() {
	if (profiles === null) {
		profiles = [];
	}
}

function saveConfiguration() {

}

export { Profile, createProfile, getProfiles, removeProfile };
