import * as vscode from 'vscode';

var profiles: Profile[] = []; 

interface Profile {
	id: string;
	host: string;
	database?: string;
	user?: string;
}

function createProfile(profile: Profile) {
	profiles.push(profile);
}

function getProfiles() {
	return profiles;
}

function removeProfile(id: string) {

}

export { Profile, createProfile, getProfiles, removeProfile };
