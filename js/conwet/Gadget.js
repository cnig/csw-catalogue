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

conwet.Gadget = Class.create({

    initialize: function() {
        
        this.locationInfoEvent = new conwet.events.Event('location_info_event');
        this.outputTextEvent   = new conwet.events.Event('output_text_event');
        this.searchTextEvent   = new conwet.events.Event('search_text_event');
        
        this.controller = null;

        //Receive multiple values and search with them
        this.searchTextSlot    = new conwet.events.Slot('search_text_slot', function(text) {
            var data;
            try{
                data = JSON.parse(text);
            }catch(e){
                data = text;
            }
            var inputs = $$("input.search");
            
            if(inputs.length > 0){
                if(typeof data == "string"){
                    inputs[0].setValue(data);
                }else if(data != null && data.length > 0){
                    for(var x = 0; x < inputs.length && x < data.length; x++)
                        inputs[x].setValue(data[x]);
                }
                this.launchSearch();
            }
        }.bind(this));

        this.serviceConfiguration = null; //Contains the configuration of the service in use
        this.serviceConfigurationList = []; //Contains the configuration of all the services
        
        this.wfsServiceSlot   = new conwet.events.Slot('csw_service_slot', function(service) {
            service = JSON.parse(service);

            if ((typeof service == 'object') && ('type' in service) && ('url' in service) && ('service_type' in service) && ('name' in service) && (service.type == "CSW") && (service.url != "")) {
                this.addWfsService(service, true);
            }
        }.bind(this));

        this.servicesPreference = MashupPlatform.widget.getVariable("services");
        
        // Attributes
        this.messageManager = new conwet.ui.MessageManager(3000);
        this.transformer    = new conwet.map.ProjectionTransformer();
        
        this.parseUtils = new conwet.parser.ParseUtils();

        this.draw();
    },

    draw: function() {
        var header = $("header");
        conwet.ui.UIUtils.ignoreEvents(header, ["click", "dblclick"]);

        var serviceLabel = document.createElement("div");
        $(serviceLabel).addClassName("label");
        serviceLabel.appendChild(document.createTextNode(_("CSW Service:")));
        header.appendChild(serviceLabel);

        //Service selector
        this.serviceSelect = new StyledElements.StyledSelect();
        this.serviceSelect.addEventListener("change", function(){
            if(this.serviceSelect.getValue() != "")
                this.setWfsService(JSON.parse(this.serviceSelect.getValue()));
        }.bind(this));
        
        this.serviceSelect.addClassName("service");
        this.serviceSelect.insertInto(header);

        this.serviceSelect.addEntries([{label: _('Select a server'), value: ''}]);

        if (this.servicesPreference.get() != "") {
            var services = JSON.parse(this.servicesPreference.get());

            for (var i=0; i<services.length; i++) {
                this.addWfsService(services[i], i==0);
            }
        }

        var searchLabel = document.createElement("div");
        $(searchLabel).addClassName("label");
        searchLabel.appendChild(document.createTextNode(_("Search query:")));
        header.appendChild(searchLabel);

        //Select with the properties that can be used to search in this service
        this.propertySelect = new StyledElements.StyledSelect({"onChange": function(){}});
        //this.propertySelect.addClassName("search"); TEMPORAL!!
        this.propertySelect.addClassName("hidden"); //TEMPORAL!!
        this.propertySelect.addEntries([{label: _('Search by'), value: ''}]);
        this.propertySelect.insertInto(header);
        
        //$(this.propertySelect).hide(); //Temporal
        
        var searchDiv = document.createElement("div");
        $(searchDiv).addClassName("search");
        header.appendChild(searchDiv);
        
        //Text input containing the text to be searched
        this.searchInput = document.createElement("input");
        this.searchInput.type = "text";
        this.searchInput.onkeydown = function(k){
           if(k.keyCode == 13)
               this.launchSearch();
        }.bind(this);
        $(this.searchInput).addClassName("search");
        searchDiv.appendChild(this.searchInput);

        var searchButton = conwet.ui.UIUtils.createButton({
            "classNames": ["search_button"],
            "title"     : _("Search"),
            "value"     : _("Search"),
            "onClick"   : this.launchSearch.bind(this)
        });
        header.appendChild(searchButton);

    },

    launchSearch: function(){
        this.sendSearch(this.searchInput.value);
        this.controller._sendSearchRequest(JSON.parse(this.serviceSelect.getValue()), this.searchInput.value, this.propertySelect.getValue());  
    },

    /*
     * This functions adds a WFS service to the select. If added, returns true, othrewise returns false.
     */
    addWfsService: function(service, selected) {
        var serviceJson = JSON.stringify(service);
        
        //Add it if it already isn't in the select
        if(!(serviceJson in this.serviceSelect.optionValues)){
            //Load the configuration of the service
            new Ajax.Request(servicesAssociations[service.url], {
                method: 'GET',
                onSuccess: function(transport) {

                    var configuration = XMLObjectifier.xmlToJSON(transport.responseXML);

                    this.serviceSelect.addEntries([{label: service.name, value: serviceJson}]);
                    
                    //Add the configuration to the list of configurations
                    this.serviceConfigurationList[service.name] = configuration;

                    //Set this as the current service
                    if(selected)
                        this.setWfsService(service);

                    //Tell everything is ok and save the services list (persistent list)
                    this.showMessage(_("New server added."));
                    this.save(service);
                    
                }.bind(this),
                onFailure: function(transport) {
                    this.showMessage(_("Error loading server configuration."));
                }.bind(this)
            });
        }
        
    },
    
    /*
     * This function changes the current service to the given service
     */
    setWfsService: function(service){
        this.serviceSelect.setValue(JSON.stringify(service));
        
        //Parse the XML configuration to an object
        this.serviceConfiguration = this.serviceConfigurationList[service.name];

        //Set the search options list
        this.propertySelect.clear();
        try{
            var searchOptions = this.serviceConfiguration.request[0].search[0].option;
            for(var x = 0; x < searchOptions.length; x++){
                var propertyName = searchOptions[x].Text;
                var label = searchOptions[x].label;
                this.propertySelect.addEntries([{label: _(label), value: propertyName}]);
            }
        }catch(e){};
        
        //Create the controller
        if(service.service_type == 'CSW') 
            this.controller = new conwet.CSWController(this);
        else
            this.showMessage(_("Unknown service type."));
        
        //Clean the list of results
        this.clearUI();
    },

    /*
     * This function saves the service in a persistent list.
     */
    save: function(service) {
        var services = [];
        if(this.servicesPreference.get() != "")
            services = JSON.parse(this.servicesPreference.get());
        
        var found = false;
        for(var i = 0; i < services.length; i++){
            if(services[i].url == service.url)
                found = true;
        }
        
        if(!found){
            services.push(service);
            this.servicesPreference.set(JSON.stringify(services));
        }
    },

    /*
     * This function sends and event with the location info
     */
    sendLocationInfo: function(loc1, loc2, title) {
        var send = [];
        send.push(loc1.lon);
        send.push(loc1.lat);
        send.push(loc2.lon);
        send.push(loc2.lat);
        
        this.locationInfoEvent.send(JSON.stringify([{
            "bbox": send,
            "title": title
        }]));
    },
    sendServiceInfo: function(url, name){
        var url2 = url.toLowerCase();
        var type = "WMS"
        if (url2.indexOf("wmts") != -1){
            type = "WMTS"
        }else if (url2.indexOf("wms-c") != -1){
            type = "WMSC"
        }else if (url2.indexOf("csw") != -1){
            type = "CSW"
        }
        url = url.split("?")[0];
        var service = {
                type: type,
                name: name,
                url : url
            };
        this.locationInfoEvent.send(JSON.stringify(service));
    },

    sendText: function(text) {
        this.outputTextEvent.send(text);
    },

    sendSearch: function(text) {
        this.searchTextEvent.send(text);
    },

    

    _selectFeature: function(feature, element) {
        this._deselectAllFeatures();
        element.addClassName("selected");
        this._showDetails(feature);
    },

    _deselectAllFeatures: function() {
        var features = $("chan_items").childNodes;
        for (var i=0; i<features.length; i++) {
            features[i].removeClassName("selected");
        }
    },

    _clearDetails: function() {
        $("info").innerHTML = "";
    },

    clearUI: function() {
        this._clearDetails();
        $("list").innerHTML = "";
    },

    showMessage: function(message, permanent) {
        this.messageManager.showMessage(message, conwet.ui.MessageManager.INFO, permanent);
    },

    hideMessage: function() {
        this.messageManager.hideMessage();
    },

    showError: function(message, permanent) {
        this.messageManager.showMessage(message, conwet.ui.MessageManager.ERROR, permanent);
    }

});
