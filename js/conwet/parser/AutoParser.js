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
    initialize: function(gadget) {
        this.gadget = gadget;
    },
    _entityToHtml: function(entity) {
        var html = document.createElement("div");
        html.className = "featureContainer";
        _createLevel(entity, html, "", 0);        
    },
    _createLevel: function (entity, parent, name, level){
        var html = document.createElement('div');
        var text = "";        
        var attributes="";
        var indent = "";
        for (var i = 0; i<level; i++)
            indent += "    ";
        
        if (entity._attributes != null){
            for( var i = 0; i < entity._attributes.length; i++){
                attributes+=" "+entity[entity._attributes[i]];
            }
        }
        if (entity.Text != null){
            text = entity.Text;
        }
        for (var index in entity) {

            if (index != "Text" && index != "_attributes" && index != "_children"){
                if (entrada.Text != null && entrada.Text !=""){
                    
                }
            }
        }
        
        html.addChild(document.createTextNode(indent + name + attributes + ": " + text))
    }
});