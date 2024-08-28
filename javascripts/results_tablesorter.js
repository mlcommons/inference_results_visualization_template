$(document).ready(function() {
    //tableSorterInit();
    //console.log('Document is ready');
    // if(!is_power) {
    //     $('.power-content').hide();
    // }
    // draw initial charts
    var category = $('#category option:selected').val();
    var division = $('#division option:selected').val();
    var with_power = $('#with_power option:selected').map(function() {
        return $(this).val() == "true";
    }).get();

    readAllData().then(function(allData) {
        //console.log(allData);
        //console.log(category+division+with_power[0]);
        reConstructTables(category, division, with_power[0], allData);
        constructChartFromSummary(allData, category, division, with_power[0]);
    }).catch(function(error) {
        console.error(error);
    });


    $('#resultSelectionForm').submit(function(event) {
        event.preventDefault(); // This will cancel the form submission

        // Your custom logic here
        //console.log('Form submission canceled.');
        category = $('#category option:selected').val();
        division = $('#division option:selected').val();
        with_power = $('#with_power option:selected').map(function() {
            return $(this).val() == "true";
        }).get();
        //console.log(category);
        //console.log(division);
        //console.log(with_power[0]);
        $(".resultstable").hide();
        $(".results_table_heading").text("");
        $(".pager").hide();

        readAllData().then(function(allData) {
            //  console.log(allData);
            reConstructTables(category, division, with_power[0], allData);
            constructChartFromSummary(allData, category, division, with_power[0]);
        }).catch(function(error) {
            console.error(error);
        });
    }
    );

    //fetchSummaryData();
});

function constructChartFromSummary(data, category, division, with_power) {
    const [summaryData, countData] = getSummaryData(data, category, division, with_power);

    let html = "";
    html += `
        <div id="submittervssubmissionchartContainer" style="height: 370px; width: 100%;"></div>
        <div id="modelvssubmissionchartContainer" style="height: 370px; width: 100%;"></div>
    `;

    let submitterVsSubmissionsCntTmp = {};
    let modelsVsSubmissionsCntTmp = {};

    if ( category==="edge" ) {
        models = models_edge;
        //console.log("edgecategory");
    }
    else {
        models = models_datacenter;
        //console.log("datacenter");
    }

    // Loop for getting submitters vs number of submissions count
    for (const [submitter, item] of Object.entries(countData)) {
        let cnt = 0;
        for (const m of models) {
            if (item[m] !== undefined && item[m] !== '') {
                cnt += item[m];
                if (modelsVsSubmissionsCntTmp[m] === undefined) {
                    modelsVsSubmissionsCntTmp[m] = item[m];
                } else {
                    modelsVsSubmissionsCntTmp[m] += item[m];
                }
            }
        }
        submitterVsSubmissionsCntTmp[submitter] = cnt;
    }

    submitterVsSubmissionsCnt = Object.entries(submitterVsSubmissionsCntTmp).map(([key, value]) => ({
        label: key,
        y: value
    }));

    modelsVsSubmissionsCnt = Object.entries(modelsVsSubmissionsCntTmp).map(([key, value]) => ({
        label: key,
        y: value
    }));

    drawChartResults();
}

function drawChartResults(){
    var submittervssubmissionchart = new CanvasJS.Chart("submittervssubmissionchartContainer", {
        animationEnabled: true,
        theme: "light2",
        title: {
            text: "Submissions per Submitter"
        },
        axisY: {
            title: "Number of Submissions",
        },
        axisX: {
            title: "Submitters"
        },
        data: [{
            type: "column",
            dataPoints: submitterVsSubmissionsCnt
        }]
    });

    var modelvssubmissionchart = new CanvasJS.Chart("modelvssubmissionchartContainer", {
        animationEnabled: true,
        theme: "light2",
        title: {
            text: "Submissions per Model"
        },
        axisY: {
            title: "Number of Submissions",
        },
        axisX: {
            title: "Models"
        },
        data: [{
            type: "column",
            dataPoints: modelsVsSubmissionsCnt
        }]
    });

    submittervssubmissionchart.render();
    modelvssubmissionchart.render();
}

function reConstructTables(category, division, with_power, data){
    availabilities = [ "Available", "Preview", "RDI" ]; 
    availabilities.forEach(function(availability) {
        // filtered data as per the user choice
        const filteredResults = filterDataResultsTable(category, division, with_power, availability, data);
        //console.log(filteredResults.length);
        var html_table = constructTable(category, division, with_power, availability, filteredResults);
        var tableHeading = `${category} Category: ${availability} submissions in ${division} division`;
        // replacing the old table with the newly constructed one
        var elemIdTable = `results_table_${availability.toLowerCase()}` 
        var elemIdTableHeading = `results_heading_${availability.toLowerCase()}`
        if (html_table) {
            document.getElementById(elemIdTable).innerHTML = html_table;
            document.getElementById(elemIdTableHeading).innerHTML = tableHeading;
        }
    });
    var countResultsTable = constructSummaryTable(data, category, division, with_power)
    var elemIdTableSummary = `results_summary`
    document.getElementById(elemIdTableSummary).innerHTML = countResultsTable;
    $('table').tablesorter();
    $("table").trigger("updateAll");
}

// to get the data summary for results count
function getSummaryData(data, category, division, with_power) {
    const myData = {};
    const myCountData = {};
    data.forEach(item => {        
        if (!item.Suite.includes(category)) {
            return;
        }
        if (item.Category !== division) {
            return;
        }

        if (!validScenarios[category].includes(item.Scenario)) {
            return;
        }
        // filtering by power or just performance
        let powerMatch;
        if (with_power) {
            powerMatch = item.hasOwnProperty('Power_Result'); // Check for the key
        } else {
            powerMatch = true;//!item.hasOwnProperty('Power_Result'); // Include power results by default
        }
        if (!powerMatch) {
            return;
        }

        const submitter = item.Submitter;
        if (!myData[submitter]) {
            myData[submitter] = {};
        }
        const myId = item.ID;
        if (!myData[submitter][myId]) {
            myData[submitter][myId] = {};
        }
        const model = item.Model;
        if (!myData[submitter][myId][model]) {
            myData[submitter][myId][model] = { count: 0 };
        }

        myData[submitter][myId][model].count += 1;
    });

    for (const submitter in myData) {
        myCountData[submitter] = {};
        const value = myData[submitter];
        for (const sut in value) {
            const results = value[sut];
            for (const model in results) {
                const modelData = results[model];
                if (!myCountData[submitter][model]) {
                    myCountData[submitter][model] = 0;
                }
                myCountData[submitter][model] += modelData.count;
            }
        }
    }
    //console.log(myData);
    return [myData, myCountData];
}

function constructSummaryTable(data, category, division, with_power) {
    const [summaryData, countData] = getSummaryData(data, category, division, with_power);
    let html = ``
    if (category == "datacenter") {
        html += `
        <thead>
        <tr>
        <th class="count-submitter">Submitter</th>`
        for(let model of models_datacenter) {
            html += `
                <th id="col-model">${model}</th>
                `
        }
        html += ` 
            <th id="all-models">Total</th>
            </tr>
            </thead>
    `;
    }
    else {
        html += `
        <thead>
        <tr>
        <th class="count-submitter">Submitter</th>`
        for(let model of models_edge) {
            html += `
                <th id="col-model">${model}</th>
                `
        }
        html += ` 
            <th id="all-models">Total</th>
            </tr>
            </thead>
    `;
    }
    const totalCounts = {};
    models = [];
    if (category == "datacenter") {
        models = models_datacenter;
    }
    else{
        models = models_edge;
    }
    for (const submitter in countData) {
        html += "<tr>";
        let cnt = 0;

        html += `<td class="count-submitter"> ${submitter} </td>`;
        for (const model of models) {
            if (countData[submitter][model] !== undefined) {
                html += `<td class="col-result"> ${countData[submitter][model]} </td>`;
                cnt += countData[submitter][model];
                totalCounts[model] = (totalCounts[model] || 0) + countData[submitter][model];
            } else {
                html += `<td class="col-result"> 0 </td>`;
            }
        }
        html += `<td class="col-result"> ${cnt} </td>`;
        html += "</tr>";
    }

    html += `
    <tr>
    <td class="count-submitter">Total</td>
    `;
    let total = 0;
    for (const model of models) {
        if (totalCounts[model] !== undefined) {
            html += `<td class="col-result"> ${totalCounts[model]} </td>`;
            total += totalCounts[model];
        } else {
            html += `<td class="col-result"> 0 </td>`;
        }
    }
    html += `<td class="col-result"> ${total} </td>`;
    html += "</tr>";
    return html
}

function get_scenario_td_data(data, scenario, with_power, accuracy=false) {
    let location_pre = `https://github.com/mlcommons/inference_results_${result_version}/tree/main/`;
    let result_link_text = ``;

    if(!data || !data.hasOwnProperty(scenario)) {
        td_data = "<td></td>";
        if(accuracy) {
            td_data += "<td></td>";
        }
        if (with_power) {
            td_data += "<td></td><td></td>";
        }
        return td_data;
    }

    let html = ``;
    let precision_info = data[scenario].weight_data_types;
    let extra_model_info = `Model precision: ${precision_info}`;
    //console.log(data);
    if(accuracy) {
        html += `<td class="col-result"><a target="_blank" title="${result_link_text}${extra_model_info}" href="${location_pre}${data[scenario].Location}"> ${data[scenario].Accuracy_Values} </a> </td>`;
    }
    html += `<td class="col-result"><a target="_blank" title="${result_link_text}${extra_model_info}" href="${location_pre}${data[scenario].Location}"> ${data[scenario].Performance_Result.toFixed(2)} </a> </td>`;

    if (with_power) {
        //console.log(with_power);
        //console.log(data);
        html += `<td class="col-result" title="${data[scenario].Power_Units}"> ${data[scenario].Power_Result.toFixed(2)} </td>`;
        power_units = data[scenario].Power_Units;

        let samples_per_joule = 0;
        let samples_per_query = 1;
        if(scenario == "MultiStream") {
            samples_per_query = 8;
        }
        if(power_units == "Watts") {
            samples_per_joule = (data[scenario].Performance_Result / data[scenario].Power_Result);
        }
        else if(power_units.toLowerCase().includes("millijoules")) {
            samples_per_joule = (1000 * samples_per_query / (data[scenario].Performance_Result * data[scenario].Power_Result));
        }
        else if(power_units.toLowerCase().includes("joules")) {
            samples_per_joule = (samples_per_query / (data[scenario].Performance_Result * data[scenario].Power_Result));
        }
        if(samples_per_joule < 1) {
            digits = 2;
            do {
                temp = samples_per_joule.toFixed(digits);
                digits++;
            }while(temp == 0);
            samples_per_joule = temp;
        }
        else {
            samples_per_joule = samples_per_joule.toFixed(2);
        }
        //console.log(samples_per_joule);
        html += `
                        <td class="col-result" title="Samples per Joule"> ${samples_per_joule}</td>
                    `;
    }
    return html;
}

function constructOpenTableModel(model, category, with_power, availability, mydata, needsFooter=false) {
    //mydata = filterModel(data, model);

    html = `
    <h4>${model}</h4>
    <table class="resultstable tablesorter tableopen table${category}" id="results_${model}_${availability}">`;
    html += `<thead> <tr>`
    if (category == "datacenter") {
        if (with_power) {
            colspan = 8;
            colspan_single = 4;
            model_header = `
        <th class="col-scenario" colspan="4">Server</th>
        <th class="col-scenario" colspan="4">Offline</th>
        `;
            //console.log(scenarioUnits);
            model_header_2 = `
        <th class="col-scenario">Accuracy</th>
        <th class="col-scenario">${scenarioUnits['Server']['Performance_Units']}</th>
        <th class="col-scenario">${scenarioUnits['Server']['Power_Units']}</th>
        <th class="col-scenario">Samples/J</th>
        <th class="col-scenario">Accuracy</th>
        <th class="col-scenario">${scenarioUnits['Offline']['Performance_Units']}</th>
        <th class="col-scenario">${scenarioUnits['Offline']['Power_Units']}</th>
        <th class="col-scenario">Samples/J</th>
        `;
            model_header_single = `
        <th class="col-scenario" colspan="${colspan_single}">Offline</th>
        `;
            model_header_single_2 = `
        <th class="col-scenario">Accuracy</th>
        <th class="col-scenario">${scenarioUnits['Offline']['Performance_Units']}</th>
        <th class="col-scenario">${scenarioUnits['Offline']['Power_Units']}</th>
        <th class="col-scenario">Samples/J</th>
        `;
        }
        else {
            colspan = 4;
            colspan_single = 2;
            model_header = `
        <th class="col-scenario" colspan="2">Server</th>
        <th class="col-scenario" colspan="2">Offline</th>
        `;
            model_header_2 = `
        <th class="col-scenario">${accuracyUnits[model]}</th>
        <th class="col-scenario">${scenarioUnits['Server']['Performance_Units']}</th>
        <th class="col-scenario">${accuracyUnits[model]}</th>
        <th class="col-scenario">${scenarioUnits['Offline']['Performance_Units']}</th>
        `;
            model_header_single = `
        <th class="col-scenario">Offline</th>
        `;
            model_header_single_2 = `
        <th class="col-scenario">${accuracyUnits[model]}</th>
        <th class="col-scenario">${scenarioUnits['Offline']['Performance_Units']}</th>
        `;
        }

    }
    else {
        if (with_power) {
            colspan = 6;
            colspan_ms = 9;
            model_header = `
        <th class="col-scenario" colspan="4">Offline</th>
        <th class="col-scenario" colspan="4">SingleStream</th>
        `;
            //console.log(scenarioUnits);
            model_header_2 = `
        <th class="col-scenario">${accuracyUnits[model]}</th>
        <th class="col-scenario">${scenarioUnits['Offline']['Performance_Units']}</th>
        <th class="col-scenario">${scenarioUnits['Offline']['Power_Units']}</th>
        <th class="col-scenario">Samples/J</th>
        <th class="col-scenario">${accuracyUnits[model]}</th>
        <th class="col-scenario">${scenarioUnits['SingleStream']['Performance_Units']}</th>
        <th class="col-scenario">${scenarioUnits['SingleStream']['Power_Units']}</th>
        <th class="col-scenario">Samples/J</th>
        `;
            model_header_ms = model_header + `
        <th class="col-scenario" colspan="4">MultiStream</th>
        `;
            model_header_ms_2 = model_header_2 + `
        <th class="col-scenario">${accuracyUnits[model]}</th>
        <th class="col-scenario">${scenarioUnits['MultiStream']['Performance_Units']}</th>
        <th class="col-scenario">${scenarioUnits['MultiStream']['Power_Units']}</th>
        <th class="col-scenario">Samples/J</th>
        `;
        }
        else {
            colspan = 2;
            colspan_ms = 6;
            model_header = `
        <th class="col-scenario" colspan="${colspan}">Offline</th>
        <th class="col-scenario" colspan="${colspan}">SingleStream</th>
        `;
            model_header_2 = `
        <th class="col-scenario">${accuracyUnits[model]}</th>
        <th class="col-scenario">${scenarioUnits['Offline']['Performance_Units']}</th>
        <th class="col-scenario">${accuracyUnits[model]}</th>
        <th class="col-scenario">${scenarioUnits['SingleStream']['Performance_Units']}</th>
        `;
            if(model.includes("resnet") || model.includes("retinanet")) {
            model_header = model_header + `
        <th class="col-scenario" colspan="${colspan}">MultiStream</th>
        `;
            model_header_2 = model_header_2 + `
        <th class="col-scenario">${accuracyUnits[model]}</th>
        <th class="col-scenario">${scenarioUnits['MultiStream']['Performance_Units']}</th>
        `;
            }
        }
    }
    tableheader = `
        <th class="headcol col-id">ID</th>
        <th class="headcol col-system">System</th>
        <th class="headcol col-submitter">Submitter</th>
        <th class="headcol col-accelerator">Accelerator</th>
        <th class="headcol col-usedmodel">Model</th>
        ${model_header}
        </tr>
        <tr>
        <th class="headcol col-id"></th>
        <th class="headcol col-system"></th>
        <th class="headcol col-submitter"></th>
        <th class="headcol col-accelerator"></th>
        <th class="headcol col-usedmodel">Model</th>
        ${model_header_2}
    `;
    html += tableheader;
    html += `</tr></thead>`;
    if(needsFooter) {
        html += `<tfoot> <tr>${tableheader}</tr></tfoot>`;
    }
    //console.log("here")

    validData = false
    for (let rid in mydata) {
        if (!mydata[rid].hasOwnProperty(model)) {
            continue
        }
        validData = true
        let extra_sys_info = `
            Processor: ${mydata[rid].Processor}
            Software: ${mydata[rid].Software}
            Cores per processor: ${mydata[rid].host_processor_core_count}
            Processors per node: ${mydata[rid].host_processors_per_node}
            Nodes: ${mydata[rid].Nodes}
            Notes: ${mydata[rid].Notes}
        `;

        let a_num = mydata[rid]['a#'] || '';
        let acc = a_num === '' ? "" : `${mydata[rid].Accelerator} x ${parseInt(a_num)}`;
        let system_json_link = mydata[rid].Details.replace("/results/", "/systems/").replace("submissions_inference_4.0", "inference_results_v4.0") + ".json";
        html += `
        <tr>
            <td class="col-id headcol"> ${rid} </td>
            <td class="col-system headcol" title="${extra_sys_info}"> <a target="_blank" href="${system_json_link}"> ${mydata[rid].System} </a> </td>
            <td class="col-submitter headcol"> ${mydata[rid].Submitter} </td>
            <td class="col-accelerator headcol"> ${acc} </td>
        `;
        if(mydata[rid][model].hasOwnProperty("Offline")) {
            html += `<td class="col-usedmodel headcol"> ${mydata[rid][model]["Offline"].UsedModel} </td>`;
        }
        else if(mydata[rid][model].hasOwnProperty("Server")) {
            html += `<td class="col-usedmodel headcol"> ${mydata[rid][model]["Server"].UsedModel} </td>`;
        }
        else if(mydata[rid][model].hasOwnProperty("SingleStream")) {
            html += `<td class="col-usedmodel headcol"> ${mydata[rid][model]["SingleStream"].UsedModel} </td>`;
        }
        else if(mydata[rid][model].hasOwnProperty("MultiStream")) {
            html += `<td class="col-usedmodel headcol"> ${mydata[rid][model]["MultiStream"].UsedModel} </td>`;
        }



        if (category == "datacenter") {
            if (!model.includes("3d-unet")) { 
                scenario_data = get_scenario_td_data(mydata[rid][model], "Server", with_power, true);
                html += scenario_data;
            }
            scenario_data = get_scenario_td_data(mydata[rid][model], "Offline", with_power, true);
            html += scenario_data;
        }
        else {
            scenario_data = get_scenario_td_data(mydata[rid][model], "Offline", with_power, true);
            html += scenario_data;
            scenario_data = get_scenario_td_data(mydata[rid][model], "SingleStream", with_power, true);
            html += scenario_data;
            if (model.includes("retinanet") || model.includes("resnet")) {
                scenario_data = get_scenario_td_data(mydata[rid][model], "MultiStream", with_power, true);
                html += scenario_data;
            }
        }
        html += `</tr>`;
    }
    if(!validData) {
        html = ''
    }
    else {
    html += `</table>`;
    }

    //console.log(html);
    return html;
}
function constructOpenTable(category, with_power, availability, data) {
    models = []
    if (category == "datacenter") {
        models = models_datacenter;
    }
    else{
        models = models_edge;
    }
    html = ''
    models.forEach(function(model, index) {
        html += constructOpenTableModel(model, category, with_power, availability, data);
    });
    //console.log(with_power);
    // html += "</table>";

    //console.log(html)

    return html
}




function constructTable(category, division, with_power, availability, data) {
    let html = ``;
    var mydata = processData(data, category, division, availability)
    if (!Object.keys(mydata).length) {
        return null; // return if mydata is null
    }
    var needsFooter = Object.keys(mydata).length > 5;
    if(division == "open") {
        html =  constructOpenTable(category, with_power, availability, mydata);
        //console.log(html);
        return html;
    }
    html += `<table class="resultstable tablesorter tableclosed table${category}" id="results_${availability}">`
    // Table header
    html += `<thead> <tr>`
    let tableheader = ``;
    //console.log(with_power);
    if (category == "datacenter") {
        if (with_power) {
            colspan = 6;
            colspan_single = 3;
            model_header = `
        <th class="col-scenario" colspan="3">Server</th>
        <th class="col-scenario" colspan="3">Offline</th>
        `;
            //console.log(scenarioUnits);
            model_header_2 = `
        <th class="col-scenario">${scenarioUnits['Server']['Performance_Units']}</th>
        <th class="col-scenario">${scenarioUnits['Server']['Power_Units']}</th>
        <th class="col-scenario">Samples/J</th>
        <th class="col-scenario">${scenarioUnits['Offline']['Performance_Units']}</th>
        <th class="col-scenario">${scenarioUnits['Offline']['Power_Units']}</th>
        <th class="col-scenario">Samples/J</th>
        `;
            model_header_single = `
        <th class="col-scenario" colspan="3">Offline</th>
        `;
            model_header_single_2 = `
        <th class="col-scenario">${scenarioUnits['Offline']['Performance_Units']}</th>
        <th class="col-scenario">${scenarioUnits['Offline']['Power_Units']}</th>
        <th class="col-scenario">Samples/J</th>
        `;
        }
        else {
            colspan = 2;
            colspan_single = 1;
            model_header = `
        <th class="col-scenario">Server</th>
        <th class="col-scenario">Offline</th>
        `;
            model_header_2 = `
        <th class="col-scenario">${scenarioUnits['Server']['Performance_Units']}</th>
        <th class="col-scenario">${scenarioUnits['Offline']['Performance_Units']}</th>
        `;
            model_header_single = `
        <th class="col-scenario">Offline</th>
        `;
            model_header_single_2 = `
        <th class="col-scenario">${scenarioUnits['Offline']['Performance_Units']}</th>
        `;
        }

        tableheader = `
        <th id="col-id" class="headcol col-id">ID</th>
        <th id="col-system" class="headcol col-system">System</th>
        <th id="col-submitter" class="headcol col-submitter">Submitter</th>
        <th id="col-accelerator" class="headcol col-accelerator">Accelerator</th>`
        for(let model of models_datacenter) {
            if(model.includes("3d-unet")) {
                span=colspan_single;
            }
            else{
                span=colspan;
            }
            tableheader += `
                <th id="col-model" colspan=${span}>${model}</th>`
        }
    tableheader += `
    </tr>
    <tr>
        <th class="headcol col-id"></th>
        <th class="headcol col-system"></th>
        <th class="headcol col-submitter"></th>
        <th class="headcol col-accelerator"></th>`;
        for(let model of models_datacenter) {
            if(model.includes("3d-unet")) {
                tableheader += `
                ${model_header_single}
                    `;
            }
            else{
                tableheader += `
                ${model_header}
                    `;
            }
        }
        tableheader += `
        </tr>
        <tr>
        <th class="headcol col-id"></th>
        <th class="headcol col-system"></th>
        <th class="headcol col-submitter"></th>
        <th class="headcol col-accelerator"></th>`
        for(let model of models_datacenter) {
            if(model.includes("3d-unet")) {
                tableheader += `
                ${model_header_single_2}
                    `;
            }
            else{
                tableheader += `
                ${model_header_2}
                    `;
            }
        }
    }
    else {
        if (with_power) {
            colspan = 6;
            colspan_ms = 9;
            model_header = `
        <th class="col-scenario" colspan="3">Offline</th>
        <th class="col-scenario" colspan="3">SingleStream</th>
        `;
            //console.log(scenarioUnits);
            model_header_2 = `
        <th class="col-scenario">${scenarioUnits['Offline']['Performance_Units']}</th>
        <th class="col-scenario">${scenarioUnits['Offline']['Power_Units']}</th>
        <th class="col-scenario">Samples/J</th>
        <th class="col-scenario">${scenarioUnits['SingleStream']['Performance_Units']}</th>
        <th class="col-scenario">${scenarioUnits['SingleStream']['Power_Units']}</th>
        <th class="col-scenario">Samples/J</th>
        `;
            model_header_ms = model_header + `
        <th class="col-scenario" colspan="3">MultiStream</th>
        `;
            model_header_ms_2 = model_header_2 + `
        <th class="col-scenario">${scenarioUnits['MultiStream']['Performance_Units']}</th>
        <th class="col-scenario">${scenarioUnits['MultiStream']['Power_Units']}</th>
        <th class="col-scenario">Samples/J</th>
        `;
        }
        else {
            colspan = 2;
            colspan_ms = 3;
            model_header = `
        <th class="col-scenario">Offline</th>
        <th class="col-scenario">SingleStream</th>
        `;
            model_header_2 = `
        <th class="col-scenario">${scenarioUnits['Offline']['Performance_Units']}</th>
        <th class="col-scenario">${scenarioUnits['SingleStream']['Performance_Units']}</th>
        `;
            model_header_ms = model_header + `
        <th class="col-scenario">MultiStream</th>
        `;
            model_header_ms_2 = model_header_2 + `
        <th class="col-scenario">${scenarioUnits['MultiStream']['Performance_Units']}</th>
        `;
        }
        tableheader = `
        <th id="col-id" class="headcol col-id">ID</th>
        <th id="col-system" class="headcol col-system">System</th>
        <th id="col-submitter" class="headcol col-submitter">Submitter</th>
        <th id="col-accelerator" class="headcol col-accelerator">Accelerator</th>`;
        for(let model of models_edge) {
            if(model.includes("resnet") || model.includes("retinanet")) {
                tableheader += `
                    <th id="col-model" colspan="${colspan_ms}">${model}</th>
                    `;
            }
            else {
                tableheader += `
                    <th id="col-model" colspan="${colspan}">${model}</th>
                    `;
            }
        }
    tableheader += `
    </tr>
    <tr>
        <th class="headcol col-id"></th>
        <th class="headcol col-system"></th>
        <th class="headcol col-submitter"></th>
        <th class="headcol col-accelerator"></th>`;
        for(let model of models_edge) {
            if(model.includes("resnet") || model.includes("retinanet")) {
                tableheader += `
                ${model_header_ms}`;
            }
            else{
                tableheader += `
                ${model_header}`;
            }
        }
        tableheader += `
        </tr>
        <tr>
        <th class="headcol col-id"></th>
        <th class="headcol col-system"></th>
        <th class="headcol col-submitter"></th>
        <th class="headcol col-accelerator"></th>`;
        for(let model of models_edge) {
            if(model.includes("resnet") || model.includes("retinanet")) {
                tableheader += `
                ${model_header_ms_2}`;
            }
            else{
                tableheader += `
                ${model_header_2}`;
            }
        }
    }
    html += tableheader;
    html += `</tr></thead>`;
    if(needsFooter) {
        html += `<tfoot> <tr>${tableheader}</tr></tfoot>`;
    }
    //console.log("here")


    for (let rid in mydata) {
        let extra_sys_info = `
            Processor: ${mydata[rid].Processor}
            Software: ${mydata[rid].Software}
            Cores per processor: ${mydata[rid].host_processor_core_count}
            Processors per node: ${mydata[rid].host_processors_per_node}
            Nodes: ${mydata[rid].Nodes}
            Notes: ${mydata[rid].Notes}
        `;

        let a_num = mydata[rid]['a#'] || '';
        let acc = a_num === '' ? "" : `${mydata[rid].Accelerator} x ${parseInt(a_num)}`;
        let system_json_link = mydata[rid].Details.replace("results", "systems").replace("submissions_inference_4.0", "inference_results_v4.0") + ".json";
        html += `
        <tr>
            <td class="col-id headcol"> ${rid} </td>
            <td class="col-system headcol" title="${extra_sys_info}"> <a target="_blank" href="${system_json_link}"> ${mydata[rid].System} </a> </td>
            <td class="col-submitter headcol"> ${mydata[rid].Submitter} </td>
            <td class="col-accelerator headcol"> ${acc} </td>
        `;
        let models = [];
        if (category == "datacenter") {
            models = models_datacenter;
        }
        else{
            models = models_edge;
        }
        models.forEach(m => {
            //console.log(mydata[rid][m]);
            if (category == "datacenter") {
                if (!m.includes("3d-unet")) { 
                    scenario_data = get_scenario_td_data(mydata[rid][m], "Server", with_power);
                    html += scenario_data;
                }
                scenario_data = get_scenario_td_data(mydata[rid][m], "Offline", with_power);
                html += scenario_data;
            }
            else {
                scenario_data = get_scenario_td_data(mydata[rid][m], "Offline", with_power);
                html += scenario_data;
                scenario_data = get_scenario_td_data(mydata[rid][m], "SingleStream", with_power);
                html += scenario_data;
                if (m.includes("retinanet") || m.includes("resnet")) {
                    scenario_data = get_scenario_td_data(mydata[rid][m], "MultiStream", with_power);
                    html += scenario_data;
                }
            }
        });
        html += `</tr>`;
    }
    html += "</table>";

    //console.log(html)

    return html
}



function processData(data, category, division, availability) {
    const myData = {};
    const neededKeysModel = ["has_power", "Performance_Result", "Performance_Units", "Accuracy", "Location", "weight_data_types", "UsedModel"];
    const neededKeysSystem = ["System", "Submitter", "Availability", "Category", "Accelerator", "a#", "Nodes", "Processor", "host_processors_per_node", "host_processor_core_count", "Notes", "Software", "Details", "Platform"];

    data.forEach(item => {
        if (!item.Suite.includes(category.toLowerCase())) {
            return;
        }
        if (item.Category !== division.toLowerCase()) {
            return;
        }
        if (item.Availability !== availability.toLowerCase()) {
            return;
        }

        const myId = item.ID;
        if (!myData[myId]) {
            myData[myId] = {};
        }

        const model = item.Model;
        if (!myData[myId][model]) {
            myData[myId][model] = {};
        }

        const scenario = item.Scenario;
        if (!myData[myId][model][scenario]) {
            myData[myId][model][scenario] = {};
        }

        myData[myId][model][scenario].has_power = item.has_power;
        if (item.has_power && item.Power_Result) {
            myData[myId][model][scenario].Power_Result = item.Power_Result;
            myData[myId][model][scenario].Power_Units = item.Power_Units;
        }

        neededKeysModel.forEach(key => {
            myData[myId][model][scenario][key] = item[key];
        });

        neededKeysSystem.forEach(key => {
            myData[myId][key] = item[key];
        });

        accuracyUnits[model] 
        acc = item['Accuracy']
        acc_ = acc.split("  ")
        acc_units = ""
        acc_values = ""
        for(val in acc_) {
            val_ = acc_[val].split(":")
            if(acc_units) {
                acc_units += ", "+val_[0]
                acc_values += ", "+ parseFloat(val_[1]).toFixed(4)
            }
            else {
                acc_units = val_[0]
                acc_values = parseFloat(val_[1]).toFixed(4)
            }
        }
        if (!accuracyUnits.hasOwnProperty(model)) {
            accuracyUnits[model] = acc_units;
        }
        myData[myId][model][scenario]['Accuracy_Values'] = acc_values;
        //console.log(accuracyUnits);

        if (!scenarioUnits.hasOwnProperty(item['Scenario'])) {
            scenarioUnits[item['Scenario']] = {}
            scenarioUnits[item['Scenario']]['Performance_Units'] = item['Performance_Units'];
        }
        if (item.hasOwnProperty('Power_Units')) {
            if(!scenarioUnits[item['Scenario']].hasOwnProperty('Power_Units')) {
                scenarioUnits[item['Scenario']]['Power_Units'] = item['Power_Units'];
            }
        }
        //console.log(scenarioUnits);
    });
    return myData;
}


// function to filter data in according to the user selection
function filterDataResultsTable(category, division, with_power, availability, data) {
    const result = []; // Initialize an empty object to hold the filtered results

    data.forEach(item => {
        // the key value pair mapping in summary_results.json is a bit different. please refer to it.
        //console.log(`category is: ${item.Category} and division is ${typeof with_power}`);
        const categoryMatch = item.Category === division.toLowerCase();
        const divisionMatch = item.Suite.includes(category.toLowerCase()); 
        const availabilityMatch = item.Availability == availability.toLowerCase();
        // Determine if the item should be included based on with_power
        let powerMatch;
        if (with_power) {
            powerMatch = item.hasOwnProperty('Power_Result'); // Check for the key
        } else {
            powerMatch = !item.hasOwnProperty('Power_Result'); // Check for absence of the key
            powerMatch = true; //!item.hasOwnProperty('Power_Result'); // Include power results in perf too by default
        }

        // If all conditions match, add the item to the result object
        if (categoryMatch && divisionMatch && powerMatch && availabilityMatch) {
            result.push({ ...item }); // Use spread operator to copy the item
        }
    });

    return result;
}

