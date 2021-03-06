import * as https from 'https';
import { tools } from './helper';
import { homedir, platform, release, type, hostname, arch } from 'os';
import { join } from 'path';
import { vfs } from './helper';
import { existsSync, readdirSync, removeSync, mkdirpSync } from 'fs-extra';
import { version as lastVersion } from '../package.json';
import compareVersions from 'compare-versions';
import { identifier } from './constants';
import { addHours, isPast } from 'date-fns';
import * as querystring from 'querystring';

type ActionTimestamp = number;
type OSInfo = { [attr: string]: string };
type Actions = { [action: string]: ActionTimestamp[] };

function currentTime() {
    return new Date().getTime();
}

type ActionsBody = { cid: string; action: string; timestamp: number; version: string };

type ClientInfoBody = { cid: string; info: OSInfo; timestamp: number; version: string };

function genClientId() {
    vfs.writeFileSync(ClientFiles.id, tools.hexRandom(10));
}

function doActive() {
    try {
        const ct = currentTime();
        const isFile = existsSync(ClientFiles.active);
        const activeTime = isFile ? Number(vfs.readFileSync(ClientFiles.active)) : ct;
        const nextActiveTime: Date = addHours(activeTime, 24);
        nextActiveTime.setHours(0, 0, 0, 0);
        if (isPast(nextActiveTime) || !isFile) {
            sendClientActions('active');
            sendGA()('active', lastVersion);
            vfs.writeFileSync(ClientFiles.active, ct.toString());
        }
    } catch (e) {
        removeSync(ClientFiles.active);
        console.error(e);
    }
}

const getActions = () => (existsSync(ClientFiles.actions) ? vfs.readJsonSync<Actions>(ClientFiles.actions) : {});

const getClientId = () => vfs.readFileSync(ClientFiles.id);

const getPreviousVersion = (extonionsPath: string) => {
    const extonions = readdirSync(extonionsPath).filter(name => name.startsWith(identifier));
    if (extonions.length >= 2) {
        const versions = extonions.map(name => name.substr(identifier.length + 1)).sort(compareVersions);
        return versions.slice(versions.length - 2)[0];
    } else {
        return lastVersion;
    }
};

const stageActions = (actions: Actions) => vfs.writeJsonSync(ClientFiles.actions, actions);

function getOSInfo() {
    return { type: type(), platform: platform(), release: release(), hostname: hostname(), arch: arch() };
}

function versionUpgrade(extonionPath: string) {
    const upgradeScriptsPath = join(extonionPath, 'upgrade');
    const extonionsPath = join(extonionPath, '..');
    const preVersion: string = getPreviousVersion(extonionsPath);
    if (compareVersions(lastVersion, preVersion) === 0) return;
    const patchs = readdirSync(upgradeScriptsPath)
        .map(name => name.substr(0, name.length - 3))
        .filter(patch => compareVersions(patch, preVersion) === 1)
        .filter(patch => compareVersions(patch, lastVersion) <= 0)
        .sort(compareVersions)
        .map(v => v + '.js');
    for (const patch of patchs) {
        console.log(join(upgradeScriptsPath, patch));
        eval(vfs.readFileSync(join(upgradeScriptsPath, patch)));
        console.log(`use upgrade script: ${patch}.js`);
    }
    console.log(`update from ${preVersion} -> ${lastVersion}`);
}

const postSlack = (body: ClientInfoBody | ActionsBody) => {
    const b: string = JSON.stringify({ text: JSON.stringify(body) });
    return new Promise<string>((resolve, reject) => {
        const options: https.RequestOptions = {
            host: 'hooks.slack.com',
            path: '/services/THAUWRE2W/BJACQ46CX/vmUGK9qnTQDRNtxETMwavscn',
            method: 'POST',
            headers: { 'Content-type': 'application/json; charset=UTF-8' }
        };

        const req = https.request(options, res => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => (chunk += data));
            res.on('end', () => resolve(data));
            res.on('error', err => reject(err.message));
        });

        req.on('error', err => reject(err.message));
        req.write(b);
        req.end();
    });
};

function makePostActionsBody(action: string, timestamp: number): ActionsBody {
    return { action, timestamp, cid: getClientId(), version: lastVersion };
}

function makePostClientInfoBody(timestamp: number): ClientInfoBody {
    return { cid: getClientId(), info: getOSInfo(), timestamp, version: lastVersion };
}

async function sendClientActions(action: string) {
    const actions = getActions();
    if (actions[action]) {
        actions[action].push(currentTime());
    } else {
        actions[action] = [currentTime()];
    }
    try {
        for (const [a, ts] of Object.entries(actions)) {
            if (a === 'installed') {
                await postSlack(makePostClientInfoBody(ts[0]));
                continue;
            }
            for (const t of ts) {
                await postSlack(makePostActionsBody(a, t));
            }
        }
        removeSync(ClientFiles.actions);
    } catch (e) {
        stageActions(actions);
    }
}

// client file variable
namespace ClientFiles {
    export const home = join(homedir(), '.vscode-note');
    export const id = join(home, 'clientId');
    export const actions = join(home, 'actions');
    export const active = join(home, 'active');
}

export function initClient(extonionPath: string) {
    if (!existsSync(ClientFiles.home)) {
        mkdirpSync(ClientFiles.home);
        genClientId();
        stageActions({ installed: [currentTime()] });
    }
    versionUpgrade(extonionPath);
    doActive();
    return (action: string) => sendClientActions(action);
}

export function sendGA() {
    const tid = 'UA-143144958-1';
    const t = 'event';
    const v = 1;
    const uid = getClientId();

    return (ec: string, ea: string) => {
        const body = { v, tid, uid, t, ec, ea };
        const data = querystring.stringify(body);

        return new Promise<void>((resolve, reject) => {
            const options = {
                host: 'www.google-analytics.com',
                path: '/collect',
                method: 'POST'
            };

            const req = https.request(options, res => {
                res.setEncoding('utf8');
                res.on('end', () => resolve());
                res.on('error', err => reject(err.message));
            });

            req.write(data);
            req.end();
            req.on('error', err => reject(err.message));
        }).catch(e => console.log(e));
    };
}
