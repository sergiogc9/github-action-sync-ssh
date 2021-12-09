"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const node_ssh_1 = require("node-ssh");
const __executeCommand = (sshInstance, command) => __awaiter(void 0, void 0, void 0, function* () {
    core.info(`Executing: ${command}`);
    const response = yield sshInstance.exec(command, [], {
        stream: 'both',
        onStdout(chunk) {
            console.log(chunk.toString('utf8'));
        },
        onStderr(chunk) {
            console.log(chunk.toString('utf8'));
        }
    });
    if (response.code !== 0)
        throw new Error(response.stderr);
});
const __copyContent = (sshInstance, source, destination) => __awaiter(void 0, void 0, void 0, function* () {
    core.info(`Copying content from ${source} to ${destination}`);
    const isSuccess = yield sshInstance.putDirectory(source, destination, {
        recursive: true,
        tick: (localFile, remoteFile, error) => {
            if (error) {
                console.error(`Error copying ${localFile} to ${remoteFile}:`);
                console.error(error);
                core.warning(`Error copying ${localFile} to ${remoteFile}`);
            }
            else {
                console.log(`File copied from ${localFile} to ${remoteFile}`);
            }
        }
    });
    if (isSuccess)
        core.info('The files have been copied successfully');
    else
        throw new Error('An error ocurred while copying the directory!');
});
const runAction = () => __awaiter(void 0, void 0, void 0, function* () {
    core.info(`Running action...`);
    const ssh = new node_ssh_1.NodeSSH();
    try {
        yield ssh.connect({
            host: core.getInput('host', { required: true }),
            port: +core.getInput('port', { required: true }),
            username: core.getInput('username', { required: true }),
            password: core.getInput('password', { required: true })
        });
    }
    catch (e) {
        console.error('Error connecting to remote server');
        console.error(e);
        core.setFailed('Error connecting to remote server');
        process.abort();
    }
    try {
        const source = core.getInput('local-directory', { required: true });
        const destination = core.getInput('remote-directory', { required: true });
        if (core.getBooleanInput('remove-content', { required: false }))
            yield __executeCommand(ssh, `rm -rf ${destination}`);
        yield __copyContent(ssh, source, destination);
        if (ssh.isConnected())
            ssh.dispose();
    }
    catch (e) {
        console.error('Error syncing content');
        console.error(e);
        core.setFailed('Error syncing content');
        process.abort();
    }
});
runAction();
