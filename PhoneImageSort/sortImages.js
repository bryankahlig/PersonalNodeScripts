const fs = require('fs');
const path = require('path');
const exif = require('exif');

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

function buildDestinationFolderByExifData(path, fileToMove, baseDestinationFolder) {
    
}

function moveMedia(filenames, sourceFolder, baseDestinationFolder) {
    filenames.forEach(element => {
        if (!shouldSkipFile(element)) {
            console.log("Working on file: " + element);
            var destinationFolder = buildDestinationFolderByExifData(sourceFolder, element, baseDestinationFolder);
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
    var jpegDate = new ExifImage({ image : filename },
        function (error, exifData) {
            if (error) {
                console.log("Unable to read EXIF Data for " + filename + " Error:" + error.message);
                return "";
            } else {
                console.log(exifData);
                return exifData.image.ModifyDate;
            }
        });
    return jpegDate;
}

function processFolder(sourceFolder, destinationFolder) {
    console.log("Processing Folder " + sourceFolder + " to " + destinationFolder);

}

var rootDestinationFolder = "D:\\Pictures\\";
var bryanRootFolder = "D:\\Pictures\\From Bryan Phone\\";
var dirs = getFolders(bryanRootFolder);
console.log("Folders:" + dirs);
