const fs = require('fs');
const path = require('path');
const exif = require('exif').ExifImage;
const sprintf = require('sprintf-js');

var testRun = true;

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
    var fileYear = fileToMove.substring(indexOfYearInFilename, 4);
    var fileMonth = fileToMove.substring(indexOfYearInFilename+4, 2);
    var filenameWithoutPath = fileToMove;

    if (!fileYear.match("/^\d+$/") || !fileMonth.match(/^\d+$/)) {
        return "ERROR";
    }
    var resultingPath = baseDestinationFolder + fileYear + "/" + fileMonth + "/";
    fs.mkdir(resultingPath);
    return resultingPath + filenameWithoutPath;
}

function buildDestinationFolderByExifData(path, fileToMove, baseDestinationFolder) {
    var fileDate = Date.now();
    console.log("FileDate init:" + fileDate.toString());
    if (fileToMove.endsWith('jpg') || fileToMove.endsWith('jpeg')) {
        fileDate = getExifDateForJpg(path + fileToMove);
        console.log("FileDate exif: " + JSON.stringify(fileDate));
    } else {
        if (fileToMove.endsWith('mp4')) {
            // we can't read data from mp4 files
            return "ERROR"
        }
    }
    if (fileDate == "") {
        return "ERROR"
    }
    console.log("FileDate: " + fileDate);
    var fileYear = fileDate.getFullYear().toString();
    var fileMonth = sprintf('%0d2', fileDate.getMonth());
    var resultingPath = baseDestinationFolder + fileYear + "/" + fileMonth + "/";
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
                console.log("Skipping " + sourceFolder);
            } else {
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
    console.log("Getting EXIF data for: " + filename);
    var ExifImage = exif.ExifImage;
    var jpegDate = "";
    try {
        jpegDate = new ExifImage({ image : filename },
            function (error, exifData) {
                console.log("EXIF DATA: " + JSON.stringify(exifData));
                if (error) {
                    console.log("Unable to read EXIF Data for " + filename + " Error:" + error.message);
                    return "";
                } else {
                    return exifData.exif.CreateDate;
                }
            }).exif.DateTimeOriginal;
    } catch (error) {
        console.log("Error reading EXIF data. ERROR:" + error);
    }
    return jpegDate;
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