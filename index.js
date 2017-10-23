#!/usr/bin/env node

// a small command line utility to push multiple .nupgk files to nuget repositories, you also need nuget.exe

"use strict"

const program = require("commander");
const fs = require("fs");
const exec = require("child_process").execFileSync;
const ERR = "ERROR: ";
const LOG = ""

program
    .version('1.0.0')
    .option('-s, --source [source]','the nuget source that is to be used by nuget')
    .option('-a, --apikey [apikey]','Apikey to the nuget source')
    .option("-n , --nuget [nugetpath]","path to nuget.exe to be used in pushing, defaults to './'")
    .parse(process.argv);

if(!program.source){
    console.log(ERR + "No source specfied")
    process.exit(1);
}
if(!program.apikey){
    console.log(ERR + "No API-key specfied")
    process.exit(1);
}

//read all the .nupkg files from the folder, check for duplicates (not applicable to one folder stuff, but if multiple folders specified at some point)

let nupkgNames = [];
console.log(process.cwd());
let files = fs.readdirSync(process.cwd() +"/nugetpackages");

files.forEach(file => {
    if (file.endsWith(".nupkg")){
        console.log(LOG + "Found package: " + file);
        nupkgNames.push(file);
    }
});
console.log(files);
//check the nupkgs for duplicates:

let duplicates = [];
let sortedNames = nupkgNames.slice().sort();

for (let i = 0 ; i < sortedNames.length - 1 ; i++ ){
    if (sortedNames[i] == sortedNames[i+1]){
        duplicates.push(sortedNames[1]);
    }
}

if(duplicates.length != 0){
    console.log(LOG + "Found duplicates for following packages, duplicates cannot be pushed, solve duplicates and try again:");
    duplicates.forEach(name =>{
        console.log(LOG +"  "+name);
    });
    process.exit(1);
}

let numberOfProblems = 0;
let nugetPath = program.nugetpath ? program.nugetpath : "./nuget.exe";
console.log("nuget path: " + nugetPath);
console.log("starting mass push");

//we are using the async version of exec to prevent all the nuget commands from being executed at the same time, this kills the server.
nupkgNames.forEach( nupackage =>{
    //execute nuget for each file, if nuget fails for one file, log the error
    //console.log("trying to push file: " + nugetPath + 'push -Source "' + program.source + '" -ApiKey ' + program.apikey + " " + nupackage);  
    let execString = ' push -Source "' + program.source + '" -ApiKey ' + program.apikey + " ./nugetpackages/" + nupackage;
    console.log("Pushing package: " + nupackage );
    exec(nugetPath,  ["push", "-Source",program.source, "-ApiKey", program.apikey,"./nugetpackages/"+nupackage ] ,{}, (error, stdout, stderr) => {
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        if (error !== null) {
            console.log(`exec error: ${error}`);
            numberOfProblems++;
        }
    } );

});
console.log(LOG + "We logged "+ numberOfProblems +" problems during the mass push" );