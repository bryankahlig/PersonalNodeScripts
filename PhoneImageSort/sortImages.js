const fs = require('fs');
const path = require('path');
const exif = require('exif').ExifImage;
const sprintf = require('sprintf-js');

var testRun = false;

function getFolders(dirPath) {
    var fullPath = path.resolve(dirPath)
    return fs.readdirSync(fullPath).map(function (fn) {
        return fullPath+'\\'+fn;
    }).filter(
        function (file) {
            return fs.statSync(file).isDirectory();
        }
    );
}

function buildDestinationFolderByFilename(path, fileToMove, baseDestinationFolder) {
    var indexOfYearInFilename = getIndexOfYearInFilename(fileToMove);
    if (indexOfYearInFilename == -1) {
        return "ERROR";
    }
    console.log("Index Of Year:" + indexOfYearInFilename);
    var fileYear = fileToMove.substring(indexOfYearInFilename, indexOfYearInFilename + 4);
    var fileMonth = fileToMove.substring(indexOfYearInFilename + 4, indexOfYearInFilename + 6);
    var filenameWithoutPath = fileToMove;

    if (!fileYear.match(/^\d+$/) || !fileMonth.match(/^\d+$/)) {
        return "ERROR";
    }
    var resultingPath = baseDestinationFolder + fileYear + "\\" + fileMonth + "\\";
    fs.mkdir(resultingPath, {recursive: true}, (err) => {
        if (err) {
            console.log("Unable to make directory " + resultingPath + " - Error:" + err);
        }
    });
    return resultingPath + filenameWithoutPath;
}

function buildDestinationFolderByExifData(path, fileToMove, baseDestinationFolder) {
    var fileDate = Date.now();
    if (fileToMove.endsWith('jpg') || fileToMove.endsWith('jpeg')) {
        fileDate = getExifDateForJpg(path + fileToMove);
    } else {
        // we can't read data from mp4 files
        return "ERROR";
    }
    if (fileDate == "ERROR") {
        return "ERROR";
    }
    console.log("FileDate: " + fileDate);
    var fileYear = fileDate.getFullYear().toString();
    var fileMonth = sprintf('%0d2', fileDate.getMonth());
    var resultingPath = baseDestinationFolder + fileYear + "\\" + fileMonth + "\\";
    fs.mkdir(resultingPath);
    return resultingPath + fileToMove;
}

function moveMedia(filenames, sourceFolder, baseDestinationFolder) {
    filenames.forEach(element => {
        if (!shouldSkipFile(element)) {
            var fullOriginalFilename = sourceFolder + element
            console.log("Working on file: " + fullOriginalFilename);
            var destinationFile = buildDestinationFolderByExifData(sourceFolder, element, baseDestinationFolder);
            if (destinationFile == "ERROR") {
                console.log("Exif data failed. Using filename algorithm for: " + element);
                var indexOfYearInFilename = getIndexOfYearInFilename(element);
                destinationFile = buildDestinationFolderByFilename(sourceFolder, element, baseDestinationFolder);
            }
            console.log("Destination Folder:" + destinationFile);
            if (destinationFile == "ERROR") {
                console.log("Skipping " + fullOriginalFilename);
            } else {
                console.log("Destination: " + destinationFile);
                if (testRun) {
                    console.log("TEST RUN DOING NOTHING");
                } else {
                    if (fs.existsSync(destinationFile)) {
                        fs.unlinkSync(fullOriginalFilename);
                    } else {
                        fs.renameSync(fullOriginalFilename, destinationFile);
                    }
                }
            }
        }
    });
}

function shouldSkipFile(filename) {
    var basename = path.basename(filename);
    return basename.startsWith(".") ||
        basename.toUpperCase() === "THUMBS.DB" ||
        getIndexOfYearInFilename(basename) === -1;
}

function getIndexOfYearInFilename(filename) {
    if (filename.match(/20(?:19|20|21)(?:0[1-9]|1[0-2])(?:0[1-9]|1[0-9]|2[0-9]|3[01])_(\d*)(_[\d])?.(?:jpg|jpeg|mp4|gif)/)) {
        return 0;
    }
    switch (filename.substring(0, 3)) {
        case "IMG":
            return 4;
        case "PHO":
            return 6;
        case "Scr": // screenshot
            return 11;
        case "VI":
            return filename.index("_") + 1;
        default:
            console.log("UNRECOGNIZED FILE FORMAT: " + filename);
            return -1;
    }
}

function getExifDateForJpg(filename) {
    var ExifImage = exif.ExifImage;
    try {
        var exifData = new ExifImage({ image : filename },
            function (error, exifData) {
                if (error) {
                    console.log("Unable to read EXIF Data for " + filename + " Error:" + error.message);
                    return "ERROR";
                }
            });
//        console.log("EXIFIMAGE RETURNED:" + JSON.stringify(exifData));
        if (exifData == "ERROR") return jpegDate;
        return exifData.exif.DateTimeOriginal;
    } catch (error) {
        console.log("Error reading EXIF data. ERROR:" + error);
        return "ERROR";
    }
}

function getFiles(folder) {
    if (fs.existsSync(folder)) {
        return fs.readdirSync(folder).filter(entity =>
            !fs.lstatSync(folder + "\\" + entity).isDirectory());
    } else {
        return [];
    }
}

function processFolder(sourceFolder, destinationFolder) {
    console.log("Processing Folder " + sourceFolder + " to " + destinationFolder);
    moveMedia(getFiles(sourceFolder), sourceFolder, destinationFolder);
    console.log("getDirectories " + sourceFolder);
    var folders = getFolders(sourceFolder);
    folders.forEach(folder => {
        console.log("Working on folder: " + folder);
        processFolder(folder + "\\", destinationFolder);
    })
}

var rootDestinationFolder = "D:\\Pictures\\";
var bryanRootFolder = "D:\\Pictures\\From Bryan Phone\\Saved pictures\\";
var dirs = getFolders(bryanRootFolder);
console.log("Folders:" + dirs);
processFolder(bryanRootFolder, rootDestinationFolder);