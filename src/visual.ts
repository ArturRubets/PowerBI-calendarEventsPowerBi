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

export class Visual implements IVisual {
    private host: IVisualHost;
    private options: VisualUpdateOptions



    private target: HTMLElement;
    private updateCount: number;
    private settings: VisualSettings;
    private textNode: Text;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;


        console.log('Visual constructor', options);
        this.target = options.element;
        this.updateCount = 0;
        if (document) {
            const new_p: HTMLElement = document.createElement("p");
            new_p.appendChild(document.createTextNode("Update count:"));
            const new_em: HTMLElement = document.createElement("em");
            this.textNode = document.createTextNode(this.updateCount.toString());
            new_em.appendChild(this.textNode);
            new_p.appendChild(new_em);
            this.target.appendChild(new_p);
        }
    }

    public update(options: VisualUpdateOptions) {
        //this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
       
        this.options = options
        let viewModel: ViewModel = visualTransform(options, this.host);

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