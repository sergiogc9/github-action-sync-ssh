import * as core from '@actions/core';
import { NodeSSH } from 'node-ssh';

const __executeCommand = async (sshInstance: NodeSSH, command: string) => {
	core.info(`Executing: ${command}`);
	const response = await sshInstance.exec(command, [], {
		stream: 'both',
		onStdout(chunk) {
			console.log(chunk.toString('utf8'));
		},
		onStderr(chunk) {
			console.log(chunk.toString('utf8'));
		}
	});

	if (response.code !== 0) throw new Error(response.stderr);
};

const __copyContent = async (sshInstance: NodeSSH, source: string, destination: string) => {
	core.info(`Copying content from ${source} to ${destination}`);
	const isSuccess = await sshInstance.putDirectory(source, destination, {
		recursive: true,
		tick: (localFile, remoteFile, error) => {
			if (error) {
				console.error(`Error copying ${localFile} to ${remoteFile}:`);
				console.error(error);
				core.warning(`Error copying ${localFile} to ${remoteFile}`);
			} else {
				console.log(`File copied from ${localFile} to ${remoteFile}`);
			}
		}
	});

	if (isSuccess) core.info('The files have been copied successfully');
	else throw new Error('An error ocurred while copying the directory!');
};

const runAction = async () => {
	core.info(`Running action...`);

	const ssh = new NodeSSH();

	try {
		await ssh.connect({
			host: core.getInput('host', { required: true }),
			port: +core.getInput('port', { required: true }),
			username: core.getInput('username', { required: true }),
			password: core.getInput('password', { required: true })
		});
	} catch (e) {
		console.error('Error connecting to remote server');
		console.error(e);
		core.setFailed('Error connecting to remote server');
		process.abort();
	}

	try {
		const source = core.getInput('local-directory', { required: true });
		const destination = core.getInput('remote-directory', { required: true });

		if (core.getBooleanInput('remove-content', { required: false }))
			await __executeCommand(ssh, `rm -rf ${destination}`);
		await __copyContent(ssh, source, destination);

		if (ssh.isConnected()) ssh.dispose();
	} catch (e) {
		console.error('Error syncing content');
		console.error(e);
		core.setFailed('Error syncing content');
		process.abort();
	}
};

runAction();
