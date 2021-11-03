"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import { VisualSettings } from "./settings";

interface Data {
    dateStart: Date,
    dateFinish: Date,
    eventName: string
}

interface ViewModel {
    dataModel: Data[];
    settings: VisualSettings;
}

const events = [
    { start: new Date(2021, 9, 6), finish: new Date(2021, 10, 2), description: 'Big Sale Promotion', colorStartAndFinish:'', colorDays: '' }
    , { start: new Date(2021, 9, 8), finish: new Date(2021, 9, 10), description: '30% OFF', colorStartAndFinish:'', colorDays: '' }
    , { start: new Date(2021, 10, 6), finish: new Date(2021, 10, 18), description: '40% OFF', colorStartAndFinish:'', colorDays: '' }
    , { start: new Date(2021, 9, 15), finish: new Date(2021, 9, 21), description: '50% OFF', colorStartAndFinish:'', colorDays: '' }
    , { start: new Date(2021, 9, 18), finish: new Date(2021, 9, 23), description: '60% OFF', colorStartAndFinish:'', colorDays: '' }
]

events.forEach(e => {
    const color = randDarkColor()
    e.colorStartAndFinish = color
    e.colorDays = color
})

export class Visual implements IVisual {
    private host: IVisualHost;
    private options: VisualUpdateOptions
    private container: HTMLElement


    private target: HTMLElement;
    private updateCount: number;
    private settings: VisualSettings;
    private textNode: Text;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.target = options.element;
        this.container = document.createElement('div')
        this.container.classList.add('container')
        this.container.innerHTML = `
            <div class="header">Season and promotion</div>
                <div class="slicerCalendar">
                <div id="slicerToday">Today</div>
                <div id="slicerYesterday">Yesterday</div>
                <div id="slicerLast7Days">Last 7 Days</div>
                <div id="slicerLast30Days">Last 30 Days</div>
                <div id="slicerThisMonth">This Month</div>
                <div id="slicerLastMonth">Last Month</div>
                <div id="slicerLastYear">Last Year</div>
            </div>
        `
        this.target.appendChild(this.container)
        
    }
    private flag :boolean = true
    public update(options: VisualUpdateOptions) {
        //this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        this.options = options
        const width = options.viewport.width
        const height = options.viewport.height
        let viewModel: ViewModel = visualTransform(options, this.host);

        this.container.style.width = `${width}px`
        this.container.style.height = `${height}px`
        startUp()
        
    }


    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}

function visualTransform(options: VisualUpdateOptions, host: IVisualHost): ViewModel {
    const dataViews = options.dataViews;
    const viewModel: ViewModel = {
        dataModel: null,
        settings: <VisualSettings>{}
    };

    if (!dataViews
        || !dataViews[0]
        || !dataViews[0].table
        || !dataViews[0].table.rows
        || !dataViews[0].table.rows[0]
        || !dataViews[0].table.rows[0][0]
        || !dataViews[0].table.rows[0][1]
        || !dataViews[0].table.rows[0][2]
    ) {
        return viewModel;
    }

    let flag = false
    dataViews[0].table.columns.forEach(column => {
        if(column.roles['dateStart']){
            if(column.type.dateTime != true){
                flag = true
            }
        }
        if(column.roles['dateFinish']){
            if(column.type.dateTime != true){
                flag = true
            }
        }
        if(column.roles['eventName']){
            if(column.type.text != true){
                flag = true
            }
        }
    })

    if(flag){
        return viewModel;
    }

    const dataArray:Data[] = []
    dataViews[0].table.rows.forEach(array => {
        let dataObject = {dateStart: null, dateFinish: null, eventName: null}
        array.forEach((data, i) => {
            if(dataViews[0].table.columns[i].roles['dateStart']){
                dataObject.dateStart = data
            }
            if(dataViews[0].table.columns[i].roles['dateFinish']){
                dataObject.dateFinish = data
            }
            if(dataViews[0].table.columns[i].roles['eventName']){
                dataObject.eventName = data
            }
        })
        dataArray.push(dataObject)
    })

    return {
        dataModel: dataArray,
        settings: null
    };
}






function randDarkColor() {
    var lum = -0.25;
    var hex = String('#' + Math.random().toString(16).slice(2, 8).toUpperCase()).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    var rgb = "#",
        c, i;
    for (i = 0; i < 3; i++) {
        c = parseInt(hex.substr(i * 2, 2), 16);
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgb += ("00" + c).substr(c.length);
    }
    return rgb;
}


function $getCalendarHtml(){ return `
<div class="month-year">
    <div class="arrow-wrap prev">
       
        <svg xmlns="http://www.w3.org/2000/svg" width="1.6rem" height="1.6rem" fill="currentColor" class="bi bi-arrow-left" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
</svg>
    </div>
    <div class="month">
        <h1></h1>
    </div>
    <div class="year">
        <h1></h1>
    </div>     
    <div class="arrow-wrap next">
    <svg xmlns="http://www.w3.org/2000/svg" width="1.6rem" height="1.6rem" fill="currentColor" class="bi bi-arrow-right" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
  </svg>
    </div>           
</div>
<div class="weekdays">
    <div>M</div>
    <div>T</div>
    <div>W</div>
    <div>T</div>
    <div>F</div>
    <div>S</div>
    <div>S</div>
</div>
<div class="days">
</div>
`
}

function quantityEventsOnStart(date) {
    const d = new Date(date)
    const e = events.filter(e => equalDate(e.start, d))
    return e.length
}

function quantityEventsOnFinish(date) {
    const d = new Date(date)
    const e = events.filter(e => equalDate(e.finish, d))
    return e.length
}

//поиск дат для отрисовки описания события(ивента)
function getDatesForDescription(event, filterEvents, firstDateOnCalendar) {
    let dateCurrentEvent = event.start < firstDateOnCalendar ? new Date(firstDateOnCalendar) : new Date(event.start)
    let daysSuitable = []

    do {
        let flag = false

        if (equalDate(dateCurrentEvent, event.finish) || equalDate(dateCurrentEvent, event.start)) {
            // не рисуем описание события в дате начала и конца события, потому что там синий полукруг и день месяца
            flag = true
        }

        if (equalDate(dateCurrentEvent, new Date(new Date().toDateString()))) {
            // не рисуем описание события при текущем дне, потому что там красный круг
            flag = true
        }

        for (let i = 0; i < filterEvents.length; i++) {
            if (filterEvents[i] != event && (equalDate(dateCurrentEvent, filterEvents[i].start) || equalDate(dateCurrentEvent, filterEvents[i].finish))) {
                // не рисуем описание события в начале или конце событий
                flag = true
            }
        }

        if (daysSuitable[daysSuitable.length - 1]) {
            const day1 = daysSuitable[daysSuitable.length - 1].getDay() === 0 ? 7 : daysSuitable[daysSuitable.length - 1].getDay()
            const day2 = dateCurrentEvent.getDay() === 0 ? 7 : dateCurrentEvent.getDay()
            if (!(day1 < day2)) {
                //Предыдущий добавленный элемент и текущий перебираемый находятся на одной недели, 
                flag = true
            }
        }

        if (flag) {
            if (daysSuitable.length > 0) {
                //если даты для отрисовки уже есть, а флаг оказался true тогда конец поиска
                return daysSuitable
            }
            dateCurrentEvent = addDay(dateCurrentEvent, 1)
            continue
        }

        //если все условия прошли тогда добавить день как подходящий для расположения текста
        daysSuitable.push(new Date(dateCurrentEvent))
        dateCurrentEvent = addDay(dateCurrentEvent, 1)
    } while (dateCurrentEvent < event.finish)

    return daysSuitable
}

function equalDate(date1, date2) {
    return date1.getTime() === date2.getTime()
}

function addDay(date, quantityDays) {
    const newObj = new Date(date)
    // Округление до даты  
    return new Date(new Date(newObj.setDate(newObj.getDate() + quantityDays)).toDateString())
}

function filterAndSortEvents(start, finish) {
    let eventsFind = []
    events.forEach(event => {
        if (event.start <= finish && event.finish >= start) {
            eventsFind.push(event)
        }
    })

    return eventsFind.sort((a, b) => {
        if (equalDate(a.start, b.start)) {
            return b.finish - a.finish
        } else {
            return a.start - b.start
        }
    })
}

function getNodeCalendar($days, findDate, shiftMonth = 0) {
    let $resultNode

    if (shiftMonth <= -1) {
        $days.forEach(d => {
            if (d.classList.contains('prev-date')) {
                if (+d.innerHTML === findDate.getDate()) {
                    $resultNode = d
                }
            }
        })
    } else if (shiftMonth >= 1) {
        $days.forEach(d => {
            if (d.classList.contains('next-date')) {
                if (+d.innerHTML === findDate.getDate()) {
                    $resultNode = d
                }
            }
        })
    } else {
        $days.forEach(d => {
            if (!['next-date', 'prev-date'].some(className => d.classList.contains(className))) {
                if (+d.innerHTML === findDate.getDate()) {
                    $resultNode = d
                }
            }
        })
    }
    if (!$resultNode) {
        return
    }
    return $resultNode
}

function getShift(currentDate, date) {
    if (currentDate.getMonth() === date.getMonth()) {
        return 0
    }
    else if (+new Date(currentDate.getFullYear(), currentDate.getMonth())
        >
        +new Date(date.getFullYear(), date.getMonth())) {
        return 1
    }
    else return -1
}

function firstDateOnCalendar($calendar, date) {
    const $node = $calendar[0]
    if ($node.classList.contains('prev-date')) {
        return new Date(date.getFullYear(), date.getMonth() - 1, $node.innerHTML)
    } else {
        return new Date(date.getFullYear(), date.getMonth(), $node.innerHTML)
    }
}

function lastDateOnCalendar($calendar, date) {
    const $node = $calendar[$calendar.length - 1]
    if ($node.classList.contains('next-date')) {
        return new Date(date.getFullYear(), date.getMonth() + 1, $node.innerHTML)
    } else {
        return new Date(date.getFullYear(), date.getMonth(), $node.innerHTML)
    }
}

function today($calendar, date) {
    $calendar.querySelectorAll(`.days div:not(.next-date, .prev-date)`).forEach($n => {
        const day = +$n.innerHTML
        if (equalDate(new Date(date.getFullYear(), date.getMonth(), day), new Date(new Date().toDateString()))) {
            const { top, left, width, height } = $n.getBoundingClientRect()
            const $square = document.createElement('div')
            $square.classList.add('today')

            $square.style.top = top + 'px'
            $square.style.left = left + 'px'
            $square.style.width = width + 'px'
            $square.style.height = height + 'px'

            const $circle = document.createElement('div')
            $circle.innerHTML = $n.innerHTML
            $circle.style.width = height / 1 + 'px'
            $circle.style.height = height / 1 + 'px'
            $square.appendChild($circle)

            $calendar.appendChild($square)
        }
    })
}

function setEvents(date, $main) {
    const $deleteContent = $main.querySelector('.events')
    if ($deleteContent) {
        $deleteContent.remove()
    }

    const $calendar = $main
    const $days = $calendar.querySelectorAll('.days div')

    const firstDate = firstDateOnCalendar($days, date)
    const lastDate = lastDateOnCalendar($days, date)

    const eventsFiltes = filterAndSortEvents(firstDate, lastDate)
    if (eventsFiltes.length <= 0) {
        return
    }

    const $events = document.createElement('div')
    $events.classList.add('events')
    $calendar.appendChild($events)
    //рисую ивент
    eventsFiltes.forEach((e, i) => {
        const $event = document.createElement('div')
        $events.appendChild($event)

        const finishCycle = e.finish <= lastDate ? e.finish : lastDate
        let currentDate = e.start >= firstDate ? new Date(e.start) : firstDate

        do {
            let shift = getShift(currentDate, date)
            const $dateCalendar = getNodeCalendar($days, new Date(currentDate), shift)
            const { top, left, width, height } = $dateCalendar.getBoundingClientRect()
            const $dateEvent = document.createElement('div')
            $event.appendChild($dateEvent)

            $dateEvent.style.top = top + 'px'
            $dateEvent.style.left = left + 'px'
            $dateEvent.style.width = width + 'px'
            $dateEvent.style.height = height + 'px'

            $dateEvent.setAttribute('data-date', currentDate.toDateString())
            $dateEvent.setAttribute('data-description', e.description)

            if (currentDate.getTime() === e.start.getTime()) {
                $dateEvent.classList.add('event-start')
                if (quantityEventsOnFinish(currentDate) >= 1) {
                    $dateEvent.classList.add('event-finish')
                }
                $dateEvent.innerHTML = `<span>${$dateCalendar.innerHTML}</span>`
                $dateEvent.style.backgroundColor = e.colorStartAndFinish
            }
            if (currentDate.getTime() === e.finish.getTime()) {
                $dateEvent.classList.add('event-finish')
                if (quantityEventsOnStart(currentDate) >= 1) {
                    $dateEvent.classList.add('event-start')
                }
                $dateEvent.innerHTML = `<span>${$dateCalendar.innerHTML}</span>`
                $dateEvent.style.backgroundColor = e.colorStartAndFinish
            }
            
            if (eventsFiltes.filter((event, index) => index < i).map(e => e.finish.getTime()).filter( time => time === currentDate.getTime()).length > 0) {
                //Делаем прозрачность текущему событию если предыдущее заканчивается в период текущего
                $dateEvent.style.opacity = '0'
            }

            if (currentDate.getTime() != e.finish.getTime() && currentDate.getTime() != e.start.getTime()) {
                $dateEvent.classList.add('event')
                $dateEvent.style.backgroundColor = e.colorDays
            }

            currentDate = addDay(currentDate, 1)
        } while (currentDate <= finishCycle)
    })


    //Пишу описание ивента
    eventsFiltes.forEach((e, i) => {
        const $event = $calendar.querySelectorAll('.events > div')[i]
        const $eventsCalendar = $event.querySelectorAll('div')

        const daysSuitable = getDatesForDescription(e, eventsFiltes, firstDate)
        if (daysSuitable.length <= 0) {
            return
        }

        let $startNodeForDescription, flag = true
        $eventsCalendar.forEach(d => {
            if (daysSuitable.map(d => d.toDateString()).filter(date => date === d.dataset.date).length > 0) {
                if (flag) {
                    $startNodeForDescription = d
                    flag = false
                }
            }
        })

        const $description = document.createElement('div')
        $description.classList.add('description')
        $event.appendChild($description)

        const { top, left, width, height } = $startNodeForDescription.getBoundingClientRect()

        $description.style.top = top + 'px'
        $description.style.left = left + 'px'
        $description.style.width = width * daysSuitable.length + 'px'
        $description.style.height = height + 'px'
        $description.innerHTML = e.description
        if (daysSuitable.length === 1) {
            $description.setAttribute('data-size', 'small')
        }
    })
}

const renderCalendar = (date, $main) => {

    date.setDate(1)
    const monthDays = $main.querySelector('.days')

    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()

    const prevLastDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate()

    const firstDayIndex = (date.getDay() === 0 ? 7 : date.getDay()) - 1

    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ]

    $main.querySelector('.month h1').innerHTML = months[date.getMonth()]
    $main.querySelector('.year h1').innerHTML = date.getFullYear()

    let days = ''
    for (let x = firstDayIndex; x > 0; x--) {
        const day = prevLastDay - x + 1
        days += `<div class='prev-date'>${day}</div>`
    }


    for (let i = 1; i <= lastDay; i++) {
        days += `<div>${i}</div>`
    }

    const dayOfWeekEndMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDay()
    const daysNextMonth = 7 - (dayOfWeekEndMonth === 0 ? 7 : dayOfWeekEndMonth)

    for (let i = 1; i <= daysNextMonth; i++) {
        days += `<div class='next-date'>${i}</div>`
    }
    monthDays.innerHTML = days

    const $today = monthDays.parentNode.querySelector('.today')
    if ($today) {
        $today.remove()
    }
    today(monthDays.parentNode, date)
}

function flow(date, $main) {
    renderCalendar(date, $main)
    setEvents(date, $main)
}

function renderArrow($calendarLeft, $calendarRight, dateLeftCalendar, dateRightCalendar) {
    if (monthDiff(dateLeftCalendar, dateRightCalendar) === 1) {
        removeArrow($calendarLeft, 'next')
        removeArrow($calendarRight, 'prev')
    } else{
        showArrow($calendarLeft, 'next')
        showArrow($calendarRight, 'prev')
    }
}

function monthDiff(dateFrom, dateTo) {
    return dateTo.getMonth() - dateFrom.getMonth() +
        (12 * (dateTo.getFullYear() - dateFrom.getFullYear()))
}

function showArrow($calendar, className) {
    $calendar.querySelector(`.month-year .${className}`).style.display = 'flex'
}

function removeArrow($calendar, className) {
    $calendar.querySelector(`.month-year .${className}`).style.display = 'none'
}

const startUp = () => {
    let dateRightCalendar = new Date()
    const $calendarRight = document.createElement('div')
    $calendarRight.classList.add('calendarRight')
    $calendarRight.innerHTML = $getCalendarHtml()
    document.querySelector('.container').appendChild($calendarRight)
    flow(dateRightCalendar, $calendarRight)

    let dateLeftCalendar = new Date()
    dateLeftCalendar.setMonth(dateLeftCalendar.getMonth() - 1)
    const $calendarLeft = document.createElement('div')
    $calendarLeft.classList.add('calendarLeft')
    $calendarLeft.innerHTML = $getCalendarHtml()
    document.querySelector('.container').appendChild($calendarLeft)
    flow(dateLeftCalendar, $calendarLeft)

    renderArrow($calendarLeft, $calendarRight, dateLeftCalendar, dateRightCalendar)

    $calendarLeft.querySelector('.prev').addEventListener('click', () => {
        dateLeftCalendar.setMonth(dateLeftCalendar.getMonth() - 1)
        flow(dateLeftCalendar, $calendarLeft)
        renderArrow($calendarLeft, $calendarRight, dateLeftCalendar, dateRightCalendar)
    })

    $calendarLeft.querySelector('.next').addEventListener('click', () => {
        dateLeftCalendar.setMonth(dateLeftCalendar.getMonth() + 1)
        flow(dateLeftCalendar, $calendarLeft)
        renderArrow($calendarLeft, $calendarRight, dateLeftCalendar, dateRightCalendar)
    })

    $calendarRight.querySelector('.prev').addEventListener('click', () => {
        dateRightCalendar.setMonth(dateRightCalendar.getMonth() - 1)
        flow(dateRightCalendar, $calendarRight)
        renderArrow($calendarLeft, $calendarRight, dateLeftCalendar, dateRightCalendar)
    })

    $calendarRight.querySelector('.next').addEventListener('click', () => {
        dateRightCalendar.setMonth(dateRightCalendar.getMonth() + 1)
        flow(dateRightCalendar, $calendarRight)
        renderArrow($calendarLeft, $calendarRight, dateLeftCalendar, dateRightCalendar)
    })

    document.querySelector('#slicerToday').addEventListener('click', () => {
        dateRightCalendar = new Date()
        dateLeftCalendar = new Date(new Date(dateRightCalendar).setMonth(dateRightCalendar.getMonth() - 1))
        
        flow(dateRightCalendar, $calendarRight)
        flow(dateLeftCalendar, $calendarLeft)
        renderArrow($calendarLeft, $calendarRight, dateLeftCalendar, dateRightCalendar)
    })

    document.querySelector('#slicerYesterday').addEventListener('click', () => {
        dateRightCalendar = new Date(new Date().setDate(new Date().getDate() - 1))
        dateLeftCalendar = new Date(new Date(dateRightCalendar).setMonth(dateRightCalendar.getMonth() - 1))
       
        flow(dateRightCalendar, $calendarRight)
        flow(dateLeftCalendar, $calendarLeft)
        renderArrow($calendarLeft, $calendarRight, dateLeftCalendar, dateRightCalendar)
    })

    document.querySelector('#slicerLast7Days').addEventListener('click', () => {
        dateRightCalendar = new Date()
        dateLeftCalendar = new Date(new Date(dateRightCalendar).setMonth(dateRightCalendar.getMonth() - 1))
        
        flow(dateRightCalendar, $calendarRight)
        flow(dateLeftCalendar, $calendarLeft)
        renderArrow($calendarLeft, $calendarRight, dateLeftCalendar, dateRightCalendar)
    })
    
    document.querySelector('#slicerLast30Days').addEventListener('click', () => {
        dateRightCalendar = new Date()
        dateLeftCalendar = new Date(new Date(dateRightCalendar).setMonth(dateRightCalendar.getMonth() - 1))
        
        flow(dateRightCalendar, $calendarRight)
        flow(dateLeftCalendar, $calendarLeft)
        renderArrow($calendarLeft, $calendarRight, dateLeftCalendar, dateRightCalendar)
    })

    document.querySelector('#slicerThisMonth').addEventListener('click', () => {
        dateRightCalendar = new Date()
        dateLeftCalendar = new Date(new Date(dateRightCalendar).setMonth(dateRightCalendar.getMonth() - 1))
        
        flow(dateRightCalendar, $calendarRight)
        flow(dateLeftCalendar, $calendarLeft)
        renderArrow($calendarLeft, $calendarRight, dateLeftCalendar, dateRightCalendar)
    })

    document.querySelector('#slicerLastMonth').addEventListener('click', () => {
        const lastMonth =  new Date(new Date().setMonth(new Date().getMonth() - 1))
        dateRightCalendar = new Date(lastMonth)
        dateLeftCalendar = new Date(new Date(dateRightCalendar).setMonth(dateRightCalendar.getMonth() - 1))

        flow(dateRightCalendar, $calendarRight)
        flow(dateLeftCalendar, $calendarLeft)
        renderArrow($calendarLeft, $calendarRight, dateLeftCalendar, dateRightCalendar)
    })

    document.querySelector('#slicerLastYear').addEventListener('click', () => {
        const lastYear =  new Date(new Date().setFullYear(new Date().getFullYear() - 1))
        dateRightCalendar = new Date(lastYear)
        dateLeftCalendar = new Date(new Date(dateRightCalendar).setMonth(dateRightCalendar.getMonth() - 1))

        flow(dateRightCalendar, $calendarRight)
        flow(dateLeftCalendar, $calendarLeft)
        renderArrow($calendarLeft, $calendarRight, dateLeftCalendar, dateRightCalendar)
    })
}
