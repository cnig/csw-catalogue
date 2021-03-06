/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2013 IGN - Instituto Geográfico Nacional
 *     Centro Nacional de Información Geográfica
 *     http://www.ign.es/
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
        this.parser = null;
        var auto = this.gadget.serviceConfiguration.details[0]["auto"];
        if(auto == null || auto == false){
            this.parser = new conwet.parser.ConfigParser(gadget);
        }else{
            this.parser = new conwet.parser.AutoParser(gadget);
        }
    },
    
    _sendSearchRequest: function (service, word, property) {
        this.gadget.clearUI();

        var baseURL = service.url;

        if ((baseURL == "") || (word == "")) {
            this.gadget.showMessage(_("Missing data from form."));
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
        

        this.gadget.showMessage("Requesting data from server.", true);
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
                this.gadget.showError("Server not responding..");
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
            var outputText = this.gadget.serviceConfiguration.results[0].outputText;
            
            div.title = "Send event";
            div.observe("click", function(e) {
                this.self.gadget.sendText(this.self.gadget.parseUtils.getDOMValue(this.entity, outputText[0]));
                this.self._showDetails(this.entity);
                //this.self._selectFeature(this.feature, this.div);
            }.bind(context));
            div.observe("mouseover", function(e) {
                this.div.addClassName("highlight");
            }.bind(context), false);
            div.observe("mouseout", function(e) {
                this.div.removeClassName("highlight");
            }.bind(context), false);
            
            //Show all the info that the config specifies
            var span = document.createElement("span");
            span.innerHTML = this._mulpipleDisplayToHtml(entity, showInfo);
            div.appendChild(span);

            $("list").appendChild(div);
            
        }
    },
            
    /**
     * This method retuns the HTML given a multiple configuration parameter (that can contain
     * headChar and trailChar attributes) from the configuration file.
     */        
    _mulpipleDisplayToHtml: function(entity, displayConfig){
        //Load the separator character from the service configuration file
        var separator = this.gadget.serviceConfiguration.results[0].separator;
        if(separator == null)
            separator = " ";

        var texto = "";

        for(var x = 0; x < displayConfig.length; x++){

            //Add the separator between fields
            if(texto != null && texto != "")
                texto += separator;

            //If a headchar is defined, add it before the field.
            if(displayConfig[x].headChar != null)
                texto += displayConfig[x].headChar;

            //Add the field text
            texto += this.gadget.parseUtils.getDOMValue(entity, displayConfig[x]);

            //If a trailChar is defined, add it after the field
            if(displayConfig[x].trailChar != null)
                texto += displayConfig[x].trailChar;
        }

        return texto;
    },
            
            /*
     * Displays more info about the selected entry in the list of features.
     */
    _showDetails: function(entity) {
        $("info").innerHTML = ""; 
        $("info").appendChild(this.parser._entityToHtml(entity));
        this.gadget.sendServiceInfo(entity.URI[0].Text, entity.title[0].Text)
        
        
        
        /*var srsConfig = this.gadget.serviceConfiguration.results[0].srs[0];
        var srs      = this.gadget.parseUtils.getDOMValue(entity, srsConfig).split(":::", 2);
        if(srs.length > 1)
            srs=srs[1];
        else
            srs = "";
        if (srs = "EPSG: 23030")
            srs = "";
        
        var location1Config = this.gadget.serviceConfiguration.results[0].bbox1[0];
        var location2Config = this.gadget.serviceConfiguration.results[0].bbox2[0];
        var location1 = this.gadget.parseUtils.getDOMValue(entity, location1Config).split(" ", 2);
        var location2 = this.gadget.parseUtils.getDOMValue(entity, location2Config).split(" ", 2);
        var locationInfoConfig = this.gadget.serviceConfiguration.results[0].locationInfo[0];
        var locationInfo = this.gadget.parseUtils.getDOMValue(entity, locationInfoConfig);

        location1 = new OpenLayers.LonLat(location1[0], location1[1]);
        if (srs && (srs != "")) {
            location1 = this.gadget.transformer.advancedTransform(location1, srs, this.gadget.transformer.DEFAULT.projCode);
        }
        
        location2 = new OpenLayers.LonLat(location2[0], location2[1]);
        if (srs && (srs != "")) {
            location2 = this.gadget.transformer.advancedTransform(location2, srs, this.gadget.transformer.DEFAULT.projCode);
        }

        //Send the location and location info (location + name)
        this.gadget.sendLocationInfo(location1, location2, locationInfo);*/

    }
    
    
});
