
var StyleManager = (function StyleManager(){

    var styles = {
        barGraphRed: 'red',
        barGraphRedGreenMid: 'yellow',
        barGraphGreen: '#76b732',

        colorset0button  : '#4487e0',
        colorset0start  : '#edf3fc',
        colorset0end    : '#4676b4',

        colorset1button : '#7fb446',
        colorset1start  : '#f2f8ed',
        colorset1end    : '#76b732',

        colorset2button : '#ffa500',
        colorset2start  : '#fff6e6',
        colorset2end    : '#ffa500',

        colorset3button : '#b44648',
        colorset3start  : '#f8eded',
        colorset3end    : '#dc595b',

        colorset4button : '#7d7d7d',
        colorset4start  : '#f2f2f2',
        colorset4end    : '#666666',

        colorset5button : '#a246b4',
        colorset5start  : '#f6edf8',
        colorset5end    : '#a95cb9',

        colorset6button : '#f24949',
        colorset6start  : '#feeded',
        colorset6end    : '#f24949',

        colorset7button : '#a079e2',
        colorset7start  : '#f6f2fc',
        colorset7end    : '#9f79e1',

        colorset8button : '#7cc4e0',
        colorset8start  : '#f1f8fb',
        colorset8end    : '#7cc4e0',

        colorset9button : '#d8e17f',
        colorset9start  : '#fbfcf2',
        colorset9end    : '#d8e17f',

        graphDefaultWidth: 1000,

        lineGraphStyles: {
            axisFontSize: 14,
            axisJutOut: 10,
            axisStrokeWidth: 2,
            highlightLineColor: 'grey',
            highlightLineDashArray: "5 5",
            dataDotRadius: 3,
            dataDotStrokeWidth: 5,
            dataLineStrokeWidth: 2.5,
            width: 1000,
            height: 250,
            padding: {
                top: 15,
                right: 40,
                bottom: 45,
                left: 40
            }
        }
    };

    function getColorSet(name, index){
        if(name === "button" || name === "start" || name == "end"){
            return styles["colorset" + index % 10 + name];
        }else{
            console.log('colorset ' + name + ' missing');
        }
    }

    function getStyle(name){
        if(styles.hasOwnProperty(name))
            return styles[name];
        else{
            console.log('style ' + name + ' missing');
        }
    }

    return {
        getStyle: getStyle,
        getColorSet: getColorSet
    }

}());

function DatePicker(_initRange) {
    var attached = false;
    var parentElem, textElem, selectorElem, pickerElem, data;
    var range = _initRange;
    var availableDataRange;

    var options = {
        separator: ' - ',
        showTopbar: false,
        inline: true,
        alwaysOpen: true,
        container: '#date-range-picker-container',
        language: navigator.language,
        startOfWeek: 'monday',
        getValue: function () {
            return this.innerHTML;
        },
        setValue: function (s) {
            //textElem = $('#picker-text');
            selectorElem.hide();
            var dateLength = (s.length - options.separator.length) / 2;
            if (s.substr(0, dateLength) === s.substr(-dateLength))
                textElem[0].innerHTML = s.substr(-dateLength);
            else
                textElem[0].innerHTML = s;
            this.innerHTML = s;
        },
        showShortcuts: true,
        shortcuts: [],
        customShortcuts: []
    };

    function generateShortcuts() {
        var dateString = PageManager.getInitData().earliestDate.join('-');
        var earliestMoment = moment(dateString, "YYYY-MM-DD");
        availableDataRange = moment.range(earliestMoment, moment().endOf('day'));

        var rangesData = [
            {label: tid['today'], range: moment.range(moment(), moment())},
            {
                label: tid['this_week'], range: moment.range(moment().startOf('week'), moment().endOf('day'))
            },
            {
                label: tid['this_month'], range: moment.range(moment().startOf('month'), moment().endOf('day'))
            },
            {
                label: tid['this_year'], range: moment.range(moment().startOf('year'), moment().endOf('day'))
            },
            {
                label: tid['yesterday'], range: moment.range(moment().subtract(1, 'day'), moment().subtract(1, 'day'))
            },
            {
                label: tid['last_week'],
                range: moment.range(moment().subtract(1, 'week').startOf('week'), moment().subtract(1, 'week').endOf('week'))
            },
            {
                label: tid['last_month'],
                range: moment.range(moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month'))
            },
            {
                label: tid['last_year'],
                range: moment.range(moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year'))
            },
            {
                label: tid['last_two_years'],
                range: moment.range(moment().subtract(2, 'year').startOf('day'), moment().subtract(1, 'year').endOf('year'))
            },
            {
                label: tid['last_three_years'],
                range: moment.range(moment().subtract(3, 'year').startOf('day'), moment().subtract(1, 'year').endOf('year'))
            },
            {
                label: tid['total'],
                range: availableDataRange
            },
        ];

        options.customShortcuts = [];
        rangesData.forEach(addShortcut);

        refreshPicker();
    }

    function addShortcut(data) {
        options.customShortcuts.push({
            name: '<div class="custom-shortcut">' + data.label + '</div>',
            dates: function () {
                return [data.range.start.toDate(), data.range.end.toDate()];
            }
        });
    }

    function attach() {
        parentElem = $('#picker');
        parentElem.html('<span id="picker-text"></span><i class="fa fa-calendar"></i>');
        textElem = parentElem.find('#picker-text');
        parentElem.on('click', function (event) {
            event.stopPropagation();
            toggleSelector(event);
        });
        selectorElem = $('#selector');

        pickerElem = $('#daterangepicker')
            .dateRangePicker(options);

        getPicker().setDateRange(moment(range.start).format("YYYY-MM-DD"), moment(range.end).format("YYYY-MM-DD"));

        pickerElem.bind('datepicker-change', function (event, obj) {
            data = obj;
            range = moment.range(moment(obj.date1).startOf('day'), moment(obj.date2).endOf('day'));
            imc.sendEvent('dateChange', range);
        });

        attached = true;
        refreshPicker();
    }

    function getPicker() {
        return pickerElem.data('dateRangePicker');
    }

    function toggleSelector() {
        selectorElem.toggle();
    }

    function refreshPicker() {
        if (getPicker())
            getPicker().destroy();
        pickerElem.dateRangePicker(options);
        getPicker().setDateRange(moment(range.start).format('YYYY-MM-DD'), moment(range.end).format('YYYY-MM-DD'), true);
        selectorElem.hide();
    }

    function getRange() {
        return range;
    }

    function setDay(_next) {

        if (_next) {
            var nextDay = moment(range.start).add(1, 'day').format('YYYY-MM-DD');
            getPicker().setDateRange(nextDay, nextDay);
        } else {
            var prevDay = moment(range.start).subtract(1, 'day').format('YYYY-MM-DD');
            getPicker().setDateRange(prevDay, prevDay);
        }
    }

    imc.on('globalClick', function () {
        selectorElem.hide();
    });

    return {
        getRange: getRange,
        attach: attach,
        refresh: refreshPicker,
        setDay: setDay,
        generateShortcuts: generateShortcuts
    }
}

function Report(_config, _index){
    var index = _index;
    var id = _config.id;
    var config = _config;
    if(config.graphConfig)
    config.graphConfig.get = function getConfig(_name, _index){
        if(!this.hasOwnProperty(_name) || this[_name].length === 0){
            return false;
        }else{
            if(typeof(_index) === 'number')
                return this[_name][Math.min(_index, this[_name].length -1)];
            else
                return this[_name];
        }
    };
    var rc = new EventEmitter(); // report communication
    var container, graph, printTable;
    var data = null;


    function getHeadline(){
        var verboseId = tid[id]? tid[id] :id.substr(0,1).toUpperCase() + id.substr(1);
        var headline = verboseId;
        var unitName = MomentUtils.getUnitName();
        var unit = unitName.substr(0,1).toUpperCase() + unitName.substr(1);
        var unitSuffix = tid['by_' + unitName] ? tid['by_' + unitName] : 'By ' + unit;
        var byGroupOperator = tid['by_groups'] + ', ' + tid['operators'];

        switch(config.graphName){
            case 'LineGraph':
                if(id === 'goals')
                    verboseId = tid['goals_reached'];
                headline = verboseId + ' ' + MomentUtils.rangeString();
                break;
            case 'NumberGraph':
                if(id === 'goalsDayNumbers')
                    headline = tid['goals_reached'] + ' ' + MomentUtils.rangeString();
                else if(id === 'feedbacksDayNumbers')
                    headline = tid['feedbacks'] + ' ' + MomentUtils.rangeString();
                else
                    headline = '';
                break;
            case 'TableGraph':
                headline = config.getHeadline();
                break;
            case 'BarGraph':
                headline = byGroupOperator;
                if(id === 'goalsBar')
                    headline = tid['by_goals'];
                if(id === 'eventsBar')
                    headline = tid['by_events'];
                if(id === 'availability')
                    headline = tid['availability'] + ' ' + MomentUtils.rangeString().trim() + ', ' + byGroupOperator;
                break;
            case 'TagGraph':
                if(id === 'ticketTags')
                    headline = tid['tickets'] + ' ' + tid['tags'];
                else
                    headline = tid['chats'] + ' ' + tid['tags'];
                break;
            default:
                headline = verboseId + ' ' + MomentUtils.rangeString() + ', ' + unitSuffix;
                break;
        }
        return headline;

    }

    function init(_re) {
        if (_re) {
            data = null;
        }
        if (!container) {
            container = new ReportViewContainer({
                id: id,
                rc: rc,
                config: config
            });
        }
        var headline = getHeadline();
        container.attach(headline);

        if(!data){
            container.showSpinner();
            var requestKey = config.dataId ? config.dataId : id;
            DataManager.getData(requestKey, {postData: {'request': requestKey}, range: PageManager.getRange()} , onData);
            return;
        }

        if(!graph)
            graph = new window[config.graphName](id, config.graphConfig, rc);

        graph.pushData(data);

        if(config.graphName === 'LineGraph' || config.graphName === 'BarGraph'){
            if(!printTable){
                printTable = new window[config.graphName + 'PrintTable'](id, config.graphConfig);
            }
            printTable.init(data);
        }

        container.hideSpinner();
    }

    function onData(_data) {
        if(!_data){
            throw new Error('Could not get data for report ' + id);
        }
        data = _data;
        init();
    }

    function getNameFromInitDataByKey(section, key){
        var initData = PageManager.getInitData();
        for(var index in initData[section]){
            if(initData[section][index].id === key){
                return initData[section][index].name;
            }
        }
        return key;
    }

    function getExportSheets() {

        switch(config.graphName){
            case 'LineGraph':
                var formattedData = [];
                var firstLine = Object.keys(data[0].values).map(function(d){return MomentUtils.formatExportTableHeadlineEntry(d)});
                firstLine.unshift('');
                formattedData.push(firstLine);
                for(var index in data){
                    var lineData = data[index];
                    var lineValues = Object.values(lineData.values);
                    lineValues.unshift(config.graphConfig.get("names",parseInt(index)));
                    formattedData.push(lineValues);
                }
                return [{name: tid[config.tid],data: formattedData}];
                break;
            case 'BarGraph':
                var sheetArray = [];
                for(var datasetIndex in data){
                    var datasetData = data[datasetIndex].data;
                    var firstEntry = '';
                    var firstLine = [];
                    if(datasetData[0].value.length)
                        firstLine = Object.values(datasetData[0].value[0].value).map(function(d){return MomentUtils.formatExportTableHeadlineEntry(d.key)});
                    var formattedBarGraphData = [];
                    for(var sectionIndex in datasetData){
                        var section = datasetData[sectionIndex];
                        if(sectionIndex != 0)
                            firstEntry += '/';
                        firstEntry += tid[section.key.slice(0,-1)];
                        for(var entryIndex in section.value){
                            var entry = section.value[entryIndex];

                            var entryValues = entry.value.map(function(d,i,a){
                                return d.value;
                            });
                            var name = getNameFromInitDataByKey(section.key, entry.key);
                            if(name === '')
                                name = entry.key;
                            entryValues.unshift(name);
                            entryValues.unshift(entry.key);
                            formattedBarGraphData.push(entryValues);
                        }
                    }
                    firstLine.unshift(firstEntry + ' Name');
                    firstLine.unshift(firstEntry + ' ID');
                    formattedBarGraphData.unshift(firstLine);
                    if(formattedBarGraphData.length > 0){
                        ws = XLSX.utils.aoa_to_sheet(formattedBarGraphData);
                    }
                    var sheetName = id;
                    if(data.length == 1)
                        sheetName = tid[config.tid] + ' ';
                    else if(config.tid === data[datasetIndex].tid)
                        sheetName = tid[config.tid] + ' ' + tid['total'];
                    else
                        sheetName = tid[config.tid] + ' ' + tid[data[datasetIndex].tid];
                    if(sheetName.length > 31){
                        sheetName = sheetName.substr(0,27) + '...'
                    }
                    sheetArray.push({
                        name: sheetName,
                        data: formattedBarGraphData
                    });
                }
                return sheetArray;
                break;

            case 'TableGraph':
                var sheetArray = [];
                data.forEach(function(item, index, array){
                    var values = item.value;
                    values[0] = values[0].map(function(elem){
                        return tid[elem] ? tid[elem] : elem;
                    });
                    values = values.map(function(elem){
                       if(Array.isArray(elem[0])){
                           var newElem = elem;
                           newElem[0] = newElem[0][0];
                           return newElem;
                       }else
                           return elem;
                    });

                    sheetArray.push({
                        name: tid[item.tid],
                        data: values
                    })
                });
                return sheetArray;
                break;
            default:
                return [];
                break;

        }
    }

    function resize(){
        if(graph)
            graph.resize();
    }

    return {
        init: init,
        resize: resize,
        getExportSheets: getExportSheets,
        id: id,
        getConfig: function() {return config;}
    }
}

function LineGraphPrintTable(_id, _config){
    var id = _id;
    var config = _config;
    var container;
    var dataPointsIndex = 0;

    function draw(_data){

        container = d3.select('#' + id + '-print-table-container');

        container.selectAll('.print-table-section').remove();

        var line = container.selectAll('.print-table-section')
            .data([_data]);

        line.exit().remove();

        var lineDiv = line.enter()
            .append('div')
            .classed('print-table-section', true);
        lineDiv
            .append('div')
            .classed('print-table-data-container', true)
            .each(drawSectionData);
    }

    function drawSectionData(_data, _index, _array) {

        var data = d3.select(this).selectAll('.print-table-line-data')
            .data(_data);

        var dataDiv = data.enter()
            .append('div')
            .attr('id', function(d,i){return 'print-table-line-data-' + d.name.replace(' ', '&nbsp;')})
            .style('margin-right', function(d,i){
                if((i % 3) === 2)
                    return '0';
                else
                    return '11vw';
            })
            .classed('print-table-line-data', true);

        dataDiv
            .append('div')
            .classed('print-table-line-headline', true)
            .append('span')
            .classed('print-table-line-headline-text', true)
            .html(function (d,i,a) {
                var result = config.get("prefixes",i) + tid[config.get("tids",i)];// + ' ' + MomentUtils.rangeString();
                var replaced = result.split(' ').join('&nbsp;');
                return replaced;
            });

        dataDiv
            .append('div')
            .classed('line-print-table-dati-container', true)
            .style('border-color', function(d,i){return StyleManager.getColorSet('button',i)})
        .each(drawDataPoints);

    }

    function drawDataPoints(_data, _index, _array) {
        var datum = d3.select(this).selectAll('.line-print-table-datum')
            .data(d3.entries(_data.values));
        dataPointsIndex = _index;
        var dati = datum.enter()
            .each(addDatum);
    }

    function addDatum(_data, _index){
        var range = PageManager.getRange();
        if(_data.key.split('-').length < 4 || (range.start.format('YYYY-MM-DD') == range.end.format('YYYY-MM-DD'))) {

            d3.select(this).append('div')
                .classed('line-print-table-datum', true)
                .html(function (d, i) {
                    var result = '<div class="line-print-table-datum-key"><span class="table-datum-key-text">' + MomentUtils.formatTableDataKey(d.key) + '</span></div><div class="line-print-table-datum-value"><span class="table-datum-value-text">' +
                        config.get("formatFunctions",dataPointsIndex)(d.value) +
                        '</span></div>';


                    return result;
                });
        }
        else {
            if(_data.key.split('-')[3] === '0'){

                d3.select(this).append('div')
                    .classed('line-print-table-datum', true)
                    .html(function (d, i) {
                        var result = '<div class="line-print-table-datum-key"><span class="table-datum-key-text">' + MomentUtils.formatTableDataKey(d.key) + '</span></div><div class="line-print-table-datum-value"><span class="table-datum-value-text">' +
                            config.get("formatFunctions",dataPointsIndex)(d.value)  +
                            '</span></div>';

                        var pre = '<div class="date-interval-info">' + MomentUtils.getMain(_index) + '</div>';
                        return  pre + result;
                    });
            }
            else{
                d3.select(this).append('div')
                    .classed('line-print-table-datum', true)
                    .html(function (d, i) {
                        var result = '<div class="line-print-table-datum-key"><span class="table-datum-key-text">' + MomentUtils.formatTableDataKey(d.key) + '</span></div><div class="line-print-table-datum-value"><span class="table-datum-value-text">' +
                            config.get("formatFunctions",dataPointsIndex)(d.value) +
                            '</span></div>';


                        return result;
                    });
            }
        }

    }

    return {
        init: draw
    };
}

function BarGraphPrintTable(_id){
    var id = _id
    var container;

    function draw(_data){
        var data = _data[0].data;

        container = d3.select('#' + id + '-print-table-container');

        container.selectAll('.print-table-section').remove();

        var section = container.selectAll('.print-table-section')
            .data(data);

        section.exit().remove();

        var sectionDiv = section.enter()
            .append('div')
                .classed('print-table-section', true);

        sectionDiv
            .append('h3')
                .classed('print-table-section-headline', true)
                .html(function(d){return d.key});
        sectionDiv
            .append('div')
                .classed('print-table-data-container', true)
            .each(drawSectionData);


        section.enter()
            .merge(section);
    }

    function drawSectionData(_data, _index, _array) {
        var data = d3.select(this).selectAll('.print-table-data')
            .data(_data.value);

        var dataDiv = data.enter()
            .append('div')
            .attr(id, 'print-table-data' + _data.key)
            .style('margin-right', function(d,i){
                if((i % 3) === 2)
                    return '0';
                else
                    return '11vw';
            })
            .classed('print-table-data', true);

        dataDiv
            .append('div')
            .classed('print-table-line-headline', true)
            .append('span')
            .classed('print-table-line-headline-text', true)
            .html(function (d) {
                return d.key
            });

        dataDiv
            .append('div')
            .classed('bar-print-table-dati-container', true)
            .each(drawDataPoints);
    }

    function drawDataPoints(_data, _index, _array){

        var datum = d3.select(this).selectAll('.print-table-datum')
            .data(_data.value);

        var dati = datum.enter()
            .append('div')
            .classed('bar-print-table-datum', true)
            .html(function(d){
                return '<div class="bar-print-table-datum-key"><span class="table-datum-key-text">' + MomentUtils.formatTableDataKey(d.key) + '</span></div><div class="bar-print-table-datum-value"><span class="table-datum-value-text">' + MomentUtils.durationStringFromSeconds(d.value) + '</span></div>';
            });


    }

    return {
        init: draw
    };
}

function ReportViewContainer(_options){
    var headline = '';
    var id = _options.id;
    var rc = _options.rc;
    var config = _options.config;
    var graphContainer, printTableContainer, wrapper;
    var tooltip = false;
    var spinner = false;
    var isSpinnerSet = false;

    function attach(_headline){
        if (_headline)
            headline = _headline;
        wrapper = d3.select('#reports').selectAll('#report-wrapper-' + id)
            .data([id])
            .enter()
            .append('div')
            .classed('report-wrapper', true)
            .classed('report-wrapper-' + config.graphName, true)
            .style('display', 'none')
            .attr('id', 'report-wrapper-' + id);

        if(headline) {
            drawHeadline();
        }
        graphContainer = wrapper
            .append('div')
            .classed('graph-container', true)
            .classed(config.graphName + '-container', true)
            .attr('id', id + '-graph-container');
        printTableContainer = wrapper
            .append('div')
            .classed('print-table-container', true)
            //.style('display', 'none')
            .attr('id', id + '-print-table-container');

        if(!tooltip && (config.graphName == 'LineGraph' || config.graphName == 'BarGraph')){
            tooltip = true;
            new Tooltip(id,rc);
        }


        if(!isSpinnerSet){
            isSpinnerSet=true;
            spinner = new ReportLoadingSpinner({
                id: id,
                rc: rc
            });
        }
    }

    function drawHeadline(){
        wrapper.classed('nodisplay', false);

        var headlineSelection = d3.select('#reports').selectAll('#report-wrapper-' + id).selectAll('.report-headline')
            .data([headline]);
        var enterArray = headlineSelection.enter();
        var mergedArray = enterArray.append('h3')
            .classed('report-headline', true)
            .merge(headlineSelection);
        mergedArray.html(headline);
    }

    return {
        attach: attach,
        showSpinner: function(){
            $('#' + id + '-graph-container .content').hide();
            $('#' + id + '-graph-container .buttons').hide();
            spinner.show();
        },
        hideSpinner: function(){
            $('#' + id + '-graph-container .content').show();
            $('#' + id + '-graph-container .buttons').css({display: 'flex'});
            spinner.hide();
        }
    }
}

ReportLoadingSpinner = function (_in){
    var id = _in.id;
    var rc = _in.rc;
    var spinner = d3.select('#' + id + '-graph-container')
        .append('div')
        .attr('id', 'view-loader');
    spinner.append('div')
        .classed('loader', true);

    rc.on('onData', function(){
        spinner.style('display', 'none');
    });

    return {
        show: function(){
            spinner.style('display', 'flex');
        },
        hide: function(){
            spinner.style('display', 'none');
        }
    }
};

function Tooltip(_id, _rc) {
    var id = _id;
    var rc = _rc;
    var container = d3.select('#' + id + '-graph-container')
        .append('div')
        .classed('tooltip-container', true);
    var headline = container.append('h4');
    var subHeadline = container.append('h5');
    var body = container.append('p');
    var lastTooltip = 0;

    function calcPos(_defaultY, _index){
        var marginX = 120;
        var windowWidth = $(window).width();
        var parent = $('#' + id + '-graph-container');
        var tooltipContainer = parent.find(' .tooltip-container');
        var parentWidth = parent.outerWidth();
        var tooltipWidth = tooltipContainer.outerWidth();
        var mouseRightOffset = windowWidth - d3.event.pageX;
        var parentRightOffset = (windowWidth - (parent.offset().left + parentWidth));
        var rightSpace = mouseRightOffset - parentRightOffset;

        var mousePosInParent = parentWidth - rightSpace;

        var cond1 = rightSpace < (tooltipWidth + marginX);
        var cond21 = _index > lastTooltip;
        lastTooltip = _index;

        var cond22 = !(mousePosInParent < (tooltipWidth + marginX));
        var cond2 = cond21 && cond22;
        var tooltipLeft = cond1 || cond2 ; //   being on left side     //i > a.length * 0.7;
        var x;

        if (tooltipLeft) // left
            x = Math.round((mousePosInParent - tooltipWidth) - marginX ) ;
        else  // right
            x = Math.round(mousePosInParent + marginX ) ;
        x = Math.max(0, x);

        var y = _defaultY;
        if( x === 0){
            var marginY = 10;
            var tooltipHeight = tooltipContainer.outerHeight();
            var mouseTopOffset = d3.event.pageY;
            var parentTopOffset = parent.offset().top;
            y = Math.max(0, mouseTopOffset - parentTopOffset - tooltipHeight - marginY);
            x = d3.event.pageX - (tooltipWidth/2);
        }
        return {
            x:x,
            y:y
        };
    }

    rc.on('updateTooltip',function(_in){
        if(!window.printMode){
            var pos = calcPos(_in.defaultY, _in.index);
            container.transition('tooltip')
                .ease(d3.easeCubicOut)
                .style('left', pos.x + 'px')
                .style('top', pos.y + 'px');
            container.style('visibility', 'visible');
            headline.html(_in.headline);
            subHeadline.html(_in.subHeadline);
            body.html(_in.body);
        }
    });

    rc.on('hideTooltip', function(){
        container.style('visibility', 'hidden');
    });
}

function NumberGraph(_id, _config) {
    var id = _id;
    var config = _config;
    var data;


    function drawNumber(d,i,a,parentId){
        if(d.container){
            var container = d3.select(parentId).selectAll("#" + d.id)
                .data([d]);
            container.enter()
                .append('div')
                .attr('id', d.id);
            d.value.forEach(function(dd,ii,aa){
                drawNumber(dd,ii,aa,"#" + d.id)
            })
        }else if(d.pie){
            var curPie = d3.select(parentId).selectAll('#' + d.tid)
                .data([d]);
            curPie.enter()
                .append('div')
                .classed('pie', true)
                .attr('id', id + '-' + d.tid)
            .merge(curPie)
            .html(function(dd){
                generatePie(id + '-' + d.tid, dd);
            });

        }else{
            var curNum = d3.select(parentId).selectAll('#' + d.tid)
                .data([d]);
            curNum.enter()
                .append('div')
                .classed('number', true)
                .attr('id', d.tid)
            .merge(curNum)
            .html(getHtml);
        }
    }

    function draw(_data) {
        data = _data;
        data.forEach(function(d,i,a){drawNumber(d,i,a,'#' + id + "-graph-container")});
    }

    function generatePie(elemId,data){
        var pieData = [];
        for (var valueIndex in data.value) {
            pieData.push([((typeof tid[data.value[valueIndex].tid] !== 'undefined') ? tid[data.value[valueIndex].tid] : data.value[valueIndex].tid), parseInt(data.value[valueIndex].value)]);
        }
        setTimeout(function () {
            Pie.bake('#' + elemId, pieData, tid[data.tid] ? tid[data.tid] : data.tid)
        }, 500);

        return '<div id="' + elemId + '"></div>';
    }

    function getHtml(d,i) {
        if (d.pie) {
            return generatePie(d);
        }
        if (!Array.isArray(d.value)) {
            return getSingleNumberHtml(d,i);
        } else {
            return getNumberTableHtml(d,i);
        }
    }

    function getSingleNumberHtml(d,i) {
        var formattedValue = ((typeof d.format !== 'undefined') ? config.get("formatFunctions", d.format)(d.value) : d.value);
        return '<h1>' + ((d.hasOwnProperty('prefix')) ? d.prefix : '') + ((d.hasOwnProperty('tid')) ? tid[d.tid] : d.key) + '</h1><h2>' + formattedValue + '</h2>';
    }

    function getNumberTableHtml(d) {
        var html = '<h1>' + ((d.hasOwnProperty('tid')) ? tid[d.tid] : d.key) + '</h1>';
        html += '<div class="number-table">';
        for (var index in d.value) {
            var entry = d.value[index];
            html += '<div class="number-detail-key"><h2>' + ((entry.hasOwnProperty('tid')) ? tid[entry.tid] : entry.key) + '</h2></div>';
            html += '<div class="number-detail-value"><h2>' + entry.value + '</h2></div>';
        }
        html += '</div>';
        return html;
    }

    return {
        pushData: draw
    }
}

function TableGraph(_id, _config, _rc) {
    var id = _id;
    var container = null;
    var data;

    function draw(_data, cap) {
        data = _data;
        data.forEach(function (table) {
            if (cap)
                table.cap = cap;
            else
                table.cap = 11;

        });
        d3.select('#' + id + "-graph-container").select('.tops-table-container').remove();
        container = d3.select(' #' + id + "-graph-container").append('div')
            .classed('content', true)
            .classed('tops-table-container', true);


        container.selectAll('.table-pie-wrapper')
            .data(data)
            .enter()
            .append('div')
            //.classed('clear', function(d, i){return !(i % 2);})
            .classed('table-pie-wrapper', true)
            .each(function (d, i, a) {
                drawTable(d, i, a);
            })
            .each(function (d) {
                if (d.pie) {
                    var pieData = [];
                    var others = 0;
                    var sum = 0.0;
                    for (var i = 1; i < d.value.length; i++) {
                        var floatVal = parseFloat(d.value[i][1]);
                        sum += floatVal;
                    }

                    for (var i = 1; i < d.value.length; i++) {
                        var floatVal = parseFloat(d.value[i][1]);
                        if (floatVal > (sum / 100 * 3)){
                            var value = d.value[i][0] ? d.value[i][0] : tid['unknown'];
                            if(d.tid === 'time_on_page' && i !== 0){
                                if(parseInt(value) === 7)
                                    value = '>= 7 min';
                                else
                                    value = value + ' min';
                            }
                            pieData.push([value, floatVal]);
                        }else
                            others += floatVal;
                    }

                    if (others > 0){
                        pieData.push([tid['others'], others]);
                    }
                    d3.select(this).append('div').attr('id', id + d.tid + 'pieChart').classed('pie-wrapper', true)
                        .append('div').attr('id', id + d.tid + 'c3wrapper').classed('c3-pie-wrapper', true);
                    Pie.bake('#' + id + d.tid + "c3wrapper", pieData);
                }
            })
    }

    function drawTable(td, ti, ta) {
        d3.select(ta[ti]).selectAll('.table-wrapper')
            .data([td])
            .enter()
            .append('div')
            .classed('table-wrapper', true);

        d3.select(ta[ti]).select('.table-wrapper').selectAll('#table-headline-' + td.tid)
            .data([td])
            .enter()
            .append('span')
            .classed('table-headline', true)
            .attr('id', 'table-headline-' + td.tid)
            .html(function (d) {
                if (d.tid)
                    return tid[d.tid];
                else
                    console.log('no tid');
            });
        var table = d3.select(ta[ti]).select('.table-wrapper').selectAll('#table-' + td.tid)
            .data([td])
            .enter()
            .append('table')
            .classed('tops-table', true)
            .attr('id', 'table-' + td.tid);


        var entriesData = td.value.slice(0, 101);
        var entries = table.selectAll('.entry')
            .data(entriesData);

        entries.enter()
            .append('tr')
            .classed('entry', true)
            .merge(entries)
            .style('display', function (d, i) {
                if (td.cap > i) {
                    return 'table-row';
                } else
                    return 'none';
            })
            .html(function (d, i) {
                var html = '';
                var entries = d.slice();
                entries.unshift(i);
                for (var index in entries) {
                    var value = entries[index];
                    if(td.tid === 'time_on_page' && parseInt(index) === 1 && parseInt(i) !== 0){
                        if(parseInt(value) === 7)
                            value = '>= 7 min';
                        else
                            value = value + ' min';
                    }
                    if (value === '')
                        value = tid['unknown'];
                    if (value === 0 && i === 0)
                        value = '';
                    if (td.kbEntry && i !== 0 && index == 1)
                        html += '<td><a href="' + value[1] + '" target="_blank">' + value[0] + '</a></td>';
                    else if (td.kbEq && i !== 0 && index == 1)
                        html += '<td><a href="' + value[1] + '" target="_blank">' + value[0] + '</a></td>';
                    else if (td.links && i !== 0 && index == 1)
                        html += '<td><a href="' + value + '" target="_blank">' + value + '</a></td>';
                    else if ( i === 0 && !!value)
                        html += '<td>' + tid[value] + '</td>';
                    else
                        html += '<td>' + value + '</td>';
                }
                return html;
            });
        entries.exit().remove();

        var showMore = d3.select(ta[ti]).select('.table-wrapper').selectAll('#table-' + td.tid + "-show-more")
            .data(["show-more"]);
        showMore.enter()
            .append('div')
            .attr('id', '#table-' + td.tid + "-show-more")
            .classed('table-show-more', true)
            .merge(showMore)
            .style('display', function (d, i, a) {
                if(td.value.length > td.cap)
                    return 'flex';
                else
                    return 'none';
            })
            .html(tid["show_more"])
            .on('click', function () {
                showMoreEntries($(this).parent().find('table'), $(this));
            });
    }

    function showMoreEntries(table, button){
        if(!table.length){
            console.log('missing table reference');
        }
        var allRows = table.children();
        var formerVisibleRows = table.children(":visible");
        allRows.slice(0, formerVisibleRows.length + 10).css({'display': 'table-row'});
        $('#content').animate({
            scrollTop: formerVisibleRows.filter(":last").offset().top - $('#reports').offset().top
        }, 200);
        if((formerVisibleRows.length + 10) >= allRows.length)
            button.hide();
    }

    return {
        pushData: draw
    }
}

function BarGraph(_id, _config, _rc){
    var id = _id;
    var rc = _rc;
    var config = _config;
    var data = [];
    var datasets = [];
    var datasetIndex = 0;
    var currentlyDrawnDataSetName = '';
    var currentlyDrawnSectionName = '';
    var currentlyDrawnBarLineID = '';
    var indexOfSelectedButton = 0;
    var indexOfHoveredButton = -1;
    var colorInterpolator = d3.interpolateHclLong(StyleManager.getColorSet('start',0), StyleManager.getColorSet('end',0));
    var openingHourFull = 1;
    var openingHourPartTime = 2;
    if(config.get("redgreen",0))
        colorInterpolator = d3.interpolateRgbBasis([StyleManager.getStyle('barGraphRed'), StyleManager.getStyle('barGraphRedGreenMid'),StyleManager.getStyle('barGraphGreen')]);
    var scale = {
        radius: 18,
        color: function(_in){
            return colorInterpolator(_in);
        },
        beforeLastTooltip: 0,
        lastLeft: 0,
        lastTooltip :0,
        yTicks: 3,
        xTicks: 1,
        x: d3.scaleLinear(),
        yDefault: null,
        y: d3.scaleLinear(),
        pos: d3.scaleLinear(),
        datasetMaxVal: 0,
        dataBorder: 2
    };

    var elem = {
        container: d3.select('#' + id + "-graph-container")
    };
    var unit = MomentUtils.getUnit();

    function draw(_data, _datasetIndex) {
        datasetIndex = _datasetIndex? _datasetIndex : 0;
        colorInterpolator = d3.interpolateHclLong(StyleManager.getColorSet('start',datasetIndex), StyleManager.getColorSet('end',datasetIndex));
        if(config.get("redgreen", _datasetIndex)) // TODO not for amount
            colorInterpolator = d3.interpolateRgbBasis([StyleManager.getStyle('barGraphRed'), StyleManager.getStyle('barGraphRedGreenMid'),StyleManager.getStyle('barGraphGreen')]);
        if(id === 'feedbacksBar' && !config.get("redgreen", _datasetIndex))
            colorInterpolator = d3.interpolateHclLong(StyleManager.getColorSet('start',0), StyleManager.getColorSet('end',0));

        datasets = _data;
        currentlyDrawnDataSetName = _data[datasetIndex].dataset;
        data = _data[datasetIndex].data;
        scale.datasetMaxVal = _data[datasetIndex].max;
        if(config.get("redgreen",datasetIndex)){
            scale.datasetMaxVal = 5;
        }
        unit = MomentUtils.getUnit();
        scale.dataLength = getDataLength();
        scale.innerWidth = $(elem.container.node()).width() - 42;
        scale.dataWidth = MomentUtils.precisionFloor(scale.innerWidth/scale.dataLength,1);
        scale.radius = MomentUtils.precisionFloor(Math.min(18, scale.dataWidth/2),1);

        if(scale.dataWidth < scale.radius * 2.5)
            scale.dataWidth = scale.radius * 2;

        if(datasets.length > 1)
            drawButtons();
        drawColorGradient();
        drawData();
        return true;
    }

    function drawButtons() {
        var selection = elem.container.selectAll('.buttons')
            .data([id]);
        selection.enter()
            .append('nav')
            .classed('buttons', true);
        var buttons = elem.container.select('.buttons').selectAll('.button')
            .data(datasets);

        buttons.enter()
            .append('div')
            .classed('button', true)
            .classed('unselectable', true)
            .classed('disabled-button', function (d, i) {
                return i > 0;
            })
            .style('top', 0)
            .style('left', function (d, i) {
                return i * 70 + 'px'
            })
            .on('mousedown', function (d, i) {
                indexOfSelectedButton = i;
                var buttons = elem.container.select('nav').selectAll('.button');
                buttons.classed('disabled-button', true);
                var button = elem.container.select('nav').select('.button:nth-child(' + (i + 1) + ')');
                button.classed('disabled-button', false);
                if(!config.get("redgreen",i))  // TODO check i correct index
                    colorInterpolator = d3.interpolateHclLong(StyleManager.getColorSet('start',i), StyleManager.getColorSet('end',i));
                draw(datasets, i);
            })
            .on('mouseenter', function (d, i, a) {
                indexOfHoveredButton = i;
                var button = elem.container.select('.button:nth-child(' + (i + 1) + ')');
                if(indexOfHoveredButton != indexOfSelectedButton)
                    button.classed('disabled-button', !button.classed('disabled-button'));
                if(!config.get("redgreen",i))
                    colorInterpolator = d3.interpolateHclLong(StyleManager.getColorSet('start',i), StyleManager.getColorSet('end',i));
                draw(datasets, i);
            })
            .on('mouseleave', function (d, i, a) {
                indexOfHoveredButton = -1;
                var button = elem.container.select('.button:nth-child(' + (i + 1) + ')');
                button.classed('disabled-button', indexOfSelectedButton !== i);
                if(!config.get("redgreen",i))
                    colorInterpolator = d3.interpolateHclLong(StyleManager.getColorSet('start',indexOfSelectedButton), StyleManager.getColorSet('end',indexOfSelectedButton));
                draw(datasets, indexOfSelectedButton);
            })
            .html(function (d, i) {
                var color = StyleManager.getColorSet('button',i);
                if(id === 'feedbacksBar')
                    color = StyleManager.getColorSet('button',0)
                return '<div class="button-background" style="background-color: ' + color + '"></div><div class="button-headline-div"><span class="button-headline">' + d.prefix + tid[d.tid] + '</span></div>';
            });
        buttons.exit().remove();
    }

    function drawColorGradient() {
        var width = 32;
        var selection = elem.container.selectAll("#color-gradient")
            .data(['color-gradient']);
        selection.enter()
            .append('div')
            .attr('id', 'color-gradient')
            .classed('content', true)
            .merge(selection)
            .html(function(){
                var text = '<div id="color-gradient-max-text"><span>max: ';
                var index = (indexOfHoveredButton != -1)? indexOfHoveredButton : indexOfSelectedButton;
                var formatFunction = '';
                if(config.get("redgreen",index))
                    formatFunction = MomentUtils.formatRating;
                else
                    formatFunction = config.get("formatFunctions",index);

                if(typeof(formatFunction) === 'function'){
                    text += formatFunction(scale.datasetMaxVal);
                }else{
                    text += scale.datasetMaxVal;
                }
                text += '</span></div>'
                text += '<div id="color-gradient-circles" class="color-gradient-circles"></div>'
                return text;
            });

        var colorCircles = elem.container.select('#color-gradient-circles').selectAll('circle')
            .data([0,0.25,0.5,0.75,1]);
        colorCircles.enter()
            .append('div')
            .classed('gradient-circle', true)
            .merge(colorCircles)
            .style('background-color', function(d){return colorInterpolator(d)})
        colorCircles.exit().remove();

    }

    function drawData() {
        for (var sectionIndex in data) {
            drawSection(data[sectionIndex]);
        }
    }

    function drawSection(_sectionData) {
        currentlyDrawnSectionName = _sectionData.key;
        drawSectionHeadline(_sectionData.key);
        drawSectionBarLines(_sectionData);
    }


    function drawSectionHeadline(_sectionName) {
        var containerSelection = elem.container.selectAll('#' + id + '-' + _sectionName)
            .data([_sectionName]);
        containerSelection.enter()
            .append('div')
            .classed('bar-graph-section', true)
            .classed('content', true)
            .merge(containerSelection)
            .attr('id', id + '-' + _sectionName)
            .attr('index', function (d, i) {
                return i;
            });
        var headlineSelection = elem.container.select('#' + id + '-' + _sectionName).selectAll('#headline-text-' + _sectionName)
            .data([_sectionName]);
        headlineSelection.enter()
            .append('h4')
            .classed('bargraph-section-headline-text', true)
            .attr('id', 'headline-text-' + _sectionName)
            .merge(headlineSelection)
            .html( function () {
                var translateString = _sectionName;
                return tid[translateString];
            });

    }

    function drawSectionBarLines(_sectionData) {
        var currentData = _sectionData.value;
        var container = elem.container.select('#' + id + '-' + _sectionData.key);
        var selection = container.selectAll('.bar-line')
            .data(currentData);
        selection.enter()
            .append('div')
            .classed('bar-line', true)
            .each(function () {
                enterBarLine(d3.select(this));
            })
            .merge(selection)
            .each(function () {
                updateBarLine(d3.select(this));
            });
        selection.exit().remove();
    }

    function enterBarLine(selection) {
        selection.append('div')
            .classed('bar-line-text', true);
        selection.append('div')
            .classed('bar-line-graph',true)
            .on('mouseleave', function () {
                rc.sendEvent('hideTooltip');
                elem.container.selectAll('.tooltip-rect')
                    .attr('fill', 'transparent');
            });
    }

    function getBarLineText(d,i,a) {
        var returnVal = d.key;
        if(currentlyDrawnSectionName === 'operators'){
            var operators = PageManager.getInitData().operators;
            for(var operatorIndex in operators){
                if(operators[operatorIndex].id == d.key){
                    returnVal = operators[operatorIndex].name;
                    break;
                }
            }
        }
        if(currentlyDrawnSectionName === 'goals'){
            var goals = PageManager.getInitData().goals;
            for(var goalIndex in goals){
                if(goals[goalIndex].id == d.key){
                    returnVal = goals[goalIndex].name;
                    break;
                }
            }
        }
        if(currentlyDrawnSectionName === 'events'){
            var events = PageManager.getInitData().events;
            for(var eventIndex in events){
                if(events[eventIndex].id == d.key){
                    returnVal = events[eventIndex].name;
                    break;
                }
            }
        }
        return returnVal;
    }

    function updateBarLine(selection){
        currentlyDrawnBarLineID = selection.data()[0].key;
        selection.select('.bar-line-text')
            .html(function(d,i,a){
                var formattedTotal = config.get("formatFunctions",datasetIndex)(d.total);
                return '<div class="bar-line-text-id">' + getBarLineText(d,i,a) + '</div><div class="bar-line-text-total">' + formattedTotal + '</div>';
            });

        var barLineGraph = selection.select('.bar-line-graph');

        barLineGraph.selectAll('.bargraph-data-container')
            .data(['data-container'])
            .enter()
            .append('div')
            .classed('bargraph-data-container', true);

        var dataSelection = barLineGraph.select('.bargraph-data-container').selectAll('.data')
            .data(selection.data()[0].value);

        dataSelection.enter()
            .append('div')
            .classed('data', true)
            .classed('data-circle', true)
            .merge(dataSelection)
            .classed('no-data', function(d){
                return d.value == 0;
            })
            .style('background-color', function(d){
                var value = (scale.datasetMaxVal === 0)? 0 : (d.value/scale.datasetMaxVal);
                if(id === 'feedbacksBar' && config.get('redgreen', datasetIndex))
                    value = (d.value === 0 )? 0 : ((d.value -1) / 4).toString();
                return scale.color(value);
            })
            .on('mouseover', function(d,i,a){
                rc.sendEvent('updateTooltip', getTooltipData(d,i,a));
            })
            .each(function(d,i){
                if(id === 'availability' && currentlyDrawnSectionName == "groups")
                    addOpeningHourClasses(this, i,  currentlyDrawnBarLineID);
            });

        dataSelection.exit().remove();
    }

    function getOpeningHour(dataIndex, groupID)
    {
        var startTime = moment(PageManager.getRange().start).add(dataIndex,MomentUtils.getUnitName());
        var endTime = moment(startTime).add(1,MomentUtils.getUnitName());
        var currentRange = moment.range(startTime, endTime);
        var openingHours = PageManager.getInitData().groups[groupID].openingHours;

        for(var i=0; i<openingHours.length; i++) {
            var openingHourRange = moment.range(moment(startTime).day(openingHours[i][0]).startOf('day').second(openingHours[i][1]),moment(startTime).day(openingHours[i][0]).startOf('day').second(openingHours[i][2]));
            var overlaps = openingHourRange.overlaps(currentRange);
            if(overlaps){
                var intersect = openingHourRange.intersect(currentRange);
                if(intersect.isEqual(currentRange))
                    return openingHourFull;
                else
                    return openingHourPartTime;
            }
        }
        return 0;

    }

    function addOpeningHourClasses(that,i,groupID) {
        var selection = d3.select(that);

        if(unit > 1){
            selection.classed('opened', false);
            selection.classed('part-time', false);
            return;
        }

        var open = getOpeningHour(i, groupID);
        switch(open){
            case openingHourFull:
                selection.classed('opened', true);
                selection.classed('part-time', false);
                break;
            case openingHourPartTime:
                selection.classed('opened', true);
                selection.classed('part-time', true);
                break;
            default:
                selection.classed('opened', false);
                selection.classed('part-time', false);
                break;
        }
    }

    function getTooltipHeadlines(_index) {
        return [MomentUtils.getMain(_index,id), MomentUtils.getSub(_index, id)];
    }

    function getTooltipData(d,i,a){
        var headlines = getTooltipHeadlines(i);
        var headline = headlines[0];
        var subHeadline = headlines[1];
        var bodyText = config.get("formatFunctions",indexOfSelectedButton)(d.value);
        return {
            headline: headline,
            subHeadline: subHeadline,
            body: bodyText,
            defaultY: $(a[i]).offset().top - $('#' + id + '-graph-container').offset().top - 40,
            index: i
        };
    }

    function getDataLength(){
        if(datasets[0].data && datasets[0].data[0].value.length)
            return Object.keys(datasets[0].data[0].value[0].data).length;
        else
            return 0;
    }

    return {
        pushData: draw
    };
}

function LineGraph(_id, _config, _rc) {
    var id = _id;
    var rc = _rc;
    var data = [];
    var style = StyleManager.getStyle('lineGraphStyles');
    var scale = {
        yTicks: 3,
        xTicks: 4,
        x: d3.scaleLinear(),
        yDefault: null,
        y: d3.scaleLinear(),
        bandWidth: null
    };
    var elem = {
        svg: null,
        yAxis: null,
        xAxis: null,
        container: d3.select('#' + id + '-graph-container')
    };
    var config = _config; // colors, names, formatFunctions
    var unit = MomentUtils.getUnit();
    var combinationData = [];

    function defaultDisabled(i){
        return  (!config.get("defaultActive",i) && i > 0);
    }

    function onData(_data){
        unit = MomentUtils.getUnit();
        data = _data;
        scale.dataLength = Object.keys(data[0].values).length;

        style.innerWidth = style.width - (style.padding.left + style.padding.right);
        style.innerHeight = style.height - (style.padding.top + style.padding.bottom);

        scale.x.range([style.padding.left, style.innerWidth + style.padding.left]);
        scale.x.domain([0, scale.dataLength - 1]);
        scale.yDefault = d3.scaleLinear()
            .domain([10, 0])
            .range([ style.padding.top, style.innerHeight + style.padding.top]);
        drawButtons();
        drawSVG();
        checkLineCombination();
        return true;
    }

    function drawSVG() {
        var selection =d3.select("#" + id + "-graph-container").selectAll('svg')
            .data([id]);
        selection.enter()
            .append("svg")
            .classed('line-graph', true)
            .classed('content', true)
            .attr('id', 'line-graph-' + id)
            .merge(selection)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 " + style.width + " " + style.height)
            .on('mouseleave', function () {
                rc.sendEvent('hideTooltip');
                elem.svg.selectAll('.highlight-line')
                    .style('visibility', 'hidden');
                elem.svg.selectAll('.tick-data')
                    .style('visibility', 'hidden');
            });
        elem.svg = d3.select("#" + id + "-graph-container").select('svg');
        drawGrid();
        drawData();
    }

    function drawGrid() {
        drawAxisY();
        drawAxisX();
        drawGridLines();
    }

    function drawAxisY() {
        elem.yAxis = d3.axisLeft(scale.yDefault)
            .ticks(scale.yTicks)
            .tickFormat(function () {
                return ''
            });
        var selection = elem.svg.selectAll('.y-axis')
            .data([id]);

        selection.enter()
            .append("g")
            .classed("y-axis", true)
            .merge(selection)
            .call(elem.yAxis);
       elem.svg.selectAll('.tick').selectAll('line').remove();
    }

    function drawAxisX() {
        var tickValues =  [0, Math.round((Object.keys(data[0].values).length - 1)/3),Math.round((Object.keys(data[0].values).length - 1)*2/3), Object.keys(data[0].values).length - 1];
        if(Object.keys(data[0].values).length < 4)
            tickValues =  [0, Math.round((Object.keys(data[0].values).length - 1)/2), Object.keys(data[0].values).length - 1];
        elem.xAxis = d3.axisBottom(scale.x)
            .ticks(scale.xTicks)
            .tickFormat(function (d, i, a) {
                var format = MomentUtils.getAxisLabelFormatFromUnit(unit);
                var label = moment().hour(d).format(format);
                if(unit>1){
                    label = moment(PageManager.getRange().start).add(d, MomentUtils.getUnitName(unit)).format(format);
                    if(i == a.length)
                        label = moment(PageManager.getRange().end).format(format);
                }
                if(unit == 3){
                    label = tid['week_of'] + ' ' + moment(PageManager.getRange().start).add(d, MomentUtils.getUnitName(unit)).startOf('week').format(format);
                    if(i == a.length)
                        label = tid['week_of'] + ' ' + moment(PageManager.getRange().end).startOf('week').format(format);
                }
                if(unit == 5)
                    label = label.replace('Quarter', tid['quarter']);

                return label;
            })
            .tickValues(tickValues);
        var selection = elem.svg.selectAll('.x-axis')
            .data([style.innerWidth]);
        selection.enter()
            .append("g")
            .classed("x-axis", true)
            .merge(selection)
            .attr('transform', "translate(0, " + (style.padding.top + style.innerHeight + 1) + ")")
            .call(elem.xAxis);
        elem.svg.selectAll('.x-axis .tick text').attr('y', style.axisFontSize - 1);
        elem.svg.selectAll('.x-axis .tick text').attr('font-size', style.axisFontSize + 'px');
        elem.svg.selectAll('.x-axis .tick text').each(function(d,i,a){
            d3.select(this)
                .attr('x', function(){
                    if(i === 0)
                        return '-10';
                    else if(i === a.length -1)
                        return '10';
                    else
                        return '0';

                })
        });
        elem.svg.selectAll('.x-axis .tick').each(function(d,i,a){
            d3.select(this)
                .attr('text-anchor', function(){
                    if(i === 0)
                        return 'start';
                    else if(i === a.length -1)
                        return 'end';
                    else
                        return 'middle';

                })
        });
    }

    function drawGridLines() {
        d3.select('#' + id + "-graph-container").select('svg').select('.y-axis').selectAll('.tick').selectAll('.grid-line').remove();
        var selection = d3.select('#' + id + "-graph-container").select('svg').select(".y-axis").selectAll(".tick")
            .append("line")
            .classed("grid-line", true)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("x2", function(d){
                return style.padding.left + style.innerWidth + style.axisJutOut;
            })
            .attr("x1", style.padding.left - style.axisJutOut);
    }

    function drawHighlightLines() {
        var highlightLineData = d3.range(Object.keys(data[0].values).length);

        elem.svg.selectAll('.highlight-line-container')
            .data(['highlight-line-container'])
            .enter()
            .append('g').classed('highlight-line-container', true);
        var lineContainer = elem.svg.select('.highlight-line-container');
        var selection = lineContainer.selectAll(".highlight-line")
            .data(d3.values(data[0].values));

        selection.enter()
            .append('line')
            .classed("highlight-line", true)
            .merge(selection)
            .attr("stroke", style.highlightLineColor)
            .attr("stroke-dasharray", style.highlightLineDashArray)
            .attr("stroke-width", "2px")
            .attr("id", function (d, i) {
                return "highlight-line-" + i
            })
            .attr("x1", function (d, i) {
                return scale.x(i)
            })
            .attr("y1", style.padding.top)
            .attr("x2", function (d, i) {
                return scale.x(i)
            })
            .attr("y2", style.innerHeight + style.padding.top)
            .style('visibility', 'hidden');
    }

    function drawData() {
        drawHighlightLines();
        for (var j = 0; j < data.length; j++) {
            drawDataDots(j);
            drawDataLine(j);
            if(defaultDisabled(j)){
                $('#' + id + '-graph-container' + ' .data-dots-' + j).hide();
            }
        }
        drawSelectionBars();
    }

    function drawDataDots(j) {
        var dotData = d3.entries(data[j].values);
        var max = d3.max(dotData, function (d) {
            return d.value
        });
        var upperDomain = max === 0 ? 5 : max;// Math.ceil(max / 5) * 5;
        var yScale = d3.scaleLinear()
            .domain([upperDomain, 0])
            .range([style.padding.top, style.innerHeight + style.padding.top]);
        var groupSel = elem.svg.selectAll('.data-dots-' + j)
            .data([data[j]]);
        var groupEnter = groupSel.enter()
            .append('g')
            .classed('data-dots-' + j, true)
            .classed('data-dots', true)
            .merge(groupSel)
            .style('display', function(){
                if(!defaultDisabled(j))
                    return 'inline';
                else
                    return 'none';
            });
        var selection = elem.svg.select(".data-dots-" + j).selectAll('.data-dot-' + j)
            .data(dotData);

        selection.enter()
            .append("circle")
            .classed('data-dot-' + j, true)
            .merge(selection)
            .attr('id', function (d, i) {
                return 'data-dot-' + j + '-' + i
            })
            .attr('class', function (d, i, a) {
                return a[i].className.baseVal + ' tick-data tick-' + i;
            })
            .attr("cx", function (d, i) {
                return scale.x(i);
            })
            .attr("cy", function (d) {
                return parseInt(yScale(d.value));
            })
            .attr("r", style.dataDotRadius)
            .style('stroke', StyleManager.getColorSet('button',j))
            .style('stroke-width', style.dataDotStrokeWidth)
            .style('fill', StyleManager.getColorSet('button',j))
            .style('visibility', 'hidden');
    }

    function drawDataLine(j) {
        var lineData = d3.entries(data[j].values);
        var max = d3.max(lineData, function (d) {
            return d.value
        });
        var upperDomain = max == 0 ? 5 : max; //Math.ceil(max / 5) * 5;

        var yScale = d3.scaleLinear()
            .domain([upperDomain, 0])
            .range([style.padding.top, style.innerHeight + style.padding.top]);
        var line = d3.line()
            .x(function (d, i) {
                return scale.x(i);
            })
            .y(function (d) {
                return yScale(d.value);
            })
            .curve(d3.curveLinear);
        var selection = elem.svg.selectAll('.data-line-' + j)
            .data([data[j]]);
        selection.enter()
            .append("path")
            .merge(selection)
            .datum(lineData)
            .classed('inactive', function(){return defaultDisabled(j);})
            .attr("fill", "none")
            .attr("stroke", StyleManager.getColorSet('button',j))
            .attr("opacity", 0.8)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", style.dataLineStrokeWidth )
            .classed('data-line-' + j, true)
            .attr("d", line);
    }

    function drawSelectionBars() {
        var bandData = d3.entries(data[0].values);
        var max = d3.max(bandData, function (d) {
            return d.value
        });
        var dataLength = bandData.length;
        var bands = d3.scaleBand()
            .domain(d3.range(dataLength))
            .range([style.padding.left - style.innerWidth / dataLength / 2, style.padding.left - style.innerWidth / dataLength / 2 + style.innerWidth / dataLength + style.innerWidth])
            .padding(0);
        scale.bandWidth = bands.bandwidth();

        elem.svg.selectAll('.selectionBarContainer')
            .data(['selectionBarContainer'])
            .enter()
            .append('g')
            .classed('selectionBarContainer', true);

        var selection = elem.svg.select('.selectionBarContainer').selectAll(".selectionBar")
            .data(bandData);

        selection.enter()
            .append("rect")
            .classed('selectionBar', true)
            .merge(selection)
            .attr("x", function (d, i) {
                return bands(i);
            })
            .attr("y", style.padding.top)
            .attr("width", bands.bandwidth())
            .attr("height", style.innerHeight)
            .style('fill', 'transparent')
            .on('mouseenter', function(d,i,a){
                rc.sendEvent('updateTooltip',tooltipData(d,i,a));
                highlightLine(d,i,a);
            })
            .on('touchstart', function(d,i,a){
                rc.sendEvent('updateTooltip',tooltipData(d,i,a));
                highlightLine(d,i,a);
            })
            .on('touchmove', function(d,i,a){
                rc.sendEvent('updateTooltip',tooltipData(d,i,a));
                highlightLine(d,i,a);
            });
        selection.exit().remove();
    }

    function highlightLine(d,i,a){
        elem.svg.selectAll('.highlight-line')
            .style('visibility', 'hidden');
        elem.svg.select('#highlight-line-' + i)
            .style('visibility', 'visible');
        elem.svg.selectAll('.tick-data')
            .style('visibility', 'hidden');
        elem.svg.selectAll('.tick-' + i)
            .style('visibility', 'visible');
    }

    function tooltipData(d,i,a){
        var headlines = getTooltipHeadlines(i);
        return {
            headline: headlines[0],
            subHeadline: headlines[1],
            body: getTooltipBody(d,i,a),
            defaultY: style.padding.top + 93,
            index: i
        }
    }

    function drawButtons() {
        var selection = elem.container.selectAll('.buttons')
            .data([id]);
        selection.enter()
            .append('nav')
            .classed('buttons', true);

        var buttonData = [];
        for (var i = 0; i < data.length; i++) {
            buttonData.push(data[i].total);
        }
        var buttons = elem.container.select('.buttons').selectAll('.button')
            .data(buttonData);

        buttons.enter()
            .append('div')
            .classed('button', true)
            .classed('unselectable', true)
            .attr('index', function(d,i){return i;})
            .style('top', 0)
            .style('left', function (d, i) {
                return i * 70 + 'px'
            })
            .on('click', function (d, i) {
                buttonClicked(i)
            })
          .merge(buttons)
            .classed('disabled-button', function(d,i){
                return defaultDisabled(i);
            })
            .html(function (d, i) {
                return '<div class="button-background" style="background-color: ' + StyleManager.getColorSet('button',i) + ';"></div><div class="button-headline-div"><span class="button-headline">' + config.get("prefixes",i) + tid[config.get("tids",i)] + '</span></div><div class="button-body">' + config.get("formatFunctions",i)(d) + '</div>';
            })
            .on('mouseover', function (d, i, a) {
                if (a[i].className.indexOf('disabled-button') != -1) {
                    elem.svg.select('.data-line-' + i).classed('shadow', true);
                }
            })
            .on('mouseleave', function (d, i, a) {
                if (a[i].className.indexOf('disabled-button') != -1) {
                    elem.svg.select('.data-line-' + i).classed('shadow', false);
                }
            });
    }

    function buttonClicked(j) {
        var button = elem.container.select('.button:nth-child(' + (j + 1) + ')');
        var dataLine = elem.svg.select('.data-line-' + j);
        if(button.classed('disabled-button')){
            button.classed('disabled-button', false);
            dataLine.classed('inactive', false);
            elem.svg.select('.data-dots-' + j).style('display', 'block');
        }else {
            button.classed('disabled-button', true);
            dataLine.classed('inactive', true);
            elem.svg.select('.data-dots-' + j).style('display', 'none');
        }
        dataLine.classed('shadow', false);
        checkLineCombination(j);
    }

    function buttonReset(){
        d3.selectAll('.print').remove();
    }

    function checkLineCombination(){
        elem.container.selectAll('.combination-line').remove();
        var selection = elem.container.selectAll('.button').filter(function(){return !d3.select(this).classed('disabled-button')});
        if(selection.nodes().length == 2){
            var index1 = d3.select(selection.nodes()[0]).attr('index');
            var index2 = d3.select(selection.nodes()[1]).attr('index');
            var combinationsConfig = config.get("combinations");
            if(combinationsConfig){
                if(combinationsConfig.indexOf(index1 + '/' + index2) !== -1 ){
                    drawCombinationLine(index1, index2);
                }else if(combinationsConfig.indexOf(index2 + '/' + index1) !== -1 ){
                    drawCombinationLine(index2, index1);
                }
            }
        }
    }

    function drawCombinationLine(index1, index2){
        var combIndex = config.get("combinations").indexOf(index1 + '/' + index2);
        var firstData = d3.entries(data[index1].values);
        var secondData = d3.entries(data[index2].values);
        var lineData = firstData.map(function(d,i){
            if(secondData[i].value === 0)
                return {key: d.key, value: 0};
            else
                return {key: d.key, value: d.value / secondData[i].value};
        });
        combinationData = lineData;
        var max = d3.max(lineData, function (d) {
            return d.value
        });
        var min = d3.min(lineData, function (d) {
            return d.value
        });
        //var upperDomain = max == 0 ? 5 : max; //Math.ceil(max / 5) * 5;
        var domain = config.get("combinationRanges",combIndex) ? config.get("combinationRanges",combIndex) : [max,0];
        var yScale = d3.scaleLinear()
            .domain(domain)
            .range([style.padding.top, style.innerHeight + style.padding.top]);
        var line = d3.line()
            .x(function (d, i) {
                return scale.x(i);
            })
            .y(function (d) {
                return yScale(d.value);
            })
            .curve(d3.curveLinear);
        var selection = elem.svg.selectAll('.combination-line')
            .data(['combination-line']);
        selection.enter()
            .append("path")
            .merge(selection)
            .datum(lineData)
            .attr("index1", index1)
            .attr("index2", index2)
            .attr("fill", "none")
            .attr("stroke", 'grey')
            .attr("opacity", 0.8)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 2)
            .classed('combination-line', true)
            .attr("d", line);
    }

    function getTooltipHeadlines(_index) {
        var main = '';
        var sub = '';
        var mom = moment(PageManager.getRange().start).add(_index, MomentUtils.getUnitName(unit));
        switch (id) {
            case 'totals':
            default:
                switch (MomentUtils.getUnitName(unit)){
                    case 'hours':
                        main = mom.format(MomentUtils.getLocaleFullDayFormat());
                        sub = moment(mom).format('HH:mm') + ' - ' + moment(mom).add(1,'hour').format('HH:mm');
                        break;
                    case 'days':
                        main = moment(mom).format(MomentUtils.getLocaleFullDayFormat());
                        break;
                    case 'weeks':
                        main = moment(mom).startOf('week').format('[' + tid['week_of'] + ' ] ' + MomentUtils.getLocaleFullDayFormat());
                        sub = moment(moment.max( moment(mom).startOf('week'), PageManager.getRange().start)).format(MomentUtils.getLocaleFullDayShortFormat()) + ' - ' + moment(moment.min(moment(mom).endOf('week'),PageManager.getRange().end)).format(MomentUtils.getLocaleFullDayShortFormat());
                        break;
                    case 'months':
                        main = moment(mom).startOf('month').format('YYYY-MM');
                        sub = moment(moment.max( moment(mom).startOf('month'), PageManager.getRange().start)).format('YYYY-MM-DD') + ' - ' + moment(moment.min( moment(mom).endOf('month'), PageManager.getRange().end)).format('YYYY-MM-DD');
                        break;
                    case 'quarters':
                        main = moment(mom).startOf('quarter').format('YYYY [Quarter] Q');
                        sub = moment(moment.max( moment(mom).startOf('quarter'), PageManager.getRange().start)).format('YYYY-MM-DD') + ' - ' + moment(moment.min( moment(mom).endOf('quarter'), PageManager.getRange().end)).format('YYYY-MM-DD');
                        break;
                    case 'years':
                        main = moment(mom).startOf('year').format('YYYY');
                        sub = moment(moment.max( moment(mom).startOf('year'), PageManager.getRange().start)).format('YYYY-MM-DD') + ' - ' + moment(moment.min( moment(mom).endOf('year'), PageManager.getRange().end)).format('YYYY-MM-DD');
                        break;
                    default:
                        break;
                }
        }
        return [MomentUtils.getMain(_index, id), MomentUtils.getSub(_index, id)];
    }

    function getTooltipBody(d, i, a) {
        var body = '';
        data.forEach(function(datum, index, array){

            var filtered = elem.container.selectAll('.button').filter(function(d,i,a){ return (d3.select(this).attr('index') == index) });
            if(!filtered.classed('disabled-button')){
                body += '<p class="tooltip-entry" id="tooltip-' + i + '">';

                var value = config.get("formatFunctions",index)(d3.entries(data[index].values)[i].value);
                body += '<span class="color-box" style="color:' + StyleManager.getColorSet('button',index) + '">&FilledSmallSquare;</span>' + config.get("prefixes",index) + tid[config.get("tids",index)] + ': ' + value;
                body += '</p>';
            }

        });
        if(elem.svg.select('.combination-line').nodes().length){
            var index1 = elem.svg.select('.combination-line').attr('index1');
            var index2 = elem.svg.select('.combination-line').attr('index2');
            var indexOfCombination = config.get("combinations").indexOf(index1 + '/' + index2);
            body += '<p class="tooltip-entry" id="tooltip-' + i + '">';
            var value = combinationData[i].value;
            var formattedValue = isNaN(value) ? '0' : config.get("combinationFormats",indexOfCombination)(value);
            body += '<span class="color-box" style="color:grey">&FilledSmallSquare;</span>' + tid[config.get("combinationTids",indexOfCombination)] + ': ' + formattedValue;
            body += '</p>';
        }
        return body;
    }

    return {
        pushData: onData
    }

}

var ResizeManager = (function ResizeManager(){
    var now = Date.now();
    var lastResizeCall = Date.now();
    var delayTime = 300;

    function onResize(){
        lastResizeCall = now;
        setTimeout(checkResize, delayTime);
    }

    function checkResize(){
        if(Date.now()+2-delayTime > lastResizeCall){
            imc.sendEvent('resize');
            $('#content').css({height: $(window).height() - 36 + 'px'});
        }
    }

    function debug(){
        return {
            last: lastResizeCall
        }
    }

    return {
        resize: onResize,
        debug: debug
    }
}());

window.onresize = ResizeManager.resize;

window.onload = function () {
    imc.sendEvent('onload');
    PageManager.onload();
    ResizeManager.resize();
};

$(window).on('click', function(event){
    imc.sendEvent('globalClick');
    if(window.printMode){
        window.printMode = false;
        imc.sendEvent('leave-print-mode');
    }
});

// Polyfills for Browser compatibility


if (typeof Object.assign != 'function') {  // IE polyfill
    Object.assign = function (target) {
        'use strict';
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        target = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source != null) {
                for (var key in source) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    };
}

function reset(){
    localStorage.removeItem('customPagePresets');
    if( localStorage.getItem('custemPagePresets') )
        return 'not done!';
    else
        return 'done!';
}

function EventEmitter() {
    var events = {};
    function on(eventName, fn){
        if( !events[eventName] ) {
            events[eventName] = [];
        }

        events[eventName].push(fn);

        return function() {
            events[eventName] = events[eventName].filter(function(eventFn){ return (fn !== eventFn); });
        }
    }

    function sendEvent(eventName, data){
        var event = events[eventName];
        if( event ) {
            event.forEach(function(fn) {
                fn.call(null, data);
            });
        }
    }

    function clearAll(){
        var keys = Object.keys(events);
        for(var i = 0; i< keys.length; i++){
            clear(keys[i]);
        }
    }

    function clear(key){
        delete events[key];
    }

    return {
        on: on,
        sendEvent: sendEvent,
        clear: clear,
        clearAll: clearAll
    }
}
var imc = new EventEmitter();

var MomentUtils = (function MomentUtils() {

    var HOURS = 1;
    var DAYS = 2;
    var WEEKS = 3;
    var MONTHS = 4;
    var QUARTERS = 5;
    var YEARS = 6;

    var unit = HOURS;

    var unitNames = ['none', 'hours', 'days', 'weeks', 'months', 'quarters', 'years'];
    var axisLabelFormats =  ["", "HH:[00]",getLocaleFullDayShortFormat(), 'l',"MMMM YYYY","[Quarter ]Q YYYY","YYYY"];
    var fullWorkTime = [0, 3600, 3600*8, 3600*40, 3600*8*20, 3600*8*20*3, 3600*8*20*12, 3600*8*20*12*10];
    var minWorkTime = [0, 1800, 3600, 3600, 3600, 3600, 3600, 3600];

    function durationString_h_min_FromSeconds(_seconds){  //  '1 h 5 min'
        var hours = Math.floor(Math.round(_seconds/60) / 60);
        var minutes = Math.round(_seconds/60) % 60;
        if(hours === 0 && minutes === 0)
            return '0 min';
        else if(hours === 0)
            return minutes + ' min';
        else if(minutes === 0 || hours > 99)
            return hours + ' h';
        else
            return hours + ' h ' + minutes + ' min';
    }

    function durationString_h_min_s_fromSeconds(_seconds){
        if(_seconds === 0)
            return '0';
        var hours = Math.floor(_seconds / 60 / 60);
        var hoursString = hours? (hours + ' h '): '';
        var minutes = Math.floor(_seconds/60) % 60;
        var minutesString = minutes? (minutes + ' min '): '';
        var seconds = Math.round(_seconds) % 60;
        var secondsString = seconds? (seconds + ' s'): '';
        return hoursString + minutesString + secondsString;
    }

    function durationString_min_s_FromSeconds(_seconds){  // '55:34'
        return Math.floor(_seconds/ 60 ) + ':' + Math.round(_seconds) % 60;
    }

    function formatSeconds(_seconds){ //  '55:34'  // difference from above?
        var date = new Date(null);
        date.setSeconds(_seconds); // specify value for SECONDS here
        return date.toISOString().substr(11, 8);
    }

    function scaleSecondsToWorkTime(_seconds){ // ??
        if(_seconds < minWorkTime[unit])
            return 0;
        return _seconds / fullWorkTime[unit];
    }

    function getLocaleFullDayFormatDayName() {  // 'Montag, 13. September 2017'
        var localeData = moment.localeData(moment.locale());
        return localeData.longDateFormat('LLLL').replace(localeData.longDateFormat('LT'), '');
    }

    function getLocaleFullDayFormat() {  //  '13. September 2017'
        var localeData = moment.localeData(moment.locale());
        return localeData.longDateFormat('LLLL').replace(localeData.longDateFormat('LLL').replace(localeData.longDateFormat('LL'), ''), '');
    }

    function getLocaleFullDayShortFormat() { // '13. Sept. 2017'
        var localeData = moment.localeData(moment.locale());
        return localeData.longDateFormat('llll').replace(localeData.longDateFormat('lll').replace(localeData.longDateFormat('ll'), ''), '');
    }

    function dualString (_int){
        return (_int.toString().length > 1) ? _int.toString().substr(0, 2) : '0' + _int;
    }

    function calcDisplayUnitsAndRanges(_range){
        if (_range.diff('days', true) < 2)
            unit = HOURS;
        else if (_range.diff('weeks', true) < 6)
            unit = DAYS;
        else if (_range.diff('months', true) < 7)
            unit = WEEKS;
        else if (_range.diff('quarters', true) < 6)
            unit = MONTHS;
        else if (_range.diff('years', true) < 6)
            unit = QUARTERS;
        else
            unit = YEARS;
        return unit;
    }

    function getFullWorkingTime(){
        var hours = moment.duration(fullWorkTime[unit], 'seconds').asHours();
        var format = hours > 1 ? 'hh' : 'h';
        return moment.localeData().relativeTime(hours, true, format, true);
    }

    function getMinWorkingTime(_unit){
        var minutes = moment.duration(minWorkTime[_unit], 'seconds').asMinutes();
        var format = hours > 1 ? 'mm' : 'm';
        if(minutes > 59){
            var hours = moment.duration(minWorkTime[_unit], 'seconds').asHours();
            var hourFormat = hours > 1 ? 'hh' : 'h';
            return moment.localeData().relativeTime(hours,true, hourFormat, true );
        }
        return moment.localeData().relativeTime(minutes, true, format, true);
    }

    function hourSpanFromDateString(_dateString){
        var hourStart = _dateString.split('-')[3];
        return dualString(hourStart) + ':00 - ' + dualString(parseInt(hourStart) + 1) + ':00';
    }

    function formatTableDataKey(_key){
        if(!_key){
            return 'not defined';
        }
        if(_key.split('-').length > 3){
            return hourSpanFromDateString(_key);
        }else {
            return moment(_key).format(localeFormat('ll'));
        }
    }

    function localeFormat(_short) {
        return moment.localeData(moment.locale()).longDateFormat(_short);
    }

    function getRangeLocaleString_LL() {
        var range = PageManager.getRange();
        var format = localeFormat('LL');
        var same = range.start.format(format) === range.end.format(format);
        return same ? range.start.format(getLocaleFullDayFormatDayName()) : (range.start.format(format) + ' - ' + range.end.format(format));
    }


    function getMain(_index, _id) {
        var main = '';
        var mom = moment(PageManager.getRange().start).add(_index, unitNames[unit]);
        switch (_id) {
            case 'totals':
            default:
                switch (unitNames[unit]){
                    case 'hours':
                        main = mom.format(getLocaleFullDayShortFormat());
                        // main = mom.format('dd YYYY-MM-DD');
                        break;
                    case 'days':
                        main = moment(mom).format(getLocaleFullDayFormat());
                        break;
                    case 'weeks':
                        main = moment(mom).startOf('week').format('[' + tid['week_of'] + ' ] ' + getLocaleFullDayFormat());
                        break;
                    case 'months':
                        main = moment(mom).startOf('month').format('MMMM YYYY');
                        break;
                    case 'quarters':
                        main = moment(mom).startOf('quarter').format('[' + tid["quarter"] + '] Q, YYYY');
                        break;
                    case 'years':
                        main = moment(mom).startOf('year').format('YYYY');
                        break;
                    default:
                        break;
                }
        }
        return main;
    }

    function getSub(_index, _id) {
        var sub = '';
        var mom = moment(PageManager.getRange().start).add(_index, unitNames[unit]);
        switch (_id) {
            case 'totals':
            default:
                switch (unitNames[unit]){
                    case 'hours':
                        sub = moment(mom).format('HH:mm') + ' - ' + moment(mom).add(1,'hour').format('HH:mm');
                        break;
                    case 'weeks':
                        sub = moment(moment.max( moment(mom).startOf('week'), PageManager.getRange().start)).format(getLocaleFullDayShortFormat()) + ' - ' + moment(moment.min(moment(mom).endOf('week'),PageManager.getRange().end)).format(getLocaleFullDayShortFormat());
                        break;
                    case 'months':
                        sub = moment(moment.max( moment(mom).startOf('month'), PageManager.getRange().start)).format(localeFormat('L')) + ' - ' + moment(moment.min( moment(mom).endOf('month'), PageManager.getRange().end)).format(localeFormat('L'));
                        break;
                    case 'quarters':
                        sub = moment(moment.max( moment(mom).startOf('quarter'), PageManager.getRange().start)).format(localeFormat('L')) + ' - ' + moment(moment.min( moment(mom).endOf('quarter'), PageManager.getRange().end)).format(localeFormat('L'));
                        break;
                    case 'years':
                        sub = moment(moment.max( moment(mom).startOf('year'), PageManager.getRange().start)).format(localeFormat('L')) + ' - ' + moment(moment.min( moment(mom).endOf('year'), PageManager.getRange().end)).format(localeFormat('L'));
                        break;
                    default:
                        break;
                }
        }
        return sub;
    }

    function formatRating(number){
        return precisionRound(number, 1)
    }

    function precisionRound(number, precision) {
        var factor = Math.pow(10, precision);
        return Math.round(number * factor) / factor;
    }

    function precisionFloor(number, precision) {
        var factor = Math.pow(10, precision);
        return Math.floor(number * factor) / factor;
    }

    function relativeToPercent(_relative) {
        return precisionRound(_relative * 100, 2) + '%';
    }

    function formatExportTableHeadlineEntry(string) {
        var start = moment(string, "YYYY-MM-DD-H");
        var end = moment(start).add(moment.duration(1, unitNames[unit]));
        switch(unit) {
            case 1:
                return start.format('L, HH:mm') + ' - ' + end.format('HH:mm');
                break;
            case 2:
                return start.format('L');
                break;
            default:
                return start.format('L') + ' - ' + end.format('L');
                break;
        }
    }

    return {
        localeFormat: localeFormat,
        calcUnit: function(_range){return calcDisplayUnitsAndRanges(_range)},
        dualString: dualString,
        timeStringFromSeconds: formatSeconds,
        getLocaleFullDayFormat: getLocaleFullDayFormat,
        getLocaleFullDayShortFormat: getLocaleFullDayShortFormat,
        getAxisLabelFormatFromUnit: function(_unit){return axisLabelFormats[_unit];},
        getUnitName: function(){return unitNames[unit];},
        formatRatio: function(d){return Math.round(d*100) + '%';},
        round2: function(d){return Math.round(d*100)/100;},
        durationString_h_min_s_fromSeconds: durationString_h_min_s_fromSeconds,
        durationStringFromSeconds:durationString_h_min_FromSeconds,
        getFullWorkingTime: getFullWorkingTime,
        getMinWorkingTime: getMinWorkingTime,
        scaleSecondsToWorkTime: scaleSecondsToWorkTime,
        hourSpanFromDateString: hourSpanFromDateString,
        formatTableDataKey:formatTableDataKey,
        rangeString: getRangeLocaleString_LL,
        getMain: getMain,
        getSub: getSub,
        relativeToPercent: relativeToPercent,
        formatExportTableHeadlineEntry: formatExportTableHeadlineEntry,
        getUnit: function(){return unit;},
        formatRating: formatRating,
        precisionFloor: precisionFloor,
        ident: function(x){return x;}
    }
}());

var RequestUtils = (function RequestUtils(){

    var requestQueue = [];
    var waitingForRequest = '';
    var getDataStartTime = Date.now();
    var cancelled = '';

    function calcRequestPostDataInterval(_range){
        return {
            'unit': MomentUtils.getUnit(),  // day = 1, week = 2, month = 3, quarter = 4, year = 5
            'year': moment(_range.start).year(),
            'month': moment(_range.start).month() + 1,
            'day': moment(_range.start).date(),
            'toyear': moment(_range.end).year(),
            'tomonth': moment(_range.end).month() + 1,
            'today': moment(_range.end).date()
        };
    }

    function getData(_callback, _postData, _range, _method, _url){
        getDataStartTime = Date.now();
        if(_range)
            Object.assign(_postData, calcRequestPostDataInterval(_range));

        $.ajax({
            url: _url ? _url : "analytics.php",
            method: _method ? _method : "post",
            data: _postData ? _postData : {},
            dataType: "text",
            success: function(_resultData, status, xhr){
                imc.sendEvent('requestDone', {pendingRequests: requestQueue.length});
                try {
                    var parsedData = JSON.parse(_resultData);
                }catch(e) {
                    console.log('errorparsing ' + _postData.request);
                    console.log(String.prototype.substr.call(_resultData, [0,50]));
                }
                // console.log('success: ' + _postData.request + ' took ' + (Date.now() - getDataStartTime) + ' ms ');
                // if(_postData.request === 'TOPsVisitors')
                //     console.log(parsedData);
                if(requestQueue.length){
                    var next = requestQueue.shift();
                    getData(next.callback, next.postData, next.range, next.method, next.url);
                    waitingForRequest = next.postData.request;
                }else
                    waitingForRequest = '';
                if(cancelled === _postData.request)
                    cancelled = '';
                else
                    _callback(_postData.request, parsedData);
            },
            error: function(err){
                console.log('Error ' + _postData.request + ' retrieving Data: ' + err);
                imc.sendEvent('requestDone', {pendingRequests: requestQueue.length});
                if(requestQueue.length){
                    var next = requestQueue.shift();
                    getData(next.callback, next.postData, next.range, next.method,next.url);
                }else{
                    waitingForRequest = '';
                }
            }
        });
    }

    function queueBundle(bundleVal){

    }

    function queueRequest(_callback, _postData, _range, _method, _url){
        if(waitingForRequest === ''){
            waitingForRequest = _postData.request;
            getData(_callback,_postData, _range, _method,_url);
        }else{
            for(var i = 0; i < requestQueue.length; i++){
                if(requestQueue[i].postData.request === _postData.request){
                    requestQueue.splice(i,1);
                    break;
                }
            }
            requestQueue.push({
                callback:_callback,
                postData: _postData,
                range: _range,
                method: _method,
                url: _url
            });
        }
    }

    function clearQueue(){
        cancelled = waitingForRequest;
        requestQueue = [];
    }

    imc.on('dateChange', function(){
        clearQueue();
    });

    return {
        getBundle:queueBundle,
        getData:queueRequest,
        getQueueLength: function(){return requestQueue.length},
        clearQueue: clearQueue
    }
}());

var DataManager = (function DataManager(){

    var knownData = {};

    var requestedData = {};

    var ee = new EventEmitter();

    function onData(key, data){
        knownData[key] = data;
        delete requestedData[key];
        ee.sendEvent(key, data);
        ee.clear(key);
    }

    function getData(key, data, callback){
        if(knownData.hasOwnProperty(key))
            return knownData[key];
        else if(requestedData.hasOwnProperty(key)){
            ee.on(key, callback);
        }else{
            ee.on(key, callback);
            RequestUtils.getData(onData, data.postData, data.range);
        }
    }

    function clearCache(){
        ee.clearAll;
        knownData = {};
        requestedData = {};
    }

    return {
        getData: getData,
        clearCache: clearCache
    }
}());

var LoadingScreenManager = (function LoadingScreenManager(){

    var container, text, loader;
    var mode = 'spinner';

    function init(){
        container = $('#center-loader');
        text = container.find('#center-loader-text');
        loader = container.find('#loader');
        setTimeout(function(){
            if(!PageManager.isLoaded()){
                container.show();
            }
        },300);
    }

    imc.on('onload', init);

    function reset(){
        loader.empty();
        text.empty();
        loader.removeClass('progress').addClass('loader');
        mode = 'spinner';
    }

    function showSpinner(){
        reset();
        container.show();
    }

    function attachProgress(_message){
        $('#page-grid').hide();
        loader.empty();
        text.html(_message);
        mode = 'progress';
        container.show();
    }

    function progress(_value, _of, _message){
        if(mode != 'progress')
            attachProgress(_message);
        text.html(_message + '(' + _value + '/' + _of + ')');
    }

    function hide(){
        reset();
        $('#page-grid').show();
        container.hide();
    }

    return {
        showSpinner: showSpinner,
        progress: progress,
        hide: hide
    }

}());

var PrintManager = (function PrintManger(){
    var active = false;
    var missingData = 0;
    var queueLength = 0;
    var message = '';

    var hiddenEntries, moreButtons;

    function preparePrint(){
        message = tid['generating_print_data'];
        active = true;
        queueLength  = RequestUtils.getQueueLength();
        if(queueLength > 0){
            missingData = queueLength;
            LoadingScreenManager.progress(1, missingData, message);
        }else {
            doPrint();
        }
    }

    function doPrint(){ 
        active = false;
        window.printMode = true;
        $('#content').css({height: 'auto'});
        hiddenEntries = $('tr.entry').filter(function(){return $( this ).css( "display" ) == "none"});
        moreButtons = $('.table-show-more').filter(function(){return $( this ).css( "display" ) != "none"});
        hiddenEntries.show();
        moreButtons.hide();
        imc.sendEvent('enter-print-mode');
        print();
        setTimeout(function(){
            hiddenEntries.hide();
            moreButtons.show();
        },1000)
    }

    imc.on('requestDone', function(_data){
        if(!active)
            return;
        queueLength = _data.pendingRequests;
        if(_data.pendingRequests > 0) {
            LoadingScreenManager.progress(missingData - queueLength + 1, missingData, message);
        }else{
            active = false;
            LoadingScreenManager.hide();
            setTimeout(doPrint,1000);
        }
    });


    return {
        print: preparePrint
    }
}());

var PageManager = (function PageManager() {
    var loaded = false;
    var currentPageIndex = 0;
    var datepicker;
    var initData;
    var pages = [
        {
            name: 'overview',
            reports: ['overview']
        },{
            name: 'chats',
            reports: ['chats', 'chatNumbers', 'chatsBar', 'chatTags']
        },{
            name: 'tickets',
            reports: ['tickets', 'ticketNumbers', 'ticketsBar', 'ticketTags']
        },{
            name: 'availability',
            reports: ['availability']
        },{
            name: 'visitors',
            reports: ['visitors', 'visitorNumbers', 'TOPsVisitors', 'TOPsPages' ]
        },{
            name: 'events',
            reports: ['events', 'eventsBar', 'goalsBar']
        },{
            name: 'feedbacks',
            unitCondition: ['1', '2345678', '2345678'],
            reports: ['feedbacksDayNumbers', 'feedbacks', 'feedbacksBar']
        },{
            name: 'knowledgebase',
            reports: ['TOPsKnowledgeBase']
        }
    ];

    function onload(){
        drawNav();
        initDatePicker();
        document.title = 'LiveZilla Report ' + MomentUtils.rangeString();
        DataManager.getData('preInit',{postData:{request:'preInit'}},onInitData);
    }

    function getReportsForPageAndCondition(){
        var pageDefinition = pages[currentPageIndex];
        if(pageDefinition.hasOwnProperty('unitCondition')){
            var unit = MomentUtils.getUnit();
            var availableReports = pageDefinition.reports;
            var activeReports = [];
            for(var i=0; i<availableReports.length; i++){
                if(pageDefinition.unitCondition[i].indexOf(unit.toString()) !== -1){
                    activeReports.push(pageDefinition.reports[i]);
                }
            }
            return activeReports;
        }else{
            return pageDefinition.reports;
        }
    }

    function showPage(_page, _init){
        var range = datepicker.getRange();
        // RequestUtils.clearQueue();
        if(parseInt( _page ) == _page && _page >= 0){
            currentPageIndex = _page;
        }else if( typeof(_page) == 'string'){
            var found;
            for(var pageIndex in pages){
                if(pages[pageIndex].name == _page){
                    found = true;
                    currentPageIndex = pageIndex;
                }
            }
            if(!found){
            }
        }


        var pageReports = getReportsForPageAndCondition();
        ReportManager.fillPage(pageReports, _init);

        if(!loaded){
            loaded = true;
            LoadingScreenManager.hide();
        }
    }

    function onInitData(_data){
        initData = _data;
        showPage(currentPageIndex, true);
        datepicker.generateShortcuts();
    }

    function initDatePicker(){
        MomentUtils.calcUnit(initialRange);
        datepicker = new DatePicker(window.initialRange);
        datepicker.attach();
    }

    function drawNav(){
        var day = moment(initialRange.start).format('YYYY-DD-MM') === moment(initialRange.end).format('YYYY-DD-MM');
        var pagesElem = d3.select('#left-button-list');

        pagesElem.selectAll('.lzm-tabs')
            .data(pages)
            .enter()
            .append('span')
            .classed('lzm-tabs', true)
            .classed('lzm-tabs-selected',function(d,i){return i === currentPageIndex;})
            .classed('lzm-unselectable', true)
            .on('click', function(d,i,a){
                $(a[i]).addClass('lzm-tabs-selected').siblings().removeClass('lzm-tabs-selected');
                imc.sendEvent('nav-click');
                showPage(i, false);
            })
            .append('span')
            .html(function(d){return tid[d.name] || d.name});
        var rightNav = d3.select('#right-button-list');

        rightNav.selectAll('#print').data(['print']).enter().append('span')
            .classed('lzm-button-e', true)
            .attr('id', 'print')
            .on('click', function(){
                PrintManager.print();
            })
            .html(function(){return '<i class="fa fa-print"></i>';});
        rightNav.selectAll('#export').data(['export']).enter().append('span')
            .classed('lzm-button-e', true)
            .attr('id', 'export')
            .on('click', function(){
                ExportManager.export();
            })
            .html(function(){return '<i class="fa fa-download"></i>';});
        rightNav.selectAll('#prevDay').data(['prevDay']).enter().append('span')
            .classed('lzm-button-e', true)
            .classed('nodisplay', !day)
            .attr('id', 'prevDay')
            .on('click', function(){
                datepicker.setDay(false);
            })
            .html(function(){return '<i class="fa fa-arrow-left"></i>';});
        rightNav.selectAll('#picker').data(['picker']).enter().append('span')
            .classed('lzm-button-e', true)
            .classed('lzm-unselectable', true)
            .attr('id', 'picker');
        rightNav.selectAll('#nextDay').data(['nextDay']).enter().append('span')
            .classed('lzm-button-e', true)
            .classed('nodisplay', !day)
            .attr('id', 'nextDay')
            .on('click', function(){
                datepicker.setDay(true);
            })
            .html(function(){return '<i class="fa fa-arrow-right"></i>';});
    }

    imc.on('dateChange', function(_range){
        MomentUtils.calcUnit(_range);
        DataManager.clearCache();
        var same = _range.start.format('YYYY-MM-DD') === _range.end.format('YYYY-MM-DD');
        if(same)
            $('#nextDay, #prevDay').removeClass('nodisplay');
        else
            $('#nextDay, #prevDay').addClass('nodisplay');
        document.title = 'LiveZilla Report ' + MomentUtils.rangeString();
    });

    imc.on('leave-print-mode', function(){
        // $('#analytics-headline').show();
    });

    imc.on('enter-print-mode', function(){
        // $('#analytics-headline').hide();
    });

    return {
        onload: onload,
        showPage: showPage,
        getRange: function(){return datepicker.getRange();},
        isLoaded: function(){return loaded;},
        getInitData: function(){return initData;},
        getCurrentIndex: function () {return currentPageIndex},
        getReportsForPageAndCondition: getReportsForPageAndCondition
    };
}());

var ReportManager = (function ReportManager() {
    var activeReports = [];
    var currentReports = [];
    var notCurrentReports = [];
    var currentPageReportIDs = [];
    var soloMode = '';

    var reportsConfig = [
        {
            id: 'overview',
            tid: 'overview',
            graphName: 'LineGraph',
            graphConfig: {
                defaultActive: [1,1,1,1],
                prefixes: ['', '', '', '', ''],
                tids: ['chats', 'tickets', 'visitors', 'operators'],
                names: ['Chats', 'Tickets', 'Visitors', 'Operators'],
                formatFunctions: [MomentUtils.ident]
            }
        },
        {
            id: 'chats',
            tid: 'chats',
            graphName: 'LineGraph',
            graphConfig: {
                defaultActive: [true, true, false],
                prefixes: ['', '', '', '', 'Ø '],
                tids: ['chats', 'accepted', 'declined', 'missed'],
                names: ['Total', 'Accepted', 'Declined', 'Missed'],
                formatFunctions: [MomentUtils.ident]
            }
        },
        {
            id: 'chatNumbers',
            tid: 'chats',
            graphName: 'NumberGraph',
            graphConfig: {
                formatFunctions: [MomentUtils.timeStringFromSeconds, MomentUtils.timeStringFromSeconds, MomentUtils.ident]
            }
        },
        {
            id: 'chatsBar',
            tid: 'chats',
            graphName: 'BarGraph',
            graphConfig:{
                formatFunctions: [MomentUtils.ident, MomentUtils.ident, MomentUtils.ident, MomentUtils.ident, MomentUtils.durationString_h_min_s_fromSeconds]
            }
        },
        {
            id: 'chatTags',
            tid: 'chats',
            graphName: 'TableGraph',
            getHeadline: function (){
                return  '';
            }
        },
        {
            id: 'tickets',
            tid: 'tickets',
            graphName: 'LineGraph',
            toggles: ['groups', 'operators'],
            graphConfig: {
                defaultActive: [true, true, true, false],
                prefixes: [''],
                tids: ['new_tickets','closed', 'deleted', 'incoming_messages', 'outgoing_messages' ],
                names: ['Total', 'Closed', 'Deleted', 'Incoming Messages', 'Outgoing Messages'],
                formatFunctions: [MomentUtils.ident]
            }
        },
        {
            id: 'ticketNumbers',
            tid: 'tickets',
            graphName: 'NumberGraph',
            graphConfig: {
                formatFunctions: [MomentUtils.timeStringFromSeconds, MomentUtils.ident]
            }
        },
        {
            id: 'ticketsBar',
            tid: 'tickets',
            graphName: 'BarGraph',
            graphConfig:{
                formatFunctions: [MomentUtils.ident, MomentUtils.ident, MomentUtils.ident, MomentUtils.ident, MomentUtils.ident, MomentUtils.durationStringFromSeconds, MomentUtils.durationStringFromSeconds]
            }
        },
        {
            id: 'ticketTags',
            tid: 'tickets',
            graphName: 'TableGraph',
            getHeadline: function (){
                return  '';
            }
        },
        {
            id: 'availability',
            tid: 'availability',
            graphName: 'BarGraph',
            graphConfig:{
                formatFunctions: [MomentUtils.durationStringFromSeconds]
            }
        },
        {
            id: 'visitors',
            tid: 'visitors',
            graphName: 'LineGraph',
            graphConfig: {
                tids: ['visitors', 'new', 'page_impressions', 'browser_instances', 'bounces'],
                prefixes: [''],
                names: ['Visitors', 'New Visitors', 'Page impressions', 'Browser Instances', 'Bounces'],
                formatFunctions: [MomentUtils.ident],
                additionalTids: ['recurring', 'pages_per_visitor', 'browser_instances_per_visitor'],
                combinations: ['1/0', '2/0', '3/0', '4/0'],
                combinationTids: ['ratio_new_visitors', 'pages_per_visitor', 'browser_instances_per_visitor', 'bounce_rate'],
                combinationFormats: [MomentUtils.formatRatio, MomentUtils.round2, MomentUtils.round2, MomentUtils.formatRatio],
                combinationRanges: [[1,0], '', '', [1,0]]
            }
        },
        {
            id: 'visitorNumbers',
            tid: 'visitors',
            graphName: 'NumberGraph',
            graphConfig: {
                formatFunctions: [MomentUtils.timeStringFromSeconds, function(d){return (MomentUtils.round2(d) + '%')}, MomentUtils.ident]
            }
        },
        {
            id: 'TOPsVisitors',
            tid: 'visitors',
            graphName: 'TableGraph',
            getHeadline: function (){
                return  tid['tops'] + ' ' +  tid['visitors'];
            }
        },
        {
            id: 'TOPsPages',
            tid: 'pages',
            graphName:'TableGraph',
            getHeadline: function (){
                return  tid['tops'] + ' ' +  tid['pages'];
            }
        },
        {
            id: 'TOPsKnowledgeBase',
            tid: 'knowledgebase',
            graphName: 'TableGraph',
            getHeadline: function (){
                return tid['tops'] + ' ' + tid['knowledgebase'];
            }
        },
        {
            id: 'events',
            tid: 'events',
            graphName: 'LineGraph',
            graphConfig: {
                prefixes: [''],
                tids: ['events', 'goals', 'visitors', 'conversions'],
                names: ['Events', 'Goals', 'Visitors', 'Conversions'],
                formatFunctions: [MomentUtils.ident]  // TODO formatFunction for dynamic goal count
            }
        },
        {
            id: 'eventsBar',
            tid: 'events',
            graphName: 'BarGraph',
            graphConfig:{
                formatFunctions: [ MomentUtils.ident]
            }
        },
        {
            id: 'goalsBar',
            tid: 'goals',
            graphName: 'BarGraph',
            graphConfig:{
                formatFunctions: [ MomentUtils.ident]
            }
        },
        {
            id: 'feedbacksDayNumbers',
            noexport: true,
            tid: 'goals',
            graphName: 'NumberGraph',
            graphConfig: {
                formatFunctions: [MomentUtils.ident]
            }
        },
        {
            id: 'feedbacks',
            tid: 'feedbacks',
            graphName: 'LineGraph',
            graphConfig: {
                prefixes: ['', 'Ø ', ''],
                tids: ['feedbacks', 'rating', 'visitors'],
                names: ['Feedbacks', 'Rating', 'Visitors'],
                formatFunctions: [MomentUtils.ident, MomentUtils.formatRating, MomentUtils.ident]
            }
        },
        {
            id: 'feedbacksBar',
            tid: 'feedbacks',
            graphName: 'BarGraph',
            graphConfig:{
                formatFunctions: [ MomentUtils.formatRating, MomentUtils.ident, MomentUtils.formatRating],  // TODO dynamic count of feedback categories
                redgreen: [true, false, true]
            }
        }
    ];

    function addCurrentReport(reportName, init){
        addReport(reportName, init);
        currentReports[reportName] = activeReports[reportName];
    }

    function addNotCurrentReport(reportName, init){
        addReport(reportName ,init);
        notCurrentReports[reportName] = activeReports[reportName];
    }

    function addReport(reportName, init){
        if(!activeReports[reportName]){
            activeReports[reportName] = new Report(reportName, reportsConfig[reportName]);
        }
        if(init)
            activeReports[reportName].init();
    }

    function filterCurrentReports(d){
        return currentPageReportIDs.indexOf(d.id) !== -1;
    }

    function filterNotCurrentReports(d){
        return currentPageReportIDs.indexOf(d.id) === -1;
    }

    function getActiveReports(){
        if(activeReports.length === 0){
            for(var i = 0; i< reportsConfig.length; i++){
                activeReports.push(new Report(reportsConfig[i],i))
            }
        }
        return activeReports;
    }

    function fillPage(_pageReportIDs, _init){
        hideReports();

        if(!!soloMode){
            var soloReport = getActiveReports().filter(function(d){return [soloMode].indexOf(d.id) !== -1;})[0];
            if(_init)
                soloReport.init();
            $('#report-wrapper-' + soloMode).show();
            return
        }

        currentPageReportIDs = _pageReportIDs;

        currentReports = getActiveReports().filter(filterCurrentReports);
        notCurrentReports = getActiveReports().filter(filterNotCurrentReports);

        if(_init){
            for(var i = 0; i< currentReports.length; i++){
                currentReports[i].init(true);
            }
            for(var i = 0; i< notCurrentReports.length; i++){
                notCurrentReports[i].init(true);
            }
        }

        unHideCurrentReports();
    }

    function updatePage(_pageReportNames){
        currentReports = {};
        notCurrentReports = [];
        var allReportNames = Object.keys(reportsConfig);
        var restReportsNames = [];
        allReportNames.forEach(function(item){
            if(_pageReportNames.indexOf(item) === -1)
                restReportsNames.push(item);
        });
    }

    function hideReports(){
        $('.report-wrapper').hide();
    }

    function sortReports(_sortedReportNames){
        d3.selectAll('.report-wrapper').sort(function(a,b){
            return d3.ascending(_sortedReportNames.indexOf(a),_sortedReportNames.indexOf(b));
        })
    }
    function unHideCurrentReports(){
        currentReports.forEach(function(d){
             $('#report-wrapper-' + d.id).show();
        });
    }

    imc.on('leave-print-mode', function(){
        hideReports();
        unHideCurrentReports();
    });

    imc.on('enter-print-mode', function(){
        $('.report-wrapper').show();
    });

    imc.on('dateChange', function(){
        DataManager.clearCache();
        var pageReports = PageManager.getReportsForPageAndCondition();
        fillPage(pageReports, true);

        //DataManager.bundleRequest(currentReports, notCurrentReports);

        // for(var report in currentReports){
        //     currentReports[report].init(true);
        // }
        // for(var report in notCurrentReports){
        //     notCurrentReports[report].init(true);
        // }
    });

    return {
        fillPage: fillPage,
        updatePage: updatePage,
        getReports: function(){return reportsConfig;},
        getActiveReports: getActiveReports
    }

}());

var ExportManager = (function ExportManger(){
    var active = false;
    var missingData = 0;
    var queueLength = 0;

    function prepareExport(){
        active = true;
        queueLength  = RequestUtils.getQueueLength();
        if(queueLength > 0){
            missingData = queueLength;
            LoadingScreenManager.progress(1, missingData, tid['generating_export_data']);
        }else {
            exportReportData();
        }
    }

    function exportReportData(){
        active = false;
        var activeReports = ReportManager.getActiveReports();
        var wb = XLSX.utils.book_new();
        wb.Props = {
            Title: "LiveZilla Report",
            Subject: MomentUtils.rangeString(),
            Author: "Generated by LiveZilla",
            CreatedDate: Date.now().toString()
        };
        for(var index in activeReports){
            var report = activeReports[index];
            var reportName = report.id;

            if(report.getConfig().hasOwnProperty('noexport'))
                continue;

            var sheets = report.getExportSheets();

            if(typeof(sheets) !== 'undefined' && sheets.length){
                sheets.forEach(function(d){
                    var sheetName = d.name.replace(/[\\,\/,\[,\],\*]/g, "");
                    wb.SheetNames.push(sheetName);
                    wb.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(d.data);
                });
            }
        }
        var range = PageManager.getRange();
        var isSingleDay = (range.start.format('YYYYMMDD') == range.end.format('YYYYMMDD'));
        XLSX.writeFile(wb, 'report_' + range.start.format('YYYYMMDD') +  (isSingleDay? "": ('-' + range.end.format('YYYYMMDD')))  + '.ods');
    }

    imc.on('requestDone', function(_data){
        if(!active)
            return;
        queueLength = _data.pendingRequests;
        if(_data.pendingRequests > 0) {
            LoadingScreenManager.progress(missingData - queueLength + 1, missingData, tid['generating_export_data']);
        }else{
            active = false;
            setTimeout(function(){
                LoadingScreenManager.hide();
                exportReportData();
            },1000);
        }
    });

    return {
        export: prepareExport
    }
}());

var Pie = (function PieChartManager() {

    var pies = [];

    var config = {
        size: {
            width: 300,
            height: 400
        },
        color: {
            pattern: [
                StyleManager.getColorSet('button', 0),
                StyleManager.getColorSet('button', 1),
                StyleManager.getColorSet('button', 2),
                StyleManager.getColorSet('button', 3),
                StyleManager.getColorSet('button', 4),
                StyleManager.getColorSet('button', 5),
                StyleManager.getColorSet('button', 6),
                StyleManager.getColorSet('button', 7),
                StyleManager.getColorSet('button', 8),
                StyleManager.getColorSet('button', 9)
            ]
        },
        data: {
            type: 'pie',
            order: null,
            selection: {
                enabled: false
            }
        },
        label: {},
        pie: {
            label: {
                show: true,
                format: undefined,
                threshold: 0.05
            },
            expand: false
        },
        interaction: {
            enabled: true
        }
    };

    function setNoData() {
        config.data.columns = [['No Data', 1]];
        config.pie.label.show = false;
    }

    function isAllZero(data) {
        return data.reduce(function (acc, cur) {
            return acc && cur[1] == 0
        }, true);
    }

    function setTitle(title) {
        if(title)
            config.title = {
                text: title,
                padding: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20
                }
            };
        else
            delete config.title;
    }

    function setData(data){
        config.data.columns = data;
        config.data.colors = {};
        config.pie.label.show = true;
        config.data.colors[tid['others']] = '#aaa';
        if (data.length == 0 || isAllZero(data)) {
            setNoData();
        }
    }

    function bakePie(elem, data, title) {
        config.bindto = elem;
        setData(data);
        setTitle(title);
        pies.push(c3.generate(config));
    }

    return {
        bake: bakePie
    }

}());