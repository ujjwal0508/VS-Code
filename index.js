const $ = require('jquery');
const fs = require('fs');
const nodePath = require('path');

let currPath;
let directory;
$(document).ready(function () {

    currPath = process.argv[6].split('=')[1];
    //--app-path=C:\Users\INDIA\Desktop\1. Dev\2. Lectures\Vs-Code-Clone
    let data = [];
    data.push({
        id: currPath,
        parent: '#',
        text: getName(currPath)
    })

    data = data.concat(getCurrentDirectories(currPath));

    $('#content').jstree({
        "core": {
            data: data,
            "check_callback": true
        }

    }).on("open_node.jstree", function (e, data) {

        data.node.children.forEach(function (child) {
            let directories = getCurrentDirectories(child);

            directories.forEach(function (directory) {
                let temp = $('#content').jstree().create_node(child, directory, "last");
            })
        })
    }).on('changed.jstree', function (e, data) {
        console.log(data.selected)
    })
})

function getCurrentDirectories(path) {

    if (fs.lstatSync(path).isFile()) {
        return [];
    }

    let files = fs.readdirSync(path);

    let rv = [];
    files.forEach(function (file) {
        rv.push({
            id: nodePath.join(path, file),
            parent: path,
            text: file
        });
    })

    return rv;
}

function getName(path) {
    return path.replace(/^.*[\\\/]/, '');
}