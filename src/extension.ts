import * as vscode from 'vscode';
import urlJoin from 'url-join';
import * as path from 'path';

import { LabProvider } from './treeView';
import { login, logout } from './login';
import { chatOpenPanel } from './chat';
import { monitoringOpenPanel, initializeLog, sendLog, stopLog } from './monitoring';
import { uploadProblem, deleteProblem, getProblemName, fetchProblem } from './problem';
import { makeLab, deleteLab, fetchInfo, getVideoPath, getUsername } from './lab';
import { saveAllStudentCode, submitCode } from './code';
import { inviteMember, inviteTA, deleteMember } from './member';
import { downloadVideo, uploadVideo, uploadVideoTA } from './video';

export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined; // 워크 스페이스 경로
	const info: vscode.Memento = context.globalState;
	const rootUrl: string | any = vscode.workspace.getConfiguration().get('codelabhub.root-url'); // root url

	const labUrl = 'api/v1/labs';
	const problemsUrl = 'api/v1/problems/';
	const codesUrl = 'api/v1/student_codes/';
	const inviteUrl = 'api/v1/invite';
	const inviteTAUrl = 'api/v1/inviteTA';
	const infoUrl = 'api/v1/info';
	const deleteMemberUrl = 'api/v1/deleteStudentFromLab';
	const logUrl = 'api/v1/logs/DS';
	const videoUrl = 'api/v1/video/';
	
	const labProvider = new LabProvider(rootPath, info);
	vscode.window.registerTreeDataProvider('labView', labProvider); // treeData 등록

	// treeView refresh, labs.json 가져오기
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.refreshLab', async () => {
		console.log('command : refreshLab');
		labProvider.refresh();
		labProvider.refresh();
		if(rootPath){
			await fetchInfo(urlJoin(rootUrl, infoUrl), path.join(rootPath, 'labs.json'), info);
		}
		labProvider.refresh();
		labProvider.refresh();
	}));


	// login
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.login', async () => {
		console.log('command : login');
		await login(info, rootUrl);
		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));

	// logout
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.logout', () => {
		console.log('command : logout');
		logout(info);
	}));



	// admin이 문제 업로드
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.uploadProblem', async (item) => {
		console.log('command : uploadProblem');
		const problemName = await getProblemName();
		if(rootPath && problemName){
			await uploadProblem(urlJoin(rootUrl, problemsUrl, item.labName, problemName), path.join(rootPath, item.labName, problemName), info, problemName);
		}
		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));

	// admin이 문제 삭제
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.deleteProblem', async (item) => {
		console.log('command : deleteProblem');
		if(rootPath){
			await deleteProblem(urlJoin(rootUrl, problemsUrl, item.labName, item.label), item.label, info);
		}
		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));

	// admin, student 문제, 코드들 가져오기
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.fetchProblem', async (item) => {
		console.log('command : fetchProblem');
		if(rootPath){
			await fetchProblem(urlJoin(rootUrl, item.labName, item.label), item.label, path.join(rootPath, item.labName, item.label), info);
		}
		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));

	// 학생 코드 다 가져오기
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.saveStudentCode', async (item) => {
		console.log('command : saveStudentCode');
		if(rootPath){
			await saveAllStudentCode(urlJoin(rootUrl, codesUrl, item.labName, item.label), item.label, path.join(rootPath, item.labName, item.label + '_code'), info);
		}
		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));

	// admin이 Lab 만들기
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.makeLab', async () => {
		console.log('command : makeLab');
		if(rootPath){
			await makeLab(urlJoin(rootUrl, labUrl), rootPath, info);
		}
		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));

	// admin이 lab 삭제
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.deleteLab', async (item) => {
		console.log('command : deleteLab');
		await deleteLab(urlJoin(rootUrl, labUrl, 'delete'), info, item.label);
		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));

	// admin이 멤버 초대
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.inviteMember', async (item) => {
		console.log('command : inviteMember');
		
		await inviteMember(urlJoin(rootUrl, inviteUrl), item.labName, info);
		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));

	// admin이 멤버 삭제
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.deleteMember', async (item) => {
		console.log('command : deleteMember');

		await deleteMember(urlJoin(rootUrl, deleteMemberUrl), item.labName, item.label, info);
		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));

	// admin이 TA초대
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.inviteTA', async (item) => {
		console.log('command : inviteTA');

		await inviteTA(urlJoin(rootUrl, inviteTAUrl), item.labName, info);
		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));

	// admin 모니터링
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.monitoringLog', (item) => {
		console.log('command : monitoringLog');
		monitoringOpenPanel(urlJoin(rootUrl, item.labName, 'practice'), info);
		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));
	// admin 모니터링 초기화
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.initializeLog', () => {
		console.log('command : initializeLog');
		initializeLog(urlJoin(rootUrl, logUrl), info);
		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));

	

	// admin, student가 Code 제출 && 채점
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.submitCode', async (item) => {
		console.log('command : submitCode');
		if(rootPath){
			await submitCode(urlJoin(rootUrl, codesUrl, item.labName, item.label), item.label, path.join(rootPath, item.labName, item.label), info);
		}
		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));
	
	// admin, student 전체 채팅
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.labChat', (item) => {
		console.log('command : labChat');
		chatOpenPanel(urlJoin(rootUrl, item.labName, 'chat'), info);

		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));

	// student 모니터링 log 시작
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.sendLog', () => {
		console.log('command : sendLog');

		sendLog(urlJoin(rootUrl, logUrl), info);

		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));

	// student 모니터링 log 중지
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.stopLog', () => {
		console.log('command : stopLog');

		stopLog(urlJoin(rootUrl, logUrl), info);

		vscode.commands.executeCommand('codelabhub.refreshLab');
	}));

	// 비디오 녹화 시작
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.videoRecord', () => {
		const editJsonFile = require("edit-json-file");
		const home = process.env.HOME || process.env.USERPROFILE;
		const fileName = editJsonFile(`${home}/Library/Application\ Support/Code/User/settings.json`);
		console.log('command : videoRecord');

		getVideoPath()
		.then(async (res: any)=> {

			fileName.set("chronicler.dest-folder", rootPath + '/' + res);

			fileName.save();

			await vscode.commands.executeCommand('chronicler.recordWithAudio');

		});

	}));

	//video 업로드
	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.videoUploadStudent', () => {
		
		getVideoPath()
		.then(async (res: any)=> {

			uploadVideo(urlJoin(rootUrl, videoUrl, res), rootPath + '/' + res, info);

		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.videoUploadTA', () => {
		
		getVideoPath()
		.then(async (res: any)=> {
			getUsername()
			.then(async (res2: any) => {
				uploadVideoTA(urlJoin(rootUrl, videoUrl, res, res2), rootPath + '/' + res, info);
			});
		});
	}));


	context.subscriptions.push(vscode.commands.registerCommand('codelabhub.downVideo', () => {
		
		getVideoPath()
		.then(async (res: any)=> {
			getUsername()
			.then(async (res2: any) => {
				downloadVideo(urlJoin(rootUrl, videoUrl, res, res2), rootPath + '/' + res + '/' + res2, info, res2);
			});
		});

	}));
	

}

export function deactivate() {}
