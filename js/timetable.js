'use strict';

// Set async ajax
$.ajaxSetup({ async: false });

// Globals
const FADE_TIME = 500;
const TIME_SPLITTER = " - ";
const APPEND_ZEROES = true;

// Timetable lists
const allTimetables = {
    timetables: {
        dy: {
            name: "D-Y Timetable",
            address: "timetables/dy.json"
        },
        dx: {
            name: "D-X Timetable",
            address: "timetables/dx.json"
        }
    },
    courses: "timetables/courses.json"
};

// Some timetable truths
const timetableInfo = {
    hourIntervals: 1,
    time: {
        start: 9,
        end: 18
    },
    weekdayNames: [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" ],
    typeCorrelation: {
        "lecture": "Lecture",
        "lab": "Laboratory",
        "tutorial": "Tutorial"
    }
};

// Function to create the time list
function timeList(interval, start, end) {
    // Count steps
    let steps = Math.floor((end - start) / interval);
    // Iterate and add to list
    let totals = [];
    for (let i = 0; i < steps; ++i) {
        let bottomItem = (i + start).toString();
        let topItem = (i + start + 1).toString();
        // Check if zeroes should be appended
        if (APPEND_ZEROES) {
            let fix = item => item.padStart(2, '0') + "00";
            bottomItem = fix(bottomItem);
            topItem = fix(topItem);
        }
        // Append to list
        totals.push(`${bottomItem}${TIME_SPLITTER}${topItem}`);
    }
    // Return full array
    return totals;
}

// Function to create the table
function createTable(rows, columns, dataFull, coursesInfo) {

    // Extract info from data
    let data = dataFull.data;

    // Validate all the data
    let lengthList = data.map(each =>
        each.map(single =>
            single[single.length - 1]
        ).reduce((a, b) => a + b)
    );
    const allEqual = array => array.every(each => each === array[0]);
    if ((data.length !== rows.length) || (!allEqual(lengthList))) {
        console.error("Input data is not of right length");
        return
    }

    // Create main tag
    let main = $("<div>", { class: "custom-table" });

    // Create headers
    let headers = $("<div>", { class: "table-header" });
    // Append empty cell for row descriptor
    let headerChild = $("<div>", { class: "cell table-header-child" })
    headers.append(headerChild);
    // Create each item
    for (let each of columns) {
        let newCell = $("<div>", { class: "cell table-header-child" });
        let infoCell = $("<div>", { class: "cell-inside" });
        infoCell.append(each);
        newCell.append(infoCell)
        headers.append(newCell);
    }
    // Add header to table
    main.append(headers)

    // Iterate rows
    for (let eachRow in timetableInfo.weekdayNames) {

        // Create whole row
        let wholeRow = $("<div>", { class: "table-row" });

        // Create first item
        let headerRow = $("<div>", { class: "cell table-header-row" });
        let infoCell = $("<div>", { class: "cell-inside" });
        let floatInside = $("<div>", { class: "cell-float-inside" });
        floatInside.append(timetableInfo.weekdayNames[eachRow]);
        infoCell.append(floatInside);
        headerRow.append(infoCell);

        // Add header cell to row
        wholeRow.append(headerRow);

        // Iterate each cell
        for (let eachCell in data[eachRow]) {

            // Get local data
            let localData = data[eachRow][eachCell][0];

            // Create cell
            let rowChild = $("<div>", { class: "cell table-row-child" });
            // Add size to the cell
            rowChild.css("flex-grow", data[eachRow][eachCell][1]);
            if (localData != null) {

                // Fix the class string
                let matchesClass = /([a-zA-Z.]*) *([\d.]*)/g.exec(localData["class"]);
                let newClass = `${matchesClass[1].toUpperCase()} ${matchesClass[2]}`

                // Add the info contained in the cell
                let cell = $("<div>", { class: "cell-inside" });
                cell.append(...[
                    $("<div>", { class: "cell-inside-item cell-type" }).append(timetableInfo.typeCorrelation[localData["type"]]),
                    $("<div>", { class: "cell-middle-filler" }),
                    $("<div>", { class: "cell-inside-item cell-course" }).append(
                        $("<a>").attr("href", coursesInfo[localData["course"]].link).append(
                            coursesInfo[localData["course"]].name
                        )
                    ),
                    $("<div>", { class: "cell-bottom-filler" }),
                    $("<div>", { class: "cell-inside-item cell-class inside-corner" }).append(newClass)
                ])
                rowChild.append(cell);

            } else {
                let cell = $("<div>", { class: "cell-inside empty" });
                rowChild.append(cell);
            }

            // Add cell to row
            wholeRow.append(rowChild);

        }

        // Add the whole row to the table
        main.append(wholeRow);

    }

    // Return the whole thing
    return main;

}

/*
 * Main
 *
 */

// Get courses info
let coursesInfo = null;
$.getJSON(allTimetables.courses, function(data) {
    coursesInfo = data;
});

// Get all timetables data
let allTimetablesData = [];
for (let eachTable in allTimetables.timetables)
    $.getJSON(allTimetables.timetables[eachTable].address, function(data) {
        allTimetablesData.push({
            name: allTimetables.timetables[eachTable].name,
            data: data.table
        });
    });

// Create the needed tables
let createdTables = [];
for (let eachTable in allTimetablesData)
    createdTables.push({
        name: allTimetablesData[eachTable].name,
        data: createTable(
            timetableInfo.weekdayNames,
            timeList(timetableInfo.hourIntervals, timetableInfo.time.start, timetableInfo.time.end),
            allTimetablesData[eachTable],
            coursesInfo
        )
    })

// Add the show button for each table
let allPacks = [];
for (let eachTable in createdTables) {
    // Create the button
    let wholePack = $("<div>", { class: "table-package" });
    let button = $("<div>", { class: "button timetable" });

    // Add name to button
    button.append(createdTables[eachTable].name);

    // Hide the table
    createdTables[eachTable].data.hide();

    // Add the listener to the button
    button.click(() => { createdTables[eachTable].data.slideToggle(FADE_TIME) })

    // Add button and table to pack
    wholePack.append(button, createdTables[eachTable].data);
    allPacks.push(wholePack);
}

// On document load
$(document).ready(function() {

    // Add tables
    let tableInsert = $("div#table-insert");
    tableInsert.empty();
    for (let eachFullTable in allPacks)
        tableInsert.append(allPacks[eachFullTable]);

});
