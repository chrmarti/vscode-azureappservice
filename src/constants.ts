/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const deploymentFileName: string = '.deployment';
export const deploymentFile: string = `[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=true`;

export const extensionPrefix: string = 'appService';
export enum runtimes {
    node = 'node',
    php = 'php',
    dotnetcore = 'dotnetcore',
    ruby = 'ruby'
}

export function getIgnoredFoldersForDeployment(runtime: string): string[] | undefined {
    switch (runtime) {
        case runtimes.node:
            return ['node_modules{,/**}'];
        default:
            return undefined;
    }
}

export enum configurationSettings {
    zipIgnorePattern = 'zipIgnorePattern',
    showBuildDuringDeployPrompt = 'showBuildDuringDeployPrompt',
    showRemoteFiles = 'showRemoteFiles'
}
