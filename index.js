const $ = require('jquery');
const fs = require('fs');
const nodePath = require('path');

let currPath;
let directory;
let editor;
$(document).ready(async function () {

    editor = await promisifyRequire();
    console.log(editor)


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
        updateEditor(data.selected[0])
    })
})

function updateEditor(path) {
    if (fs.lstatSync(path).isFile()) {
        let fileData = fs.readFileSync(path).toString();
        editor.setValue(fileData);
        let lang = getName(path).split('.')[1];

        if (lang === 'js') {
            lang = 'javascript';
        }
        console.log(lang);
        monaco.editor.setModelLanguage(editor.getModel(), lang);        }
}

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
function promisifyRequire() {
    return new Promise(function (resolve, reject) {
        require.config({ paths: { 'vs': './node_modules/monaco-editor/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            let editor = monaco.editor.create(document.getElementById('text-editor'), {
                value: "function hello() {\n\talert('Hello world!');\n}",
                language: 'javascript'
            });
            resolve(editor);
        });
    })
}