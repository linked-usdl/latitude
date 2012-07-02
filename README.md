latitude
========

Simple Web repository for linked data descriptions

Introduction
------------
Web citizen
The repository is relying on Web principles:
* URI to identify resources
* consistent URI structure based on REST style protocol
* HTTP content negotiation to allow the client to choose the appropriate data format supporting HTML, RDF, XML, RSS, JSON, Turtle, ...
* Human readable output format using HTML rendering ('text/html' accept header) including hyperlinked representation
* Use of HTTP response codes including ETags (proper caching)
* Linked Data enablement supporting RDF input and output types

Linked Open Data
----------------
Publishing data as linked data requires every resource to be directly resolvable given their URL.
The basic idea of Linked Data is simple. Tim Berners-Lees note on Linked Data describes four rules for publishing data on the Web:

* Use URIs as names for things
* Use HTTP URIs so that people can look up those names.
* When someone looks up a URI, provide useful information, using the standards (RDF, SPARQL)
* Include links to other URIs, so that they can discover more things.

Input/Output Formats
--------------------
The interfaces should support data exchange through multiple formats:

*text/plain*  A linefeed separated list of elements for easy mashup and scripting.
*text/html*  An human-readable HTML rendering of the results of the operation as output format. 
*application/json*  A JSON representation of the input and output for mashups or JavaScript-based Web Apps
*application/rdf+xml*  A RDF description of the input and output.

Other formats such as XML, RSS, Atom, etc. are possible.

/{''collection''}
-----------------
A single collection.
### Formats
*text/html*  A HTML representation of the collection, linking to the resources contained in the collection
*application/json*  A JSON representation of the collection. 
*application/rdf+xml*  An RDF description of the collection. 
### Methods 
*GET*  Get the collection.
*PUT*  Create or update a collection.
*DELETE*  Delete collectionand its content irrevocably.

/{''collection''}/{''resource''}
--------------------------------

### Formats
*text/plain* A text representation of the resource.
*text/html* An HTML representation of the resource.
*application/json* JSON representation of the resoure.
*application/rdf+xml* A RDF XML representation of the resource.

Other mime-types depending on the type of the resource.
### Methods
*GET* Get the resource.
*PUT* Create or edit the named resource.
*DELETE* Delete the resource.

/{''collection''}/services
--------------------------
Services available for the collection.
### Formats
*text/html* An hyperlinked HTML representation of the search result list.
*application/json* JSON representation of the search result list.
*application/rdf+xml* A RDF XML representation of the search result. 
### Methods
*GET* Get the list of services.

/{''collection''}/services/search
---------------------------------
[OpenSearch](http://www.opensearch.org/Home "OpenSearch Site") compliant search service for the *collection*.

### Formats
*text/plain* A text representation of the resource.
*text/html* An HTML representation of the resource.
*application/json* JSON representation of the resoure.
*application/rdf+xml* A RDF XML representation of the resource.

Other mime-types depending on the type of the resource.
### Parameters
*query* A query expression for search.
*max* A number specifying the maximal number of results to be returned.
*offset* A number giving the offset of the results to be returned.
*sort* A comma separated list of field names for sorting the result list.
### Methods
*GET* If query parameter is given perform query using the query expression. If no query parameter is given get a HTML query form.
*POST* Perform query using the ''query'' form parameter.

/{''collection''}/services/sparql
---------------------------------
Query all RDF graphs in the collection using the SPARQL protocol.

### Formats
*text/html* An HTML representation of the query results.
*application/json* JSON representation of the query results.
*application/rdf+xml* A RDF XML representation of the query results.
### Parameters
*query* A SPARQL query expression for the query.
### Methods
*GET* If query parameter is given perform query using the SPARQL query expression. If no query parameter is given get a HTML query form.
*POST* Perform query using the ''query'' form parameter.

ETag Handling
-------------

For standard caching an ETag HTTP header is provided for GET and PUT requests. If a GET requests has a "If-None-Match" header, than the content is only delivered if the stored ETag of the object matches the requested ETag. HTTP status code 304 (not changed) is responded otherwise.

For PUT requests the ETag header can be used to ensure integrity of the repository. The PUT operation will only be executed if the "If-Match" header matches the stored ETag of the resource in the repository. If no "If-Match" header is given for an existing resource or the "If-Match" header does not match the existing ETag of the resource, status code 409 will be returned. If the resource was changed, then a new ETag header will be returned in the response header.

