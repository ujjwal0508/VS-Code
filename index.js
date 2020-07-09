var $ = jQuery = require('jquery')
require('jquery-ui-dist/jquery-ui');
require('jstree');

const fs = require('fs');
const nodePath = require('path');

let currPath;
let db;
let editor;
let defaultValue = "function hello() {\n\talert('Hello world!');\n}";
let defaultName = 'utilited';
let lcTab = [];
let lcFolder;

// console.log(jQuery);
$(document).ready(async function () {

    editor = await getMonacoPromise();
    console.log(editor)

    $('#explorer-window').resizable();
    $('#terminal').resizable();

    let tabs = $("#tabs").tabs({
        collapsible: true,
        active: false,
        heightStyle: "fill"
    });

    // Close icon: removing the tab on click
    tabs.on("click", ".ui-icon-close", function () {

        // console.log(db.length);
        if (lcTab.length <= 1) {
            return;
        }

        var panelId = parseInt($(this).closest("li").remove().attr("aria-controls"));
        console.log(panelId);
        $("#" + panelId).remove();
        tabs.tabs("refresh");

        let idx = lcTab.indexOf(panelId);
        console.log('idx is ' + idx);
        if (lcTab[lcTab.length - 1] == panelId) {
            let newTabId = lcTab[lcTab.length - 2];
            editor.setValue(db[newTabId].data);
        }
        console.log('removing idx ' + idx);
        lcTab.splice(idx, 1);
        delete db[panelId];

        window.event.stopImmediatePropagation();

    });

    tabs.on("click", ".ui-tabs-tab", function () {

        $('.ui-tabs-tab').attr("aria-selected", false);

        if ($(window.event.srcElement).hasClass('ui-icon-close')) {
            return;
        }
        let tabId = parseInt($(this).find("a").attr('href').substr(1));
        console.log(tabId);

        editor.setValue(db[tabId].data)

        let tabIdx = lcTab.indexOf(tabId);
        if (tabIdx != -1) {
            lcTab.splice(tabIdx, 1);
        }
        lcTab.push(tabId);

    })

    editor.onDidBlurEditorText(function () {

        let ltab = lcTab[lcTab.length - 1];
        db[ltab].data = editor.getValue();

    });

    db = {};
    openFile();

    currPath = process.argv[6].split('=')[1];
    lcFolder = currPath;

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
        lcFolder = data.node.id;
        // console.log(lcFolder);
    }).on('changed.jstree', function (e, data) {
        // console.log(data.selected);
        if (fs.lstatSync(data.selected[0]).isFile()) {
            openFile(data.selected[0]);
            console.log(lcTab);
        }

    })

    $('#new').on('click', function () {
        openFile();
    })


    function openFile(path) {

        let fileName = (path === undefined) ? defaultName : getName(path);
        let tabId = Object.keys(db).length + 1;
        lcTab.push(tabId);

        let tabTemplate = "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>";
        let li = $(tabTemplate.replace(/#\{href\}/g, "#" + tabId).replace(/#\{label\}/g, fileName));

        tabs.find(".ui-tabs-nav").append(li);
        tabs.append("<div id='" + tabId + "'></div>");
        tabs.tabs("refresh");


        let fileData = (path === undefined) ? updateEditor() : updateEditor(path);

        db[tabId] = {
            path: path === undefined ? 'new' : path,
            data: fileData
        };
    }

    function updateEditor(path) {

        if (path === undefined) {
            editor.setValue(defaultValue);
            monaco.editor.setModelLanguage(editor.getModel(), 'javascript');
            return defaultValue;
        }

        let fileData = fs.readFileSync(path).toString();
        editor.setValue(fileData);
        let lang = getName(path).split('.')[1];

        if (lang === 'js') {
            lang = 'javascript';
        }
        console.log(lang);
        monaco.editor.setModelLanguage(editor.getModel(), lang);
        return fileData;
    }
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

function getMonacoPromise() {
    return new Promise(function (resolve, reject) {
        var mloader = require('./node_modules/monaco-editor/dev/vs/loader.js');
        mloader.require.config({ paths: { 'vs': './node_modules/monaco-editor/dev/vs' } });
        mloader.require(['vs/editor/editor.main'], function (a) {
            let editor = monaco.editor.create(document.getElementById('text-editor'), {
                value: "",
                language: 'javascript'
            });

            resolve(editor);
        });
    });
}