/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { reporter } from './telemetry/reporter';
import WebSiteManagementClient = require('azure-arm-website');
import * as vscode from 'vscode';
import * as WebSiteModels from '../node_modules/azure-arm-website/lib/models';


export interface PartialList<T> extends Array<T> {
    nextLink?: string;
}

export async function listAll<T>(client: { listNext(nextPageLink: string): Promise<PartialList<T>>; }, first: Promise<PartialList<T>>): Promise<T[]> {
    const all: T[] = [];

    for (let list = await first; list.length || list.nextLink; list = list.nextLink ? await client.listNext(list.nextLink) : []) {
        all.push(...list);
    }

    return all;
}

export function waitForWebSiteState(webSiteManagementClient: WebSiteManagementClient, site: WebSiteModels.Site, state: string, intervalMs = 5000, timeoutMs = 60000): Promise<void> {
    return new Promise((resolve, reject) => {
        const func = async (count: number) => {
            const rgName = site.resourceGroup;
            const isSlot = isSiteDeploymentSlot(site);
            const siteName = extractSiteName(site);
            const slotName = extractDeploymentSlotName(site);
            const currentSite = await (isSlot ? webSiteManagementClient.webApps.getSlot(rgName, siteName, slotName) : webSiteManagementClient.webApps.get(rgName, siteName));

            if (currentSite.state.toLowerCase() === state.toLowerCase()) {
                resolve();
            } else {
                count += intervalMs;

                if (count < timeoutMs) {
                    setTimeout(func, intervalMs, count);
                } else {
                    reject(new Error(`Timeout waiting for Web Site "${siteName}" state "${state}".`));
                }
            }
        };
        setTimeout(func, intervalMs, intervalMs);
    });
}

export function getSignInCommandString(): string {
    return 'azure-account.login';
}

// Web app & deployment slots
export function isSiteDeploymentSlot(site: WebSiteModels.Site): boolean {
    return site.type.toLowerCase() === 'microsoft.web/sites/slots';
}

export function extractSiteName(site: WebSiteModels.Site): string {
    return isSiteDeploymentSlot(site) ? site.name.substring(0, site.name.lastIndexOf('/')) : site.name;
}

export function extractDeploymentSlotName(site: WebSiteModels.Site): string {
    return isSiteDeploymentSlot(site) ? site.name.substring(site.name.lastIndexOf('/') + 1) : null;
}

export function getWebAppPublishCredential(webSiteManagementClient: WebSiteManagementClient, site: WebSiteModels.Site): Promise<WebSiteModels.User> {
    const webApps = webSiteManagementClient.webApps;
    const siteName = extractSiteName(site);
    const slotName = extractDeploymentSlotName(site);
    return isSiteDeploymentSlot(site) ? webApps.listPublishingCredentialsSlot(site.resourceGroup, siteName, slotName) : webApps.listPublishingCredentials(site.resourceGroup, siteName);
}

// Output channel for the extension
const outputChannel = vscode.window.createOutputChannel("Azure App Service");

export function getOutputChannel(): vscode.OutputChannel {
    return outputChannel;
}

// Telemetry for the extension
export function sendTelemetry(eventName: string, properties?: { [key: string]: string; }, measures?: { [key: string]: number; }) {
    if (reporter) {
        reporter.sendTelemetryEvent(eventName, properties, measures);
    }
}

export function errToString(error: any): string {
    if (error === null || error === undefined) {
        return '';
    }

    if (error instanceof Error) {
        return JSON.stringify({
            'Error': error.constructor.name,
            'Message': error.message
        });
    }

    if (typeof (error) === 'object') {
        return JSON.stringify({
            'object': error.constructor.name
        });
    }

    return error.toString();
}