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

// http://spatialreference.org/

Proj4js.defs["EPSG:4326"]   = "+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees +no_defs";
Proj4js.defs["EPSG:23030"]  = "+proj=utm +zone=30 +ellps=intl"+ " +towgs84=-131,-100.3,-163.4,-1.244,-0.020,-1.144,9.39 "+ " +units=m +no_defs";//"+proj=utm +zone=30 +ellps=intl +units=m +no_defs";
Proj4js.defs["EPSG:900913"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";


Proj4js.maxScale = {};
Proj4js.maxScale["m"]       = 443744272.724101;
Proj4js.maxScale["degrees"] = 442943843;
