/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the GeoWidgets Project,
 *
 *     http://conwet.fi.upm.es/geowidgets
 *
 *     Licensed under the GNU General Public License, Version 3.0 (the 
 *     "License"); you may not use this file except in compliance with the 
 *     License.
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     under the License is distributed in the hope that it will be useful, 
 *     but on an "AS IS" BASIS, WITHOUT ANY WARRANTY OR CONDITION,
 *     either express or implied; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *  
 *     See the GNU General Public License for specific language governing
 *     permissions and limitations under the License.
 *
 *     <http://www.gnu.org/licenses/gpl.txt>.
 *
 */
use("conwet");

conwet.CSWController = Class.create({
    
    initialize: function(gadget){
        this.gadget = gadget;
    },
    
    _sendSearchRequest: function (service, word, property) {
        this.gadget.clearUI();

        var baseURL = service.url;

        if ((baseURL == "") || (word == "")) {
            this.gadget.showMessage(_("Faltan datos en el formulario."));
            return;
        }

        if (baseURL.indexOf('?') == -1) {
            baseURL = baseURL + '?';
        } else {
            if (baseURL.charAt(baseURL.length - 1) == '&') {
                baseURL = baseURL.slice(0, -1);
            }
        }

        var parameters = {
            "SERVICE": "CSW",
            "VERSION": "2.0.2",
            "REQUEST": "GetRecords",
            "MAXFEATURES": "100",
            "ELEMENTSETNAME": "full",
            "CONSTRAINTLANGUAGE": "CQL_TEXT",
            "CONSTRAINT_LANGUAGE_VERSION": "1.1.0",
            "RESULTTYPE": "results",
            //"NAMESPACE": this.gadget.serviceConfiguration.request[0].namespace[0].Text,
            "TYPENAMES": this.gadget.serviceConfiguration.request[0].typename[0].Text,
            "constraint": this.gadget.serviceConfiguration.request[0].filter[0].Text.replace("{{word}}", word).replace("{{property}}", property)
        };
        

        this.gadget.showMessage("Solicitando datos al servidor.", true);
        //TODO Gif chulo para esperar
        MashupPlatform.http.makeRequest(baseURL, {
            method: 'GET',
            parameters: parameters,
            onSuccess: function(transport) {
                this.gadget.hideMessage();
                //parser=new DOMParser();
                //xmlObject=XMLObjectifier.xmlToJSON(parser.parseFromString(transport.responseText,"text/xml"));
                var xmlObject = XMLObjectifier.xmlToJSON(XMLObjectifier.textToXML(transport.responseText));
                this._drawEntities(xmlObject);
            }.bind(this),
            onFailure: function(){
                this.gadget.showError("El servidor no responde.");
            }.bind(this)
        });
    },

    /**
     * This functions shows a list of the results of the search done.
     */
    _drawEntities: function(xmlObject) {
        this.gadget.clearUI();
        
        //Get the features typename (without the prefix)
        var configTypename = this.gadget.serviceConfiguration.request[0].typename[0].Text;
        var pos = configTypename.indexOf(":");        
        
        var entities = xmlObject.SearchResults[0].Record;
        var nEntities = entities.length;
        
        if(nEntities < 1)
            return;
        
        for (var i=0; i<nEntities; i++) {
            var entity = entities[i];

            var div = document.createElement("div");
            $(div).addClassName("feature");

            var context = {
                "div"   : div,
                "entity": entity,
                //"url"   : this.gadget._decodeASCII(json[1].sourceServiceURL),
                //"type"  : json[1].sourceServiceType,
                "self"  : this
            };

            var showInfo = this.gadget.serviceConfiguration.results[0].displayInfo;
            
            div.title = "Send event";
            div.observe("click", function(e) {
                this.self.gadget.sendText(this.self._getDOMValue(this.entity, showInfo[0]));
                this.self._showDetails(this.entity);
                //this.self._selectFeature(this.feature, this.div);
            }.bind(context));
            div.observe("mouseover", function(e) {
                this.div.addClassName("highlight");
            }.bind(context), false);
            div.observe("mouseout", function(e) {
                this.div.removeClassName("highlight");
            }.bind(context), false);
            
            //Load the separator character from the service configuration file
            var separator = this.gadget.serviceConfiguration.results[0].separator;
            if(separator == null)
                separator = " ";
            
            var span = document.createElement("span");
            
            for(var x = 0; x < showInfo.length; x++){
                
                //Add the separator between fields
                if(span.innerHTML != null)
                    span.innerHTML += separator;
                
                //If a headchar is defined, add it before the field.
                if(showInfo[x].headChar != null)
                    span.innerHTML += showInfo[x].headChar;
                
                //Add the field text
                span.innerHTML += this._getDOMValue(entity, showInfo[x]);
                
                //If a trailChar is defined, add it after the field
                if(showInfo[x].trailChar != null)
                    span.innerHTML += showInfo[x].trailChar;
            }
            div.appendChild(span);

            $("list").appendChild(div);
        }
    },
            
            /*
     * Displays more info about the selected entry in the list of features.
     */
    _showDetails: function(entity) {
        $("info").innerHTML = ""; 
        $("info").appendChild(this._entityToHtml(entity));
        
        var srsConfig = this.gadget.serviceConfiguration.results[0].srs[0];
        var srs      = this._getDOMValue(entity, srsConfig).split(":::", 2);
        if(srs.length > 1)
            srs=srs[1];
        else
            srs = "";
        if (srs = "EPSG: 23030")
            srs = "";
        
        var location1Config = this.gadget.serviceConfiguration.results[0].bbox1[0];
        var location2Config = this.gadget.serviceConfiguration.results[0].bbox2[0];
        var location1 = this._getDOMValue(entity, location1Config).split(" ", 2);
        var location2 = this._getDOMValue(entity, location2Config).split(" ", 2);
        var locationInfoConfig = this.gadget.serviceConfiguration.results[0].locationInfo[0];
        var locationInfo = this._getDOMValue(entity, locationInfoConfig);

        location1 = new OpenLayers.LonLat(location1[0], location1[1]);
        if (srs && (srs != "")) {
            location1 = this.gadget.transformer.advancedTransform(location1, srs, this.gadget.transformer.DEFAULT.projCode);
        }
        
        location2 = new OpenLayers.LonLat(location2[0], location2[1]);
        if (srs && (srs != "")) {
            location2 = this.gadget.transformer.advancedTransform(location2, srs, this.gadget.transformer.DEFAULT.projCode);
        }

        //Send the location and location info (location + name)
        this.gadget.sendLocation(location1, location2);
        this.gadget.sendLocationInfo(location1, location2, locationInfo);

    },
    
    /*
     * This functions parses a feature object to an styled HTML
     */
    _entityToHtml: function(entity){
        var html = document.createElement("div");
        html.className = "featureContainer";
        
        this._useDetailsLevels(entity, html, this.gadget.serviceConfiguration.details[0]);
        
        return html;
       
    },
            
    /*
     * This function uses the given config (detailslevel) to extract the info
     * from the entity and display it in the parentDiv.
     */
    _useDetailsLevels: function(entity, parentDiv, config){

    var headDiv, fieldsDiv;
                
        var parseInfo = config.detailslevel;
        //Iterate through sections
        for(var x = 0; x < parseInfo.length; x++){
            
            var head = parseInfo[x].label[0].Text;
            
            headDiv = document.createElement("div");
            fieldsDiv = document.createElement("div");
            
            headDiv.className = "featureHead";
            fieldsDiv.className = "featureFieldsContainer";
            
            headDiv.innerHTML = head;
            
            var fieldDiv = document.createElement("div");
            var valueDiv = document.createElement("div");
            valueDiv.className = "fieldValue";
            fieldDiv.className = "fieldContainer";
            
            if(parseInfo[x].path != null){
                valueDiv.innerHTML = this._getDOMValue(entity, parseInfo[x].path[0]);
                fieldsDiv.appendChild(valueDiv);
            }else if(parseInfo[x].detailslevel != null){
                this._useDetailsLevels(entity, fieldsDiv, parseInfo[x]);
            }
            
            parentDiv.appendChild(headDiv);
            parentDiv.appendChild(fieldsDiv);
        }
        
    },
            
    /*
     * This function get a DOM object and an element path and returns its value.
     * Is attribute is set, it return that attribute. Otherwise, returns the innerHTML.
     */         
    _getDOMValue: function(DOM, pathElement){
        try{
            
            if(pathElement.Text != null && pathElement.Text != ""){
                var path = pathElement.Text.split('/');
                var current = path[0];
                var coincidences = DOM[current];
                
                var subPath;
                if(path.length <= 1)
                    subPath = "";
                else{
                    subPath = pathElement.Text.substring(pathElement.Text.indexOf("/")+1);
                }
                
                for(var x = 0; x < coincidences.length; x++){
                    var value = this._getDOMValue(coincidences[x], {Text: subPath, attribute: pathElement.attribute});
                    if(value != null)
                        return value;
                }
                
            }else{
                if(pathElement.attribute != null)
                    return DOM[pathElement.attribute];
                else
                    return DOM.Text;   
            }
            
            return null;
            
        }catch(e){
            return null;
        };

    }

    
    
});
